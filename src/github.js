import { languageColors } from './languageColors.js';
import { parseColor } from './themes.js';

const API_URL = 'https://api.github.com';
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const USER_AGENT = 'awesome-git-stats';
// Give up on a slow GitHub request well before the serverless function is stopped,
// so the visitor still gets an error card rather than a broken image.
const REQUEST_TIMEOUT_MS = 8000;

export class GitHubError extends Error {
  constructor(message, { status = 500, code = 'GITHUB_ERROR' } = {}) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.code = code;
  }
}

const QUERY = `
query ($login: String!, $after: String, $isFork: Boolean, $languages: Boolean = false) {
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
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) @include(if: $languages) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

const REPO_QUERY = `
query ($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    nameWithOwner
    description
    stargazerCount
    forkCount
    isFork
    isArchived
    isTemplate
    isPrivate
    primaryLanguage { name color }
  }
}`;

const GIST_QUERY = `
query ($login: String!, $id: String!) {
  user(login: $login) {
    gist(name: $id) {
      name
      description
      stargazerCount
      isFork
      isPublic
      forks { totalCount }
      files(limit: 10) { name language { name color } }
    }
  }
}`;

// Extra data for the dashboard layout. Only users have contributions.
const ACTIVITY_QUERY = `
query ($login: String!) {
  user(login: $login) {
    createdAt
    following { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    repositoriesContributedTo(
      contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, PULL_REQUEST_REVIEW]
    ) { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

function normaliseActivity(user) {
  if (!user) return null;
  const collection = user.contributionsCollection;
  const calendar = collection?.contributionCalendar;
  return {
    createdAt: user.createdAt ?? null,
    following: user.following?.totalCount ?? null,
    pullRequests: user.pullRequests?.totalCount ?? null,
    issues: user.issues?.totalCount ?? null,
    contributedTo: user.repositoriesContributedTo?.totalCount ?? null,
    commits: collection?.totalCommitContributions ?? 0,
    prsThisYear: collection?.totalPullRequestContributions ?? 0,
    issuesThisYear: collection?.totalIssueContributions ?? 0,
    reviews: collection?.totalPullRequestReviewContributions ?? 0,
    restricted: collection?.restrictedContributionsCount ?? 0,
    totalContributions: calendar?.totalContributions ?? 0,
    days: (calendar?.weeks ?? [])
      .flatMap((week) => week.contributionDays)
      .map((day) => ({ date: day.date, count: day.contributionCount })),
  };
}

const colorOf = (name, color) => parseColor(color ?? (name ? languageColors[name] : null));

function normaliseRepo(node) {
  const language = node.primaryLanguage?.name ?? node.language ?? null;
  const code = node.languages?.edges?.map((edge) => ({
    name: edge.node.name,
    color: colorOf(edge.node.name, edge.node.color),
    size: edge.size,
  }));
  return {
    name: node.name,
    description: node.description ?? '',
    stars: node.stargazerCount ?? node.stargazers_count ?? 0,
    forks: node.forkCount ?? node.forks_count ?? 0,
    isFork: Boolean(node.isFork ?? node.fork),
    isArchived: Boolean(node.isArchived ?? node.archived),
    language,
    languageColor: colorOf(language, node.primaryLanguage?.color),
    // Bytes of code per language, only when asked for (GraphQL only).
    ...(code ? { codeLanguages: code } : {}),
  };
}

/** fetch() with a timeout; a timed-out request becomes a GitHubError. */
async function request(fetchImpl, url, init) {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new GitHubError('GitHub took too long to respond, try again later', {
        status: 504,
        code: 'TIMEOUT',
      });
    }
    throw error;
  }
}

async function graphql(fetchImpl, token, variables, query = QUERY) {
  const response = await request(fetchImpl, `${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': USER_AGENT,
    },
    body: JSON.stringify({ query, variables }),
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
async function graphqlWithFailover(fetchImpl, tokens, variables, state, query) {
  let lastError;
  for (let attempt = 0; attempt < tokens.length; attempt += 1) {
    const index = (state.index + attempt) % tokens.length;
    try {
      const data = await graphql(fetchImpl, tokens[index], variables, query);
      state.index = index;
      return data;
    } catch (error) {
      if (!['RATE_LIMITED', 'BAD_TOKEN'].includes(error.code)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchWithGraphQL(
  username,
  { tokens, includeForks, activity, codeLanguages, fetchImpl },
) {
  const repos = [];
  const state = { index: rotation++ % tokens.length };
  let owner = null;
  let after = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await graphqlWithFailover(
      fetchImpl,
      tokens,
      { login: username, after, isFork: includeForks ? null : false, languages: codeLanguages },
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
    // Repositories are sorted by stars, so once we reach zero we can stop,
    // unless every repository counts (languages by code size).
    const lastStars = nodes.at(-1)?.stars ?? 0;
    if (!node.repositories.pageInfo.hasNextPage || (lastStars === 0 && !codeLanguages)) break;
    after = node.repositories.pageInfo.endCursor;
  }
  let activityData = null;
  if (activity && owner.type === 'User') {
    const data = await graphqlWithFailover(
      fetchImpl,
      tokens,
      { login: owner.login },
      state,
      ACTIVITY_QUERY,
    );
    activityData = normaliseActivity(data?.user);
  }
  return { ...owner, repos, activity: activityData };
}

async function rest(fetchImpl, path) {
  const response = await request(fetchImpl, `${API_URL}${path}`, {
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
    // Contribution data is only available through the GraphQL API.
    activity: null,
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
 * @param {boolean} [options.activity]  also fetch contribution activity (users only)
 */
export async function fetchAccount(
  username,
  {
    token,
    tokens = tokensFromEnv(),
    includeForks = false,
    activity = false,
    codeLanguages = false,
    fetchImpl = globalThis.fetch,
  } = {},
) {
  const usable = usableTokens(token, tokens);
  if (usable.length) {
    return fetchWithGraphQL(username, {
      tokens: usable,
      includeForks,
      activity,
      codeLanguages,
      fetchImpl,
    });
  }
  return fetchWithRest(username, { includeForks, fetchImpl });
}

function usableTokens(token, tokens) {
  return token !== undefined ? [token].filter(Boolean) : tokens.filter(Boolean);
}

// The GraphQL errors say "User not found"; a repository or gist deserves its own message.
async function renamedNotFound(promise, message) {
  try {
    return await promise;
  } catch (error) {
    if (error.code === 'NOT_FOUND')
      throw new GitHubError(message, { status: 404, code: 'NOT_FOUND' });
    throw error;
  }
}

/**
 * Fetch one public repository for the pin card, owned by anyone.
 *
 * @returns {Promise<object>} name, fullName, description, stars, forks, flags and language
 */
export async function fetchRepo(
  owner,
  name,
  { token, tokens = tokensFromEnv(), fetchImpl = globalThis.fetch } = {},
) {
  const usable = usableTokens(token, tokens);
  let node;
  if (usable.length) {
    const state = { index: rotation++ % usable.length };
    const data = await renamedNotFound(
      graphqlWithFailover(fetchImpl, usable, { owner, name }, state, REPO_QUERY),
      'Repository not found',
    );
    node = data?.repository;
  } else {
    node = await renamedNotFound(
      rest(fetchImpl, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`),
      'Repository not found',
    );
  }
  // A token may see private repositories; the card must never show them.
  if (!node || node.isPrivate || node.private) {
    throw new GitHubError('Repository not found', { status: 404, code: 'NOT_FOUND' });
  }
  return {
    ...normaliseRepo(node),
    fullName: node.nameWithOwner ?? node.full_name ?? `${owner}/${name}`,
    isTemplate: Boolean(node.isTemplate ?? node.is_template),
  };
}

/**
 * Fetch one of `username`'s public gists for the gist card. Stars are only available
 * through GraphQL, so they are null without a token.
 */
export async function fetchGist(
  username,
  id,
  { token, tokens = tokensFromEnv(), fetchImpl = globalThis.fetch } = {},
) {
  const usable = usableTokens(token, tokens);
  if (usable.length) {
    const state = { index: rotation++ % usable.length };
    const data = await renamedNotFound(
      graphqlWithFailover(fetchImpl, usable, { login: username, id }, state, GIST_QUERY),
      'Gist not found',
    );
    const gist = data?.user?.gist;
    // Secret gists stay secret, even when the token can read them.
    if (!gist || gist.isPublic === false) {
      throw new GitHubError('Gist not found', { status: 404, code: 'NOT_FOUND' });
    }
    const file = gist.files?.[0];
    return {
      id: gist.name,
      name: file?.name ?? gist.name,
      description: gist.description ?? '',
      stars: gist.stargazerCount ?? 0,
      forks: gist.forks?.totalCount ?? 0,
      isFork: Boolean(gist.isFork),
      language: file?.language?.name ?? null,
      languageColor: colorOf(file?.language?.name, file?.language?.color),
    };
  }
  const gist = await renamedNotFound(
    rest(fetchImpl, `/gists/${encodeURIComponent(id)}`),
    'Gist not found',
  );
  if (gist.public === false || gist.owner?.login?.toLowerCase() !== username.toLowerCase()) {
    throw new GitHubError('Gist not found', { status: 404, code: 'NOT_FOUND' });
  }
  const file = Object.values(gist.files ?? {})[0];
  return {
    id: gist.id,
    name: file?.filename ?? gist.id,
    description: gist.description ?? '',
    stars: null,
    forks: Array.isArray(gist.forks) ? gist.forks.length : 0,
    isFork: Boolean(gist.fork_of),
    language: file?.language ?? null,
    languageColor: colorOf(file?.language),
  };
}
