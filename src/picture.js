// Light and dark variants of a card. GitHub swaps the sources of a <picture>
// element to match the viewer's GitHub appearance setting, so each mode gets
// its own complete card (theme, art, fonts, colours) instead of a media query
// inside one SVG, which can only follow the operating system and swap colours.
import { themePair } from './themes.js';

/** Where a card links to, so people who like it can find out how to make their own. */
export const PROJECT_URL = 'https://github.com/iiogurt/Awesome-Git-Stats';

/** `dark-theme` value that picks the design's own light and dark variant. */
export const MATCH = 'match';

/** Path of the dark card next to the light one: `assets/stars.svg` → `assets/stars-dark.svg`. */
export function darkPath(path) {
  const match = /^(.*?)(\.[^./]+)?$/.exec(path);
  return `${match[1]}-dark${match[2] ?? ''}`;
}

/**
 * Queries for the light and dark card. `options` apply to both, `darkOptions`
 * only to the dark one (and win), so the modes can differ in art, colours or
 * anything else. `darkTheme: 'match'` uses the premade light and dark variant
 * of the chosen theme's design. Returns `{ light, dark }`, `dark` being null
 * if not requested.
 */
export function variantQueries({ base, options = '', darkTheme = '', darkOptions = '' }) {
  const shared = { ...Object.fromEntries(new URLSearchParams(options)), ...base };
  if (!darkTheme && !darkOptions) return { light: shared, dark: null };
  if (darkTheme === MATCH) {
    const pair = themePair(String(shared.theme ?? 'default').toLowerCase());
    return variantQueries({
      base: { ...base, theme: pair.light },
      options,
      darkTheme: pair.dark,
      darkOptions,
    });
  }
  return {
    light: shared,
    dark: {
      ...shared,
      ...Object.fromEntries(new URLSearchParams(darkOptions)),
      ...(darkTheme ? { theme: darkTheme } : {}),
    },
  };
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * README snippet that shows `dark` in GitHub's dark mode and `light` otherwise.
 * With `href`, the card is a link (an SVG inside an <img> cannot hold links itself).
 */
export function pictureHtml({ light, dark, alt = 'GitHub stars', href }) {
  const picture = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${escapeAttr(dark)}" />
  <img alt="${escapeAttr(alt)}" src="${escapeAttr(light)}" />
</picture>`;
  if (!href) return picture;
  return `<a href="${escapeAttr(href)}">\n${picture.replace(/^/gm, '  ')}\n</a>`;
}
