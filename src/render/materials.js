/**
 * Shared surface finishes that give flat shapes depth: glossy bars, recessed
 * tracks, glass panels and lit spheres. Everything is a gradient overlay in
 * white or black, so it works with any colour (theme variable or language hex)
 * and costs nothing like a filter would when the card is animated.
 */

const r1 = (n) => Math.round(n * 10) / 10;

const stop = (offset, color, opacity) =>
  `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;

const MATERIALS = [
  // Gloss: a bright upper half, a soft shade at the bottom.
  `<linearGradient id="ags-sheen" x1="0" y1="0" x2="0" y2="1">${stop(0, '#fff', 0.5)}${stop(0.45, '#fff', 0.12)}${stop(0.55, '#000', 0)}${stop(1, '#000', 0.22)}</linearGradient>`,
  // Gloss across an upright bar: lit from the left, rounding off to the right.
  `<linearGradient id="ags-sheen-x" x1="0" y1="0" x2="1" y2="0">${stop(0, '#fff', 0.1)}${stop(0.3, '#fff', 0.42)}${stop(0.55, '#fff', 0.05)}${stop(1, '#000', 0.25)}</linearGradient>`,
  // A gentler gloss for large surfaces.
  `<linearGradient id="ags-sheen-soft" x1="0" y1="0" x2="0" y2="1">${stop(0, '#fff', 0.2)}${stop(0.5, '#fff', 0)}${stop(1, '#000', 0.16)}</linearGradient>`,
  // A groove: shadow along the top inner edge, a faint highlight at the bottom.
  `<linearGradient id="ags-inset" x1="0" y1="0" x2="0" y2="1">${stop(0, '#000', 0.34)}${stop(0.45, '#000', 0.06)}${stop(1, '#fff', 0.08)}</linearGradient>`,
  // A sphere lit from the top left.
  `<radialGradient id="ags-sphere" cx=".36" cy=".3" r=".8">${stop(0, '#fff', 0.6)}${stop(0.3, '#fff', 0.14)}${stop(0.65, '#000', 0)}${stop(1, '#000', 0.4)}</radialGradient>`,
  // The light on a ring: bright on top, shaded underneath.
  `<linearGradient id="ags-ring-light" x1="0" y1="0" x2="0" y2="1">${stop(0, '#fff', 0.38)}${stop(0.5, '#fff', 0)}${stop(1, '#000', 0.3)}</linearGradient>`,
  // The shadow a ring casts into its own hole.
  `<radialGradient id="ags-hole">${stop(0.72, '#000', 0)}${stop(1, '#000', 0.35)}</radialGradient>`,
  // Frosted glass.
  `<linearGradient id="ags-glass" x1="0" y1="0" x2="0" y2="1">${stop(0, '#fff', 0.13)}${stop(0.4, '#fff', 0.04)}${stop(1, '#fff', 0.02)}</linearGradient>`,
  // A soft contact shadow under a raised shape.
  `<radialGradient id="ags-drop">${stop(0, '#000', 0.38)}${stop(1, '#000', 0)}</radialGradient>`,
  // A hairline of light along a top edge, fading at both ends.
  `<linearGradient id="ags-edge" x1="0" y1="0" x2="1" y2="0">${stop(0, '#fff', 0)}${stop(0.5, '#fff', 0.4)}${stop(1, '#fff', 0)}</linearGradient>`,
  // A rim lit from above: bright at the top, gone by the bottom.
  `<linearGradient id="ags-edge-v" x1="0" y1="0" x2="0" y2="1">${stop(0, '#fff', 0.45)}${stop(0.5, '#fff', 0.05)}${stop(1, '#fff', 0)}</linearGradient>`,
  // A gentle dome for large discs such as a pie.
  `<radialGradient id="ags-dome" cx=".38" cy=".3" r=".85">${stop(0, '#fff', 0.36)}${stop(0.35, '#fff', 0.08)}${stop(0.7, '#000', 0)}${stop(1, '#000', 0.3)}</radialGradient>`,
];

/** The material gradients a card body refers to, for the frame's <defs>. */
export function materialDefs(body) {
  return MATERIALS.filter((def) => body.includes(`url(#${def.match(/id="([^"]+)"/)[1]})`)).join('');
}

const paint = (fill) => (fill.startsWith('#') ? `fill="${fill}"` : `class="${fill}"`);

/**
 * A recessed track for bars: the theme's track colour with a groove on top.
 */
export function track({ x, y, width, height }) {
  const rx = r1(height / 2);
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}" class="track"/>
    <rect x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}" fill="url(#ags-inset)"/>`;
}

/**
 * A glossy bar inside a faint halo of its own colour. `fill` is a validated hex
 * colour or a CSS class (e.g. "accent"); `attrs` go on the group, for animation.
 */
export function glossBar({
  x,
  y,
  width,
  height,
  fill,
  attrs = '',
  glow = true,
  upright = false,
  rx,
}) {
  rx ??= r1(Math.min(height / 2, width / 2));
  const shape = `x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}"`;
  const halo = glow
    ? `<rect x="${r1(x - 2)}" y="${r1(y - 2)}" width="${r1(width + 4)}" height="${r1(height + 4)}" rx="${r1(rx + 2)}" ${paint(fill)} opacity=".16"/>`
    : '';
  return `<g${attrs}>${halo}<rect ${shape} ${paint(fill)}/><rect ${shape} fill="url(#ags-sheen${upright ? '-x' : ''})"/></g>`;
}

/** A small lit sphere, e.g. a legend dot. */
export function orb({ cx, cy, r, fill }) {
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" ${paint(fill)}/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="url(#ags-sphere)"/>`;
}

/** A frosted glass panel with a lit top edge. */
export function glassPanel({ x, y, width, height, rx = 10, base = 'panel' }) {
  const shape = `x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}"`;
  return `<rect ${shape} class="${base}"/><rect ${shape} fill="url(#ags-glass)"/>
    <path d="M${r1(x + rx)} ${r1(y + 0.5)}H${r1(x + width - rx)}" stroke="url(#ags-edge)" stroke-width="1"/>`;
}

/** A frosted glass disc with a rim lit from above, e.g. the centre of a ring. */
export function glassDisc({ cx, cy, r }) {
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" class="glass"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="url(#ags-glass)" stroke="url(#ags-edge-v)" stroke-width="1"/>`;
}

/** A soft elliptical contact shadow centred under a shape. */
export function dropShadow({ cx, cy, rx, ry }) {
  return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="url(#ags-drop)"/>`;
}

/**
 * Light and depth for a ring (donut or progress ring) of radius `r` and
 * `stroke` width: gloss across the band and a shadow cast into the hole.
 */
export function ringLight({ cx, cy, r, stroke }) {
  const inner = r - stroke / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#ags-ring-light)" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cy}" r="${r1(inner)}" fill="url(#ags-hole)"/>`;
}

/**
 * Gloss for a regular grid of cells (heatmaps, waffles) as one pattern, so a
 * grid of hundreds of cells needs only a few extra elements: draw it over the
 * cells with `gridGloss`. `x` and `y` are the top left of the first cell.
 */
export function gridSheen({ id, x, y, cell, step, rx = 2 }) {
  return `<pattern id="${id}" x="${r1(x)}" y="${r1(y)}" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><rect width="${cell}" height="${cell}" rx="${rx}" fill="url(#ags-sheen)"/></pattern>`;
}

/** Cover an area of a grid with the gloss pattern `id` from `gridSheen`. */
export function gridGloss({ id, x, y, width, height }) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" fill="url(#${id})"/>`;
}
