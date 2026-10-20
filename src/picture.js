// Light and dark variants of a card. GitHub swaps the sources of a <picture>
// element to match the viewer's GitHub appearance setting, so each mode gets
// its own complete card (theme, art, fonts, colours) instead of a media query
// inside one SVG, which can only follow the operating system and swap colours.

/** Path of the dark card next to the light one: `assets/stars.svg` → `assets/stars-dark.svg`. */
export function darkPath(path) {
  const match = /^(.*?)(\.[^./]+)?$/.exec(path);
  return `${match[1]}-dark${match[2] ?? ''}`;
}

/**
 * Queries for the light and dark card. `options` apply to both, `darkOptions`
 * only to the dark one (and win), so the modes can differ in art, colours or
 * anything else. Returns `{ light, dark }`, `dark` being null if not requested.
 */
export function variantQueries({ base, options = '', darkTheme = '', darkOptions = '' }) {
  const shared = { ...Object.fromEntries(new URLSearchParams(options)), ...base };
  if (!darkTheme && !darkOptions) return { light: shared, dark: null };
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

/** README snippet that shows `dark` in GitHub's dark mode and `light` otherwise. */
export function pictureHtml({ light, dark, alt = 'GitHub stars' }) {
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${escapeAttr(dark)}" />
  <img alt="${escapeAttr(alt)}" src="${escapeAttr(light)}" />
</picture>`;
}
