import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GitHubError,
  REPO_LIMIT,
  fetchAccount,
  fetchGist,
  fetchRepo,
  tokensFromEnv,
} from '../src/github.js';
import { computeStats } from '../src/stats.js';
import { graphqlPage, graphqlRepo, mockFetch } from './helpers.js';

describe('fetchAccount (GraphQL)', () => {
  it('normalises repositories and sends the token', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      json: graphqlPage([graphqlRepo('a', 10, 'Rust', '#dea584'), graphqlRepo('b', 3, null)]),
    }));
    const account = await fetchAccount('octocat', { token: 't0k3n', fetchImpl });
    assert.equal(calls.length, 1);
    assert.match(calls[0].init.headers.authorization, /t0k3n/);
    assert.equal(calls[0].body.variables.isFork, false);
    assert.equal(account.name, 'The Octocat');
    assert.equal(account.followers, 42);
    assert.deepEqual(account.repos[0], {
      name: 'a',
      description: '',
      stars: 10,
      forks: 1,
      isFork: false,
      isArchived: false,
      language: 'Rust',
      languageColor: '#dea584',
    });
    assert.equal(account.repos[1].language, null);
  });

  it('paginates through every repository, unstarred ones included', async () => {
    const { fetchImpl, calls } = mockFetch((_call, index) => {
      if (index === 0) {
        return { json: graphqlPage([graphqlRepo('a', 5)], { hasNextPage: true, endCursor: 'c1' }) };
      }
      if (index === 1) {
        return {
          json: graphqlPage([graphqlRepo('b', 1), graphqlRepo('c', 0)], {
            hasNextPage: true,
            endCursor: 'c2',
          }),
        };
      }
      return { json: graphqlPage([graphqlRepo('d', 0)]) };
    });
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(calls.length, 3);
    assert.equal(calls[1].body.variables.after, 'c1');
    assert.equal(calls[2].body.variables.after, 'c2');
    assert.equal(account.repos.length, 4);
    assert.equal(account.truncated, false);
  });

  it('requests forks when asked', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: graphqlPage([]) }));
    await fetchAccount('octocat', { token: 't', includeForks: true, fetchImpl });
    assert.equal(calls[0].body.variables.isFork, null);
  });

  it('maps errors to friendly GitHubErrors', async () => {
    const notFound = mockFetch(() => ({ json: { errors: [{ type: 'NOT_FOUND', message: 'x' }] } }));
    await assert.rejects(fetchAccount('ghost', { token: 't', fetchImpl: notFound.fetchImpl }), {
      name: 'GitHubError',
      code: 'NOT_FOUND',
      status: 404,
    });

    const limited = mockFetch(() => ({ status: 403, json: {} }));
    await assert.rejects(fetchAccount('octocat', { token: 't', fetchImpl: limited.fetchImpl }), {
      code: 'RATE_LIMITED',
    });

    const badToken = mockFetch(() => ({ status: 401, json: {} }));
    await assert.rejects(
      fetchAccount('octocat', { token: 't', fetchImpl: badToken.fetchImpl }),
      (error) => error instanceof GitHubError && error.code === 'BAD_TOKEN',
    );
  });

  it('drops language colours that are not hex values', async () => {
    const { fetchImpl } = mockFetch(() => ({
      json: graphqlPage([graphqlRepo('a', 1, 'Evil', 'red"/><script>')]),
    }));
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(account.repos[0].languageColor, null);
  });
});

describe('fetchAccount (REST fallback)', () => {
  it('fetches the user and their repos, sorted by stars, without forks', async () => {
    const { fetchImpl, calls } = mockFetch(({ url }) => {
      if (url.endsWith('/users/octocat')) {
        return { json: { login: 'octocat', name: null, type: 'User', followers: 7 } };
      }
      return {
        json: [
          { name: 'small', stargazers_count: 1, forks_count: 0, language: 'Go', fork: false },
          { name: 'big', stargazers_count: 9, forks_count: 2, language: 'Rust', fork: false },
          { name: 'forked', stargazers_count: 50, forks_count: 0, language: 'C', fork: true },
        ],
      };
    });
    const account = await fetchAccount('octocat', { token: '', fetchImpl });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].init.headers.authorization, undefined);
    assert.equal(account.name, 'octocat');
    assert.deepEqual(
      account.repos.map((repo) => repo.name),
      ['big', 'small'],
    );
    assert.equal(account.repos[0].languageColor, '#dea584');
  });

  it('uses the orgs endpoint for organisations', async () => {
    const { fetchImpl, calls } = mockFetch(({ url }) =>
      url.endsWith('/users/acme')
        ? { json: { login: 'acme', type: 'Organization' } }
        : { json: [] },
    );
    const account = await fetchAccount('acme', { token: '', fetchImpl });
    assert.match(calls[1].url, /\/orgs\/acme\/repos/);
    assert.equal(account.followers, null);
  });

  it('reports unknown users', async () => {
    const { fetchImpl } = mockFetch(() => ({ status: 404, json: {} }));
    await assert.rejects(fetchAccount('ghost', { token: '', fetchImpl }), { code: 'NOT_FOUND' });
  });
});

describe('multiple tokens', () => {
  it('reads GITHUB_TOKEN and GITHUB_TOKENS without duplicates', () => {
    assert.deepEqual(tokensFromEnv({ GITHUB_TOKEN: 'a', GITHUB_TOKENS: 'b, c\nd,,a' }), [
      'a',
      'b',
      'c',
      'd',
    ]);
    assert.deepEqual(tokensFromEnv({}), []);
  });

  it('fails over to the next token when one is rate limited or invalid', async () => {
    const { fetchImpl, calls } = mockFetch(({ init }) => {
      const auth = init.headers.authorization;
      if (auth.endsWith('limited')) return { status: 403, json: {} };
      if (auth.endsWith('revoked')) return { status: 401, json: {} };
      return { json: graphqlPage([graphqlRepo('a', 5)]) };
    });
    const tokens = ['limited', 'revoked', 'good'];
    for (let i = 0; i < tokens.length; i += 1) {
      const account = await fetchAccount('octocat', { tokens, fetchImpl });
      assert.equal(account.repos[0].stars, 5);
    }
    assert.ok(calls.every((call) => call.init.headers.authorization));
    assert.ok(calls.some((call) => call.init.headers.authorization.endsWith('good')));
  });

  it('spreads requests across tokens', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: graphqlPage([graphqlRepo('a', 1)]) }));
    const tokens = ['one', 'two'];
    await fetchAccount('octocat', { tokens, fetchImpl });
    await fetchAccount('octocat', { tokens, fetchImpl });
    const used = new Set(calls.map((call) => call.init.headers.authorization));
    assert.equal(used.size, 2);
  });

  it('reports a rate limit when every token is exhausted', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 403, json: {} }));
    await assert.rejects(fetchAccount('octocat', { tokens: ['x', 'y'], fetchImpl }), {
      code: 'RATE_LIMITED',
    });
    assert.equal(calls.length, 2);
  });

  it('does not fail over on errors that are not about the token', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      json: { errors: [{ type: 'NOT_FOUND', message: 'x' }] },
    }));
    await assert.rejects(fetchAccount('ghost', { tokens: ['x', 'y'], fetchImpl }), {
      code: 'NOT_FOUND',
    });
    assert.equal(calls.length, 1);
  });
});

describe('fetchAccount activity', () => {
  const activityResponse = {
    data: {
      user: {
        createdAt: '2020-01-01T00:00:00Z',
        following: { totalCount: 3 },
        pullRequests: { totalCount: 40 },
        issues: { totalCount: 12 },
        repositoriesContributedTo: { totalCount: 9 },
        contributionsCollection: {
          totalCommitContributions: 100,
          totalPullRequestContributions: 10,
          totalIssueContributions: 5,
          totalPullRequestReviewContributions: 7,
          restrictedContributionsCount: 2,
          contributionCalendar: {
            totalContributions: 3,
            weeks: [
              {
                contributionDays: [
                  { date: '2026-01-04', contributionCount: 1 },
                  { date: '2026-01-05', contributionCount: 2 },
                ],
              },
            ],
          },
        },
      },
    },
  };

  it('fetches contributions for users when asked', async () => {
    const { fetchImpl, calls } = mockFetch(({ body }) =>
      body.query.includes('contributionsCollection')
        ? { json: activityResponse }
        : { json: graphqlPage([graphqlRepo('a', 1)]) },
    );
    const account = await fetchAccount('octocat', { token: 't', activity: true, fetchImpl });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].body.variables.login, 'octocat');
    assert.deepEqual(account.activity.days, [
      { date: '2026-01-04', count: 1 },
      { date: '2026-01-05', count: 2 },
    ]);
    assert.equal(account.activity.pullRequests, 40);
    assert.equal(account.activity.reviews, 7);
  });

  it('skips the extra query unless asked, and for organisations', async () => {
    const plain = mockFetch(() => ({ json: graphqlPage([graphqlRepo('a', 1)]) }));
    await fetchAccount('octocat', { token: 't', fetchImpl: plain.fetchImpl });
    assert.equal(plain.calls.length, 1);

    const orgPage = graphqlPage([graphqlRepo('a', 1)]);
    orgPage.data.repositoryOwner.__typename = 'Organization';
    const org = mockFetch(() => ({ json: orgPage }));
    const account = await fetchAccount('acme', {
      token: 't',
      activity: true,
      fetchImpl: org.fetchImpl,
    });
    assert.equal(org.calls.length, 1);
    assert.equal(account.activity, null);
  });
});

describe('languages by code size', () => {
  it('asks for language sizes and keeps paging past repositories without stars', async () => {
    const withLanguages = (name, stars) => ({
      ...graphqlRepo(name, stars),
      languages: { edges: [{ size: 1200, node: { name: 'Go', color: '#00ADD8' } }] },
    });
    const { fetchImpl, calls } = mockFetch((_call, index) => ({
      json: graphqlPage([withLanguages(`r${index}`, 0)], {
        hasNextPage: index === 0,
        endCursor: 'c1',
      }),
    }));
    const account = await fetchAccount('octocat', { token: 't', codeLanguages: true, fetchImpl });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.variables.languages, true);
    assert.deepEqual(account.repos[0].codeLanguages, [
      { name: 'Go', color: '#00ADD8', size: 1200 },
    ]);
  });

  it('leaves them out otherwise', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: graphqlPage([graphqlRepo('a', 1)]) }));
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(calls[0].body.variables.languages, false);
    assert.equal('codeLanguages' in account.repos[0], false);
  });
});

describe('fetchRepo', () => {
  const repository = {
    ...graphqlRepo('hello', 120, 'Rust', '#dea584'),
    nameWithOwner: 'octo/hello',
    description: 'Says hi',
    isTemplate: true,
  };

  it('reads one repository through GraphQL', async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ json: { data: { repository } } }));
    const repo = await fetchRepo('octo', 'hello', { token: 't', fetchImpl });
    assert.deepEqual(calls[0].body.variables, { owner: 'octo', name: 'hello' });
    assert.equal(repo.fullName, 'octo/hello');
    assert.equal(repo.stars, 120);
    assert.equal(repo.description, 'Says hi');
    assert.equal(repo.isTemplate, true);
    assert.equal(repo.languageColor, '#dea584');
  });

  it('falls back to REST and reports a missing repository', async () => {
    const rest = mockFetch(() => ({
      json: {
        name: 'hello',
        full_name: 'octo/hello',
        stargazers_count: 3,
        forks_count: 1,
        language: 'Go',
      },
    }));
    const repo = await fetchRepo('octo', 'hello', { token: '', fetchImpl: rest.fetchImpl });
    assert.match(rest.calls[0].url, /\/repos\/octo\/hello$/);
    assert.equal(repo.stars, 3);
    assert.equal(repo.languageColor, '#00ADD8');
    const missing = mockFetch(() => ({ json: { data: { repository: null } } }));
    await assert.rejects(fetchRepo('octo', 'nope', { token: 't', fetchImpl: missing.fetchImpl }), {
      code: 'NOT_FOUND',
      message: 'Repository not found',
    });
  });
});

describe('private repositories and secret gists', () => {
  it('never shows a private repository, even when the token can read it', async () => {
    const graphql = mockFetch(() => ({
      json: { data: { repository: { ...graphqlRepo('secret', 5), isPrivate: true } } },
    }));
    await assert.rejects(
      fetchRepo('octo', 'secret', { token: 't', fetchImpl: graphql.fetchImpl }),
      {
        code: 'NOT_FOUND',
        message: 'Repository not found',
      },
    );
    const rest = mockFetch(() => ({
      json: { name: 'secret', private: true, stargazers_count: 5 },
    }));
    await assert.rejects(fetchRepo('octo', 'secret', { token: '', fetchImpl: rest.fetchImpl }), {
      code: 'NOT_FOUND',
    });
    assert.match(graphql.calls[0].body.query, /isPrivate/);
  });

  it('never shows a secret gist', async () => {
    const gist = { name: 'abc', description: 'keys', isPublic: false, files: [] };
    const graphql = mockFetch(() => ({ json: { data: { user: { gist } } } }));
    await assert.rejects(fetchGist('octo', 'abc', { token: 't', fetchImpl: graphql.fetchImpl }), {
      message: 'Gist not found',
    });
    const rest = mockFetch(() => ({
      json: { id: 'abc', public: false, owner: { login: 'octo' }, files: {} },
    }));
    await assert.rejects(fetchGist('octo', 'abc', { token: '', fetchImpl: rest.fetchImpl }), {
      message: 'Gist not found',
    });
  });
});

describe('request timeouts', () => {
  it('turn a request GitHub never answers into a timeout error', async () => {
    let signal;
    const fetchImpl = async (url, init) => {
      signal = init.signal;
      throw new DOMException('The operation timed out.', 'TimeoutError');
    };
    await assert.rejects(fetchAccount('octocat', { token: 't', fetchImpl }), {
      code: 'TIMEOUT',
      status: 504,
    });
    assert.ok(signal instanceof AbortSignal);
    await assert.rejects(fetchAccount('octocat', { token: '', fetchImpl }), { code: 'TIMEOUT' });
  });
});

describe('fetchGist', () => {
  it('reads a gist with stars through GraphQL', async () => {
    const gist = {
      name: 'abc123',
      description: 'Countries',
      stargazerCount: 41,
      isFork: false,
      forks: { totalCount: 13 },
      files: [{ name: 'countries.json', language: { name: 'JSON', color: '#292929' } }],
    };
    const { fetchImpl, calls } = mockFetch(() => ({ json: { data: { user: { gist } } } }));
    const result = await fetchGist('octo', 'abc123', { token: 't', fetchImpl });
    assert.deepEqual(calls[0].body.variables, { login: 'octo', id: 'abc123' });
    assert.equal(result.name, 'countries.json');
    assert.equal(result.stars, 41);
    assert.equal(result.forks, 13);
    assert.equal(result.language, 'JSON');
  });

  it('only shows gists of the given user, and has no stars over REST', async () => {
    const gist = {
      id: 'abc123',
      description: 'x',
      owner: { login: 'Octo' },
      files: { 'a.py': { filename: 'a.py', language: 'Python' } },
      forks: [{}, {}],
    };
    const rest = mockFetch(() => ({ json: gist }));
    const result = await fetchGist('octo', 'abc123', { token: '', fetchImpl: rest.fetchImpl });
    assert.equal(result.stars, null);
    assert.equal(result.forks, 2);
    assert.equal(result.name, 'a.py');
    await assert.rejects(fetchGist('someone', 'abc123', { token: '', fetchImpl: rest.fetchImpl }), {
      message: 'Gist not found',
    });
  });
});

// A page of `count` repositories named `${prefix}0`, `${prefix}1`, ...
const repoPage = (prefix, count, stars, extra = {}) =>
  Array.from({ length: count }, (_, i) => ({ ...graphqlRepo(`${prefix}${i}`, stars), ...extra }));

describe('fetchAccount fork totals (#54)', () => {
  it('counts the forks of unstarred repositories on later pages', async () => {
    const { fetchImpl, calls } = mockFetch((_call, index) =>
      index === 0
        ? {
            json: graphqlPage(
              [{ ...graphqlRepo('star', 10), forkCount: 1 }, ...repoPage('zero', 99, 0)],
              { hasNextPage: true, endCursor: 'c1', totalCount: 101 },
            ),
          }
        : {
            json: graphqlPage([{ ...graphqlRepo('forked', 0), forkCount: 100 }], {
              totalCount: 101,
            }),
          },
    );
    const account = await fetchAccount('octocat', { token: 'fake', fetchImpl });
    const stats = computeStats(account);
    assert.equal(calls.length, 2);
    assert.equal(stats.repoCount, 101);
    assert.equal(stats.totalForks, 101);
  });

  it('gives the same totals whether or not language sizes are fetched', async () => {
    const respond = (call, index) => {
      const nodes =
        index === 0 ? [graphqlRepo('a', 5), graphqlRepo('b', 0)] : [graphqlRepo('c', 0)];
      for (const node of nodes) {
        node.forkCount = 3;
        if (call.body.variables.languages) {
          node.languages = { totalSize: 0, pageInfo: { hasNextPage: false }, edges: [] };
        }
      }
      return { json: graphqlPage(nodes, { hasNextPage: index === 0, endCursor: 'c1' }) };
    };
    const plain = await fetchAccount('octocat', {
      token: 't',
      fetchImpl: mockFetch(respond).fetchImpl,
    });
    const sized = await fetchAccount('octocat', {
      token: 't',
      codeLanguages: true,
      fetchImpl: mockFetch(respond).fetchImpl,
    });
    const pick = ({ totalStars, totalForks, repoCount }) => ({ totalStars, totalForks, repoCount });
    assert.deepEqual(pick(computeStats(plain)), pick(computeStats(sized)));
    assert.deepEqual(pick(computeStats(plain)), { totalStars: 5, totalForks: 9, repoCount: 3 });
  });
});

describe('fetchAccount repository limit (#56)', () => {
  const pages = (last) =>
    mockFetch((_call, index) => ({
      json: graphqlPage(repoPage(`p${index}-`, 100, 1), {
        hasNextPage: index < last,
        endCursor: `c${index + 1}`,
        totalCount: (last + 1) * 100 + (index < last ? 1 : 0),
      }),
    }));

  it('marks GraphQL totals partial when the limit stops it', async () => {
    const { fetchImpl, calls } = pages(99);
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(calls.length, REPO_LIMIT / 100);
    assert.equal(account.truncated, true);
    const stats = computeStats(account);
    assert.equal(stats.partial, true);
    assert.equal(stats.totalStars, REPO_LIMIT);
  });

  it('is complete when the last allowed page really is the last', async () => {
    const { fetchImpl, calls } = pages(REPO_LIMIT / 100 - 1);
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(calls.length, REPO_LIMIT / 100);
    assert.equal(account.truncated, false);
    assert.equal(computeStats(account).partial, false);
  });

  const restPages = (publicRepos) =>
    mockFetch(({ url }) => {
      if (url.endsWith('/users/octocat')) {
        return { json: { login: 'octocat', type: 'User', public_repos: publicRepos } };
      }
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        json: Array.from({ length: 100 }, (_, i) => ({
          name: `r${page}-${i}`,
          stargazers_count: 1,
          forks_count: 0,
          fork: false,
        })),
      };
    });

  it('marks REST totals partial when more repositories remain', async () => {
    const { fetchImpl, calls } = restPages(REPO_LIMIT + 1);
    const account = await fetchAccount('octocat', { token: '', fetchImpl });
    assert.equal(calls.length, 1 + REPO_LIMIT / 100);
    assert.equal(account.truncated, true);
  });

  it('is complete over REST when the account has exactly the limit', async () => {
    const { fetchImpl } = restPages(REPO_LIMIT);
    const account = await fetchAccount('octocat', { token: '', fetchImpl });
    assert.equal(account.truncated, false);
  });
});

describe('fetchAccount language sizes (#55)', () => {
  const languages = (names, size, { more = false, totalSize } = {}) => ({
    totalSize: totalSize ?? names.length * size,
    pageInfo: { hasNextPage: more, endCursor: more ? 'lang-cursor' : null },
    edges: names.map((name) => ({ size, node: { name, color: '#123456' } })),
  });
  const eleven = Array.from({ length: 11 }, (_, i) => `L${i}`);

  it('fetches the languages of a repository past the first ten', async () => {
    const { fetchImpl, calls } = mockFetch(({ body }) => {
      if (body.variables.login) {
        const repo = graphqlRepo('big', 5);
        repo.languages = languages(eleven.slice(0, 10), 100, { more: true, totalSize: 1100 });
        return { json: graphqlPage([repo]) };
      }
      return { json: { data: { r0: { languages: languages(eleven.slice(10), 100) } } } };
    });
    const account = await fetchAccount('octocat', { token: 't', codeLanguages: true, fetchImpl });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1].body.variables, { owner: 'octocat', n0: 'big', c0: 'lang-cursor' });
    assert.equal(account.languagesComplete, true);
    const { items } = computeStats(account, { languages: 8 }).codeLanguages;
    assert.equal(
      items.reduce((sum, lang) => sum + lang.value, 0),
      1100,
    );
    assert.deepEqual(items.at(-1), {
      name: 'Other',
      color: '#8b949e',
      value: 300,
      share: 300 / 1100,
    });
    assert.ok(Math.abs(items[0].share - 1 / 11) < 1e-9);
  });

  it('ranks a language that is small everywhere but adds up across repositories', async () => {
    // Each repository's ten largest languages leave out "Tiny"; together it is the largest.
    const big = Array.from({ length: 10 }, (_, i) => `Big${i}`);
    const repos = Array.from({ length: 30 }, (_, i) => {
      const repo = graphqlRepo(`r${i}`, 1);
      repo.languages = {
        ...languages([big[i % 10]], 50, { more: true }),
        totalSize: 50 + 40,
        edges: big.map((name, j) => ({ size: j === i % 10 ? 50 : 1, node: { name, color: null } })),
      };
      return repo;
    });
    const { fetchImpl } = mockFetch(({ body }) => {
      if (body.variables.login) return { json: graphqlPage(repos) };
      const data = {};
      for (const key of Object.keys(body.variables).filter((k) => k.startsWith('n'))) {
        data[`r${key.slice(1)}`] = { languages: languages(['Tiny'], 31) };
      }
      return { json: { data } };
    });
    const account = await fetchAccount('octocat', { token: 't', codeLanguages: true, fetchImpl });
    const { items } = computeStats(account, { languages: 3 }).codeLanguages;
    assert.equal(items[0].name, 'Tiny');
  });

  it('keeps the card when a follow-up fails, counting the unread bytes as Other', async () => {
    const { fetchImpl } = mockFetch(({ body }) => {
      if (body.variables.login) {
        const repo = graphqlRepo('gone', 5);
        repo.languages = languages(['Go'], 100, { more: true, totalSize: 160 });
        return { json: graphqlPage([repo]) };
      }
      return { json: { data: { r0: null }, errors: [{ type: 'NOT_FOUND', message: 'gone' }] } };
    });
    const account = await fetchAccount('octocat', { token: 't', codeLanguages: true, fetchImpl });
    assert.equal(account.languagesComplete, false);
    const { items } = computeStats(account).codeLanguages;
    assert.deepEqual(
      items.map(({ name, value }) => [name, value]),
      [
        ['Go', 100],
        ['Other', 60],
      ],
    );
  });

  it('counts unlisted bytes as Other past the follow-up limit', async () => {
    const repos = Array.from({ length: 70 }, (_, i) => {
      const repo = graphqlRepo(`r${i}`, 1);
      repo.languages = languages(['Go'], 100, { more: true, totalSize: 150 });
      return repo;
    });
    const { fetchImpl, calls } = mockFetch(({ body }) => {
      if (body.variables.login) return { json: graphqlPage(repos) };
      const data = {};
      for (const key of Object.keys(body.variables).filter((k) => k.startsWith('n'))) {
        data[`r${key.slice(1)}`] = { languages: languages(['Shell'], 50) };
      }
      return { json: { data } };
    });
    const account = await fetchAccount('octocat', { token: 't', codeLanguages: true, fetchImpl });
    assert.equal(calls.length, 1 + 3);
    assert.equal(account.languagesComplete, false);
    const { items } = computeStats(account, { languages: 1 }).codeLanguages;
    // 70 × 150 bytes in all: Go 7,000; Shell 3,000 fetched + 500 unlisted, all in Other.
    assert.deepEqual(
      items.map(({ name, value }) => [name, value]),
      [
        ['Go', 7000],
        ['Other', 3500],
      ],
    );
  });
});

describe('fetchAccount cancellation (#53)', () => {
  it('aborts the request in flight and starts no more once the signal fires', async () => {
    const controller = new AbortController();
    let inFlightAborted = false;
    const { fetchImpl, calls } = mockFetch(async ({ init }, index) => {
      if (index === 1) {
        init.signal.addEventListener('abort', () => (inFlightAborted = true));
        controller.abort();
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        json: graphqlPage([graphqlRepo('a', 1)], { hasNextPage: true, endCursor: 'c' }),
      };
    });
    await assert.rejects(
      fetchAccount('octocat', { token: 't', fetchImpl, signal: controller.signal }),
      { code: 'TIMEOUT', status: 504 },
    );
    assert.equal(calls.length, 2);
    assert.equal(inFlightAborted, true);
  });

  it('does not fail over to another token after the signal fires', async () => {
    const controller = new AbortController();
    const { fetchImpl, calls } = mockFetch(() => {
      controller.abort();
      return { status: 429 };
    });
    await assert.rejects(
      fetchAccount('octocat', { tokens: ['a', 'b', 'c'], fetchImpl, signal: controller.signal }),
      { code: 'TIMEOUT' },
    );
    assert.equal(calls.length, 1);
  });
});
