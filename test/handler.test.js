import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import handler, { clearCache, createCard } from '../src/handler.js';
import { graphqlPage, graphqlRepo, mockFetch } from './helpers.js';

const okFetch = () =>
  mockFetch(() => ({
    json: graphqlPage([graphqlRepo('hello-world', 1500, 'TypeScript', '#3178c6')]),
  }));

describe('createCard', () => {
  beforeEach(() => clearCache());

  it('renders a card for a valid user', async () => {
    const { fetchImpl } = okFetch();
    const result = await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl });
    assert.equal(result.status, 200);
    assert.match(result.svg, /1,500/);
    assert.equal(result.cacheSeconds, 4 * 60 * 60);
  });

  it('caches account data between requests', async () => {
    const { fetchImpl, calls } = okFetch();
    await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl });
    await createCard({ username: 'OctoCat', layout: 'repos' }, { env: {}, token: 't', fetchImpl });
    assert.equal(calls.length, 1);
  });

  it('returns an error card for bad input', async () => {
    const result = await createCard(
      { username: '-bad-' },
      { env: {}, fetchImpl: () => assert.fail() },
    );
    assert.equal(result.status, 400);
    assert.match(result.svg, /Invalid GitHub username/);
  });

  it('returns an error card when GitHub fails', async () => {
    const { fetchImpl } = mockFetch(() => ({ json: { errors: [{ type: 'NOT_FOUND' }] } }));
    const result = await createCard({ username: 'ghost' }, { env: {}, token: 't', fetchImpl });
    assert.equal(result.status, 404);
    assert.match(result.svg, /User not found/);
  });

  it('does not cache failures', async () => {
    let fail = true;
    const { fetchImpl } = mockFetch(() =>
      fail ? { status: 500, json: {} } : { json: graphqlPage([graphqlRepo('a', 1)]) },
    );
    assert.equal(
      (await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl })).status,
      502,
    );
    fail = false;
    assert.equal(
      (await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl })).status,
      200,
    );
  });

  it('enforces ALLOWED_USERNAMES', async () => {
    const { fetchImpl } = okFetch();
    const env = { ALLOWED_USERNAMES: 'Octocat, other' };
    assert.equal(
      (await createCard({ username: 'stranger' }, { env, token: 't', fetchImpl })).status,
      403,
    );
    assert.equal(
      (await createCard({ username: 'octocat' }, { env, token: 't', fetchImpl })).status,
      200,
    );
  });
});

describe('handler', () => {
  it('writes an SVG response with cache headers', async () => {
    const headers = {};
    const res = {
      statusCode: 0,
      setHeader: (name, value) => {
        headers[name.toLowerCase()] = value;
      },
      end(body) {
        this.body = body;
      },
    };
    await handler({ url: '/api/stars' }, res);
    // Error cards are images too: 200, with the real status in a header.
    assert.equal(res.statusCode, 200);
    assert.equal(headers['x-card-status'], '400');
    assert.equal(headers['content-type'], 'image/svg+xml; charset=utf-8');
    assert.match(headers['cache-control'], /s-maxage=600/);
    assert.match(res.body, /Missing &quot;username&quot;/);
  });
});

describe('createCard protects the token quota', () => {
  beforeEach(() => clearCache());

  it('remembers users that do not exist', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: { errors: [{ type: 'NOT_FOUND' }] } }));
    const env = { GITHUB_TOKEN: 't' };
    assert.equal((await createCard({ username: 'nobody-here' }, { env, fetchImpl })).status, 404);
    assert.equal((await createCard({ username: 'nobody-here' }, { env, fetchImpl })).status, 404);
    assert.equal(calls.length, 1);
  });

  it('retries other errors on the next request', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 502, json: {} }));
    const env = { GITHUB_TOKEN: 't' };
    await createCard({ username: 'octocat' }, { env, fetchImpl });
    await createCard({ username: 'octocat' }, { env, fetchImpl });
    assert.equal(calls.length, 2);
  });

  it('renders a timeout card when GitHub is too slow', async () => {
    const fetchImpl = () => new Promise(() => {});
    const result = await createCard(
      { username: 'octocat' },
      { env: { GITHUB_TOKEN: 't' }, fetchImpl, deadlineMs: 20 },
    );
    assert.equal(result.status, 504);
    assert.match(result.svg, /took too long/);
  });
});

describe('createCard tokens', () => {
  beforeEach(() => clearCache());

  it('uses tokens from GITHUB_TOKENS', async () => {
    const { fetchImpl, calls } = okFetch();
    const result = await createCard(
      { username: 'octocat' },
      { env: { GITHUB_TOKENS: 'pool-1' }, fetchImpl },
    );
    assert.equal(result.status, 200);
    assert.match(calls[0].init.headers.authorization, /pool-1/);
  });
});

describe('createCard dashboard', () => {
  beforeEach(() => clearCache());

  it('requests contribution activity only for the dashboard layout', async () => {
    const { fetchImpl, calls } = mockFetch(({ body }) =>
      body.query.includes('contributionsCollection')
        ? { json: { data: { user: null } } }
        : { json: graphqlPage([graphqlRepo('a', 1)]) },
    );
    await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl });
    assert.equal(calls.length, 1);
    const result = await createCard(
      { username: 'octocat', layout: 'dashboard' },
      { env: {}, token: 't', fetchImpl },
    );
    assert.equal(result.status, 200);
    assert.equal(calls.length, 3);
  });
});

describe('createCard deadline (#53)', () => {
  beforeEach(() => clearCache());

  // Each request takes `ms`; there are always more pages until `pages` were served.
  const slowPages = (ms, pages = 4) => {
    let calls = 0;
    let aborts = 0;
    const fetchImpl = async (_url, init) => {
      calls += 1;
      init.signal.addEventListener('abort', () => (aborts += 1));
      await new Promise((resolve) => setTimeout(resolve, ms));
      return {
        ok: true,
        status: 200,
        json: async () =>
          graphqlPage([graphqlRepo('a', 1)], {
            hasNextPage: calls < pages,
            endCursor: String(calls),
            totalCount: pages,
          }),
      };
    };
    return { fetchImpl, counts: () => ({ calls, aborts }) };
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  it('stops fetching pages once the budget runs out', async () => {
    const { fetchImpl, counts } = slowPages(30);
    const card = await createCard(
      { username: 'octocat' },
      { env: {}, token: 'fake', fetchImpl, deadlineMs: 5 },
    );
    assert.equal(card.status, 504);
    await wait(150);
    assert.deepEqual(counts(), { calls: 1, aborts: 1 });
  });

  it('starts afresh after a timed-out load', async () => {
    const slow = slowPages(30);
    await createCard(
      { username: 'octocat' },
      { env: {}, token: 't', fetchImpl: slow.fetchImpl, deadlineMs: 5 },
    );
    await wait(50);
    const fast = slowPages(0, 1);
    const card = await createCard(
      { username: 'octocat' },
      { env: {}, token: 't', fetchImpl: fast.fetchImpl, deadlineMs: 1000 },
    );
    assert.equal(card.status, 200);
    assert.equal(fast.counts().calls, 1);
  });

  it('keeps the load going for a patient request when an impatient one gives up', async () => {
    const { fetchImpl, counts } = slowPages(20, 2);
    const [impatient, patient] = await Promise.all([
      createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl, deadlineMs: 5 }),
      createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl, deadlineMs: 1000 }),
    ]);
    assert.equal(impatient.status, 504);
    assert.equal(patient.status, 200);
    assert.deepEqual(counts(), { calls: 2, aborts: 0 });
  });

  it('shares one load between concurrent requests', async () => {
    const { fetchImpl, counts } = slowPages(10, 2);
    const cards = await Promise.all(
      [1, 2, 3].map(() =>
        createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl, deadlineMs: 1000 }),
      ),
    );
    assert.deepEqual(
      cards.map((card) => card.status),
      [200, 200, 200],
    );
    assert.equal(counts().calls, 2);
  });
});

describe('createCard partial totals (#56)', () => {
  beforeEach(() => clearCache());

  const capped = () =>
    mockFetch((_call, index) => ({
      json: graphqlPage(
        Array.from({ length: 100 }, (_, i) => graphqlRepo(`p${index}-${i}`, 1)),
        { hasNextPage: true, endCursor: `c${index + 1}`, totalCount: 5000 },
      ),
    }));

  it('notes partial totals in a footnote and the title', async () => {
    const { svg } = await createCard(
      { username: 'octocat' },
      { env: {}, token: 't', fetchImpl: capped().fetchImpl },
    );
    assert.match(svg, />First 1,000 repositories only<\/text>/);
    assert.match(svg, /<title[^>]*>[^<]*\(first 1,000 repositories only\)<\/title>/);
  });

  it('notes them in the title only on the badge', async () => {
    const { svg } = await createCard(
      { username: 'octocat', layout: 'badge' },
      { env: {}, token: 't', fetchImpl: capped().fetchImpl },
    );
    assert.doesNotMatch(svg, /<\/text>\s*<\/svg>/);
    assert.match(svg, /\(first 1,000 repositories only\)<\/title>/);
  });

  it('adds nothing when every repository was fetched', async () => {
    const { fetchImpl } = mockFetch(() => ({ json: graphqlPage([graphqlRepo('a', 1)]) }));
    const { svg } = await createCard({ username: 'octocat' }, { env: {}, token: 't', fetchImpl });
    assert.doesNotMatch(svg, /repositories only/);
  });
});
