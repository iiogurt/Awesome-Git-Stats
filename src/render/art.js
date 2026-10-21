/**
 * Decorative background art drawn behind the card content.
 *
 * Every style is generated from a seed (the username), so each account gets
 * its own sky of stars or its own contour map, but the same card always
 * renders identically. Colours come from CSS custom properties so styles
 * work with every theme, colour overrides and the auto light/dark theme:
 *   --art1  main art colour (defaults to the accent)
 *   --art2  stars and fine detail (defaults to the title colour)
 *   --art3  secondary art colour (defaults to the accent)
 *   --shade vignette colour (defaults to black)
 */

export const ART_STYLES = [
  'starfield',
  'constellation',
  'aurora',
  'synthwave',
  'waves',
  'topography',
  'blueprint',
  'halftone',
  'scanlines',
  'grain',
  'bokeh',
  'sakura',
  'circuit',
  'forest',
  'rain',
  'leaves',
  'dunes',
  'jungle',
  'haunted',
  'festive',
  'fireworks',
  'hearts',
  'lanterns',
  'speedlines',
  'clouds',
  'hud',
  'blood',
  'glitch',
  'eyes',
  'isometric',
  'ridgeline',
  'warp',
  'spheres',
  'globe',
  'lava',
  'matrix',
  'fire',
  'memphis',
];

/** One-line descriptions, shown in the link builder and the theme gallery. */
export const ART_DESCRIPTIONS = {
  starfield: 'A night sky of twinkling stars and sparkles, unique to every username.',
  constellation: 'Stars joined into a constellation that draws itself in.',
  aurora: 'Soft, drifting bands of northern lights.',
  synthwave: 'A striped retro sun over a neon perspective grid.',
  waves: 'Layered ocean waves rolling along the bottom edge.',
  topography: 'Hand-drawn contour lines, like a hiking map.',
  blueprint: 'Engineering grid paper with corner crop marks.',
  halftone: 'Pop-art halftone dots fading in from a corner.',
  scanlines: 'CRT scanlines, a vignette and a slow refresh beam.',
  grain: 'Paper grain and a warm vignette, like an old print.',
  bokeh: 'Blurred, floating circles of light.',
  sakura: 'Cherry blossom petals swaying in the breeze.',
  circuit: 'Circuit traces with data pulsing through them.',
  forest: 'Layered pine ridges in the mist, with fireflies drifting between the trees.',
  rain: 'Slanting rain in two layers, ripples on the ground and the odd flash of lightning.',
  leaves: 'Autumn leaves tumbling down and piling up along the bottom edge.',
  dunes: 'Sand dunes under a hazy sun, with a lone cactus and wind-blown sand.',
  jungle: 'Split monstera leaves reaching in from the corners, swaying gently.',
  haunted: 'A full moon, flapping bats, a cobweb, a dangling spider and a shy ghost.',
  festive: 'Chasing string lights along the top edge over falling snow and drifts.',
  fireworks: 'Fireworks bursting over a city skyline with lit windows.',
  hearts: 'Hearts floating upwards, with big soft hearts beating in the background.',
  lanterns: 'Red paper lanterns swinging on their strings, gold sparkles and cloud curls.',
  speedlines: 'Manga speed lines that flicker like animation frames, with screentone.',
  clouds: 'Big anime cumulus clouds with lit tops, sun rays and a lens flare.',
  hud: 'A mecha targeting HUD: hex grid, spinning reticle and hazard stripes.',
  blood: 'Blood dripping from the top edge, falling drops and a splatter.',
  glitch: 'A haunted VHS tape: static, tracking noise, glitching colour bars and REC.',
  eyes: 'Eyes that open, blink and vanish in the dark, with creeping fog.',
  isometric: 'An isometric city of 3D blocks bobbing in a wave, on an iso grid.',
  ridgeline: 'Stacked pulsar ridgelines, like the famous album cover, rising and falling.',
  warp: 'A jump to hyperspace: star streaks and tunnel rings rushing past.',
  spheres: 'Glossy chrome spheres floating over soft shadows, one with a metal ring.',
  globe: 'A rotating 3D wireframe hologram globe with an orbiting satellite.',
  lava: 'Lava lamp blobs that merge and split as they rise and sink.',
  matrix: 'Digital rain: columns of glowing glyphs falling at different speeds.',
  fire: 'Flickering flames along the bottom edge and rising embers.',
  memphis: 'Bold 80s Memphis shapes: squiggles, triangles, dots and stripes.',
};

/** Small, fast, deterministic PRNG (mulberry32). */
export function createRandom(seedText = '') {
  let seed = 2166136261;
  for (const ch of String(seedText)) {
    seed = Math.imul(seed ^ ch.codePointAt(0), 16777619);
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const between = (rand, min, max) => min + rand() * (max - min);
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
// Size unit for art that scales with the card, capped so tall cards stay calm.
const unit = (height) => Math.min(height, 260) / 26;

/** Content that moves by (dx, dy) forever; a copy one period behind makes the loop seamless. */
function loop(content, dx, dy, seconds) {
  return `<g class="art-loop" style="animation-duration:${seconds}s">${content}<g transform="translate(${r1(-dx)} ${r1(-dy)})">${content}</g></g>`;
}

const loopMotion = (dx, dy) =>
  `@keyframes ags-loop{from{transform:translate(0,0)}to{transform:translate(${r1(dx)}px,${r1(dy)}px)}}
  .art-loop{animation:ags-loop 10s linear infinite}`;

// A soft round glow in one of the theme colours (art1, art2, art3, accent).
const radialGlow = (id, color, opacity) =>
  `<radialGradient id="${id}"><stop offset="0" style="stop-color:var(--${color})" stop-opacity="${opacity}"/><stop offset="1" style="stop-color:var(--${color})" stop-opacity="0"/></radialGradient>`;

const BAT_PATH =
  'M0 -2C1 -4 2 -4 2.5 -5.5L3 -3C5 -5 8 -6 12 -5C10 -3 10 -1 10.5 1C8.5 0 6.5 .5 5.5 2.5C4.5 1 3 1 2 2.5C1.5 1.5 .5 1 0 2C-.5 1 -1.5 1.5 -2 2.5C-3 1 -4.5 1 -5.5 2.5C-6.5 .5 -8.5 0 -10.5 1C-10 -1 -10 -3 -12 -5C-8 -6 -5 -5 -3 -3L-2.5 -5.5C-2 -4 -1 -4 0 -2Z';

const HEART_PATH = 'M0 6C-6 1 -8 -2 -8 -4.5A4 4 0 0 1 0 -3A4 4 0 0 1 8 -4.5C8 -2 6 1 0 6Z';

function sparklePath(x, y, size) {
  const s = size;
  const k = s * 0.22;
  return `M${r1(x)} ${r1(y - s)}Q${r1(x + k)} ${r1(y - k)} ${r1(x + s)} ${r1(y)}Q${r1(x + k)} ${r1(y + k)} ${r1(x)} ${r1(y + s)}Q${r1(x - k)} ${r1(y + k)} ${r1(x - s)} ${r1(y)}Q${r1(x - k)} ${r1(y - k)} ${r1(x)} ${r1(y - s)}Z`;
}

function stars(rand, { width, height, density = 1400, maxRadius = 1.3 }) {
  const count = Math.round((width * height) / density);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const twinkle = rand() < 0.18;
    const style = twinkle
      ? ` style="animation-delay:${r1(rand() * 4)}s;animation-duration:${r1(between(rand, 2.5, 5))}s"`
      : '';
    out += `<circle cx="${r1(rand() * width)}" cy="${r1(rand() * height)}" r="${r1(between(rand, 0.35, maxRadius))}" opacity="${r1(between(rand, 0.25, 0.85))}" class="art-c2${twinkle ? ' art-tw' : ''}"${style}/>`;
  }
  return out;
}

const styles = {
  starfield(rand, size) {
    let sparkles = '';
    for (let i = 0; i < 3; i += 1) {
      const x = between(rand, size.width * 0.35, size.width - 15);
      const y = between(rand, 12, size.height - 12);
      sparkles += `<path d="${sparklePath(x, y, between(rand, 3, 5.5))}" class="art-c1 art-tw" opacity=".75" style="animation-delay:${r1(rand() * 3)}s"/>`;
    }
    return { layer: stars(rand, size) + sparkles };
  },

  constellation(rand, size) {
    const { width, height } = size;
    const points = [];
    const count = 7 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i += 1) {
      points.push([
        r1(width * 0.45 + (width * 0.5 * i) / count + between(rand, -10, 10)),
        r1(between(rand, height * 0.15, height * 0.85)),
      ]);
    }
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
    const nodes = points
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="${r1(between(rand, 1.4, 2.4))}" class="art-c1"/>`,
      )
      .join('');
    return {
      layer: `${stars(rand, { ...size, density: 2600, maxRadius: 1 })}
        <path d="${line}" class="art-line art-draw" pathLength="1" stroke-width=".7" opacity=".3"/>
        <g opacity=".85">${nodes}</g>`,
      css: `.art-draw{stroke-dasharray:1;stroke-dashoffset:0}`,
      motion: `@keyframes ags-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
        .art-draw{animation:ags-draw 2.4s ease-out both}`,
    };
  },

  aurora(rand, { width, height }) {
    const bands = [1, 3, 1]
      .map((n, i) => {
        const y = height * between(rand, 0.15, 0.55);
        const amp = between(rand, 12, 26);
        const thick = between(rand, 22, 38);
        const w = width * 1.4;
        const top = `M${r1(-width * 0.2)} ${r1(y)}C${r1(w * 0.25)} ${r1(y - amp)} ${r1(w * 0.5)} ${r1(y + amp)} ${r1(w * 0.8)} ${r1(y - amp / 2)}`;
        const bottom = `L${r1(w * 0.8)} ${r1(y + thick)}C${r1(w * 0.5)} ${r1(y + thick + amp)} ${r1(w * 0.25)} ${r1(y + thick - amp)} ${r1(-width * 0.2)} ${r1(y + thick)}Z`;
        return `<path d="${top}${bottom}" class="art-c${n} art-drift" opacity="${i === 2 ? '.3' : '.5'}" style="animation-delay:-${(i + 1) * 3}s"/>`;
      })
      .join('');
    return {
      defs: `<filter id="ags-aurora" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`,
      layer: `<g filter="url(#ags-aurora)">${bands}</g>`,
      motion: `@keyframes ags-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
        .art-drift{animation:ags-drift 14s ease-in-out infinite}`,
    };
  },

  synthwave(rand, { width, height }) {
    const horizon = r1(height * 0.66);
    const cx = r1(width * 0.8);
    // Cap the sun so it stays a backdrop on tall cards such as the dashboard.
    const sunR = r1(Math.min(height * 0.3, 62));
    const sunY = r1(horizon - sunR * 0.35);
    let stripes = '';
    for (let i = 0; i < 5; i += 1) {
      const y = r1(sunY + sunR * (0.12 + i * 0.18));
      stripes += `<rect x="${r1(cx - sunR)}" y="${y}" width="${r1(sunR * 2)}" height="${r1(1.5 + i * 1.3)}" fill="#000"/>`;
    }
    let grid = `<line x1="0" y1="${horizon}" x2="${width}" y2="${horizon}"/>`;
    for (let i = 1; i <= 6; i += 1) {
      const y = r1(horizon + (height - horizon) * Math.pow(i / 6, 1.8));
      grid += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
    }
    for (let i = -8; i <= 8; i += 1) {
      const x = r1(width / 2 + i * (width / 8));
      grid += `<line x1="${r1(width / 2 + i * 14)}" y1="${horizon}" x2="${x}" y2="${height}"/>`;
    }
    return {
      defs: `<linearGradient id="ags-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--art2)"/><stop offset="1" style="stop-color:var(--art1)"/></linearGradient>
        <mask id="ags-sun-mask"><rect width="${width}" height="${height}" fill="#fff"/>${stripes}<rect y="${horizon}" width="${width}" height="${height}" fill="#000"/></mask>`,
      layer: `<circle cx="${cx}" cy="${sunY}" r="${sunR}" fill="url(#ags-sun)" mask="url(#ags-sun-mask)" opacity=".42" class="art-pulse"/>
        <g class="art-grid" stroke-width=".7" opacity=".26">${grid}</g>`,
      motion: `@keyframes ags-pulse{0%,100%{opacity:.42}50%{opacity:.3}}
        .art-pulse{animation:ags-pulse 6s ease-in-out infinite}`,
    };
  },

  waves(rand, { width, height }) {
    const period = width / 2;
    const layers = [1, 2, 3]
      .map((n) => {
        const base = height * (0.76 + n * 0.07);
        const amp = between(rand, 5, 10);
        let d = `M0 ${r1(base)}`;
        for (let x = 0; x < width * 2; x += period) {
          d += `Q${r1(x + period / 4)} ${r1(base - amp)} ${r1(x + period / 2)} ${r1(base)}T${r1(x + period)} ${r1(base)}`;
        }
        d += `V${height}H0Z`;
        return `<path d="${d}" class="art-c${n} art-wave" opacity="${r1(0.08 + n * 0.05)}" style="animation-duration:${10 + n * 4}s"/>`;
      })
      .join('');
    return {
      layer: layers,
      motion: `@keyframes ags-wave{from{transform:translateX(0)}to{transform:translateX(-${r1(period)}px)}}
        .art-wave{animation:ags-wave 12s linear infinite}`,
    };
  },

  topography(rand, { width, height }) {
    const centers = [
      [width * between(rand, 0.6, 0.9), height * between(rand, 0.2, 0.8)],
      [width * between(rand, 0.05, 0.35), height * between(rand, 0.6, 1.1)],
    ];
    let paths = '';
    for (const [cx, cy] of centers) {
      const phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
      for (let ring = 1; ring <= 7; ring += 1) {
        const radius = 10 + ring * 15;
        const pts = [];
        for (let a = 0; a < 40; a += 1) {
          const t = (a / 40) * Math.PI * 2;
          const wobble =
            1 +
            0.16 * Math.sin(2 * t + phases[0]) +
            0.09 * Math.sin(3 * t + phases[1]) +
            0.05 * Math.sin(5 * t + phases[2] + ring * 0.3);
          pts.push([cx + Math.cos(t) * radius * wobble, cy + Math.sin(t) * radius * wobble * 0.8]);
        }
        const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        let d = `M${pts[0].map(r1).join(' ')}`;
        for (let i = 0; i < pts.length; i += 1) {
          const p = pts[(i + 1) % pts.length];
          const m = mid(p, pts[(i + 2) % pts.length]);
          d += `Q${r1(p[0])} ${r1(p[1])} ${r1(m[0])} ${r1(m[1])}`;
        }
        const major = ring % 3 === 0;
        paths += `<path d="${d}Z" stroke-width="${major ? 1.1 : 0.6}" opacity="${major ? 0.5 : 0.3}"/>`;
      }
    }
    return { layer: `<g class="art-line">${paths}</g>` };
  },

  blueprint(rand, { width, height }) {
    const mark = (x, y, dx, dy) =>
      `<path d="M${x} ${y + dy * 10}V${y}H${x + dx * 10}" stroke-width="1.2" opacity=".6"/>`;
    return {
      defs: `<pattern id="ags-grid-minor" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" class="art-line" stroke-width=".5" opacity=".14"/></pattern>
        <pattern id="ags-grid-major" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" class="art-line" stroke-width=".9" opacity=".22"/></pattern>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-grid-minor)"/>
        <rect width="${width}" height="${height}" fill="url(#ags-grid-major)"/>
        <g class="art-line">${mark(8, 8, 1, 1)}${mark(width - 8, 8, -1, 1)}${mark(8, height - 8, 1, -1)}${mark(width - 8, height - 8, -1, -1)}</g>`,
    };
  },

  halftone(rand, { width, height }) {
    const cx = r1(width * between(rand, 0.92, 1.05));
    const cy = r1(height * between(rand, 0.85, 1.1));
    return {
      defs: `<pattern id="ags-dots" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4" cy="4" r="2.4" class="art-c1"/></pattern>
        <radialGradient id="ags-dot-fade" cx="${cx}" cy="${cy}" r="${r1(width * 0.5)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
        <mask id="ags-dot-mask"><rect width="${width}" height="${height}" fill="url(#ags-dot-fade)"/></mask>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-dots)" mask="url(#ags-dot-mask)" opacity=".4"/>`,
    };
  },

  scanlines(rand, { width, height }) {
    return {
      defs: `<pattern id="ags-scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" class="art-c1" opacity=".09"/></pattern>
        <radialGradient id="ags-vignette" cx=".5" cy=".5" r=".75"><stop offset=".55" style="stop-color:var(--shade)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--shade)" stop-opacity=".55"/></radialGradient>
        <linearGradient id="ags-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--art1)" stop-opacity="0"/><stop offset=".5" style="stop-color:var(--art1)" stop-opacity=".12"/><stop offset="1" style="stop-color:var(--art1)" stop-opacity="0"/></linearGradient>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-scan)"/>
        <rect width="${width}" height="${height}" fill="url(#ags-vignette)"/>
        <rect width="${width}" height="40" y="-40" fill="url(#ags-beam)" class="art-beam"/>`,
      motion: `@keyframes ags-beam{from{transform:translateY(0)}to{transform:translateY(${height + 40}px)}}
        .art-beam{animation:ags-beam 6s linear infinite}`,
    };
  },

  grain(rand, { width, height }) {
    const seed = Math.floor(rand() * 1000);
    // The noise becomes the alpha of a title-coloured rect, so the grain is
    // dark on light themes and light on dark ones.
    return {
      defs: `<filter id="ags-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed}" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .6 0" result="alpha"/><feComposite in="SourceGraphic" in2="alpha" operator="in"/></filter>
        <radialGradient id="ags-paper" cx=".5" cy=".45" r=".8"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5b3a1a" stop-opacity=".18"/></radialGradient>`,
      layer: `<rect width="${width}" height="${height}" filter="url(#ags-grain)" class="art-c2" opacity=".4"/>
        <rect width="${width}" height="${height}" fill="url(#ags-paper)"/>`,
    };
  },

  bokeh(rand, { width, height }) {
    let blobs = '';
    for (let i = 0; i < 7; i += 1) {
      const n = i % 2 ? 3 : 1;
      blobs += `<circle cx="${r1(rand() * width)}" cy="${r1(rand() * height)}" r="${r1(between(rand, 18, 60))}" class="art-c${n} art-float" opacity="${r1(between(rand, 0.35, 0.6))}" style="animation-delay:-${r1(rand() * 10)}s"/>`;
    }
    return {
      defs: `<filter id="ags-bokeh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>`,
      layer: `<g filter="url(#ags-bokeh)">${blobs}</g><rect width="${width}" height="${height}" fill="#fff" opacity=".12"/>`,
      motion: `@keyframes ags-float{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-8px)}}
        .art-float{animation:ags-float 12s ease-in-out infinite}`,
    };
  },

  sakura(rand, { width, height }) {
    let petals = '';
    for (let i = 0; i < 14; i += 1) {
      const x = r1(between(rand, width * 0.3, width - 6));
      const y = r1(rand() * height);
      const s = r1(between(rand, 0.6, 1.25));
      const a = Math.round(rand() * 360);
      const n = i % 2 ? 3 : 1;
      petals += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 -7C4 -6 5 -1 0 6C-5 -1 -4 -6 0 -7Z" class="art-c${n} art-sway" opacity="${r1(between(rand, 0.5, 0.85))}" style="animation-delay:-${r1(rand() * 6)}s"/></g>`;
    }
    return {
      layer: petals,
      motion: `@keyframes ags-sway{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
        .art-sway{transform-box:fill-box;transform-origin:center;animation:ags-sway 5s ease-in-out infinite}`,
    };
  },

  circuit(rand, { width, height }) {
    let traces = '';
    for (let i = 0; i < 7; i += 1) {
      const fromRight = rand() < 0.65;
      let x = fromRight ? width + 2 : -2;
      let y = r1(between(rand, 10, height - 10));
      let d = `M${x} ${y}`;
      const dir = fromRight ? -1 : 1;
      for (let s = 0; s < 3; s += 1) {
        x = r1(x + dir * between(rand, 30, 90));
        d += `H${x}`;
        const dy = r1(between(rand, -18, 18));
        x = r1(x + dir * Math.abs(dy));
        y = r1(Math.min(height - 6, Math.max(6, y + dy)));
        d += `L${x} ${y}`;
      }
      traces += `<path d="${d}" stroke-width=".9"/><circle cx="${x}" cy="${y}" r="2.2" class="art-c1" stroke="none"/>`;
    }
    return {
      layer: `<g class="art-line art-flow" opacity=".38">${traces}</g>`,
      motion: `@keyframes ags-flow{to{stroke-dashoffset:-20}}
        .art-flow path{stroke-dasharray:6 4;animation:ags-flow 1.6s linear infinite}`,
    };
  },

  // Nature

  forest(rand, { width, height }) {
    const u = unit(height);
    const pine = (cx, base, w, h) => {
      const tiers = [
        [-0.5, 0],
        [-0.17, -0.34],
        [-0.38, -0.34],
        [-0.12, -0.66],
        [-0.27, -0.66],
        [0, -1],
      ];
      const left = tiers.map(([px, py]) => `${r1(cx + px * w)} ${r1(base + py * h)}`);
      const right = tiers
        .slice(0, -1)
        .reverse()
        .map(([px, py]) => `${r1(cx - px * w)} ${r1(base + py * h)}`);
      return `M${[...left, ...right].join('L')}Z`;
    };
    const ridge = (base, w, h) => {
      let d = `M0 ${r1(base)}H${width}V${height}H0Z`;
      for (let x = -between(rand, 0, w); x < width + w; x += w * between(rand, 0.6, 1)) {
        const tree = h * between(rand, 0.6, 1.2);
        d += pine(x, base + between(rand, -u * 0.4, u * 0.4), w * between(rand, 0.8, 1.2), tree);
      }
      return d;
    };
    const mist = (base) =>
      `<rect y="${r1(base - u * 4)}" width="${width}" height="${r1(height - base + u * 4)}" fill="url(#ags-mist)"/>`;
    const layers = [
      [height - u * 3.4, u * 2.4, u * 5, 1, 0.3],
      [height - u * 1.9, u * 3, u * 6.2, 1, 0.45],
      [height - u * 0.3, u * 3.6, u * 7.6, 3, 0.7],
    ];
    const trees = layers
      .map(
        ([base, w, h, n, opacity], i) =>
          `<path d="${ridge(base, w, h)}" class="art-c${n}" opacity="${opacity}"/>${i < 2 ? mist(base) : ''}`,
      )
      .join('');
    let flies = '';
    for (let i = 0, n = Math.round((width * height) / 5000); i < n; i += 1) {
      const x = r1(rand() * width);
      const y = r1(between(rand, height * 0.3, height - u));
      flies += `<g transform="translate(${x} ${y})"><g class="art-fly" style="animation-delay:-${r1(rand() * 8)}s;animation-duration:${r1(between(rand, 6, 11))}s"><circle r="6" fill="url(#ags-flyglow)"/><circle r="${r1(between(rand, 0.9, 1.7))}" class="art-c2"/></g></g>`;
    }
    const moonR = r1(u * 2);
    const moon = `<circle cx="${r1(width * 0.86)}" cy="${r1(u * 3.4)}" r="${r1(moonR * 3)}" fill="url(#ags-moonglow)"/>
      <circle cx="${r1(width * 0.86)}" cy="${r1(u * 3.4)}" r="${moonR}" class="art-c2" opacity=".45"/>`;
    return {
      defs: `${radialGlow('ags-flyglow', 'art2', 0.5)}
        <linearGradient id="ags-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bg)" stop-opacity="0"/><stop offset=".55" style="stop-color:var(--bg)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--bg)" stop-opacity="0"/></linearGradient>
        ${radialGlow('ags-moonglow', 'art2', 0.35)}`,
      layer: `${moon}${trees}${flies}`,
      motion: `@keyframes ags-fly{0%,100%{transform:translate(0,0);opacity:.15}30%{opacity:1}50%{transform:translate(9px,-12px)}70%{opacity:.9}85%{transform:translate(-7px,-5px);opacity:.3}}
        .art-fly{animation:ags-fly 8s ease-in-out infinite}`,
    };
  },

  rain(rand, { width, height }) {
    const u = unit(height);
    const slant = 0.22;
    const area = width * height;
    const drops = (count, length, strokeWidth, opacity, seconds) => {
      let d = '';
      for (let i = 0; i < count; i += 1) {
        const l = length * between(rand, 0.6, 1.3);
        d += `M${r1(rand() * (width + height * slant))} ${r1(rand() * height)}l${r1(-l * slant)} ${r1(l)}`;
      }
      const path = `<path d="${d}" class="art-s2" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity}"/>`;
      return loop(path, -height * slant, height, seconds);
    };
    let clouds = '';
    for (let x = -20; x < width; x += between(rand, 50, 90)) {
      clouds += `<ellipse cx="${r1(x)}" cy="${r1(between(rand, -8, 6))}" rx="${r1(between(rand, 50, 110))}" ry="${r1(between(rand, 18, 32))}" fill="url(#ags-raincloud)"/>`;
    }
    let ripples = '';
    for (let i = 0, n = Math.round(width / 30); i < n; i += 1) {
      ripples += `<ellipse cx="${r1(rand() * width)}" cy="${r1(height - between(rand, 2, u * 1.4))}" rx="${r1(between(rand, 4, 8))}" ry="${r1(between(rand, 1, 1.8))}" class="art-s2 art-ripple" stroke-width=".8" opacity=".4" style="animation-delay:-${r1(rand() * 2)}s;animation-duration:${r1(between(rand, 1.2, 2.2))}s"/>`;
    }
    return {
      defs: radialGlow('ags-raincloud', 'art3', 0.8),
      layer: `${clouds}
        ${drops(Math.round(area / 900), u * 1.1, 0.7, 0.28, 1.6)}
        ${drops(Math.round(area / 2600), u * 2, 1.1, 0.45, 0.9)}
        ${ripples}
        <rect width="${width}" height="${height}" class="art-c2 art-flash" opacity="0"/>`,
      motion: `${loopMotion(-height * slant, height)}
        @keyframes ags-ripple{from{transform:scale(.2);opacity:.7}to{transform:scale(1.8);opacity:0}}
        .art-ripple{transform-box:fill-box;transform-origin:center;animation:ags-ripple 1.6s ease-out infinite}
        @keyframes ags-flash{0%,89%,94%,100%{opacity:0}90%{opacity:.16}91%{opacity:.02}92%{opacity:.1}}
        .art-flash{animation:ags-flash 11s linear infinite}`,
    };
  },

  leaves(rand, { width, height }) {
    const u = unit(height);
    const shapes = [
      'M0 -10L2 -6L5 -8L4.5 -3.5L9 -4L6.5 0L9 2L4 2.5L5 6L1 4.5L.6 10H-.6L-1 4.5L-5 6L-4 2.5L-9 2L-6.5 0L-9 -4L-4.5 -3.5L-5 -8L-2 -6Z',
      'M0 -9C5 -6 6 2 0 8C-6 2 -5 -6 0 -9Z',
      'M0 -9C3 -7 6 -6 5 -2C7 0 6 4 3 4C3 7 1 8 0 9C-1 8 -3 7 -3 4C-6 4 -7 0 -5 -2C-6 -6 -3 -7 0 -9Z',
    ];
    const leaf = (x, y, scale, opacity, flutter) => {
      const style = flutter
        ? ` style="animation-delay:-${r1(rand() * 6)}s;animation-duration:${r1(between(rand, 3, 6))}s"`
        : '';
      return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rand() * 360)}) scale(${r1(scale)})"><path d="${pick(rand, shapes)}" class="art-c${1 + Math.floor(rand() * 3)}${flutter ? ' art-flutter' : ''}" opacity="${r1(opacity)}"${style}/></g>`;
    };
    const falling = (count, min, max, seconds) => {
      let out = '';
      for (let i = 0; i < count; i += 1) {
        const x = between(rand, -height * 0.2, width);
        out += leaf(
          x,
          rand() * height,
          between(rand, min, max) * (u / 10),
          between(rand, 0.4, 0.7),
          true,
        );
      }
      return loop(out, height * 0.2, height, seconds);
    };
    let pile = '';
    for (let i = 0, n = Math.round(width / 9); i < n; i += 1) {
      pile += leaf(
        rand() * width,
        height - between(rand, -2, u * 0.8),
        between(rand, 0.7, 1.2) * (u / 10),
        between(rand, 0.4, 0.7),
        false,
      );
    }
    const area = width * height;
    return {
      layer: `${falling(Math.round(area / 11000), 0.6, 0.9, 22)}${pile}${falling(Math.round(area / 30000), 1, 1.4, 13)}`,
      motion: `${loopMotion(height * 0.2, height)}
        @keyframes ags-flutter{0%{transform:rotate(0) scaleX(1)}25%{transform:rotate(60deg) scaleX(.3)}50%{transform:rotate(130deg) scaleX(-1)}75%{transform:rotate(240deg) scaleX(-.3)}100%{transform:rotate(360deg) scaleX(1)}}
        .art-flutter{animation:ags-flutter 4s linear infinite}`,
    };
  },

  dunes(rand, { width, height }) {
    const u = unit(height);
    const crests = [];
    const dune = (base, amp, n, opacity) => {
      let x = -between(rand, 0, width * 0.2);
      let d = `M${r1(x)} ${r1(base)}`;
      while (x < width) {
        const w = between(rand, width * 0.28, width * 0.5);
        const peakX = x + w * between(rand, 0.55, 0.75);
        const peakY = base - amp * between(rand, 0.6, 1.2);
        crests.push([peakX, peakY]);
        d += `Q${r1(peakX - w * 0.25)} ${r1(peakY)} ${r1(peakX)} ${r1(peakY)}Q${r1(peakX + w * 0.06)} ${r1(peakY + amp * 0.2)} ${r1(x + w)} ${r1(base + between(rand, -amp, amp) * 0.2)}`;
        x += w;
      }
      return `<path d="${d}V${height}H-${r1(width * 0.2)}Z" class="art-c${n}" opacity="${opacity}"/>
        <path d="${d}" class="art-s2" stroke-width=".8" opacity=".3"/>`;
    };
    const far = dune(height * 0.62, u * 2.5, 3, 0.35);
    crests.length = 0;
    const mid = dune(height * 0.8, u * 2.2, 1, 0.4);
    const [cx, cy] = pick(rand, crests);
    const cactus = (x, y, h) =>
      `<g transform="translate(${r1(x)} ${r1(y + 1)})" class="art-line" stroke-linecap="round" stroke-linejoin="round" opacity=".55"><path d="M0 0V-${r1(h)}" stroke-width="${r1(h * 0.18)}"/><path d="M0 -${r1(h * 0.4)}H-${r1(h * 0.3)}V-${r1(h * 0.7)}M0 -${r1(h * 0.55)}H${r1(h * 0.3)}V-${r1(h * 0.82)}" stroke-width="${r1(h * 0.12)}"/></g>`;
    const near = dune(height * 0.95, u * 1.6, 1, 0.55);
    const sunR = r1(u * 3);
    const sx = r1(width - u * 7);
    const sy = r1(u * 4.2);
    let wind = '';
    for (let i = 0, n = Math.round(width / 25); i < n; i += 1) {
      wind += `M${r1(rand() * width)} ${r1(between(rand, height * 0.45, height))}h${r1(between(rand, 6, 22))}`;
    }
    let birds = '';
    for (let i = 0; i < 2; i += 1) {
      const r = r1(between(rand, u * 1.5, u * 3));
      birds += `<g transform="translate(${r1(between(rand, width * 0.4, width * 0.7))} ${r1(between(rand, u * 3, u * 6))})"><g class="art-circle" style="animation-duration:${r1(between(rand, 14, 22))}s"><path d="M${r} -2q2 2 4 0q2 2 4 0" class="art-line" stroke-width="1" opacity=".5"/></g></g>`;
    }
    return {
      defs: radialGlow('ags-sunglow', 'art2', 0.4),
      layer: `<circle cx="${sx}" cy="${sy}" r="${r1(sunR * 3.2)}" fill="url(#ags-sunglow)"/>
        <circle cx="${sx}" cy="${sy}" r="${sunR}" class="art-c2 art-pulse" opacity=".45"/>
        ${birds}${far}${mid}${cactus(cx, cy, u * 2.6)}${near}
        ${loop(`<path d="${wind}" class="art-s2" stroke-width=".8" stroke-linecap="round" opacity=".35"/>`, width, 0, 9)}`,
      motion: `${loopMotion(width, 0)}
        @keyframes ags-pulse{0%,100%{opacity:.45}50%{opacity:.3}}
        .art-pulse{animation:ags-pulse 7s ease-in-out infinite}
        @keyframes ags-circle{to{transform:rotate(360deg)}}
        .art-circle{animation:ags-circle 18s linear infinite}`,
    };
  },

  jungle(rand, { width, height }) {
    const length = Math.min(height * 0.62, 150);
    const leaf = (l, w, n, opacity) => {
      let slits = '';
      for (let k = 1; k <= 4; k += 1) {
        const y = -l * (0.12 + 0.17 * k);
        const reach = w * 0.75;
        for (const side of [1, -1]) {
          slits += `M${r1(side * w * 0.14)} ${r1(y)}Q${r1(side * reach * 0.5)} ${r1(y - l * 0.03)} ${r1(side * reach)} ${r1(y - l * 0.13)}`;
        }
      }
      return `<path d="M0 0C${r1(w * 0.95)} ${r1(-l * 0.2)} ${r1(w * 0.8)} ${r1(-l * 0.85)} 0 ${r1(-l)}C${r1(-w * 0.8)} ${r1(-l * 0.85)} ${r1(-w * 0.95)} ${r1(-l * 0.2)} 0 0Z" class="art-c${n}" opacity="${opacity}"/>
        <path d="${slits}" class="art-vein" stroke-width="${r1(l * 0.028)}" stroke-linecap="round"/>
        <path d="M0 0V${r1(-l * 0.92)}" class="art-vein" stroke-width="${r1(l * 0.012)}" opacity=".6"/>`;
    };
    const corners = [
      [width + 4, -4, 195, 255],
      [-4, height + 4, 15, 75],
      [width + 4, height + 4, -75, -15],
    ];
    let fronds = '';
    for (const [cx, cy, from, to] of corners) {
      const count = 4 + Math.floor(rand() * 2);
      for (let i = 0; i < count; i += 1) {
        const angle = Math.round(from + ((to - from) * (i + between(rand, 0.2, 0.8))) / count);
        const l = length * between(rand, 0.55, 1);
        fronds += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${angle})"><g class="art-frond" style="animation-delay:-${r1(rand() * 6)}s;animation-duration:${r1(between(rand, 5, 9))}s">${leaf(l, l * between(rand, 0.38, 0.5), i % 2 ? 3 : 1, r1(between(rand, 0.55, 0.8)))}</g></g>`;
      }
    }
    let dapples = '';
    for (let i = 0; i < 6; i += 1) {
      dapples += `<circle cx="${r1(rand() * width)}" cy="${r1(rand() * height)}" r="${r1(between(rand, 20, 50))}" fill="url(#ags-dapple)" class="art-dapple" style="animation-delay:-${r1(rand() * 8)}s"/>`;
    }
    return {
      defs: radialGlow('ags-dapple', 'art2', 0.5),
      layer: `${dapples}${fronds}`,
      css: `.art-vein{stroke:var(--bg);fill:none}`,
      motion: `@keyframes ags-frond{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
        .art-frond{animation:ags-frond 7s ease-in-out infinite}
        @keyframes ags-dapple{0%,100%{opacity:.2}50%{opacity:.6}}
        .art-dapple{animation:ags-dapple 8s ease-in-out infinite}`,
    };
  },

  // Holidays

  haunted(rand, { width, height }) {
    const u = unit(height);
    const moonR = r1(u * 3.6);
    const mx = r1(width - moonR - u * 2.4);
    const my = r1(moonR + u * 1.4);
    let craters = '';
    for (let i = 0; i < 5; i += 1) {
      const a = rand() * Math.PI * 2;
      const d = rand() * moonR * 0.65;
      craters += `<circle cx="${r1(mx + Math.cos(a) * d)}" cy="${r1(my + Math.sin(a) * d)}" r="${r1(between(rand, 0.12, 0.25) * moonR)}"/>`;
    }
    const web = Math.min(height * 0.55, 95);
    const angles = [0, 18, 36, 54, 72, 90].map((a) => (a * Math.PI) / 180);
    const at = (a, r) => `${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)}`;
    let threads = angles.map((a) => `M0 0L${at(a, web)}`).join('');
    for (let k = 1; k <= 5; k += 1) {
      const r = (web * k) / 5.5;
      threads += `M${at(angles[0], r)}`;
      for (let i = 1; i < angles.length; i += 1) {
        threads += `Q${at((angles[i - 1] + angles[i]) / 2, r * 0.82)} ${at(angles[i], r)}`;
      }
    }
    let bats = '';
    for (let i = 0, n = 3 + Math.round(width / 160); i < n; i += 1) {
      const x = between(rand, width * 0.35, width - u * 2);
      const y = between(rand, u * 1.5, height * 0.55);
      bats += `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(between(rand, 0.8, 1.4) * (u / 9))})"><g class="art-flit" style="animation-delay:-${r1(rand() * 7)}s;animation-duration:${r1(between(rand, 5, 9))}s"><path d="${BAT_PATH}" class="art-c3 art-flap" style="animation-delay:-${r1(rand())}s"/></g></g>`;
    }
    const sx = r1(width * between(rand, 0.52, 0.66));
    const drop = r1(u * between(rand, 4, 6));
    const spider = `<g class="art-dangle"><path d="M${sx} -${drop}V${drop}" class="art-s2" stroke-width=".6" opacity=".5"/>
      <g transform="translate(${sx} ${drop}) scale(${r1(u / 7)})" opacity=".7"><path d="M-5 -3L-2 -1M-6 0H-2M-5 3L-2 1M5 -3L2 -1M6 0H2M5 3L2 1" class="art-s3" stroke-width=".9"/><circle r="2.6" class="art-c3"/><circle cy="-2.6" r="1.6" class="art-c3"/></g></g>`;
    const ghost = `<g transform="translate(${r1(width * 0.42)} ${r1(height * 0.72)}) scale(${r1(u / 8)})"><g class="art-ghost"><path d="M-9 8V-1A9 9 0 0 1 9 -1V8L6 5.5L3 8L0 5.5L-3 8L-6 5.5Z" class="art-c2"/><ellipse cx="-3" cy="-1" rx="1.4" ry="2" class="art-bg"/><ellipse cx="3" cy="-1" rx="1.4" ry="2" class="art-bg"/></g></g>`;
    return {
      defs: radialGlow('ags-halo', 'art2', 0.35),
      layer: `<circle cx="${mx}" cy="${my}" r="${r1(moonR * 2.4)}" fill="url(#ags-halo)"/>
        <circle cx="${mx}" cy="${my}" r="${moonR}" class="art-c2" opacity=".75"/>
        <g class="art-c3" opacity=".1">${craters}</g>
        <path d="${threads}" class="art-s2" stroke-width=".6" opacity=".3"/>
        ${spider}${ghost}${bats}`,
      motion: `@keyframes ags-flap{to{transform:scaleY(.3)}}
        .art-flap{animation:ags-flap .3s ease-in-out infinite alternate}
        @keyframes ags-flit{0%,100%{transform:translate(0,0)}25%{transform:translate(14px,-8px)}50%{transform:translate(4px,6px)}75%{transform:translate(-12px,-4px)}}
        .art-flit{animation:ags-flit 7s ease-in-out infinite}
        @keyframes ags-dangle{0%,100%{transform:translateY(0)}50%{transform:translateY(-${r1(drop * 0.45)}px)}}
        .art-dangle{animation:ags-dangle 6s ease-in-out infinite}
        @keyframes ags-ghost{0%,100%{transform:translate(0,0);opacity:.12}50%{transform:translate(30px,-12px);opacity:.4}}
        .art-ghost{animation:ags-ghost 12s ease-in-out infinite}`,
      css: `.art-ghost{opacity:.3}`,
    };
  },

  festive(rand, { width, height }) {
    const u = unit(height);
    const swags = Math.max(2, Math.round(width / 210));
    const span = width / swags;
    const sag = Math.min(height * 0.07, 12);
    const colors = ['art-c1', 'art-c3', 'art-acc'];
    let wire = '';
    let bulbs = '';
    let k = 0;
    for (let s = 0; s < swags; s += 1) {
      const x0 = s * span;
      const control = 2 * sag + 1;
      wire += `M${r1(x0)} -1Q${r1(x0 + span / 2)} ${r1(control)} ${r1(x0 + span)} -1`;
      const count = Math.round(span / 24);
      for (let i = 1; i < count; i += 1) {
        const t = i / count;
        const x = x0 + span * t;
        const y = -1 + 2 * (1 - t) * t * (control + 1);
        const tilt = Math.round(-Math.atan2(2 * (1 - 2 * t) * (control + 1), span) * 57);
        const color = colors[k % 3];
        bulbs += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${tilt})"><circle cy="5.6" r="7" fill="url(#ags-${color})" class="art-blink" style="animation-delay:-${(k % 3) * 0.6}s"/><rect x="-1.4" width="2.8" height="2.6" class="art-cap"/><ellipse cy="5.6" rx="2.4" ry="3.6" class="${color} art-blink" style="animation-delay:-${(k % 3) * 0.6}s"/></g>`;
        k += 1;
      }
    }
    const flakes = (count, min, max, opacity, seconds, crystals) => {
      let out = '';
      for (let i = 0; i < count; i += 1) {
        out += `<circle cx="${r1(rand() * (width + height * 0.1))}" cy="${r1(rand() * height)}" r="${r1(between(rand, min, max))}" class="art-c2" opacity="${r1(between(rand, opacity * 0.6, opacity))}"/>`;
      }
      for (let i = 0; i < crystals; i += 1) {
        const r = r1(between(rand, u * 0.6, u * 1.1));
        out += `<g transform="translate(${r1(rand() * width)} ${r1(rand() * height)})"><path d="M0 -${r}V${r}M-${r1(r * 0.87)} -${r1(r / 2)}L${r1(r * 0.87)} ${r1(r / 2)}M-${r1(r * 0.87)} ${r1(r / 2)}L${r1(r * 0.87)} -${r1(r / 2)}" class="art-s2 art-spin" stroke-width=".8" stroke-linecap="round" opacity=".6"/></g>`;
      }
      return loop(out, -height * 0.1, height, seconds);
    };
    const area = width * height;
    let drift = `M0 ${height}V${r1(height - u * 0.6)}`;
    for (let x = 0; x < width; x += 60) {
      drift += `Q${r1(x + 30)} ${r1(height - between(rand, u * 0.6, u * 1.6))} ${r1(x + 60)} ${r1(height - u * 0.6)}`;
    }
    return {
      defs: ['art1', 'art3', 'accent']
        .map((v, i) => radialGlow(`ags-${colors[i]}`, v, 0.45))
        .join(''),
      layer: `${flakes(Math.round(area / 1500), 0.5, 1.2, 0.55, 18, 0)}
        <path d="${drift}V${height}Z" class="art-c2" opacity=".35"/>
        ${flakes(Math.round(area / 5000), 1.2, 2.3, 0.85, 10, 2 + Math.round(width / 200))}
        <path d="${wire}" class="art-wire" stroke-width="1"/>${bulbs}`,
      css: `.art-cap,.art-wire{fill:var(--muted)}.art-wire{fill:none;stroke:var(--muted)}`,
      motion: `${loopMotion(-height * 0.1, height)}
        @keyframes ags-blink{0%,100%{opacity:1}50%{opacity:.25}}
        .art-blink{animation:ags-blink 1.8s ease-in-out infinite}
        @keyframes ags-spin{to{transform:rotate(360deg)}}
        .art-spin{animation:ags-spin 9s linear infinite}`,
    };
  },

  fireworks(rand, { width, height }) {
    const u = unit(height);
    let bursts = '';
    for (let i = 0, n = 3 + Math.round((width * height) / 60000); i < n; i += 1) {
      const x = between(rand, width * 0.08, width * 0.95);
      const y = between(rand, height * 0.12, height * 0.6);
      const radius = Math.min(height * 0.2, 55) * between(rand, 0.6, 1);
      const rays = 12 + Math.floor(rand() * 8);
      const c = 1 + (i % 3);
      let d = '';
      let dots = '';
      for (let k = 0; k < rays; k += 1) {
        const a = (Math.PI * 2 * k) / rays + between(rand, -0.08, 0.08);
        const end = radius * between(rand, 0.85, 1);
        d += `M${r1(Math.cos(a) * radius * 0.3)} ${r1(Math.sin(a) * radius * 0.3)}L${r1(Math.cos(a) * end)} ${r1(Math.sin(a) * end)}`;
        dots += `<circle cx="${r1(Math.cos(a) * end * 1.08)}" cy="${r1(Math.sin(a) * end * 1.08)}" r="1.3"/>`;
      }
      const seconds = r1(between(rand, 2.6, 4));
      bursts += `<g transform="translate(${r1(x)} ${r1(y)})" opacity=".6"><g class="art-burst" style="animation-delay:-${r1(rand() * seconds)}s;animation-duration:${seconds}s"><path d="${d}" class="art-s${c}" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 2"/><g class="art-c${c}">${dots}</g></g></g>`;
    }
    let skyline = '';
    let windows = '';
    for (let x = -2; x < width;) {
      const w = between(rand, u * 1.4, u * 3.4);
      const h = between(rand, height * 0.05, Math.min(height * 0.16, 52));
      skyline += `M${r1(x)} ${height}V${r1(height - h)}h${r1(w)}V${height}Z`;
      for (let wy = height - h + 4; wy < height - 3; wy += 5) {
        for (let wx = x + 3; wx < x + w - 3; wx += 4.5) {
          if (rand() < 0.22) {
            windows += `<rect x="${r1(wx)}" y="${r1(wy)}" width="1.8" height="2.2"${rand() < 0.3 ? ` class="art-tw" style="animation-delay:${r1(rand() * 4)}s"` : ''}/>`;
          }
        }
      }
      x += w + between(rand, 0, u * 0.4);
    }
    let sparkles = '';
    for (let i = 0; i < 6; i += 1) {
      sparkles += `<path d="${sparklePath(rand() * width, between(rand, 6, height * 0.7), between(rand, 2, 4))}" class="art-c2 art-tw" opacity=".7" style="animation-delay:${r1(rand() * 3)}s"/>`;
    }
    return {
      layer: `${stars(rand, { width, height, density: 3200, maxRadius: 1 })}${sparkles}${bursts}
        <path d="${skyline}" class="art-shade" opacity=".85"/><g class="art-c2" opacity=".55">${windows}</g>`,
      css: `.art-shade{fill:var(--shade)}`,
      motion: `@keyframes ags-burst{0%{transform:scale(.05);opacity:0}6%{opacity:1}70%{opacity:.85}100%{transform:scale(1.08);opacity:0}}
        .art-burst{animation:ags-burst 3s cubic-bezier(.15,.8,.3,1) infinite}`,
    };
  },

  hearts(rand, { width, height }) {
    const u = unit(height);
    const rising = (count, min, max, opacity, seconds) => {
      let out = '';
      for (let i = 0; i < count; i += 1) {
        const c = 1 + Math.floor(rand() * 3);
        const outline = rand() < 0.25;
        out += `<g transform="translate(${r1(rand() * width)} ${r1(rand() * height)}) scale(${r1(between(rand, min, max) * (u / 10))})"><g class="art-bob" style="animation-delay:-${r1(rand() * 5)}s;animation-duration:${r1(between(rand, 3, 6))}s"><path d="${HEART_PATH}" ${outline ? `class="art-s${c}" stroke-width="1.4"` : `class="art-c${c}"`} opacity="${r1(between(rand, opacity * 0.6, opacity))}"/></g></g>`;
      }
      return loop(out, 0, -height, seconds);
    };
    let glow = '';
    for (let i = 0; i < 4; i += 1) {
      glow += `<g transform="translate(${r1(rand() * width)} ${r1(rand() * height)}) scale(${r1(between(rand, 3, 5) * (u / 10))})"><path d="${HEART_PATH}" class="art-c${1 + (i % 3)} art-beat" opacity=".16" style="animation-delay:-${r1(rand() * 2)}s"/></g>`;
    }
    const area = width * height;
    return {
      layer: `<g opacity=".7">${glow}</g>
        ${rising(Math.round(area / 7000), 0.5, 0.9, 0.4, 26)}
        ${rising(Math.round(area / 16000), 1, 1.6, 0.5, 15)}`,
      motion: `${loopMotion(0, -height)}
        @keyframes ags-bob{0%,100%{transform:translateX(-5px) rotate(-12deg)}50%{transform:translateX(5px) rotate(12deg)}}
        .art-bob{animation:ags-bob 4s ease-in-out infinite}
        @keyframes ags-beat{0%,45%,100%{transform:scale(1)}15%{transform:scale(1.12)}30%{transform:scale(1.03)}}
        .art-beat{animation:ags-beat 1.6s ease-in-out infinite}`,
    };
  },

  lanterns(rand, { width, height }) {
    const u = unit(height);
    const count = Math.max(3, Math.round(width / 160));
    let out = '';
    for (let i = 0; i < count; i += 1) {
      const x = width * (0.45 + (0.31 * (i + between(rand, 0.25, 0.75))) / count);
      const string = between(rand, u * 0.4, u * 3);
      const w = u * between(rand, 2, 2.8);
      const h = w * 1.15;
      const cy = string + h / 2 + 2;
      const bottom = cy + h / 2;
      out += `<g transform="translate(${r1(x)} 0)"><g class="art-swing" style="animation-delay:-${r1(rand() * 5)}s;animation-duration:${r1(between(rand, 4, 7))}s">
        <ellipse cy="${r1(cy)}" rx="${r1(w * 1.3)}" ry="${r1(h * 1.1)}" fill="url(#ags-lantern)"/>
        <path d="M0 -2V${r1(string)}M0 ${r1(bottom)}v${r1(u * 1.6)}M-1.6 ${r1(bottom + 2)}v${r1(u * 1.3)}M1.6 ${r1(bottom + 2)}v${r1(u * 1.3)}" class="art-s2" stroke-width=".8"/>
        <ellipse cy="${r1(cy)}" rx="${r1(w / 2)}" ry="${r1(h / 2)}" class="art-c1"/>
        <ellipse cy="${r1(cy)}" rx="${r1(w * 0.26)}" ry="${r1(h / 2)}" class="art-s2" stroke-width=".7" opacity=".55"/>
        <path d="M0 ${r1(cy - h / 2)}V${r1(bottom)}" class="art-s2" stroke-width=".7" opacity=".55"/>
        <rect x="${r1(-w * 0.28)}" y="${r1(string)}" width="${r1(w * 0.56)}" height="${r1(u * 0.45)}" rx="1" class="art-c2"/>
        <rect x="${r1(-w * 0.22)}" y="${r1(bottom - u * 0.35)}" width="${r1(w * 0.44)}" height="${r1(u * 0.45)}" rx="1" class="art-c2"/>
      </g></g>`;
    }
    let sparkles = '';
    for (let i = 0; i < 8; i += 1) {
      sparkles += `<path d="${sparklePath(rand() * width, rand() * height, between(rand, 2, 4.5))}" class="art-c2 art-tw" opacity=".6" style="animation-delay:${r1(rand() * 3)}s"/>`;
    }
    let clouds = '';
    for (let i = 0; i < 3; i += 1) {
      const x = r1(between(rand, 0, width * 0.4));
      const y = r1(between(rand, height * 0.55, height - u));
      const r = r1(u * between(rand, 0.8, 1.3));
      clouds += `<path d="M${x} ${y}a${r} ${r} 0 1 1 ${r1(r * 2)} 0a${r} ${r} 0 1 1 ${r1(r * 2)} 0a${r1(r / 2)} ${r1(r / 2)} 0 1 0 -${r} 0" class="art-s2" stroke-width="1" opacity=".22"/>`;
    }
    return {
      defs: radialGlow('ags-lantern', 'art3', 0.5),
      layer: `${clouds}${sparkles}${out}`,
      motion: `@keyframes ags-swing{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
        .art-swing{animation:ags-swing 5s ease-in-out infinite}`,
    };
  },

  // Anime and manga

  speedlines(rand, { width, height }) {
    const cx = width / 2;
    const cy = height / 2;
    const reach = Math.hypot(cx, cy);
    const wedges = () => {
      let d = '';
      for (let i = 0, n = Math.round((width + height) / 12); i < n; i += 1) {
        const a = rand() * Math.PI * 2;
        const inner = reach * between(rand, 0.5, 0.82);
        const half = between(rand, 0.004, 0.018);
        const tip = `${r1(cx + Math.cos(a) * inner)} ${r1(cy + Math.sin(a) * inner)}`;
        const p1 = `${r1(cx + Math.cos(a - half) * reach * 1.1)} ${r1(cy + Math.sin(a - half) * reach * 1.1)}`;
        const p2 = `${r1(cx + Math.cos(a + half) * reach * 1.1)} ${r1(cy + Math.sin(a + half) * reach * 1.1)}`;
        d += `M${tip}L${p1}L${p2}Z`;
      }
      return d;
    };
    const tx = r1(width * between(rand, 0.85, 1));
    const ty = r1(height * between(rand, 0.85, 1));
    return {
      defs: `<pattern id="ags-tone" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="1.1" class="art-c2"/></pattern>
        <radialGradient id="ags-tone-fade" cx="${tx}" cy="${ty}" r="${r1(Math.min(width * 0.4, 220))}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
        <mask id="ags-tone-mask"><rect width="${width}" height="${height}" fill="url(#ags-tone-fade)"/></mask>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-tone)" mask="url(#ags-tone-mask)" opacity=".3"/>
        <path d="${wedges()}" class="art-c1 art-frame" opacity=".2"/>
        <path d="${wedges()}" class="art-c1 art-frame art-frame-b" opacity=".2"/>`,
      motion: `@keyframes ags-frame{0%{opacity:.22}50%{opacity:0}}
        .art-frame{animation:ags-frame .5s steps(1) infinite}.art-frame-b{animation-delay:-.25s}`,
    };
  },

  clouds(rand, { width, height }) {
    const u = unit(height);
    const cloud = (cx, cy, w) => {
      const k = 4 + Math.floor(rand() * 3);
      const puffs = [];
      for (let j = 0; j < k; j += 1) {
        const arch = Math.sin((Math.PI * (j + 0.5)) / k);
        const r = (w / k) * (0.55 + arch * 0.75) * between(rand, 0.85, 1.15);
        puffs.push([cx - w / 2 + (w * (j + 0.5)) / k, cy - r * 0.45, r]);
      }
      const base = (w / k) * 0.9;
      const shape = (dx, dy, scale) =>
        `${puffs.map(([x, y, r]) => `<circle cx="${r1(x + dx)}" cy="${r1(y + dy)}" r="${r1(r * scale)}"/>`).join('')}<rect x="${r1(cx - w / 2 + dx)}" y="${r1(cy - base + dy)}" width="${r1(w)}" height="${r1(base)}" rx="${r1(base / 2)}"/>`;
      return `<g class="art-c3">${shape(0, 0, 1)}</g><g class="art-c2">${shape(-w * 0.015, -base * 0.22, 0.94)}</g>`;
    };
    let out = '';
    const big = Math.ceil(width / 260);
    for (let i = 0; i < big; i += 1) {
      const w = Math.min(width * between(rand, 0.32, 0.5), height * 1.4);
      const x = (width * (i + between(rand, 0.3, 0.7))) / big;
      out += `<g class="art-drift" opacity=".5" style="animation-delay:-${r1(rand() * 30)}s">${cloud(x, height * between(rand, 0.95, 1.08), w)}</g>`;
    }
    for (let i = 0; i < 2; i += 1) {
      const w = Math.min(width * between(rand, 0.12, 0.2), height * 0.6);
      out += `<g class="art-drift" opacity=".45" style="animation-delay:-${r1(rand() * 30)}s;animation-duration:${r1(between(rand, 30, 50))}s">${cloud(between(rand, width * 0.45, width * 0.75), between(rand, height * 0.2, height * 0.45), w)}</g>`;
    }
    const sx = r1(width * 0.92);
    const sy = r1(-height * 0.05);
    let rays = '';
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + rand() * 0.3;
      const len = height * 1.2;
      rays += `M0 0L${r1(Math.cos(a - 0.05) * len)} ${r1(Math.sin(a - 0.05) * len)}L${r1(Math.cos(a + 0.05) * len)} ${r1(Math.sin(a + 0.05) * len)}Z`;
    }
    let flares = '';
    for (const [t, r] of [
      [0.3, 0.7],
      [0.5, 1.4],
      [0.75, 0.9],
    ]) {
      flares += `<circle cx="${r1(sx + (width / 2 - sx) * t)}" cy="${r1(sy + (height / 2 - sy) * t)}" r="${r1(u * r)}"/>`;
    }
    return {
      defs: radialGlow('ags-sky-sun', 'art1', 0.6),
      layer: `<circle cx="${sx}" cy="${sy}" r="${r1(Math.min(height * 0.7, 160))}" fill="url(#ags-sky-sun)"/>
        <g transform="translate(${sx} ${sy})"><path d="${rays}" class="art-c1 art-rays" opacity=".09"/></g>
        <g class="art-c1" opacity=".14">${flares}</g>${out}`,
      motion: `@keyframes ags-drift{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}
        .art-drift{animation:ags-drift 40s ease-in-out infinite}
        @keyframes ags-rays{to{transform:rotate(360deg)}}
        .art-rays{animation:ags-rays 90s linear infinite}`,
    };
  },

  hud(rand, { width, height }) {
    const radius = Math.min(height * 0.36, 90);
    const cx = r1(width - radius - 26);
    const cy = r1(height * 0.52);
    const R = r1(radius);
    let ticks = '';
    for (let i = 0; i < 72; i += 1) {
      const a = (i * 5 * Math.PI) / 180;
      const long = i % 6 === 0 ? 1.13 : 1.07;
      ticks += `M${r1(Math.cos(a) * R * 1.02)} ${r1(Math.sin(a) * R * 1.02)}L${r1(Math.cos(a) * R * long)} ${r1(Math.sin(a) * R * long)}`;
    }
    const arc = (r, from, to) => {
      const p = (a) =>
        `${r1(Math.cos((a * Math.PI) / 180) * r)} ${r1(Math.sin((a * Math.PI) / 180) * r)}`;
      return `M${p(from)}A${r1(r)} ${r1(r)} 0 0 1 ${p(to)}`;
    };
    const arcs = [0, 120, 240].map((a) => arc(R * 0.66, a, a + 70)).join('');
    const cross = `M-${r1(R * 1.25)} 0H-${r1(R * 0.45)}M${r1(R * 0.45)} 0H${r1(R * 1.25)}M0 -${r1(R * 1.25)}V-${r1(R * 0.45)}M0 ${r1(R * 0.45)}V${r1(R * 1.25)}`;
    const mark = (x, y, dx, dy) => `M${x} ${y + dy * 12}V${y}H${x + dx * 12}`;
    const stripe = r1(14 / Math.SQRT1_2);
    return {
      defs: `<pattern id="ags-hex" width="24" height="13.86" patternUnits="userSpaceOnUse"><path d="M0 6.93L4 0H12L16 6.93L12 13.86H4ZM16 6.93H24" class="art-s3" stroke-width=".6"/></pattern>
        <pattern id="ags-hazard" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" class="art-c2"/></pattern>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-hex)" opacity=".22"/>
        <g transform="translate(${cx} ${cy})">
          <circle r="${R}" class="art-s1" stroke-width="1" opacity=".4"/>
          <g class="art-rot" style="animation-duration:60s"><path d="${ticks}" class="art-s1" stroke-width="1" opacity=".4"/></g>
          <g class="art-rot" style="animation-duration:18s"><circle r="${r1(R * 0.82)}" class="art-s2" stroke-width="2" stroke-dasharray="28 10 4 10" opacity=".5"/></g>
          <g class="art-rot art-rev" style="animation-duration:12s"><path d="${arcs}" class="art-s1" stroke-width="3" opacity=".4"/></g>
          <path d="${cross}" class="art-s1" stroke-width=".8" opacity=".35"/>
          <circle r="${r1(R * 0.22)}" class="art-s2 art-ping" stroke-width="1.2" opacity=".6"/>
          <path d="M0 -6L5 3H-5Z" class="art-c2" opacity=".7"/>
        </g>
        <g class="art-s1" stroke-width="2" opacity=".55"><path d="${mark(6, 6, 1, 1)}${mark(width - 6, 6, -1, 1)}${mark(6, height - 12, 1, -1)}${mark(width - 6, height - 12, -1, -1)}"/></g>
        <g class="art-hazard"><rect x="-${stripe}" y="${height - 7}" width="${r1(width + stripe * 2)}" height="7" fill="url(#ags-hazard)" opacity=".45"/></g>
        <rect width="2" height="${height}" class="art-c1 art-sweep" opacity=".18"/>`,
      motion: `@keyframes ags-rot{to{transform:rotate(360deg)}}
        .art-rot{animation:ags-rot 20s linear infinite}.art-rev{animation-direction:reverse}
        @keyframes ags-ping{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.6);opacity:0}}
        .art-ping{animation:ags-ping 2.4s ease-out infinite}
        @keyframes ags-hazard{to{transform:translateX(${stripe}px)}}
        .art-hazard{animation:ags-hazard 1.2s linear infinite}
        @keyframes ags-sweep{from{transform:translateX(-4px)}to{transform:translateX(${width + 4}px)}}
        .art-sweep{animation:ags-sweep 7s linear infinite}`,
    };
  },

  // Horror

  blood(rand, { width, height }) {
    const u = unit(height);
    let band = `M0 0H${width}V${r1(u * 0.6)}`;
    for (let x = width; x > 0;) {
      const step = between(rand, u * 2, u * 4);
      band += `Q${r1(x - step / 2)} ${r1(between(rand, u * 0.9, u * 1.4))} ${r1(Math.max(0, x - step))} ${r1(between(rand, u * 0.3, u * 0.8))}`;
      x -= step;
    }
    let drips = '';
    let shine = '';
    const longest = [];
    for (let i = 0, n = Math.round(width / (u * 2.2)); i < n; i += 1) {
      const x = rand() * width;
      const max = x < width * 0.5 ? u * 1.4 : Math.min(height * 0.42, u * 7);
      const l = between(rand, u * 0.8, Math.max(u, max));
      const w = between(rand, u * 0.3, u * 0.8);
      longest.push([x, l, w]);
      drips += `<g class="art-drip" style="animation-delay:${r1(rand() * 2)}s;animation-duration:${r1(between(rand, 3, 7))}s"><path d="M${r1(x - w / 2)} 0V${r1(l)}a${r1(w / 2)} ${r1(w / 2)} 0 0 0 ${r1(w)} 0V0Z"/><circle cx="${r1(x)}" cy="${r1(l + w * 0.1)}" r="${r1(w * 0.62)}"/></g>`;
      shine += `M${r1(x - w * 0.15)} ${r1(u * 0.9)}V${r1(l * 0.92)}`;
    }
    const falling = longest
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        ([x, l, w]) =>
          `<g transform="translate(${r1(x)} ${r1(l + w)})"><ellipse rx="${r1(w * 0.42)}" ry="${r1(w * 0.55)}" class="art-c1 art-fall" style="animation-delay:-${r1(rand() * 4)}s;animation-duration:${r1(between(rand, 3.5, 6))}s"/></g>`,
      )
      .join('');
    const sx = width - u * 4.5;
    const sy = height - u * 3;
    let splatter = `<circle cx="${r1(sx)}" cy="${r1(sy)}" r="${r1(u * 1.5)}"/>`;
    for (let i = 0; i < 14; i += 1) {
      const a = between(rand, Math.PI * 0.7, Math.PI * 2.1);
      const d = between(rand, u * 1.6, u * 5);
      const x = r1(sx + Math.cos(a) * d);
      const y = r1(sy + Math.sin(a) * d * 0.7);
      splatter +=
        i % 3
          ? `<circle cx="${x}" cy="${y}" r="${r1(between(rand, u * 0.12, u * 0.5))}"/>`
          : `<ellipse cx="${x}" cy="${y}" rx="${r1(u * 0.9)}" ry="${r1(u * 0.22)}" transform="rotate(${Math.round((a * 180) / Math.PI)} ${x} ${y})"/>`;
    }
    return {
      layer: `<g class="art-c1" opacity=".5">${splatter}</g>
        <g class="art-c1" opacity=".9"><path d="${band}Z"/>${drips}</g>
        <path d="${shine}" class="art-s2" stroke-width="${r1(u * 0.12)}" stroke-linecap="round" opacity=".25"/>
        ${falling}`,
      motion: `@keyframes ags-drip{from{transform:scaleY(.1)}to{transform:scaleY(1)}}
        .art-drip{transform-box:fill-box;transform-origin:center top;animation:ags-drip 5s cubic-bezier(.3,0,.2,1) both}
        @keyframes ags-fall{0%,30%{transform:translateY(0) scale(0)}45%{transform:translateY(0) scale(1)}100%{transform:translateY(${height}px) scale(.8,1.4)}}
        .art-fall{animation:ags-fall 5s ease-in infinite}`,
    };
  },

  glitch(rand, { width, height }) {
    // Random specks drawn once into a pattern: far cheaper than an animated noise filter.
    const specks = (w, h, count, maxWidth, maxHeight) => {
      let out = '';
      for (let i = 0; i < count; i += 1) {
        out += `<rect x="${r1(rand() * w)}" y="${r1(rand() * h)}" width="${r1(between(rand, 0.6, maxWidth))}" height="${r1(between(rand, 0.6, maxHeight))}" opacity="${r1(between(rand, 0.3, 1))}"/>`;
      }
      return `<g class="art-c2">${out}</g>`;
    };
    let bars = '';
    for (let i = 0; i < 10; i += 1) {
      const w = between(rand, width * 0.15, width * 0.7);
      bars += `<rect x="${r1(rand() * (width - w))}" y="${r1(rand() * height)}" width="${r1(w)}" height="${r1(between(rand, 1.5, 9))}" class="art-c${i % 2 ? 3 : 1} art-glitch" style="animation-delay:${r1(rand() * 5)}s;animation-duration:${r1(between(rand, 2.5, 6))}s"/>`;
    }
    return {
      defs: `<pattern id="ags-vhs-scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" class="art-c2" opacity=".07"/></pattern>
        <pattern id="ags-static" width="48" height="48" patternUnits="userSpaceOnUse">${specks(48, 48, 140, 1.2, 1.2)}</pattern>
        <pattern id="ags-streak" width="${width}" height="20" patternUnits="userSpaceOnUse">${specks(width, 20, Math.round(width / 4), 30, 1.2)}</pattern>
        <radialGradient id="ags-crt" cx=".5" cy=".5" r=".75"><stop offset=".6" style="stop-color:var(--shade)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--shade)" stop-opacity=".6"/></radialGradient>`,
      layer: `<g class="art-jitter"><rect x="-12" y="-12" width="${width + 24}" height="${height + 24}" fill="url(#ags-static)" opacity=".22"/></g>
        <rect width="${width}" height="${height}" fill="url(#ags-vhs-scan)"/>
        <g class="art-track"><rect y="-24" width="${width}" height="20" fill="url(#ags-streak)" opacity=".4"/></g>
        ${bars}
        <rect width="${width}" height="${height}" fill="url(#ags-crt)"/>
        <rect x="0" width="3" height="${height}" class="art-c1" opacity=".18"/><rect x="${width - 3}" width="3" height="${height}" class="art-c3" opacity=".18"/>
        <circle cx="${width - 14}" cy="${height - 14}" r="3.5" class="art-c3 art-rec"/>`,
      // The glitch bars only flash by while animating; at rest they would cover the text.
      css: `.art-glitch{opacity:0}`,
      motion: `@keyframes ags-glitch{0%,100%{opacity:0;transform:translateX(0)}3%{opacity:.6;transform:translateX(-14px)}5%{transform:translateX(10px)}7%{opacity:.5;transform:translateX(-4px)}9%{opacity:0}}
        .art-glitch{animation:ags-glitch 4s steps(1) infinite}
        @keyframes ags-jitter{0%{transform:translate(0,0)}25%{transform:translate(-5px,3px)}50%{transform:translate(4px,-4px)}75%{transform:translate(-3px,-2px)}}
        .art-jitter{animation:ags-jitter .4s steps(1) infinite}
        @keyframes ags-track{to{transform:translateY(${height + 28}px)}}
        .art-track{animation:ags-track 7s linear infinite}
        @keyframes ags-rec{50%{opacity:0}}
        .art-rec{animation:ags-rec 1.4s steps(1) infinite}`,
    };
  },

  eyes(rand, { width, height }) {
    const u = unit(height);
    let pairs = '';
    for (let i = 0, n = Math.max(5, Math.round((width * height) / 20000)); i < n; i += 1) {
      let x;
      let y;
      for (let tries = 0; tries < 20; tries += 1) {
        x = between(rand, 10, width - 10);
        y = between(rand, 10, height - 10);
        const nx = (x - width / 2) / (width / 2);
        const ny = (y - height / 2) / (height / 2);
        if (nx * nx + ny * ny > 0.7) break;
      }
      const s = between(rand, 3.6, 6.5) * (u / 8);
      const gap = s * 2.7;
      const c = rand() < 0.65 ? 1 : 3;
      const eye = (dx) =>
        `<path d="M${r1(dx - s)} 0Q${r1(dx)} ${r1(-s * 0.8)} ${r1(dx + s)} 0Q${r1(dx)} ${r1(s * 0.8)} ${r1(dx - s)} 0Z" class="art-c${c}"/><ellipse cx="${r1(dx)}" rx="${r1(s * 0.16)}" ry="${r1(s * 0.5)}" class="art-bg"/>`;
      pairs += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(between(rand, -12, 12))})"><g class="art-lurk" style="animation-delay:-${r1(rand() * 16)}s;animation-duration:${r1(between(rand, 10, 18))}s"><ellipse rx="${r1(gap * 1.4)}" ry="${r1(s * 2.2)}" fill="url(#ags-eyeglow${c})"/><g class="art-blink" style="animation-delay:-${r1(rand() * 8)}s;animation-duration:${r1(between(rand, 4, 9))}s">${eye(-gap / 2)}${eye(gap / 2)}</g></g></g>`;
    }
    let fog = '';
    for (let i = 0; i < 7; i += 1) {
      const top = i > 4;
      fog += `<ellipse cx="${r1(rand() * width)}" cy="${r1(top ? between(rand, -10, 10) : height - between(rand, 0, u * 2))}" rx="${r1(between(rand, width * 0.18, width * 0.35))}" ry="${r1(between(rand, u * 1.6, u * 3))}" fill="url(#ags-fogpuff)" class="art-fog" style="animation-delay:-${r1(rand() * 24)}s;animation-duration:${r1(between(rand, 18, 30))}s"/>`;
    }
    return {
      defs: `${radialGlow('ags-eyeglow1', 'art1', 0.45)}${radialGlow('ags-eyeglow3', 'art3', 0.45)}${radialGlow('ags-fogpuff', 'art2', 0.5)}
        <radialGradient id="ags-dark" cx=".5" cy=".5" r=".75"><stop offset=".5" style="stop-color:var(--shade)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--shade)" stop-opacity=".6"/></radialGradient>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-dark)"/>
        ${pairs}<g opacity=".45">${fog}</g>`,
      motion: `@keyframes ags-blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.05)}}
        .art-blink{animation:ags-blink 6s ease-in-out infinite}
        @keyframes ags-lurk{0%,100%{opacity:0}20%,75%{opacity:1}}
        .art-lurk{animation:ags-lurk 14s ease-in-out infinite}
        @keyframes ags-fog{0%,100%{transform:translateX(-40px)}50%{transform:translateX(40px)}}
        .art-fog{animation:ags-fog 24s ease-in-out infinite}`,
    };
  },

  // 3D

  isometric(rand, { width, height }) {
    const s = Math.min(height, 260) / 13;
    const a = s * 0.866;
    const faces = (x, y) => [
      `M${r1(x)} ${r1(y - s)}L${r1(x + a)} ${r1(y - s / 2)}L${r1(x)} ${r1(y)}L${r1(x - a)} ${r1(y - s / 2)}Z`,
      `M${r1(x - a)} ${r1(y - s / 2)}L${r1(x)} ${r1(y)}L${r1(x)} ${r1(y + s)}L${r1(x - a)} ${r1(y + s / 2)}Z`,
      `M${r1(x)} ${r1(y)}L${r1(x + a)} ${r1(y - s / 2)}L${r1(x + a)} ${r1(y + s / 2)}L${r1(x)} ${r1(y + s)}Z`,
    ];
    const column = (x, y, levels) => {
      const paths = ['', '', ''];
      for (let k = 0; k < levels; k += 1) {
        faces(x, y - k * s).forEach((d, f) => (paths[f] += d));
      }
      return `<path d="${paths[0]}" class="art-c2"/><path d="${paths[1]}" class="art-c1"/><path d="${paths[2]}" class="art-c3"/>`;
    };
    const cluster = (ox, oy, size) => {
      const cells = [];
      for (let i = 0; i < size; i += 1) {
        for (let j = 0; j < size; j += 1) {
          if (rand() < 0.72) cells.push([i, j, 1 + Math.floor(rand() * 3)]);
        }
      }
      return cells
        .sort((p, q) => p[0] + p[1] - (q[0] + q[1]))
        .map(
          ([i, j, levels]) =>
            `<g class="art-bob" style="animation-delay:-${r1((i + j) * 0.25)}s">${column(ox + (i - j) * a, oy + ((i + j) * s) / 2, levels)}</g>`,
        )
        .join('');
    };
    let floaters = '';
    for (let i = 0; i < 4; i += 1) {
      const x = r1(between(rand, width * 0.45, width * 0.75));
      const y = r1(between(rand, height * 0.55, height * 0.95));
      floaters += `<g transform="translate(${x} ${y}) scale(${r1(between(rand, 0.4, 0.7))})"><g class="art-hover" style="animation-delay:-${r1(rand() * 6)}s">${column(0, 0, 1)}</g></g>`;
    }
    return {
      defs: `<pattern id="ags-iso" width="${r1(a * 2)}" height="${r1(s)}" patternUnits="userSpaceOnUse"><path d="M0 0L${r1(a * 2)} ${r1(s)}M0 ${r1(s)}L${r1(a * 2)} 0" class="art-line" stroke-width=".5"/></pattern>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-iso)" opacity=".14"/>
        <g opacity=".5">${floaters}${cluster(width - a * 4.6, height - s * 3.4, 5)}</g>`,
      motion: `@keyframes ags-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-${r1(s * 0.35)}px)}}
        .art-bob{animation:ags-bob 3s ease-in-out infinite}
        @keyframes ags-hover{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(4deg)}}
        .art-hover{animation:ags-hover 6s ease-in-out infinite}`,
    };
  },

  ridgeline(rand, { width, height }) {
    const gap = Math.max(9, height / 26);
    const rows = Math.floor((height - gap * 2) / gap);
    const steps = 64;
    let out = '';
    for (let k = 0; k < rows; k += 1) {
      const base = gap * 2.2 + k * gap;
      const bumps = Array.from({ length: 4 }, () => [
        between(rand, 0.35, 0.65),
        between(rand, 0.02, 0.06),
        between(rand, 0.4, 1),
      ]);
      const amp = gap * between(rand, 2.2, 4.2);
      let d = '';
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const envelope = Math.exp(-(((t - 0.5) / 0.17) ** 2));
        let y = 0;
        for (const [c, w, h] of bumps) y += h * Math.exp(-(((t - c) / w) ** 2));
        y = Math.min(1.4, y) * envelope + rand() * 0.06;
        d += `${i ? 'L' : 'M'}${r1(t * width)} ${r1(base - y * amp)}`;
      }
      out += `<path d="${d}L${width} ${r1(base + 1)}H0Z" class="art-bg art-s1 art-ridge" stroke-width=".8" style="animation-delay:-${r1((rows - k) * 0.14)}s"/>`;
    }
    return {
      layer: `<g opacity=".42">${out}</g>`,
      css: `.art-ridge{fill:var(--bg);stroke-opacity:.85}`,
      motion: `@keyframes ags-ridge{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.6)}}
        .art-ridge{transform-box:fill-box;transform-origin:center bottom;animation:ags-ridge 4s ease-in-out infinite}`,
    };
  },

  warp(rand, { width, height }) {
    const cx = r1(width / 2);
    const cy = r1(height / 2);
    const reach = Math.hypot(cx, cy);
    let streaks = '';
    for (let i = 0, n = Math.round((width * height) / 1400); i < n; i += 1) {
      const r0 = between(rand, 0.08, 0.9) * reach;
      const len = between(rand, 4, 22) * (r0 / reach + 0.3);
      const c = rand() < 0.7 ? 2 : 1;
      streaks += `<g transform="rotate(${r1(rand() * 360)})"><path d="M${r1(r0)} 0h${r1(len)}" class="art-s${c} art-streak" stroke-width="${r1(between(rand, 0.6, 1.6))}" stroke-linecap="round" opacity=".7" style="animation-delay:-${r1(rand() * 2)}s;animation-duration:${r1(between(rand, 1.2, 2.4))}s"/></g>`;
    }
    let rings = '';
    for (let i = 0; i < 5; i += 1) {
      const w = r1(width * 0.1 * 1.55 ** i);
      const h = r1(height * 0.1 * 1.55 ** i);
      rings += `<ellipse rx="${r1(w / 2)}" ry="${r1(h / 2)}" class="art-s3 art-ring" stroke-width="1.2" vector-effect="non-scaling-stroke" opacity=".35" style="animation-delay:-${r1(i * 0.8)}s"/>`;
    }
    return {
      defs: radialGlow('ags-core', 'art2', 0.35),
      layer: `<circle cx="${cx}" cy="${cy}" r="${r1(Math.min(height * 0.5, 120))}" fill="url(#ags-core)"/>
        <g transform="translate(${cx} ${cy})">${rings}${streaks}</g>`,
      motion: `@keyframes ags-streak{0%{transform:scaleX(.3);opacity:0}30%{opacity:.9}100%{transform:scaleX(2.4);opacity:0}}
        .art-streak{animation:ags-streak 1.8s cubic-bezier(.5,0,1,1) infinite}
        @keyframes ags-ring{0%{transform:scale(.6);opacity:0}30%{opacity:.4}100%{transform:scale(1.6);opacity:0}}
        .art-ring{transform-box:fill-box;transform-origin:center;animation:ags-ring 4s cubic-bezier(.5,0,1,1) infinite}`,
    };
  },

  spheres(rand, { width, height }) {
    const u = unit(height);
    const placed = [];
    let orbs = '';
    // Spheres peek in from the edges, so they never sit on top of the numbers.
    for (let i = 0, n = 4 + Math.round(width / 160); i < n; i += 1) {
      let x;
      let y;
      let r;
      for (let tries = 0; tries < 20; tries += 1) {
        r = between(rand, u * 1.2, u * 4.4);
        const t = rand();
        const inset = between(rand, -0.2, 0.45) * r;
        [x, y] = pick(rand, [
          [t * width, inset],
          [t * width, height - inset],
          [inset, t * height],
          [width - inset, t * height],
        ]);
        if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r + u)) break;
      }
      placed.push([x, y, r]);
    }
    placed.sort((p, q) => p[2] - q[2]);
    placed.forEach(([x, y, r], i) => {
      const g = i % 2 ? 3 : 1;
      const ring =
        i === placed.length - 1
          ? (front) =>
              `<path d="M${r1(front ? r * 1.7 : -r * 1.7)} 0A${r1(r * 1.7)} ${r1(r * 0.42)} 0 0 1 ${r1(front ? -r * 1.7 : r * 1.7)} 0" stroke="url(#ags-metal)" stroke-width="${r1(r * 0.13)}" fill="none" transform="rotate(-16)"/>`
          : () => '';
      orbs += `<ellipse cx="${r1(x)}" cy="${r1(y + r * 1.2)}" rx="${r1(r * 0.75)}" ry="${r1(r * 0.16)}" class="art-shadow"/>
        <g transform="translate(${r1(x)} ${r1(y)})"><g class="art-bob" style="animation-delay:-${r1(rand() * 6)}s;animation-duration:${r1(between(rand, 4, 7))}s">${ring(false)}<circle r="${r1(r)}" fill="url(#ags-orb${g})"/><ellipse cx="${r1(-r * 0.32)}" cy="${r1(-r * 0.42)}" rx="${r1(r * 0.3)}" ry="${r1(r * 0.16)}" transform="rotate(-30 ${r1(-r * 0.32)} ${r1(-r * 0.42)})" fill="#fff" opacity=".7"/>${ring(true)}</g></g>`;
    });
    const orb = (n) =>
      `<radialGradient id="ags-orb${n}" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="#fff"/><stop offset=".22" style="stop-color:var(--art2)"/><stop offset=".7" style="stop-color:var(--art${n})"/><stop offset="1" style="stop-color:var(--shade)"/></radialGradient>`;
    return {
      defs: `${orb(1)}${orb(3)}<linearGradient id="ags-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".3" style="stop-color:var(--art2)"/><stop offset=".55" style="stop-color:var(--art1)"/><stop offset=".75" stop-color="#fff"/><stop offset="1" style="stop-color:var(--art3)"/></linearGradient>`,
      layer: `<g opacity=".75">${orbs}</g>`,
      css: `.art-shadow{fill:var(--shade);opacity:.12}`,
      motion: `@keyframes ags-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-${r1(u * 0.8)}px)}}
        .art-bob{animation:ags-bob 5s ease-in-out infinite}`,
    };
  },

  globe(rand, { width, height }) {
    const R = r1(Math.min(height * 0.36, 95));
    const cx = r1(width - R - 30);
    const cy = r1(height * 0.48);
    let lat = '';
    for (const deg of [-60, -30, 0, 30, 60]) {
      const phi = (deg * Math.PI) / 180;
      lat += `<ellipse cy="${r1(R * Math.sin(phi))}" rx="${r1(R * Math.cos(phi))}" ry="${r1(R * Math.cos(phi) * 0.16)}"/>`;
    }
    let meridians = '';
    const seconds = 16;
    for (let k = 0; k < 6; k += 1) {
      const scale = r1(Math.cos((k * Math.PI) / 6) * 100) / 100;
      meridians += `<ellipse rx="${R}" ry="${R}" transform="scale(${scale} 1)" class="art-spin3d" style="animation-delay:-${r1((k / 12) * seconds)}s"/>`;
    }
    let dots = '';
    for (let i = 0; i < 12; i += 1) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * R * 0.9;
      dots += `<circle cx="${r1(Math.cos(a) * d)}" cy="${r1(Math.sin(a) * d)}" r="1.3" class="art-tw" style="animation-delay:${r1(rand() * 3)}s"/>`;
    }
    return {
      defs: `<clipPath id="ags-globe-clip"><circle r="${R}"/></clipPath>
        <pattern id="ags-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r=".8" class="art-c1"/></pattern>
        <linearGradient id="ags-cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--art1)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--art1)" stop-opacity="0"/></linearGradient>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-dots)" opacity=".18"/>
        <g transform="translate(${cx} ${cy})">
          <path d="M${r1(-R * 0.55)} ${r1(R * 1.25)}L${r1(-R)} 0H${R}L${r1(R * 0.55)} ${r1(R * 1.25)}Z" fill="url(#ags-cone)" opacity=".5"/>
          <circle r="${R}" class="art-c1" opacity=".06"/>
          <g class="art-s1" stroke-width=".9" opacity=".5"><circle r="${R}"/>${lat}${meridians}</g>
          <g class="art-c2" opacity=".8">${dots}</g>
          <g clip-path="url(#ags-globe-clip)"><rect x="${-R}" y="${-R}" width="${R * 2}" height="3" class="art-c1 art-scan" opacity=".35"/></g>
          <ellipse cy="${r1(R * 1.3)}" rx="${r1(R * 0.6)}" ry="${r1(R * 0.1)}" class="art-s1" stroke-width="1.2" opacity=".5"/>
          <g transform="rotate(-18) scale(1 .3)"><circle r="${r1(R * 1.35)}" class="art-s3" stroke-width="2" stroke-dasharray="3 6" opacity=".5"/><g class="art-orbit"><circle cx="${r1(R * 1.35)}" r="5" class="art-c3"/></g></g>
        </g>`,
      motion: `@keyframes ags-spin3d{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
        .art-spin3d{animation:ags-spin3d ${seconds}s ease-in-out infinite}
        @keyframes ags-scan{0%,100%{transform:translateY(0)}50%{transform:translateY(${r1(R * 2)}px)}}
        .art-scan{animation:ags-scan 5s ease-in-out infinite}
        @keyframes ags-orbit{to{transform:rotate(360deg)}}
        .art-orbit{animation:ags-orbit 9s linear infinite}`,
    };
  },

  // Bold

  lava(rand, { width, height }) {
    const u = unit(height);
    const lampWidth = Math.min(width * 0.18, u * 10);
    // Two lamps, one at each edge, so the wax stays clear of the numbers.
    const lamp = (n, cx) => {
      let out = `<ellipse cx="${r1(cx)}" cy="${r1(height + u)}" rx="${r1(lampWidth * 0.75)}" ry="${r1(u * 2.6)}"/><ellipse cx="${r1(cx)}" cy="${r1(-u)}" rx="${r1(lampWidth * 0.5)}" ry="${r1(u * 1.8)}"/>`;
      for (let i = 0; i < 5; i += 1) {
        const x = cx + between(rand, -0.3, 0.3) * lampWidth;
        out += `<g transform="translate(${r1(x)} ${r1(between(rand, height * 0.2, height * 0.8))})"><circle r="${r1(between(rand, u * 1.3, u * 2.9))}" class="art-blob" style="animation-delay:-${r1(rand() * 20)}s;animation-duration:${r1(between(rand, 12, 22))}s"/></g>`;
      }
      return `<g filter="url(#ags-goo)" class="art-c${n}">${out}</g>`;
    };
    return {
      defs: `<filter id="ags-goo" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${r1(u * 1.1)}"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"/></filter>
        <linearGradient id="ags-lamp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--art1)" stop-opacity=".22"/><stop offset=".25" style="stop-color:var(--art1)" stop-opacity="0"/><stop offset=".75" style="stop-color:var(--art3)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--art3)" stop-opacity=".22"/></linearGradient>`,
      layer: `<rect width="${width}" height="${height}" fill="url(#ags-lamp)"/>
        <g opacity=".6">${lamp(1, lampWidth * 0.45)}${lamp(3, width - lampWidth * 0.45)}</g>`,
      motion: `@keyframes ags-blob{0%,100%{transform:translateY(${r1(height * 0.38)}px) scale(.9,1.15)}50%{transform:translateY(-${r1(height * 0.38)}px) scale(1.1,.85)}}
        .art-blob{animation:ags-blob 16s ease-in-out infinite}`,
    };
  },

  matrix(rand, { width, height }) {
    const size = 11;
    // Glyphs every font has; the film's katakana would need a CJK font on the viewer's side.
    const glyphs = '0123456789ABCDEFHKMTXZ:=+*';
    const groups = [[], [], []];
    for (let x = 6; x < width; x += 14) {
      if (rand() < 0.3) continue;
      const length = 5 + Math.floor(rand() * 12);
      const head = rand() * height;
      const ys = Array.from({ length }, (_, i) => r1(head - (length - i) * size * 1.15));
      const chars = ys.map(() => pick(rand, [...glyphs])).join('');
      const split = Math.floor(length / 2);
      // One x per glyph, otherwise each glyph would advance to the right of the previous one.
      const xs = (n) => Array(n).fill(x).join(' ');
      groups[Math.floor(rand() * 3)].push(
        `<text x="${xs(split)}" y="${ys.slice(0, split).join(' ')}" opacity=".2">${chars.slice(0, split)}</text><text x="${xs(length - split)}" y="${ys.slice(split).join(' ')}" opacity=".42">${chars.slice(split)}</text><text x="${x}" y="${r1(head)}" class="art-c2" opacity=".75">${pick(rand, [...glyphs])}</text>`,
      );
    }
    return {
      layer: `<g class="art-c1 art-glyph">${groups.map((g, i) => loop(g.join(''), 0, height, [7, 10, 14][i])).join('')}</g>`,
      css: `.art-glyph text{font-size:${size}px;font-family:monospace}`,
      // Step one glyph row at a time, like the film, which also keeps repaints rare.
      motion: `${loopMotion(0, height)}.art-glyph .art-loop{animation-timing-function:steps(${Math.round(height / (size * 1.15))})}`,
    };
  },

  fire(rand, { width, height }) {
    const tall = Math.min(height * 0.28, 64);
    const flame = (w, h) =>
      `M${r1(-w)} 0C${r1(-w)} ${r1(-h * 0.4)} ${r1(-w * 0.2)} ${r1(-h * 0.5)} ${r1(-w * 0.3)} ${r1(-h)}C${r1(w * 0.5)} ${r1(-h * 0.65)} ${r1(w)} ${r1(-h * 0.45)} ${r1(w)} 0Z`;
    const row = (n, scale, opacity) => {
      let out = '';
      for (let x = -between(rand, 0, 10); x < width + 10; x += between(rand, 12, 22)) {
        const h = tall * scale * between(rand, 0.45, 1);
        out += `<g transform="translate(${r1(x)} ${height + 2})"><path d="${flame(between(rand, 9, 15) * scale, h)}" class="art-flick" style="animation-delay:-${r1(rand())}s;animation-duration:${r1(between(rand, 0.7, 1.4))}s"/></g>`;
      }
      return `<g class="art-c${n}" opacity="${opacity}">${out}</g>`;
    };
    let embers = '';
    for (let i = 0, n = Math.round((width * height) / 3500); i < n; i += 1) {
      embers += `<g transform="translate(${r1(rand() * width)} ${r1(rand() * height)})"><circle r="${r1(between(rand, 0.6, 1.6))}" class="art-c${rand() < 0.5 ? 2 : 3} art-ember" style="animation-delay:-${r1(rand() * 3)}s;animation-duration:${r1(between(rand, 2, 4))}s"/></g>`;
    }
    return {
      defs: `<linearGradient id="ags-heat" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--art1)" stop-opacity=".45"/><stop offset="1" style="stop-color:var(--art1)" stop-opacity="0"/></linearGradient>`,
      layer: `<rect y="${r1(height * 0.45)}" width="${width}" height="${r1(height * 0.55)}" fill="url(#ags-heat)"/>
        ${loop(embers, 0, -height, 9)}
        ${row(1, 1, 0.5)}${row(3, 0.75, 0.55)}${row(2, 0.45, 0.6)}`,
      motion: `${loopMotion(0, -height)}
        @keyframes ags-flick{0%,100%{transform:scale(1,1) skewX(0)}25%{transform:scale(.9,1.15) skewX(4deg)}50%{transform:scale(1.05,.85) skewX(-3deg)}75%{transform:scale(.95,1.1) skewX(2deg)}}
        .art-flick{animation:ags-flick 1s ease-in-out infinite}
        @keyframes ags-ember{0%,100%{transform:translateX(0);opacity:.2}50%{transform:translateX(6px);opacity:1}}
        .art-ember{animation:ags-ember 3s ease-in-out infinite}`,
    };
  },

  memphis(rand, { width, height }) {
    const u = unit(height);
    const shapes = [
      (c) =>
        `<path d="M${r1(-u * 1.6)} 0l${r1(u * 0.8)} ${r1(-u * 0.8)}l${r1(u * 0.8)} ${r1(u * 0.8)}l${r1(u * 0.8)} ${r1(-u * 0.8)}l${r1(u * 0.8)} ${r1(u * 0.8)}" class="art-s${c}" stroke-width="${r1(u * 0.32)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      (c) =>
        `<path d="M0 ${r1(-u)}L${r1(u * 0.9)} ${r1(u * 0.6)}H${r1(-u * 0.9)}Z" class="art-s${c}" stroke-width="${r1(u * 0.25)}" stroke-linejoin="round"/>`,
      (c) => `<circle r="${r1(u * 0.7)}" class="art-c${c}"/>`,
      (c) => `<path d="M${r1(-u)} 0A${r1(u)} ${r1(u)} 0 0 1 ${r1(u)} 0Z" class="art-c${c}"/>`,
      (c) => {
        let dots = '';
        for (let i = -1; i <= 1; i += 1) {
          for (let j = -1; j <= 1; j += 1) {
            dots += `<circle cx="${r1(i * u * 0.6)}" cy="${r1(j * u * 0.6)}" r="${r1(u * 0.15)}"/>`;
          }
        }
        return `<g class="art-c${c}">${dots}</g>`;
      },
      (c) =>
        `<rect x="${r1(-u * 0.8)}" y="${r1(-u * 0.22)}" width="${r1(u * 1.6)}" height="${r1(u * 0.45)}" class="art-c${c}"/>`,
      (c) => `<circle r="${r1(u * 0.6)}" class="art-s${c}" stroke-width="${r1(u * 0.25)}"/>`,
      (c) =>
        `<path d="M${r1(-u * 0.6)} 0H${r1(u * 0.6)}M0 ${r1(-u * 0.6)}V${r1(u * 0.6)}" class="art-s${c}" stroke-width="${r1(u * 0.3)}" stroke-linecap="round"/>`,
      (c) =>
        `<path d="M${r1(-u * 1.6)} 0q${r1(u * 0.4)} ${r1(-u * 0.6)} ${r1(u * 0.8)} 0t${r1(u * 0.8)} 0t${r1(u * 0.8)} 0t${r1(u * 0.8)} 0" class="art-s${c}" stroke-width="${r1(u * 0.28)}" stroke-linecap="round"/>`,
    ];
    const placed = [];
    let out = '';
    for (let i = 0, n = Math.round((width * height) / 6500); i < n; i += 1) {
      let x;
      let y;
      for (let tries = 0; tries < 12; tries += 1) {
        x = between(rand, u, width - u);
        y = between(rand, u, height - u);
        if (placed.every(([px, py]) => Math.hypot(px - x, py - y) > u * 3.2)) break;
      }
      placed.push([x, y]);
      out += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rand() * 360)})"><g class="art-wiggle" style="animation-delay:-${r1(rand() * 5)}s;animation-duration:${r1(between(rand, 3, 6))}s">${pick(rand, shapes)(1 + (i % 3))}</g></g>`;
    }
    const big = r1(Math.min(height * 0.42, 110));
    return {
      defs: `<pattern id="ags-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="4" height="10" class="art-c2"/></pattern>`,
      layer: `<circle cx="${width}" cy="0" r="${big}" class="art-c3" opacity=".22"/>
        <rect x="-${r1(big * 0.5)}" y="${r1(height - big * 0.6)}" width="${r1(big * 1.8)}" height="${r1(big)}" fill="url(#ags-stripes)" opacity=".2" transform="rotate(-12 0 ${height})"/>
        <g opacity=".5">${out}</g>`,
      motion: `@keyframes ags-wiggle{0%,100%{transform:rotate(-10deg) scale(1)}50%{transform:rotate(10deg) scale(1.1)}}
        .art-wiggle{animation:ags-wiggle 4s ease-in-out infinite}`,
    };
  },
};

/**
 * Render an art style for a card of the given size.
 * @returns {{ defs: string, layer: string, css: string }} empty strings for unknown styles
 */
export function renderArt(name, { width, height, seed = '', animate = true }) {
  const style = styles[name];
  if (!style) return { defs: '', layer: '', css: '' };
  const art = style(createRandom(`${name}:${seed}`), { width, height });
  const motion = animate
    ? `@keyframes ags-twk{50%{opacity:.12}}
    .art-tw{animation:ags-twk 3.5s ease-in-out infinite}
    ${art.motion ?? ''}
    @media (prefers-reduced-motion: reduce){.art-layer *{animation:none!important}}`
    : '';
  const css = `.art-c1{fill:var(--art1)}.art-c2{fill:var(--art2)}.art-c3{fill:var(--art3)}
    .art-line{stroke:var(--art1);fill:none}.art-grid{stroke:var(--art1)}
    .art-s1{stroke:var(--art1);fill:none}.art-s2{stroke:var(--art2);fill:none}.art-s3{stroke:var(--art3);fill:none}
    .art-bg{fill:var(--bg)}.art-acc{fill:var(--accent)}
    ${art.css ?? ''}
    ${motion}`;
  return { defs: art.defs ?? '', layer: art.layer, css };
}
