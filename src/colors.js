// Colour helpers for matching GitHub's language colours to a theme.

/** "#rgb", "#rgba", "#rrggbb" or "#rrggbbaa" to [r, g, b] in 0..1 (alpha dropped). */
function toRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length < 6 ? h.replace(/./g, '$&$&') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

function toHsl(hex) {
  const [r, g, b] = toRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function toHex([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h / 60) % 6];
  return `#${[r, g, b]
    .map((v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const mix = (a, b, t) => a + (b - a) * t;
// The signed shortest way round the colour wheel from hue a to hue b.
const arc = (a, b) => ((b - a + 540) % 360) - 180;
// Below this saturation a colour reads as grey and has no hue to speak of.
const GREY = 0.12;

/**
 * What a theme's colours have in common, for `harmonise`: the saturation and lightness
 * its charts should sit at, and, when the title and accent share a hue (a green
 * terminal, a blueprint) or have none (black on white), the hue everything leans to.
 *
 * `partner` is the other theme of a light and dark pair. When only one of the two has
 * a single hue, the other borrows it, so both cards of a design colour languages alike.
 */
export function themeTone(theme, partner) {
  const own = toneOf(theme);
  if (own.mono || !partner) return own;
  const other = toneOf(partner);
  return other.mono && other.hue !== null ? { ...own, mono: true, hue: other.hue } : own;
}

function toneOf(theme) {
  const title = toHsl(theme.title);
  const accent = toHsl(theme.accent);
  const [, , bgLight] = toHsl(theme.bg);
  const vivid = [title, accent].filter(([, s]) => s >= GREY);
  const saturation = vivid.length ? Math.max(...vivid.map(([, s]) => s)) : 0;
  let hue = null;
  if (vivid.length === 1) [[hue]] = vivid;
  else if (vivid.length === 2 && Math.abs(arc(title[0], accent[0])) < 40) {
    hue = title[0] + arc(title[0], accent[0]) / 2;
  }
  return {
    hue,
    saturation,
    lightness: bgLight < 0.5 ? 0.62 : 0.5,
    mono: vivid.length === 0 || hue !== null,
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * A language colour fitted to a theme's tone.
 *
 * In a single-hue theme (or a black and white one) every language becomes a shade of
 * that hue: its own hue only nudges the result a little to either side and picks how
 * light it is, so languages stay apart without bringing in foreign colours. In a theme
 * of several hues a language keeps its hue, and its saturation and lightness move
 * part of the way to the theme's.
 */
export function harmonise(color, tone) {
  const [h, s, l] = toHsl(color);
  if (s < GREY) return toHex([h, s, mix(l, tone.lightness, 0.4)]);
  if (!tone.mono) {
    const saturation = mix(s, clamp(tone.saturation, 0.35, 0.8), 0.4);
    return toHex([h, saturation, mix(l, tone.lightness, 0.4)]);
  }
  // A spread of lightness that differs between neighbouring hues.
  const step = (((h * 7) % 360) / 360 - 0.5) * 0.34;
  if (tone.hue === null) return toHex([0, 0, clamp(tone.lightness + step * 1.6, 0.18, 0.82)]);
  const hue = (tone.hue + (arc(tone.hue, h) / 180) * 24 + 360) % 360;
  return toHex([hue, clamp(tone.saturation, 0.35, 0.85), clamp(tone.lightness + step, 0.3, 0.78)]);
}
