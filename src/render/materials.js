/**
 * Shared surface finishes that give flat shapes depth: glossy bars, recessed
 * tracks, glass panels and lit spheres, or their soft-plastic and paper-cut
 * counterparts. Everything is a gradient overlay in
 * white or black, so it works with any colour (theme variable or language hex)
 * and costs nothing like a filter would when the card is animated.
 */

const r1 = (n) => Math.round(n * 10) / 10;

const stop = ([offset, color, opacity]) =>
  `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;

// The shape of each gradient; a finish only changes the stops.
const SHAPES = {
  // Light over a bar or tile, top to bottom.
  'ags-sheen': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // Light across an upright bar, left to right.
  'ags-sheen-x': 'linearGradient x1="0" y1="0" x2="1" y2="0"',
  // Gentler light for large surfaces.
  'ags-sheen-soft': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // The groove a bar runs in.
  'ags-inset': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // A sphere lit from the top left.
  'ags-sphere': 'radialGradient cx=".36" cy=".3" r=".8"',
  // Light on a ring, top to bottom.
  'ags-ring-light': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // The shadow a ring casts into its own hole.
  'ags-hole': 'radialGradient',
  // Frosted glass.
  'ags-glass': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // A contact shadow under a raised shape.
  'ags-drop': 'radialGradient',
  // A hairline of light along a top edge, fading at both ends.
  'ags-edge': 'linearGradient x1="0" y1="0" x2="1" y2="0"',
  // A rim lit from above.
  'ags-edge-v': 'linearGradient x1="0" y1="0" x2="0" y2="1"',
  // A dome for large discs such as a pie.
  'ags-dome': 'radialGradient cx=".38" cy=".3" r=".85"',
};

const W = '#fff';
const K = '#000';

/**
 * Surface finishes (`finish=`): the stops of each gradient, and CSS for the
 * halo (a glow around bars), cast (a shadow offset below raised shapes) and
 * backing (an opaque layer under see-through panels).
 * `flat` has no stops at all, which SVG paints as nothing: the plain look.
 */
const FINISHES = {
  // Glossy plastic and glass: strong highlights, deep shade.
  gloss: {
    stops: {
      'ags-sheen': [
        [0, W, 0.5],
        [0.45, W, 0.12],
        [0.55, K, 0],
        [1, K, 0.22],
      ],
      'ags-sheen-x': [
        [0, W, 0.1],
        [0.3, W, 0.42],
        [0.55, W, 0.05],
        [1, K, 0.25],
      ],
      'ags-sheen-soft': [
        [0, W, 0.2],
        [0.5, W, 0],
        [1, K, 0.16],
      ],
      'ags-inset': [
        [0, K, 0.34],
        [0.45, K, 0.06],
        [1, W, 0.08],
      ],
      'ags-sphere': [
        [0, W, 0.6],
        [0.3, W, 0.14],
        [0.65, K, 0],
        [1, K, 0.4],
      ],
      'ags-ring-light': [
        [0, W, 0.38],
        [0.5, W, 0],
        [1, K, 0.3],
      ],
      'ags-hole': [
        [0.72, K, 0],
        [1, K, 0.35],
      ],
      'ags-glass': [
        [0, W, 0.13],
        [0.4, W, 0.04],
        [1, W, 0.02],
      ],
      'ags-drop': [
        [0, K, 0.38],
        [1, K, 0],
      ],
      'ags-edge': [
        [0, W, 0],
        [0.5, W, 0.4],
        [1, W, 0],
      ],
      'ags-edge-v': [
        [0, W, 0.45],
        [0.5, W, 0.05],
        [1, W, 0],
      ],
      'ags-dome': [
        [0, W, 0.36],
        [0.35, W, 0.08],
        [0.7, K, 0],
        [1, K, 0.3],
      ],
    },
    css: '.cast,.backing{display:none}.halo{opacity:.16}',
  },
  // Soft-touch pastel plastic: colours washed with white, matte, gentle shade.
  soft: {
    stops: {
      'ags-sheen': [
        [0, W, 0.5],
        [0.5, W, 0.34],
        [1, W, 0.24],
      ],
      'ags-sheen-x': [
        [0, W, 0.44],
        [0.45, W, 0.36],
        [1, W, 0.2],
      ],
      'ags-sheen-soft': [
        [0, W, 0.42],
        [1, W, 0.26],
      ],
      'ags-inset': [
        [0, K, 0.12],
        [0.5, K, 0.02],
        [1, W, 0.12],
      ],
      'ags-sphere': [
        [0, W, 0.62],
        [0.55, W, 0.36],
        [1, W, 0.22],
      ],
      'ags-ring-light': [
        [0, W, 0.46],
        [1, W, 0.26],
      ],
      'ags-hole': [
        [0.8, K, 0],
        [1, K, 0.12],
      ],
      'ags-glass': [
        [0, W, 0.16],
        [1, W, 0.08],
      ],
      'ags-drop': [
        [0, K, 0.16],
        [1, K, 0],
      ],
      'ags-edge': [
        [0, W, 0],
        [0.5, W, 0.3],
        [1, W, 0],
      ],
      'ags-edge-v': [
        [0, W, 0.35],
        [1, W, 0.05],
      ],
      'ags-dome': [
        [0, W, 0.5],
        [0.6, W, 0.34],
        [1, W, 0.24],
      ],
    },
    css: '.halo,.backing{display:none}.cast{opacity:.12}',
  },
  // Paper cut-outs: flat colour with a bevelled edge, crisp shadows below,
  // and tracks cut into the card.
  paper: {
    stops: {
      'ags-sheen': [
        [0, W, 0.24],
        [0.16, W, 0],
        [0.8, K, 0],
        [1, K, 0.2],
      ],
      'ags-sheen-x': [
        [0, W, 0.24],
        [0.14, W, 0],
        [0.8, K, 0],
        [1, K, 0.18],
      ],
      'ags-sheen-soft': [
        [0, W, 0.18],
        [0.06, W, 0],
        [0.94, K, 0],
        [1, K, 0.14],
      ],
      'ags-inset': [
        [0, K, 0.45],
        [0.3, K, 0.12],
        [0.32, K, 0],
      ],
      'ags-sphere': [
        [0, W, 0.1],
        [1, W, 0],
      ],
      'ags-ring-light': [],
      'ags-hole': [
        [0.84, K, 0],
        [0.86, K, 0.12],
        [1, K, 0.4],
      ],
      'ags-glass': [
        [0, W, 0.06],
        [1, W, 0.06],
      ],
      'ags-drop': [
        [0, K, 0.28],
        [0.7, K, 0.2],
        [1, K, 0],
      ],
      'ags-edge': [],
      'ags-edge-v': [
        [0, W, 0.2],
        [0.2, W, 0],
      ],
      'ags-dome': [],
    },
    css: '.halo{display:none}.cast{opacity:.34}.backing{fill:var(--bg)}',
  },
  flat: {
    stops: {},
    css: '.halo,.cast,.backing{display:none}',
  },
};

export const FINISH_NAMES = Object.keys(FINISHES);

/**
 * The gradients a card body refers to, in the given finish, and the CSS for
 * its halos and shadows; both empty when the body uses no materials.
 */
export function materials(body, finish = 'gloss') {
  const { stops, css } = FINISHES[finish] ?? FINISHES.gloss;
  const used = Object.keys(SHAPES).filter((id) => body.includes(`url(#${id})`));
  if (!used.length) return { defs: '', css: '' };
  const defs = used
    .map((id) => {
      const [tag, ...attrs] = SHAPES[id].split(' ');
      const open = [tag, `id="${id}"`, ...attrs].join(' ');
      return `<${open}>${(stops[id] ?? []).map(stop).join('')}</${tag}>`;
    })
    .join('');
  return { defs, css };
}

const paint = (fill, extra = '') => {
  const cls = [fill.startsWith('#') ? '' : fill, extra].filter(Boolean).join(' ');
  return `${fill.startsWith('#') ? `fill="${fill}" ` : ''}${cls ? `class="${cls}"` : ''}`.trim();
};

// A copy of a shape's geometry, offset down and to the right, as its shadow.
const cast = (attrs) => `<${attrs} fill="${K}" class="cast"/>`;

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
    ? `<rect x="${r1(x - 2)}" y="${r1(y - 2)}" width="${r1(width + 4)}" height="${r1(height + 4)}" rx="${r1(rx + 2)}" ${paint(fill, 'halo')}/>`
    : '';
  const shadow = castShadow({ x, y, width, height, rx });
  return `<g${attrs}>${halo}${shadow}<rect ${shape} ${paint(fill)}/><rect ${shape} fill="url(#ags-sheen${upright ? '-x' : ''})"/></g>`;
}

/** The shadow of a raised rectangle, drawn before it (shown by paper and soft). */
export function castShadow({ x, y, width, height, rx }) {
  return cast(
    `rect x="${r1(x + 1)}" y="${r1(y + 1.5)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}"`,
  );
}

/** A small lit sphere with a shadow, e.g. a legend dot. */
export function orb({ cx, cy, r, fill }) {
  return `${cast(`circle cx="${r1(cx + 0.6)}" cy="${r1(cy + 1)}" r="${r}"`)}<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" ${paint(fill)}/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="url(#ags-sphere)"/>`;
}

/** A frosted glass panel with a lit top edge and a shadow. */
export function glassPanel({ x, y, width, height, rx = 10, base = 'panel' }) {
  const shape = `x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" rx="${rx}"`;
  const shadow = castShadow({ x, y, width, height, rx });
  // Paper is opaque: a backing keeps the shadow from showing through the panel.
  return `${shadow}<rect ${shape} class="backing"/><rect ${shape} class="${base}"/><rect ${shape} fill="url(#ags-glass)"/>
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
 * Gloss for a regular grid of cells (heatmaps, waffles) as patterns, so a grid
 * of hundreds of cells needs only a few extra elements: `gridCast` under the
 * cells and `gridGloss` over them. `x` and `y` are the top left of the first cell.
 */
export function gridSheen({ id, x, y, cell, step, rx = 2 }) {
  const tile = (inner) =>
    `x="${r1(x)}" y="${r1(y)}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">${inner}`;
  return `<pattern id="${id}" ${tile(`<rect width="${cell}" height="${cell}" rx="${rx}" fill="url(#ags-sheen)"/>`)}</pattern>
    <pattern id="${id}-cast" ${tile(`<rect x="1" y="1.5" width="${cell}" height="${cell}" rx="${rx}" fill="${K}"/>`)}</pattern>`;
}

/** Cover an area of a grid with the gloss pattern `id` from `gridSheen`. */
export function gridGloss({ id, x, y, width, height }) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" fill="url(#${id})"/>`;
}

/** The cells' shadows for an area of a grid, drawn before the cells. */
export function gridCast({ id, x, y, width, height }) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width + 1)}" height="${r1(height + 1.5)}" fill="url(#${id}-cast)" class="cast"/>`;
}
