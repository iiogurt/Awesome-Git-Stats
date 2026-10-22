import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { clearCache, createCard } from '../src/handler.js';
import { ACTIVITY_LAYOUTS, parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { squarify } from '../src/render/treemap.js';
import { computeStats } from '../src/stats.js';
import { sampleAccount, sampleGist, sampleRepo } from './fixtures/account.js';
import { graphqlPage, graphqlRepo, mockFetch } from './helpers.js';

function render(query, data) {
  const options = parseOptions({ username: 'stellar-dev', ...query });
  return renderCard(
    data ?? computeStats(sampleAccount, { languages: options.langsCount }),
    options,
  );
}

describe('card options', () => {
  const parse = (query) => parseOptions({ username: 'octo', ...query });

  it('reads the repository to pin, owned by the user or anyone', () => {
    assert.deepEqual(parse({ layout: 'pin', repo: 'hello' }).repo, {
      owner: 'octo',
      name: 'hello',
    });
    assert.deepEqual(parse({ layout: 'pin', repo: 'cli/cli' }).repo, { owner: 'cli', name: 'cli' });
    assert.equal(parse({ repo: 'hello' }).repo, null);
    assert.throws(() => parse({ layout: 'pin' }), /Missing "repo"/);
    assert.throws(() => parse({ layout: 'pin', repo: 'a/b/c' }), /Invalid repository/);
    assert.throws(() => parse({ layout: 'pin', repo: 'x/<y>' }), /Invalid repository/);
  });

  it('reads the gist id', () => {
    assert.equal(
      parse({ layout: 'gist', gist: 'aa5a315d61ae9438b18d' }).gist,
      'aa5a315d61ae9438b18d',
    );
    assert.throws(() => parse({ layout: 'gist' }), /Missing "gist"/);
    assert.throws(() => parse({ layout: 'gist', gist: 'not-a-gist' }), /Invalid gist/);
  });

  it('defaults and clamps the goal and language style', () => {
    assert.equal(parse({}).goal, 1000);
    assert.equal(parse({ goal: '0' }).goal, 1);
    assert.equal(parse({ lang_style: 'PIE' }).langStyle, 'pie');
    assert.equal(parse({ lang_style: 'sunburst' }).langStyle, 'bars');
  });

  it('defaults to the glossy finish and accepts the others', () => {
    assert.equal(parse({}).finish, 'gloss');
    assert.equal(parse({ finish: 'Paper' }).finish, 'paper');
    assert.equal(parse({ finish: 'soft' }).finish, 'soft');
    assert.equal(parse({ finish: 'NEON' }).finish, 'neon');
    assert.equal(parse({ finish: 'velvet' }).finish, 'gloss');
  });
});

describe('card data', () => {
  beforeEach(() => clearCache());

  it('fetches the pinned repository instead of the account', async () => {
    const repository = { ...graphqlRepo('cli', 40000, 'Go', '#00ADD8'), nameWithOwner: 'cli/cli' };
    const { fetchImpl, calls } = mockFetch(() => ({ json: { data: { repository } } }));
    const result = await createCard(
      { username: 'octo', layout: 'pin', repo: 'cli/cli' },
      { env: {}, token: 't', fetchImpl },
    );
    assert.equal(result.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].body.query, /repository\(owner/);
    assert.match(result.svg, /cli\/cli/);
    assert.match(result.svg, /40k/);
  });

  it('keeps a personal deployment to its own repositories', async () => {
    const result = await createCard(
      { username: 'octo', layout: 'pin', repo: 'someone/else' },
      { env: { ALLOWED_USERNAMES: 'octo' }, token: 't', fetchImpl: () => assert.fail() },
    );
    assert.equal(result.status, 403);
  });

  it('asks for language sizes only for the languages card, and activity only where shown', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: graphqlPage([graphqlRepo('a', 1)]) }));
    await createCard({ username: 'octo', layout: 'languages' }, { env: {}, token: 't', fetchImpl });
    assert.equal(calls[0].body.variables.languages, true);
    assert.equal(calls.length, 1);
    await createCard({ username: 'octo', layout: 'repos' }, { env: {}, token: 't', fetchImpl });
    assert.equal(calls[1].body.variables.languages, false);
    assert.equal(calls.length, 2);
  });
});

describe('new cards', () => {
  it('rank the account on the stats card, and hide the rank on request', () => {
    const svg = render({ layout: 'stats' });
    assert.match(svg, /class="rank-level"[^>]*>S</);
    assert.match(svg, />1,184</);
    assert.match(svg, />Pull requests:</);
    const plain = render({ layout: 'stats', hide: 'rank,issues' });
    assert.doesNotMatch(plain, /rank-level"/);
    assert.doesNotMatch(plain, />Issues:</);
  });

  it('draw languages by code size in every style', () => {
    for (const style of ['bars', 'donut', 'pie', 'waffle']) {
      const svg = render({ layout: 'languages', lang_style: style });
      assert.match(svg, />Rust</, style);
      assert.match(svg, /by code size/, style);
    }
    // A waffle always has exactly 100 squares.
    const waffle = render({ layout: 'languages', lang_style: 'waffle' });
    assert.equal(
      (
        waffle.match(
          /<rect x="\d[^"]*" y="\d[^"]*" width="13" height="13" rx="2.5" fill="#[^"]+" class="fade"/g,
        ) ?? []
      ).length,
      100,
    );
  });

  it('pin a repository and a gist with their badges and numbers', () => {
    const pin = render({ layout: 'pin', repo: 'nebula-ui' }, { ...sampleRepo, isArchived: true });
    assert.match(pin, />nebula-ui</);
    assert.match(pin, />Archived</);
    assert.match(pin, />8.4k</);
    const gist = render({ layout: 'gist', gist: sampleGist.id }, { ...sampleGist, stars: null });
    assert.match(gist, />constellations.json</);
    assert.match(gist, />JSON</);
    assert.doesNotMatch(gist, />41</);
  });

  it('show streaks, the monthly timeline and the goal', () => {
    assert.match(render({ layout: 'streak' }), />Current streak</);
    assert.match(render({ layout: 'streak' }), />1,264</);
    assert.match(render({ layout: 'timeline' }), />149</);
    assert.match(render({ layout: 'goal', goal: '2000' }), />63%</);
    assert.match(render({ layout: 'goal' }), />Goal reached!</);
  });

  it('draw one tower per day on the skyline and one cell per day on the heatmap', () => {
    const days = sampleAccount.activity.days.length;
    assert.equal((render({ layout: 'heatmap' }).match(/class="hm\d"><title>/g) ?? []).length, days);
    const roofs = render({ layout: 'skyline' }).match(/class="sk(t\d|0)"/g) ?? [];
    assert.equal(roofs.length, days);
  });

  it('explain the missing data when there is no contribution activity', () => {
    const stats = computeStats({ ...sampleAccount, activity: null });
    for (const layout of ACTIVITY_LAYOUTS.filter((l) => !['dashboard', 'stats'].includes(l))) {
      assert.match(render({ layout }, stats), /Contribution activity needs a/, layout);
    }
    assert.match(render({ layout: 'stats' }, stats), /need a GitHub token/);
  });
});

describe('squarify', () => {
  it('fills the area exactly, with areas proportional to the values', () => {
    const rect = { x: 0, y: 0, w: 400, h: 200 };
    const cells = squarify(
      [50, 30, 10, 6, 4].map((value) => ({ value })),
      rect,
    );
    const total = cells.reduce((sum, c) => sum + c.w * c.h, 0);
    assert.ok(Math.abs(total - 400 * 200) < 0.01);
    for (const cell of cells) {
      assert.ok(Math.abs((cell.w * cell.h) / (400 * 200) - cell.item.value / 100) < 1e-9);
      assert.ok(cell.x >= -1e-9 && cell.x + cell.w <= 400 + 1e-9);
    }
  });
});
