/**
 * Surface finishes (`finish=`) for bars, tracks, dots, panels, rings, grids and
 * discs. The helpers below draw a shape's base colour; the active finish adds
 * the layers under and over it: gloss and glass, pastel plastic, paper, chrome,
 * neon tubes, 8-bit mosaics, pencil hatching, holographic foil or 3D blocks.
 * Everything is built from gradients, patterns and copies of the shape, never
 * filters, so cards stay cheap to draw while they animate. Layers are white,
 * black or the background colour, so they work with any colour and theme.
 */

const r1 = (n) => Math.round(n * 10) / 10;
const W = '#fff';
const K = '#000';

const stop = ([offset, color, opacity]) =>
  `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;

// The shape of each gradient; a finish only chooses the stops.
const GRADIENTS = {
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
  // Holographic foil: two rainbows at different angles that cross-fade.
  'ags-holo': 'linearGradient x1="0" y1="0" x2="1" y2="1"',
  'ags-holo-b': 'linearGradient x1="1" y1="0" x2="0" y2="1"',
};

const RAINBOW = ['#ff4fd8', '#ffd84f', '#4fffb0', '#4fc3ff', '#b44fff', '#ff4fd8'];
const rainbow = (opacity) => RAINBOW.map((c, i) => [r1(i / (RAINBOW.length - 1)), c, opacity]);

// Patterns shared by every card that uses them. `gap` paints in the background colour.
const PATTERNS = {
  // Pencil hatching: background-coloured diagonal gaps leave strokes of colour.
  'ags-hatch':
    '<pattern id="ags-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="1.7" height="4" class="gap"/></pattern>',
  // An 8-bit mosaic: a grid of background-coloured lines every 4 pixels.
  'ags-pix':
    '<pattern id="ags-pix" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="3" width="1" height="4" class="gap"/><rect y="3" width="4" height="1" class="gap"/></pattern>',
  // Brushed metal: fine horizontal streaks.
  'ags-brushed': `<pattern id="ags-brushed" width="40" height="3" patternUnits="userSpaceOnUse"><rect width="40" height="1" fill="${W}" opacity=".07"/><rect x="12" y="2" width="22" height=".6" fill="${K}" opacity=".08"/></pattern>`,
};

// ---------------------------------------------------------------------------
// Shapes: rectangles {x, y, width, height, rx}, circles {cx, cy, r} or paths {d}.

const isCircle = (g) => g.r != null;
const isRect = (g) => !g.d && !isCircle(g);

function el(g, attrs) {
  if (g.d) return `<path d="${g.d}" ${attrs}/>`;
  if (isCircle(g)) return `<circle cx="${r1(g.cx)}" cy="${r1(g.cy)}" r="${r1(g.r)}" ${attrs}/>`;
  return `<rect x="${r1(g.x)}" y="${r1(g.y)}" width="${r1(g.width)}" height="${r1(g.height)}" rx="${r1(g.rx ?? 0)}" ${attrs}/>`;
}

// The shape grown (or, with a negative n, shrunk) by n on every side; null if it vanishes.
function grow(g, n) {
  if (g.d) return null;
  if (isCircle(g)) return g.r + n > 0.5 ? { ...g, r: g.r + n } : null;
  const width = g.width + 2 * n;
  const height = g.height + 2 * n;
  if (width <= 0.5 || height <= 0.5) return null;
  return { x: g.x - n, y: g.y - n, width, height, rx: Math.max(0, (g.rx ?? 0) + n) };
}

const shift = (g, dx, dy) =>
  isCircle(g) ? { ...g, cx: g.cx + dx, cy: g.cy + dy } : { ...g, x: g.x + dx, y: g.y + dy };

const paint = (fill, extra = '') => {
  const hex = fill.startsWith('#');
  const cls = [hex ? '' : fill, extra].filter(Boolean).join(' ');
  return `${hex ? `fill="${fill}" ` : ''}${cls ? `class="${cls}"` : ''}`.trim();
};

// A small seeded wobble, so pencil lines look drawn by hand but stay stable.
const wobble = (n, k) => r1(Math.sin(n * 12.9898 + k * 78.233) * 0.9);

// A hand-drawn outline: two slightly different passes of the pencil.
function pencil(g) {
  if (g.d) return `<path d="${g.d}" class="pencil"/>`;
  if (isCircle(g)) {
    return [0, 1]
      .map((k) => {
        const j = wobble(g.cx + g.r, k);
        return `<ellipse cx="${r1(g.cx + j * 0.4)}" cy="${r1(g.cy - j * 0.3)}" rx="${r1(g.r + j * 0.6)}" ry="${r1(g.r - j * 0.5)}" transform="rotate(${r1(j * 20)} ${r1(g.cx)} ${r1(g.cy)})" class="pencil"/>`;
      })
      .join('');
  }
  return [0, 1]
    .map((k) => {
      const j = (i) => wobble(g.x + g.y * 3 + g.width + i, k);
      const [x0, y0, x1, y1] = [g.x, g.y, g.x + g.width, g.y + g.height];
      return `<path d="M${r1(x0 - 1.2 + j(1))} ${r1(y0 + j(2) * 0.5)}L${r1(x1 + 0.8 + j(3))} ${r1(y0 + j(4) * 0.5)}L${r1(x1 + j(5) * 0.5)} ${r1(y1 + 0.6 + j(6) * 0.5)}L${r1(x0 + j(7) * 0.5)} ${r1(y1 + j(8) * 0.5)}Z" class="pencil"/>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Finishes. Each draws the layers `under` and `over` a shape of a given kind:
// bar, up (an upright bar), dot, panel, tile (a large rectangle), disc, shape
// (a path) or cell (one cell of a grid, drawn inside a pattern at 0,0), plus
// the finish of a bar's `track`, a `ring` and the `base` a pie stands on.

/**
 * A finish made of gradient overlays: gloss and its relatives. `cast` lists
 * shadow copies under raised shapes, `halo` glows around bars, `wash` tints
 * shapes towards grey, `backing` makes see-through panels opaque.
 */
function lit({ stops, cast = [], halo = false, wash = null, backing = false, css = '' }) {
  const sheen = { bar: 'ags-sheen', up: 'ags-sheen-x', cell: 'ags-sheen', tile: 'ags-sheen-soft' };
  return {
    stops,
    css,
    under(g, kind, fill, { glow = true } = {}) {
      let out = '';
      if (halo && glow && (kind === 'bar' || kind === 'up')) {
        out += el(grow(g, 2), paint(fill, 'halo'));
      }
      if (kind !== 'shape' && kind !== 'disc') {
        for (const [dx, dy, opacity] of cast) {
          out += el(shift(g, dx, dy), `fill="${K}" opacity="${opacity}"`);
        }
      }
      if (backing && kind === 'panel') out += el(g, 'class="backing"');
      return out;
    },
    over(g, kind) {
      // Grid cells keep their colour: their shades carry the data.
      const tint =
        wash && kind !== 'panel' && kind !== 'cell' ? el(g, `fill="${wash}" opacity=".5"`) : '';
      if (kind === 'dot') return `${tint}${el(g, 'fill="url(#ags-sphere)"')}`;
      if (kind === 'panel') {
        const edge = isRect(g)
          ? `<path d="M${r1(g.x + g.rx)} ${r1(g.y + 0.5)}H${r1(g.x + g.width - g.rx)}" stroke="url(#ags-edge)" stroke-width="1"/>`
          : el(g, 'fill="none" stroke="url(#ags-edge-v)" stroke-width="1"');
        const brushed = wash && isRect(g) ? el(g, 'fill="url(#ags-brushed)"') : '';
        return `${el(g, 'fill="url(#ags-glass)"')}${brushed}${edge}`;
      }
      if (kind === 'disc') {
        return `${tint}${el(g, 'fill="url(#ags-dome)"')}${el(grow(g, -0.5) ?? g, 'fill="none" stroke="url(#ags-edge-v)" stroke-width="1"')}`;
      }
      if (kind === 'shape') return `${tint}${el(g, 'fill="url(#ags-dome)" opacity=".6"')}`;
      const edge =
        kind === 'tile' ? el(g, 'fill="none" stroke="url(#ags-edge-v)" stroke-width="1"') : '';
      return `${tint}${el(g, `fill="url(#${sheen[kind]})"`)}${edge}`;
    },
    track(g) {
      return el(g, 'fill="url(#ags-inset)"');
    },
    ring({ cx, cy, r, stroke }) {
      const tint = wash
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${wash}" stroke-opacity=".5" stroke-width="${stroke}"/>`
        : '';
      return `${tint}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#ags-ring-light)" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cy}" r="${r1(r - stroke / 2)}" fill="url(#ags-hole)"/>`;
    },
    base({ cx, cy, r }) {
      return `<ellipse cx="${r1(cx)}" cy="${r1(cy + r + 3)}" rx="${r1(r * 0.92)}" ry="6.5" fill="url(#ags-drop)"/>`;
    },
  };
}

const GLOSS_STOPS = {
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
};

const gloss = lit({ halo: true, stops: GLOSS_STOPS, css: '.halo{opacity:.16}' });

const FINISHES = {
  // Glossy plastic and glass: strong highlights, deep shade, a glow under bars.
  gloss,

  // Soft-touch pastel plastic: colours washed with white, matte, gentle shade.
  soft: lit({
    cast: [[0, 2, 0.12]],
    stops: {
      'ags-sheen': [
        [0, W, 0.58],
        [0.5, W, 0.42],
        [1, W, 0.32],
      ],
      'ags-sheen-x': [
        [0, W, 0.52],
        [0.45, W, 0.44],
        [1, W, 0.28],
      ],
      'ags-sheen-soft': [
        [0, W, 0.5],
        [1, W, 0.34],
      ],
      'ags-inset': [
        [0, K, 0.12],
        [0.5, K, 0.02],
        [1, W, 0.12],
      ],
      'ags-sphere': [
        [0, W, 0.66],
        [0.55, W, 0.44],
        [1, W, 0.3],
      ],
      'ags-ring-light': [
        [0, W, 0.54],
        [1, W, 0.34],
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
        [0, W, 0.58],
        [0.6, W, 0.42],
        [1, W, 0.32],
      ],
    },
  }),

  // Paper cut-outs: bevelled edges, stacked shadows, tracks cut into the card.
  paper: lit({
    cast: [
      [2.5, 4, 0.12],
      [1, 1.5, 0.3],
    ],
    backing: true,
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
      'ags-edge-v': [
        [0, W, 0.2],
        [0.2, W, 0],
      ],
    },
    css: '.backing{fill:var(--bg)}',
  }),

  // Polished chrome: colours turned to metal, a sharp horizon in the reflection.
  chrome: lit({
    wash: '#9aa3ad',
    stops: {
      'ags-sheen': [
        [0, W, 0.85],
        [0.38, W, 0.2],
        [0.5, K, 0.5],
        [0.62, K, 0.15],
        [0.85, W, 0.3],
        [1, W, 0.6],
      ],
      'ags-sheen-x': [
        [0, K, 0.3],
        [0.2, W, 0.75],
        [0.35, W, 0.1],
        [0.5, K, 0.45],
        [0.75, W, 0.3],
        [1, K, 0.35],
      ],
      'ags-sheen-soft': [
        [0, W, 0.55],
        [0.45, W, 0.05],
        [0.5, K, 0.3],
        [1, W, 0.25],
      ],
      'ags-inset': [
        [0, K, 0.45],
        [0.5, K, 0.1],
        [0.9, W, 0.25],
        [1, W, 0.4],
      ],
      'ags-sphere': [
        [0, W, 0.95],
        [0.25, W, 0.3],
        [0.5, K, 0.4],
        [0.75, W, 0.2],
        [1, K, 0.45],
      ],
      'ags-ring-light': [
        [0, W, 0.8],
        [0.35, W, 0.1],
        [0.5, K, 0.5],
        [0.7, W, 0.25],
        [1, K, 0.3],
      ],
      'ags-hole': [
        [0.75, K, 0],
        [1, K, 0.45],
      ],
      'ags-glass': [
        [0, W, 0.2],
        [0.5, W, 0.04],
        [1, W, 0.12],
      ],
      'ags-drop': [
        [0, K, 0.4],
        [1, K, 0],
      ],
      'ags-edge': [
        [0, W, 0],
        [0.5, W, 0.7],
        [1, W, 0],
      ],
      'ags-edge-v': [
        [0, W, 0.7],
        [0.5, W, 0.1],
        [1, W, 0.3],
      ],
      'ags-dome': [
        [0, W, 0.8],
        [0.3, W, 0.15],
        [0.55, K, 0.35],
        [0.8, W, 0.15],
        [1, K, 0.4],
      ],
    },
  }),

  // Neon tubes: shapes hollowed out to bright outlines, with a haze around them.
  neon: {
    stops: {},
    css: '.hollow{fill:var(--bg);opacity:.8}.hollow-ring{stroke:var(--bg);stroke-opacity:.8}.neon-edge{fill:none;stroke:var(--accent);stroke-width:1.2;opacity:.85}.neon-haze{fill:none;stroke:var(--accent);stroke-width:6;opacity:.18}.haze{opacity:.22}.haze-far{opacity:.1}',
    under(g, kind, fill) {
      if (!['bar', 'up', 'dot', 'tile'].includes(kind)) return '';
      const near = grow(g, 2.5);
      const far = grow(g, 5.5);
      return `${far ? el(far, paint(fill, 'haze-far')) : ''}${near ? el(near, paint(fill, 'haze')) : ''}`;
    },
    over(g, kind) {
      if (kind === 'panel') return `${el(g, 'class="neon-haze"')}${el(g, 'class="neon-edge"')}`;
      if (kind === 'shape') return el(g, 'class="neon-haze"');
      // Tiles carry labels, so they keep their colour and get a bright inner tube.
      if (kind === 'tile') {
        const edge = grow(g, -1);
        return edge
          ? el(edge, `fill="none" stroke="${W}" stroke-opacity=".55" stroke-width="1.2"`)
          : '';
      }
      const inner = grow(g, kind === 'disc' ? -2 : -1.5);
      return inner ? el(inner, 'class="hollow"') : '';
    },
    track(g) {
      const inner = grow(g, -1);
      return inner ? el(inner, 'class="hollow"') : '';
    },
    ring({ cx, cy, r, stroke }) {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="hollow-ring" stroke-width="${r1(Math.max(1, stroke - 3.2))}"/>`;
    },
    base: () => '',
  },

  // 8-bit: square corners, square dots, everything cut into a mosaic of pixels.
  pixel: {
    stops: {},
    square: true,
    css: '.gap{fill:var(--bg)}.gap-ring{stroke:var(--bg)}',
    under(g, kind) {
      if (kind === 'shape' || kind === 'disc' || kind === 'cell') return '';
      return el(shift(g, 2, 2), `fill="${K}" opacity=".3"`);
    },
    over(g, kind) {
      const bevel = isRect(g) && g.height >= 4 && g.width >= 4 ? pixelBevel(g) : '';
      if (kind === 'cell') return bevel;
      const mosaic = el(g, `fill="url(#ags-pix)"${kind === 'tile' ? ' opacity=".6"' : ''}`);
      return `${mosaic}${bevel}`;
    },
    track(g) {
      return el(g, 'fill="url(#ags-pix)"');
    },
    ring({ cx, cy, r, stroke }) {
      // Radial cuts every few pixels and one cut round the middle: a ring of blocks.
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="gap-ring" stroke-width="${stroke + 1}" stroke-dasharray="1.2 3.2"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="gap-ring" stroke-width="1"/>`;
    },
    base: () => '',
  },

  // Pencil sketch: colour laid down in hatched strokes, outlines drawn twice by hand.
  sketch: {
    stops: {},
    css: '.gap{fill:var(--bg)}.pencil{fill:none;stroke:var(--text);stroke-width:.8;stroke-opacity:.6;stroke-linecap:round;stroke-linejoin:round}',
    under: () => '',
    over(g, kind) {
      if (kind === 'panel') return pencil(g);
      // A grid cell gets a single outline: there are hundreds of them.
      const outline = kind === 'cell' ? el(g, 'class="pencil"') : pencil(g);
      // Tiles carry labels, so their hatching is lighter.
      const hatch = el(g, `fill="url(#ags-hatch)"${kind === 'tile' ? ' opacity=".5"' : ''}`);
      return `${hatch}${outline}`;
    },
    track: (g) => pencil(g),
    ring({ cx, cy, r, stroke }) {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#ags-hatch)" stroke-width="${stroke}"/>
    ${pencil({ cx, cy, r: r + stroke / 2 })}${pencil({ cx, cy, r: r - stroke / 2 })}`;
    },
    base: () => '',
  },

  // Holographic foil: two rainbows cross-fading over a gloss.
  holo: {
    ...gloss,
    stops: {
      ...GLOSS_STOPS,
      'ags-sheen': [
        [0, W, 0.45],
        [0.4, W, 0.05],
        [1, K, 0.12],
      ],
      'ags-holo': rainbow(0.55),
      'ags-holo-b': rainbow(0.55),
    },
    over(g, kind) {
      if (kind === 'panel')
        return `${el(g, 'fill="url(#ags-holo)" opacity=".18"')}${gloss.over(g, kind)}`;
      // Blending has nothing to blend with inside a grid's pattern: a light tint instead.
      if (kind === 'cell')
        return `${el(g, 'fill="url(#ags-holo)" opacity=".3"')}${gloss.over(g, kind)}`;
      return `${el(g, 'fill="url(#ags-holo)" class="foil"')}${el(g, 'fill="url(#ags-holo-b)" class="foil holo-shift"')}${gloss.over(g, kind)}`;
    },
    track(g) {
      return `${el(g, 'fill="url(#ags-inset)"')}${el(g, 'fill="url(#ags-holo)" opacity=".25"')}`;
    },
    ring({ cx, cy, r, stroke }) {
      const band = (fill, extra = '') =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fill}" stroke-width="${stroke}"${extra}/>`;
      return `${band('url(#ags-holo)', ' class="foil"')}${band('url(#ags-holo-b)', ' class="foil holo-shift"')}${gloss.ring({ cx, cy, r, stroke })}`;
    },
    css: '.halo{opacity:.2}.foil{mix-blend-mode:overlay}.holo-shift{opacity:.5}',
    motion:
      '@keyframes ags-holo{0%{opacity:0}100%{opacity:1}}.holo-shift{animation:ags-holo 3.5s ease-in-out infinite alternate}@media (prefers-reduced-motion: reduce){.holo-shift{animation:none}}',
  },
};

// 3D blocks: every shape extruded into a solid slab with a darker side.
FINISHES.block = {
  ...lit({
    stops: {
      'ags-sheen': [
        [0, W, 0.28],
        [0.3, W, 0.06],
        [1, W, 0],
      ],
      'ags-sheen-x': [
        [0, W, 0.24],
        [0.5, W, 0.05],
        [1, K, 0.1],
      ],
      'ags-sheen-soft': [
        [0, W, 0.2],
        [0.4, W, 0],
        [1, W, 0],
      ],
      'ags-inset': [
        [0, K, 0.5],
        [0.4, K, 0.15],
        [0.42, K, 0],
      ],
      'ags-sphere': [
        [0, W, 0.35],
        [0.6, W, 0],
        [1, K, 0.1],
      ],
      'ags-ring-light': [
        [0, W, 0.25],
        [0.5, W, 0],
        [1, K, 0.15],
      ],
      'ags-hole': [
        [0.7, K, 0],
        [0.9, K, 0.3],
        [1, K, 0.55],
      ],
      'ags-glass': [
        [0, W, 0.08],
        [1, W, 0.03],
      ],
      'ags-edge': [
        [0, W, 0.3],
        [1, W, 0.3],
      ],
      'ags-edge-v': [
        [0, W, 0.3],
        [0.15, W, 0],
      ],
      'ags-dome': [
        [0, W, 0.25],
        [0.5, W, 0],
        [1, K, 0.1],
      ],
    },
  }),
  css: '.backing{fill:var(--bg)}',
  under(g, kind, fill) {
    if (kind === 'shape' || kind === 'disc') return '';
    if (kind === 'cell') return el(shift(g, 1.6, 2), `fill="${K}" opacity=".5"`);
    const depth = kind === 'panel' || kind === 'tile' ? 5 : kind === 'dot' ? 2.5 : 4;
    const steps = Array.from({ length: Math.ceil(depth) }, (_, i) =>
      shift(g, Math.max(0, depth - i), Math.max(0, depth - i)),
    );
    const side = paint(kind === 'panel' ? 'track' : fill);
    // The side in the shape's colour, darkened as one piece so overlaps don't show.
    const slab = `${steps.map((s) => el(s, side)).join('')}<g opacity=".5">${steps.map((s) => el(s, `fill="${K}"`)).join('')}</g>`;
    return `${slab}${kind === 'panel' ? el(g, 'class="backing"') : ''}`;
  },
  base({ cx, cy, r, hole }) {
    // A pie or donut as a thick coin.
    return hole
      ? `<circle cx="${r1(cx)}" cy="${r1(cy + 7)}" r="${r1((r + hole) / 2)}" fill="none" stroke="${K}" stroke-opacity=".45" stroke-width="${r1(r - hole)}"/>`
      : `<circle cx="${r1(cx)}" cy="${r1(cy + 7)}" r="${r1(r)}" fill="${K}" opacity=".45"/>`;
  },
};

// Plain colour, no light or shadow: the original look.
FINISHES.flat = {
  stops: {},
  under: () => '',
  over: () => '',
  track: () => '',
  ring: () => '',
  base: () => '',
};

function pixelBevel(g) {
  return `<rect x="${r1(g.x)}" y="${r1(g.y)}" width="${r1(g.width)}" height="1.5" fill="${W}" opacity=".35"/><rect x="${r1(g.x)}" y="${r1(g.y + g.height - 1.5)}" width="${r1(g.width)}" height="1.5" fill="${K}" opacity=".3"/>`;
}

export const FINISH_NAMES = Object.keys(FINISHES);

// The finish of the card being rendered: set by renderCard, which renders synchronously.
let current = FINISHES.gloss;

/** Select the finish the helpers below draw with. */
export function useFinish(name) {
  current = FINISHES[name] ?? FINISHES.gloss;
}

/**
 * The gradients and patterns a card body refers to, in the given finish, and
 * the finish's CSS (with its animation when `animate`).
 */
export function materials(body, finish = 'gloss', { animate = true } = {}) {
  const f = FINISHES[finish] ?? FINISHES.gloss;
  const used = (id) => body.includes(`url(#${id})`);
  const gradients = Object.keys(GRADIENTS)
    .filter(used)
    .map((id) => {
      const [tag, ...attrs] = GRADIENTS[id].split(' ');
      return `<${[tag, `id="${id}"`, ...attrs].join(' ')}>${(f.stops[id] ?? []).map(stop).join('')}</${tag}>`;
    });
  const patterns = Object.keys(PATTERNS)
    .filter(used)
    .map((id) => PATTERNS[id]);
  return {
    defs: [...gradients, ...patterns].join(''),
    css: `${f.css ?? ''}${animate ? (f.motion ?? '') : ''}`,
  };
}

/** Corner radius for a rectangle in the current finish (square for pixel). */
export function cellRx(rx) {
  return current.square ? 0 : rx;
}

/** The finish's layers under a shape, e.g. shadows, a glow or a 3D side. */
export function underlay(g, kind, fill = K) {
  return current.under(g, kind, fill);
}

/** The finish's layers over a shape, e.g. gloss, hatching or a mosaic. */
export function cover(g, kind) {
  return current.over(g, kind);
}

/** A track for bars: the theme's track colour, recessed or outlined by the finish. */
export function track({ x, y, width, height }) {
  const g = { x, y, width, height, rx: cellRx(r1(height / 2)) };
  return `${el(g, 'class="track"')}${current.track(g)}`;
}

/**
 * A bar in the current finish. `fill` is a validated hex colour or a CSS class
 * (e.g. "accent"); `attrs` go on the group, for animation; `glow` asks for the
 * finish's halo; `upright` lights it from the side.
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
  const g = { x, y, width, height, rx: cellRx(rx ?? r1(Math.min(height / 2, width / 2))) };
  const kind = upright ? 'up' : 'bar';
  return `<g${attrs}>${current.under(g, kind, fill, { glow })}${el(g, paint(fill))}${current.over(g, kind)}</g>`;
}

/** A small dot, e.g. in a legend: a lit sphere, a neon ring or a pixel. */
export function orb({ cx, cy, r, fill }) {
  const g = current.square
    ? { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, rx: 0 }
    : { cx, cy, r };
  return `${current.under(g, 'dot', fill)}${el(g, paint(fill))}${current.over(g, 'dot')}`;
}

/** A panel behind content, e.g. a dashboard tile, drawn with the class `base`. */
export function glassPanel({ x, y, width, height, rx = 10, base = 'panel' }) {
  const g = { x, y, width, height, rx: cellRx(rx) };
  return `${current.under(g, 'panel', base)}${el(g, `class="${base}"`)}${current.over(g, 'panel')}`;
}

/** A frosted disc, e.g. the centre of a ring. */
export function glassDisc({ cx, cy, r }) {
  const g = { cx, cy, r };
  return `${el(g, 'class="glass"')}${current.over(g, 'panel')}`;
}

/** What a pie or donut of radius `r` stands on: a shadow, or the side of a coin. */
export function discBase({ cx, cy, r, hole = 0 }) {
  return current.base({ cx, cy, r, hole });
}

/** The finish over a ring (donut or progress ring) of radius `r` and `stroke` width. */
export function ringLight({ cx, cy, r, stroke }) {
  return current.ring({ cx, cy, r, stroke });
}

/**
 * The finish for a regular grid of cells (heatmaps, waffles) as patterns, so a
 * grid of hundreds of cells needs only a few extra elements: `gridCast` under
 * the cells and `gridGloss` over them. `x` and `y` are the top left of the first cell.
 */
export function gridSheen({ id, x, y, cell, step, rx = 2 }) {
  const g = { x: 0, y: 0, width: cell, height: cell, rx: cellRx(rx) };
  const tile = (inner) =>
    `x="${r1(x)}" y="${r1(y)}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">${inner}`;
  const over = current.over(g, 'cell');
  const under = current.under(g, 'cell', K);
  return `${over ? `<pattern id="${id}" ${tile(over)}</pattern>` : ''}${under ? `<pattern id="${id}-cast" ${tile(under)}</pattern>` : ''}`;
}

const SAMPLE = { x: 0, y: 0, width: 10, height: 10 };

/** Cover an area of a grid with the pattern `id` from `gridSheen`. */
export function gridGloss({ id, x, y, width, height }) {
  if (!current.over(SAMPLE, 'cell')) return '';
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width)}" height="${r1(height)}" fill="url(#${id})"/>`;
}

/** The cells' shadows or sides for an area of a grid, drawn before the cells. */
export function gridCast({ id, x, y, width, height }) {
  if (!current.under(SAMPLE, 'cell', K)) return '';
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(width + 3)}" height="${r1(height + 4)}" fill="url(#${id}-cast)"/>`;
}
