import { TtlCache } from './cache.js';
import { GitHubError, fetchAccount, fetchGist, fetchRepo, tokensFromEnv } from './github.js';
import { ACTIVITY_LAYOUTS, OptionsError, fallbackOptions, parseOptions } from './options.js';
import { renderCard, renderError } from './render/index.js';
import { computeStats } from './stats.js';

const accountCache = new TtlCache();
const ERROR_CACHE_SECONDS = 10 * 60;
// Unknown users, repositories and gists are remembered for a while, so requests for
// names that don't exist can't use up the tokens' GitHub quota.
const NOT_FOUND_CACHE_MS = 5 * 60 * 1000;
// A live card must be done well before Vercel stops the function (maxDuration 15s).
// The Action has no such limit, so it only uses the per-request timeouts.
const DEADLINE_MS = 12 * 1000;

function allowedUsernames(env) {
  const raw = env.ALLOWED_USERNAMES;
  if (!raw) return null;
  return new Set(
    raw
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
}

// Fetch what a layout needs: one repository, one gist, or the account's repositories
// (with contribution activity or language sizes for the layouts that show them).
function loadData(options, { tokens, fetchImpl }) {
  const { layout, username, repo, gist } = options;
  if (layout === 'pin') {
    const key = `repo:${repo.owner}/${repo.name}`.toLowerCase();
    return cached(key, () => fetchRepo(repo.owner, repo.name, { tokens, fetchImpl }));
  }
  if (layout === 'gist') {
    const key = `gist:${username}:${gist}`.toLowerCase();
    return cached(key, () => fetchGist(username, gist, { tokens, fetchImpl }));
  }
  const activity = ACTIVITY_LAYOUTS.includes(layout);
  const codeLanguages = layout === 'languages';
  const key = `${username.toLowerCase()}:${options.includeForks}:${activity}:${codeLanguages}`;
  return cached(key, () =>
    fetchAccount(username, {
      tokens,
      includeForks: options.includeForks,
      activity,
      codeLanguages,
      fetchImpl,
    }),
  );
}

async function cached(key, load) {
  const hit = accountCache.get(key);
  if (hit) return hit;
  const pending = load();
  // Cache the promise so concurrent requests share one GitHub round trip.
  accountCache.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    if (error instanceof GitHubError && error.code === 'NOT_FOUND') {
      accountCache.set(key, pending, NOT_FOUND_CACHE_MS);
    } else {
      accountCache.delete(key);
    }
    throw error;
  }
}

// Reject with a timeout error when `promise` takes longer than `ms`.
function withDeadline(promise, ms) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new GitHubError('GitHub took too long to respond, try again later', {
            status: 504,
            code: 'TIMEOUT',
          }),
        ),
      ms,
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/**
 * Build a card for the given query parameters. Never throws: failures are
 * rendered as an error card so READMEs always show an image. `deadlineMs` caps the time
 * spent waiting for GitHub (the HTTP handler sets it; the Action waits as long as needed).
 *
 * @returns {Promise<{ status: number, svg: string, cacheSeconds: number }>}
 */
export async function createCard(
  query,
  { env = process.env, fetchImpl = globalThis.fetch, token, deadlineMs = Infinity } = {},
) {
  let options;
  try {
    options = parseOptions(query);
  } catch (error) {
    if (!(error instanceof OptionsError)) throw error;
    return {
      status: 400,
      svg: renderError({ message: error.message, code: 'BAD_REQUEST' }, fallbackOptions(query)),
      cacheSeconds: ERROR_CACHE_SECONDS,
    };
  }

  const allowed = allowedUsernames(env);
  const owners = [options.username, options.repo?.owner].filter(Boolean);
  if (allowed && owners.some((owner) => !allowed.has(owner.toLowerCase()))) {
    return {
      status: 403,
      svg: renderError(
        { message: 'This username is not allowed here', code: 'FORBIDDEN' },
        options,
      ),
      cacheSeconds: ERROR_CACHE_SECONDS,
    };
  }

  try {
    const tokens = token !== undefined ? [token].filter(Boolean) : tokensFromEnv(env);
    const pending = loadData(options, { tokens, fetchImpl });
    const data = await (deadlineMs === Infinity ? pending : withDeadline(pending, deadlineMs));
    const languages =
      options.layout === 'overview' ? Math.min(options.langsCount, 4) : options.langsCount;
    // A pinned repository or gist is rendered as fetched.
    const stats = ['pin', 'gist'].includes(options.layout)
      ? data
      : computeStats(data, { exclude: options.exclude, languages });
    return { status: 200, svg: renderCard(stats, options), cacheSeconds: options.cacheSeconds };
  } catch (error) {
    const known = error instanceof GitHubError;
    if (!known) console.error(error);
    return {
      status: known ? error.status : 500,
      svg: renderError(
        {
          message: known ? error.message : 'Something went wrong',
          code: known ? error.code : 'INTERNAL',
        },
        options,
      ),
      cacheSeconds: ERROR_CACHE_SECONDS,
    };
  }
}

function queryFromRequest(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  const url = new URL(req.url ?? '/', 'http://localhost');
  return Object.fromEntries(url.searchParams);
}

/** Node / Vercel style request handler. */
export default async function handler(req, res) {
  const { status, svg, cacheSeconds } = await createCard(queryFromRequest(req), {
    deadlineMs: DEADLINE_MS,
  });
  // Error cards are sent as 200: GitHub's image proxy may not show an image that
  // comes with an error status, and the card exists to explain the error. The real
  // status stays visible in a header.
  res.statusCode = 200;
  res.setHeader('X-Card-Status', String(status));
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
  res.end(svg);
}

/** Exposed for tests. */
export function clearCache() {
  accountCache.clear();
}
