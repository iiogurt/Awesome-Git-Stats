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
    ${art.css ?? ''}
    ${motion}`;
  return { defs: art.defs ?? '', layer: art.layer, css };
}
