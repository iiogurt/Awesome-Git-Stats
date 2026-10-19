import { themes, resolveTheme } from './themes.js';

export const LAYOUTS = ['overview', 'repos', 'compact', 'badge'];

export const CACHE = {
  default: 4 * 60 * 60,
  min: 30 * 60,
  max: 24 * 60 * 60,
};

const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const COLOR_PARAMS = {
  bg_color: 'bg',
  border_color: 'border',
  title_color: 'title',
  text_color: 'text',
  muted_color: 'muted',
  accent_color: 'accent',
  track_color: 'track',
};

export class OptionsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OptionsError';
    this.status = 400;
  }
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function bool(value, fallback = false) {
  const v = first(value);
  if (v === undefined || v === null) return fallback;
  if (v === '') return true;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function int(value, { fallback, min, max }) {
  const n = Number.parseInt(first(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function list(value) {
  const v = first(value);
  if (!v) return [];
  return String(v)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isValidUsername(username) {
  return typeof username === 'string' && USERNAME.test(username);
}

/**
 * Validate and normalise query parameters. Unknown values fall back to
 * sensible defaults so a typo never breaks somebody's README; only a
 * missing or malformed username is treated as an error.
 */
export function parseOptions(query = {}) {
  const username = String(first(query.username) ?? '').trim();
  if (!username) throw new OptionsError('Missing "username" parameter');
  if (!isValidUsername(username)) throw new OptionsError('Invalid GitHub username');

  const layoutParam = String(first(query.layout) ?? 'overview').toLowerCase();
  const layout = LAYOUTS.includes(layoutParam) ? layoutParam : 'overview';

  const themeParam = String(first(query.theme) ?? 'default').toLowerCase();
  const themeName = themeParam in themes ? themeParam : 'default';

  const overrides = {};
  for (const [param, key] of Object.entries(COLOR_PARAMS)) {
    if (query[param] !== undefined) overrides[key] = first(query[param]);
  }

  const customTitle = first(query.custom_title);
  const label = first(query.label);

  return {
    username,
    layout,
    themeName,
    theme: resolveTheme(themeName, overrides),
    hideBorder: bool(query.hide_border),
    hideTitle: bool(query.hide_title),
    animate: !bool(query.disable_animations),
    radius: int(query.border_radius, { fallback: 10, min: 0, max: 30 }),
    customTitle: customTitle ? String(customTitle).slice(0, 60) : null,
    label: label ? String(label).slice(0, 24) : 'stars',
    count: int(query.count, { fallback: 5, min: 1, max: 10 }),
    langsCount: int(query.langs_count, { fallback: 5, min: 1, max: 8 }),
    exclude: list(query.exclude),
    hide: list(query.hide).map((item) => item.toLowerCase()),
    includeForks: bool(query.include_forks),
    cacheSeconds: int(query.cache_seconds, {
      fallback: CACHE.default,
      min: CACHE.min,
      max: CACHE.max,
    }),
  };
}

/** Best-effort options for rendering an error card when parsing failed. */
export function fallbackOptions(query = {}) {
  const themeParam = String(first(query.theme) ?? 'default').toLowerCase();
  const themeName = themeParam in themes ? themeParam : 'default';
  return {
    themeName,
    theme: resolveTheme(themeName),
    hideBorder: bool(query.hide_border),
    hideTitle: false,
    animate: false,
    radius: int(query.border_radius, { fallback: 10, min: 0, max: 30 }),
  };
}
