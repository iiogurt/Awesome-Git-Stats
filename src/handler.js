import { TtlCache } from './cache.js';
import { GitHubError, fetchAccount, tokensFromEnv } from './github.js';
import { OptionsError, fallbackOptions, parseOptions } from './options.js';
import { renderCard, renderError } from './render/index.js';
import { computeStats } from './stats.js';

const accountCache = new TtlCache();
const ERROR_CACHE_SECONDS = 10 * 60;

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

async function loadAccount(options, { tokens, fetchImpl }) {
  const activity = options.layout === 'dashboard';
  const key = `${options.username.toLowerCase()}:${options.includeForks}:${activity}`;
  const cached = accountCache.get(key);
  if (cached) return cached;
  const pending = fetchAccount(options.username, {
    tokens,
    includeForks: options.includeForks,
    activity,
    fetchImpl,
  });
  // Cache the promise so concurrent requests share one GitHub round trip.
  accountCache.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    accountCache.delete(key);
    throw error;
  }
}

/**
 * Build a card for the given query parameters. Never throws: failures are
 * rendered as an error card so READMEs always show an image.
 *
 * @returns {Promise<{ status: number, svg: string, cacheSeconds: number }>}
 */
export async function createCard(
  query,
  { env = process.env, fetchImpl = globalThis.fetch, token } = {},
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
  if (allowed && !allowed.has(options.username.toLowerCase())) {
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
    const account = await loadAccount(options, { tokens, fetchImpl });
    const languages =
      options.layout === 'overview' ? Math.min(options.langsCount, 4) : options.langsCount;
    const stats = computeStats(account, { exclude: options.exclude, languages });
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
  const { status, svg, cacheSeconds } = await createCard(queryFromRequest(req));
  res.statusCode = status;
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
