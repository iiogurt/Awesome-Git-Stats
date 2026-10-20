import { languageColors } from './languageColors.js';
import { parseColor } from './themes.js';

const API_URL = 'https://api.github.com';
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const USER_AGENT = 'awesome-git-stats';

export class GitHubError extends Error {
  constructor(message, { status = 500, code = 'GITHUB_ERROR' } = {}) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.code = code;
  }
}

const QUERY = `
query ($login: String!, $after: String, $isFork: Boolean) {
  repositoryOwner(login: $login) {
    __typename
    login
    ... on User { name followers { totalCount } }
    ... on Organization { name }
    repositories(
      first: ${PAGE_SIZE}
      after: $after
      isFork: $isFork
      privacy: PUBLIC
      ownerAffiliations: OWNER
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        description
        stargazerCount
        forkCount
        isFork
        isArchived
        primaryLanguage { name color }
      }
    }
  }
}`;

function normaliseRepo(node) {
  const language = node.primaryLanguage?.name ?? node.language ?? null;
  return {
    name: node.name,
    description: node.description ?? '',
    stars: node.stargazerCount ?? node.stargazers_count ?? 0,
    forks: node.forkCount ?? node.forks_count ?? 0,
    isFork: Boolean(node.isFork ?? node.fork),
    isArchived: Boolean(node.isArchived ?? node.archived),
    language,
    languageColor: parseColor(
      node.primaryLanguage?.color ?? (language ? languageColors[language] : null),
    ),
  };
}

async function graphql(fetchImpl, token, variables) {
  const response = await fetchImpl(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': USER_AGENT,
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (response.status === 401) {
    throw new GitHubError('The server GitHub token is invalid', { status: 500, code: 'BAD_TOKEN' });
  }
  if (response.status === 403 || response.status === 429) {
    throw new GitHubError('GitHub rate limit reached, try again later', {
      status: 503,
      code: 'RATE_LIMITED',
    });
  }
  if (!response.ok) {
    throw new GitHubError(`GitHub responded with ${response.status}`, { status: 502 });
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    const notFound = payload.errors.some((e) => e.type === 'NOT_FOUND');
    if (notFound) throw new GitHubError('User not found', { status: 404, code: 'NOT_FOUND' });
    const limited = payload.errors.some((e) => e.type === 'RATE_LIMITED');
    if (limited) {
      throw new GitHubError('GitHub rate limit reached, try again later', {
        status: 503,
        code: 'RATE_LIMITED',
      });
    }
    throw new GitHubError(payload.errors[0].message || 'GitHub GraphQL error', { status: 502 });
  }
  return payload.data;
}

// Round-robin start position so a deployment with several tokens spreads
// its requests across all of them.
let rotation = 0;

/**
 * Run a GraphQL query, failing over to the next token when one is rate
 * limited or invalid. `state.index` remembers the token that worked so
 * later pages of the same request reuse it.
 */
async function graphqlWithFailover(fetchImpl, tokens, variables, state) {
  let lastError;
  for (let attempt = 0; attempt < tokens.length; attempt += 1) {
    const index = (state.index + attempt) % tokens.length;
    try {
      const data = await graphql(fetchImpl, tokens[index], variables);
      state.index = index;
      return data;
    } catch (error) {
      if (!['RATE_LIMITED', 'BAD_TOKEN'].includes(error.code)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchWithGraphQL(username, { tokens, includeForks, fetchImpl }) {
  const repos = [];
  const state = { index: rotation++ % tokens.length };
  let owner = null;
  let after = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await graphqlWithFailover(
      fetchImpl,
      tokens,
      { login: username, after, isFork: includeForks ? null : false },
      state,
    );
    const node = data?.repositoryOwner;
    if (!node) throw new GitHubError('User not found', { status: 404, code: 'NOT_FOUND' });
    owner ??= {
      login: node.login,
      name: node.name || node.login,
      type: node.__typename,
      followers: node.followers?.totalCount ?? null,
      totalRepos: node.repositories.totalCount,
    };
    const nodes = node.repositories.nodes.map(normaliseRepo);
    repos.push(...nodes);
    // Repositories are sorted by stars, so once we reach zero we can stop.
    const lastStars = nodes.at(-1)?.stars ?? 0;
    if (!node.repositories.pageInfo.hasNextPage || lastStars === 0) break;
    after = node.repositories.pageInfo.endCursor;
  }
  return { ...owner, repos };
}

async function rest(fetchImpl, path) {
  const response = await fetchImpl(`${API_URL}${path}`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': USER_AGENT },
  });
  if (response.status === 404) {
    throw new GitHubError('User not found', { status: 404, code: 'NOT_FOUND' });
  }
  if (response.status === 403 || response.status === 429) {
    throw new GitHubError('GitHub rate limit reached, try again later', {
      status: 503,
      code: 'RATE_LIMITED',
    });
  }
  if (!response.ok) {
    throw new GitHubError(`GitHub responded with ${response.status}`, { status: 502 });
  }
  return response.json();
}

async function fetchWithRest(username, { includeForks, fetchImpl }) {
  const user = await rest(fetchImpl, `/users/${encodeURIComponent(username)}`);
  const base = user.type === 'Organization' ? 'orgs' : 'users';
  const repos = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await rest(
      fetchImpl,
      `/${base}/${encodeURIComponent(user.login)}/repos?per_page=${PAGE_SIZE}&page=${page}&type=owner`,
    );
    repos.push(...batch.map(normaliseRepo));
    if (batch.length < PAGE_SIZE) break;
  }
  const filtered = repos.filter((repo) => includeForks || !repo.isFork);
  filtered.sort((a, b) => b.stars - a.stars);
  return {
    login: user.login,
    name: user.name || user.login,
    type: user.type,
    followers: user.type === 'User' ? (user.followers ?? null) : null,
    totalRepos: filtered.length,
    repos: filtered,
  };
}

/**
 * Collect the GitHub tokens configured for a deployment: `GITHUB_TOKEN` plus
 * any number in `GITHUB_TOKENS` (separated by commas or whitespace).
 */
export function tokensFromEnv(env = process.env) {
  const all = [env.GITHUB_TOKEN, ...String(env.GITHUB_TOKENS ?? '').split(/[\s,]+/)];
  return [...new Set(all.map((token) => token?.trim()).filter(Boolean))];
}

/**
 * Fetch an account's public, owned repositories. Uses the GraphQL API when a
 * token is available (fast, includes language colours), failing over between
 * tokens when one is rate limited, and falls back to the unauthenticated REST
 * API otherwise (handy for local development).
 *
 * @param {string} username
 * @param {object} [options]
 * @param {string} [options.token]     a single token (overrides `tokens`)
 * @param {string[]} [options.tokens]  tokens to use, defaults to tokensFromEnv()
 */
export async function fetchAccount(
  username,
  { token, tokens = tokensFromEnv(), includeForks = false, fetchImpl = globalThis.fetch } = {},
) {
  const usable = token !== undefined ? [token].filter(Boolean) : tokens.filter(Boolean);
  if (usable.length) return fetchWithGraphQL(username, { tokens: usable, includeForks, fetchImpl });
  return fetchWithRest(username, { includeForks, fetchImpl });
}
