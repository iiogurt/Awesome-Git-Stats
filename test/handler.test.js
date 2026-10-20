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
    assert.equal(res.statusCode, 400);
    assert.equal(headers['content-type'], 'image/svg+xml; charset=utf-8');
    assert.match(headers['cache-control'], /s-maxage=600/);
    assert.match(res.body, /Missing &quot;username&quot;/);
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
