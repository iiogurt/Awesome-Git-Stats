import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GitHubError, fetchAccount } from '../src/github.js';
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

  it('paginates until repositories have no stars', async () => {
    const { fetchImpl, calls } = mockFetch((_call, index) => {
      if (index === 0) {
        return { json: graphqlPage([graphqlRepo('a', 5)], { hasNextPage: true, endCursor: 'c1' }) };
      }
      return {
        json: graphqlPage([graphqlRepo('b', 1), graphqlRepo('c', 0)], {
          hasNextPage: true,
          endCursor: 'c2',
        }),
      };
    });
    const account = await fetchAccount('octocat', { token: 't', fetchImpl });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].body.variables.after, 'c1');
    assert.equal(account.repos.length, 3);
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
