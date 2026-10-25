import {
  circularMean,
  elementSymbol,
  entropy,
  gini,
  hIndex,
  linearFit,
  lorenz,
  moments,
  spectrum,
  weekBits,
  zipf,
} from '../science.js';
import {
  delay,
  escapeXml,
  formatCount,
  formatExact,
  renderFrame,
  truncate,
  wrapText,
} from './common.js';
import { cellRx, cover, orb, underlay } from './materials.js';
import { TEX_CSS, tex } from './tex.js';

const WIDTH = 820;
const HEIGHT = 510;
const LEFT = 25;
const RIGHT = WIDTH - 25;
const ROW_A = 70;
const ROW_B = 276;
const ROW_C = 426;

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const r1 = (n) => Math.round(n * 10) / 10;
const fixed = (n, digits) => Number(n).toFixed(digits);
const path = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');

/** A plot area: plain, so fine lines and small type stay crisp in every finish. */
function plotArea({ x, y, width, height, rx }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cellRx(rx)}" class="ghost"/>`;
}

/** A panel heading: a TeX formula, then a plain description. */
function heading(x, y, formula, words) {
  return `<text x="${x}" y="${y}" class="head">${tex(formula)}<tspan class="head-words" dx="8">${escapeXml(words)}</tspan></text>`;
}

/** Smooth closed curve through the points (Catmull-Rom as cubic Béziers). */
function closedCurve(points) {
  const n = points.length;
  const at = (i) => points[(i + n) % n];
  let d = `M${points[0].map(r1).join(' ')}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${[...c1, ...c2, ...p2].map(r1).join(' ')}`;
  }
  return `${d}Z`;
}

/** Weekday totals in polar coordinates, with the circular mean as a vector. */
function polar(activity, options) {
  const cx = 135;
  const cy = 152;
  const R = 58;
  const totals = activity.weekdays;
  const max = Math.max(...totals, 1);
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 7;
  const at = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  const rings = [0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<circle cx="${cx}" cy="${cy}" r="${r1(R * f)}" class="grid${f === 1 ? ' grid-edge' : ''}"/>`,
    )
    .join('');
  const spokes = WEEKDAYS.map((day, i) => {
    const [x, y] = at(i, R);
    const [lx, ly] = at(i, R + 13);
    return `<path d="M${cx} ${cy}L${r1(x)} ${r1(y)}" class="grid"/>
      <text x="${r1(lx)}" y="${r1(ly + 3.5)}" class="tick" text-anchor="middle">${day}</text>`;
  }).join('');
  const shape = closedCurve(totals.map((v, i) => at(i, R * (0.08 + (0.92 * v) / max))));
  const mean = circularMean(totals);
  const length = Math.max(R * mean.length, 6);
  const theta = -Math.PI / 2 + (mean.index * 2 * Math.PI) / 7;
  const tip = [cx + Math.cos(theta) * length, cy + Math.sin(theta) * length];
  const day = WEEKDAYS[Math.round(mean.index) % 7];
  return `${heading(LEFT, ROW_A - 8, 'r(\\theta)', 'weekday density')}
    ${plotArea({ x: LEFT, y: ROW_A, width: 220, height: 180, rx: 8 })}
    ${rings}${spokes}
    <g transform="translate(${cx} ${cy})"><g class="grow-out"${delay(options, 250)}><g transform="translate(${-cx} ${-cy})">
      <path d="${shape}" class="shape"/>${cover({ d: shape }, 'shape')}
    </g></g></g>
    <g class="fade"${delay(options, 900)}>
      <path d="M${cx} ${cy}L${r1(tip[0])} ${r1(tip[1])}" class="vector" marker-end="url(#ags-arrow)"/>
      ${orb({ cx, cy, r: 2.5, fill: 'accent' })}
    </g>
    <text x="${LEFT + 110}" y="${ROW_A + 172}" class="eq-small" text-anchor="middle">${tex(`\\bar\\theta = \\mathrm{${day}},\\ \\bar{R} = ${fixed(mean.length, 2)}`)}</text>`;
}

/** Amplitude spectrum of the daily series, with the dominant period marked. */
function fourier(activity, options) {
  const x0 = 260;
  const width = 280;
  const plot = { x: x0 + 14, y: ROW_A + 22, width: width - 28, height: 118 };
  const { amplitudes, period } = spectrum(activity.days.map((day) => day.count));
  const n = activity.days.length;
  const max = Math.max(...amplitudes, 1e-9);
  // Frequency in cycles per day, from 1/n to 1/2.
  const fx = (f) => plot.x + (f / 0.5) * plot.width;
  const fy = (a) => plot.y + plot.height - (a / max) * plot.height;
  const points = amplitudes.map((a, i) => [fx((i + 1) / n), fy(a)]);
  const line = points.length ? path(points) : '';
  const area = points.length
    ? `${line}L${r1(points.at(-1)[0])} ${plot.y + plot.height}L${r1(points[0][0])} ${plot.y + plot.height}Z`
    : '';
  const ticks = [
    [1 / 30, '1/30'],
    [1 / 7, '1/7'],
    [2 / 7, '2/7'],
    [3 / 7, '3/7'],
    [1 / 2, '1/2'],
  ]
    .map(
      ([f, label]) => `<path d="M${r1(fx(f))} ${plot.y + plot.height}v4" class="axis-line"/>
      <text x="${r1(fx(f))}" y="${plot.y + plot.height + 14}" class="tick" text-anchor="middle">${label}</text>`,
    )
    .join('');
  const peak =
    period != null
      ? (() => {
          const x = fx(1 / period);
          const y = fy(max);
          return `<g class="fade"${delay(options, 1100)}>
            <path d="M${r1(x)} ${r1(y)}V${plot.y + plot.height}" class="peak-line"/>
            ${orb({ cx: r1(x), cy: r1(y), r: 3, fill: 'accent' })}
            <text x="${r1(Math.min(x + 6, plot.x + plot.width - 70))}" y="${r1(y + 4)}" class="eq-small">${tex(`T^* = ${fixed(period, 1)}\\,\\mathrm{d}`)}</text>
          </g>`;
        })()
      : '';
  return `${heading(x0, ROW_A - 8, '|\\hat{c}(f)|', 'Fourier spectrum')}
    ${plotArea({ x: x0, y: ROW_A, width, height: 180, rx: 8 })}
    <path d="M${plot.x} ${plot.y}V${plot.y + plot.height}H${plot.x + plot.width}" class="axis-line"/>
    ${ticks}
    <text x="${plot.x + plot.width}" y="${plot.y + plot.height + 28}" class="tick" text-anchor="end">${tex('f\\ (\\text{cycles / day})')}</text>
    ${area ? `<path d="${area}" fill="url(#ags-lab-area)" class="fade"${delay(options, 600)}/>` : ''}
    ${line ? `<path d="${line}" class="curve draw" pathLength="1"/>` : ''}
    ${peak}`;
}

/** The headline numbers, set like a proposition: formula on the left, comment on the right. */
function proposition(stats, numbers, options, { x0, y0, width, step = 19 }) {
  const rows = numbers
    .map(([formula, comment], i) => {
      const y = y0 + 24 + i * step;
      return `<g class="rise"${delay(options, 300 + i * 70)}>
        <text x="${x0 + 14}" y="${y}" class="eq">${tex(formula)}</text>
        <text x="${x0 + width - 12}" y="${y}" class="comment" text-anchor="end">% ${escapeXml(comment)}</text>
      </g>`;
    })
    .join('');
  return `${heading(x0, y0 - 8, '\\therefore', 'Proposition 1')}
    ${plotArea({ x: x0, y: y0, width, height: 24 + numbers.length * step, rx: 8 })}
    ${rows}`;
}

function propositionRows(stats) {
  const stars = stats.topRepos.map((repo) => repo.stars);
  const h = hIndex(stars);
  const i10 = stars.filter((s) => s >= 10).length;
  const rows = [
    [`\\Sigma\\star = ${formatExact(stats.totalStars)}`, 'stars earned'],
    [`h = ${h},\\ i_{10} = ${i10}`, 'h-index'],
    [`G = ${fixed(gini(stars), 2)}`, 'Gini of ★'],
    [`H = ${fixed(entropy(stats.languages.map((l) => l.stars)), 2)}\\,\\mathrm{bit}`, 'entropy'],
  ];
  const a = stats.activity;
  if (a) {
    const { mean, sd } = moments(a.days.map((day) => day.count));
    const p = a.days.length ? a.activeDays / a.days.length : 0;
    rows.push(
      [`\\mu = ${fixed(mean, 2)},\\ \\sigma = ${fixed(sd, 2)}`, 'per day'],
      [`P(c > 0) = ${fixed(p, 2)}`, 'active'],
      [
        `\\ell = ${formatExact(a.streaks.current)},\\ \\ell_{\\max} = ${formatExact(a.streaks.longest.length)}`,
        'streak, d',
      ],
    );
  } else {
    const repos = Math.max(stats.repoCount, 1);
    rows.push(
      [`n = ${formatExact(stats.repoCount)}`, 'repositories'],
      [`\\langle\\star\\rangle = ${fixed(stats.totalStars / repos, 1)}`, 'mean per repo'],
      [`\\Sigma\\,\\mathrm{forks} = ${formatExact(stats.totalForks)}`, 'forks'],
    );
  }
  if (stats.followers != null) {
    rows.push([`|F| = ${formatExact(stats.followers)}`, 'followers']);
  }
  return rows;
}

/** Cumulative contributions with a least-squares line. */
function cumulative(activity, options, { x0, width }) {
  const plot = { x: x0 + 14, y: ROW_B + 16, width: width - 28, height: 96 };
  let running = 0;
  const totals = activity.days.map((day) => (running += day.count));
  const n = Math.max(totals.length - 1, 1);
  const max = Math.max(running, 1);
  const px = (t) => plot.x + (t / n) * plot.width;
  const py = (c) => plot.y + plot.height - (c / max) * plot.height;
  const xs = totals.map((_, t) => t);
  const fit = linearFit(xs, totals);
  const clamp = (c) => Math.min(max, Math.max(0, c));
  const line = path(totals.map((c, t) => [px(t), py(c)]));
  const fitLine = path([
    [px(0), py(clamp(fit.intercept))],
    [px(n), py(clamp(fit.slope * n + fit.intercept))],
  ]);
  const sign = fit.intercept < 0 ? '−' : '+';
  return `${heading(x0, ROW_B - 8, '\\int_0^t c\\,d\\tau', 'cumulative contributions')}
    ${plotArea({ x: x0, y: ROW_B, width, height: 128, rx: 8 })}
    <path d="M${plot.x} ${plot.y}V${plot.y + plot.height}H${plot.x + plot.width}" class="axis-line"/>
    <text x="${plot.x}" y="${plot.y + plot.height + 13}" class="tick">${tex('t - 365\\,\\mathrm{d}')}</text>
    <text x="${plot.x + plot.width}" y="${plot.y + plot.height + 13}" class="tick" text-anchor="end">${tex('t')}</text>
    <path d="${fitLine}" class="fit fade"${delay(options, 1000)}/>
    <path d="${line}" class="curve draw" pathLength="1"/>
    <text x="${plot.x + 8}" y="${plot.y + 12}" class="eq-small fade"${delay(options, 1100)}>${tex(`\\hat{C}(t) = ${fixed(fit.slope, 2)}t ${sign} ${formatExact(Math.abs(fit.intercept))}`)}</text>
    <text x="${plot.x + 8}" y="${plot.y + 27}" class="eq-small fade"${delay(options, 1200)}>${tex(`R^2 = ${fixed(fit.r2, 3)}`)}</text>
    <text x="${plot.x + plot.width}" y="${r1(py(max) - 4)}" class="peak-label" text-anchor="end">${formatCount(running)}</text>`;
}

/** Stars against rank on log-log axes, with the fitted power law. */
function rankPlot(stats, options, { x0, y0, width, height }) {
  const plot = { x: x0 + 30, y: y0 + 16, width: width - 44, height: height - 40 };
  const { points, alpha, fit } = zipf(stats.topRepos.map((repo) => repo.stars));
  const head = heading(x0, y0 - 8, 's \\propto r^{-\\alpha}', 'rank–stars law');
  const panel = plotArea({ x: x0, y: y0, width, height, rx: 8 });
  if (points.length < 3) {
    return `${head}${panel}
      <text x="${x0 + width / 2}" y="${y0 + height / 2 + 4}" class="tick" text-anchor="middle">Too few starred repositories to fit a law</text>`;
  }
  const maxX = Math.max(points.at(-1)[0], 0.5);
  const maxY = Math.max(Math.ceil(points[0][1]), 1);
  const px = (lx) => plot.x + (lx / maxX) * plot.width;
  const py = (ly) => plot.y + plot.height - (ly / maxY) * plot.height;
  const decades = (limit) => Array.from({ length: Math.floor(limit) + 1 }, (_, i) => i);
  const yTicks = decades(maxY)
    .map(
      (d) =>
        `<text x="${plot.x - 5}" y="${r1(py(d) + 3)}" class="tick" text-anchor="end">${tex(`10^{${d}}`)}</text>`,
    )
    .join('');
  const xTicks = decades(maxX)
    .map(
      (d) =>
        `<text x="${r1(px(d))}" y="${plot.y + plot.height + 13}" class="tick" text-anchor="middle">${tex(`10^{${d}}`)}</text>`,
    )
    .join('');
  // Thin out long tails: the shape of the law shows with a few dozen points.
  const stride = Math.ceil(points.length / 60);
  const dots = points
    .filter((_, i) => i % stride === 0)
    .map(([lx, ly]) => `<circle cx="${r1(px(lx))}" cy="${r1(py(ly))}" r="2.4" class="dot"/>`)
    .join('');
  const clampY = (ly) => Math.min(maxY, Math.max(0, ly));
  const fitLine = path([
    [px(0), py(clampY(fit.intercept))],
    [px(maxX), py(clampY(fit.intercept + fit.slope * maxX))],
  ]);
  return `${head}${panel}
    <path d="M${plot.x} ${plot.y}V${plot.y + plot.height}H${plot.x + plot.width}" class="axis-line"/>
    ${yTicks}${xTicks}
    <g class="fade"${delay(options, 500)}>${dots}</g>
    <path d="${fitLine}" class="fit fade"${delay(options, 900)}/>
    <text x="${plot.x + plot.width}" y="${plot.y + 10}" class="eq-small fade" text-anchor="end"${delay(options, 1000)}>${tex(`\\alpha = ${fixed(alpha, 2)},\\ R^2 = ${fixed(fit.r2, 2)}`)}</text>`;
}

/** The Lorenz curve of stars over repositories; the shaded lens is the Gini coefficient. */
function lorenzPlot(stats, options, { x0, width }) {
  const stars = stats.topRepos.map((repo) => repo.stars);
  const plot = { x: x0 + 14, y: ROW_B + 14, width: width - 28, height: 100 };
  const px = (f) => plot.x + f * plot.width;
  const py = (f) => plot.y + plot.height - f * plot.height;
  const points = lorenz(stars).map(([fx, fy]) => [px(fx), py(fy)]);
  const curve = path(points);
  return `${heading(x0, ROW_B - 8, 'L(p)', 'Lorenz curve of stars')}
    ${plotArea({ x: x0, y: ROW_B, width, height: 128, rx: 8 })}
    <path d="M${plot.x} ${plot.y}V${plot.y + plot.height}H${plot.x + plot.width}" class="axis-line"/>
    <path d="M${px(0)} ${py(0)}L${px(1)} ${py(1)}" class="fit"/>
    ${points.length > 1 ? `<path d="${curve}L${px(1)} ${py(1)}L${px(0)} ${py(0)}Z" class="lens fade"${delay(options, 700)}/><path d="${curve}" class="curve draw" pathLength="1"/>` : ''}
    <text x="${plot.x + 8}" y="${plot.y + 12}" class="eq-small">${tex(`G = 1 - 2\\int_0^1 L\\,dp = ${fixed(gini(stars), 2)}`)}</text>`;
}

function noActivityNote(stats, { x0, width }) {
  const why =
    stats.type === 'Organization'
      ? 'Contribution activity is only available for user accounts.'
      : 'Contribution activity needs a GitHub token. The Action provides one automatically.';
  const lines = wrapText(why, width - 40, { fontSize: 11.5, maxLines: 3 });
  return `${heading(x0, ROW_B - 8, 'c(t) = \\emptyset', 'not observed')}
    ${plotArea({ x: x0, y: ROW_B, width, height: 128, rx: 8 })}
    ${lines.map((line, i) => `<text x="${x0 + width / 2}" y="${ROW_B + 58 + i * 17}" class="tick" text-anchor="middle">${escapeXml(line)}</text>`).join('')}`;
}

/** Languages as elements of a periodic table: number = rank, mass = stars. */
function elements(stats, options) {
  const langs = stats.languages.filter((lang) => lang.name !== 'Other').slice(0, 7);
  const head = heading(LEFT, ROW_C - 8, 'Z', 'periodic table of languages, by stars');
  if (!langs.length) {
    return `${head}<text x="${LEFT}" y="${ROW_C + 30}" class="tick">No starred languages yet: the table is empty</text>`;
  }
  const gap = 8;
  const size = 50;
  const width = Math.min(102, (RIGHT - LEFT - gap * 6) / 7);
  const taken = new Set();
  const tiles = langs
    .map((lang, i) => {
      const x = r1(LEFT + i * (width + gap));
      const g = { x, y: ROW_C, width, height: size, rx: 4 };
      const symbol = elementSymbol(lang.name, taken);
      return `<g class="rise"${delay(options, 400 + i * 80)}>
        ${underlay(g, 'tile', lang.color)}
        <rect x="${x}" y="${ROW_C}" width="${r1(width)}" height="${size}" rx="${g.rx}" fill="${lang.color}" class="element"/>
        <rect x="${x}" y="${ROW_C}" width="${r1(width)}" height="${size}" rx="${g.rx}" stroke="${lang.color}" class="element-edge"/>
        <text x="${x + 6}" y="${ROW_C + 12}" class="el-z">${i + 1}</text>
        <text x="${r1(x + width - 6)}" y="${ROW_C + 12}" class="el-mass" text-anchor="end">${fixed(lang.share * 100, 1)}</text>
        <text x="${r1(x + width / 2)}" y="${ROW_C + 33}" class="el-symbol" text-anchor="middle">${escapeXml(symbol)}</text>
        <text x="${r1(x + width / 2)}" y="${ROW_C + 45}" class="el-name" text-anchor="middle">${escapeXml(truncate(lang.name, width - 8, 8.5))}</text>
      </g>`;
    })
    .join('');
  return `${head}${tiles}`;
}

/** The year as one byte per week, a fingerprint for the curious. */
function fingerprint(activity, options) {
  const hex = weekBits(activity.days);
  if (!hex) return '';
  return `<text x="${LEFT}" y="${HEIGHT - 12}" class="hex fade"${delay(options, 1300)}>${tex('\\chi =')} 0x${hex}</text>`;
}

/**
 * A "lab notebook" dashboard for the mathematically inclined: the weekly rhythm
 * in polar form, the Fourier spectrum of daily contributions, an h-index and
 * Gini coefficient, a fitted rank–stars power law and languages as elements.
 */
export function renderLab(stats, options) {
  const a = stats.activity;
  const title = options.customTitle ?? `On the GitHub of ${stats.name}`;
  const subtitle = a?.joinedYear != null ? `Vol. ${a.years ?? 0} · est. ${a.joinedYear}` : '';
  const rows = propositionRows(stats);

  const body = a
    ? `${polar(a, options)}
      ${fourier(a, options)}
      ${proposition(stats, rows, options, { x0: 555, y0: ROW_A, width: RIGHT - 555, step: 156 / rows.length })}
      ${cumulative(a, options, { x0: LEFT, width: 375 })}
      ${rankPlot(stats, options, { x0: 415, y0: ROW_B, width: RIGHT - 415, height: 128 })}
      ${fingerprint(a, options)}`
    : `${rankPlot(stats, options, { x0: LEFT, y0: ROW_A, width: 515, height: 180 })}
      ${proposition(stats, rows, options, { x0: 555, y0: ROW_A, width: RIGHT - 555, step: 156 / rows.length })}
      ${lorenzPlot(stats, options, { x0: LEFT, width: 375 })}
      ${noActivityNote(stats, { x0: 415, width: RIGHT - 415 })}`;

  const css = `
    ${TEX_CSS}
    .head{font-size:14px;fill:var(--title)}
    .head-words{font-size:11px;fill:var(--muted);font-style:normal;letter-spacing:.04em}
    .subtitle{font-size:11px;fill:var(--muted);font-style:italic}
    .ghost{fill:var(--track);opacity:.35}
    .grid{fill:none;stroke:var(--muted);stroke-opacity:.25;stroke-width:1}
    .grid-edge{stroke-opacity:.5}
    .axis-line{fill:none;stroke:var(--muted);stroke-opacity:.7;stroke-width:1}
    .tick{font-size:9.5px;fill:var(--muted)}
    .shape{fill:var(--accent);fill-opacity:.3;stroke:var(--accent);stroke-width:1.8;stroke-linejoin:round}
    .vector{stroke:var(--title);stroke-width:1.6}
    .arrow{fill:var(--title)}
    .curve{fill:none;stroke:var(--accent);stroke-width:1.6;stroke-linejoin:round}
    .fit{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:4 3}
    .lens{fill:var(--accent);fill-opacity:.18}
    .peak-line{stroke:var(--accent);stroke-width:1;stroke-dasharray:2 2}
    .peak-label{font-size:10px;font-weight:700;fill:var(--accent)}
    .dot{fill:var(--accent);fill-opacity:.75}
    .eq{font-size:13px;fill:var(--title)}
    .eq-small{font-size:11px;fill:var(--text)}
    .comment{font-size:9.5px;fill:var(--muted);font-family:'JetBrains Mono','Fira Code',SFMono-Regular,Menlo,Consolas,monospace}
    .element{fill-opacity:.22}
    .element-edge{fill:none;stroke-width:1.2}
    .el-z,.el-mass{font-size:8.5px;fill:var(--muted)}
    .el-symbol{font-size:20px;font-weight:700;fill:var(--title)}
    .el-name{font-size:8.5px;fill:var(--text)}
    .hex{font-size:8.6px;fill:var(--muted);letter-spacing:.02em;font-family:'JetBrains Mono','Fira Code',SFMono-Regular,Menlo,Consolas,monospace}
    ${
      options.animate
        ? `@keyframes ags-grow-out{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes ags-dash{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    .grow-out{transform:scale(0);animation:ags-grow-out 1.1s cubic-bezier(.22,1,.36,1) forwards}
    .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ags-dash 1.8s ease-out .4s forwards}
    @media (prefers-reduced-motion: reduce){.grow-out,.draw{animation:none;transform:none;stroke-dashoffset:0}}`
        : ''
    }`;

  const defs = `<defs>
    <linearGradient id="ags-lab-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".3"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient>
    <marker id="ags-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="arrow"/></marker>
  </defs>`;

  const h = hIndex(stats.topRepos.map((repo) => repo.stars));
  const label = `${stats.name}: ${formatExact(stats.totalStars)} stars, h-index ${h}${a ? `, ${formatExact(a.total)} contributions in the last year` : ''}`;

  return renderFrame({
    width: WIDTH,
    height: a ? HEIGHT : HEIGHT - 20,
    theme: options.theme,
    options,
    title,
    body: `${defs}<text x="${RIGHT}" y="35" class="subtitle fade" text-anchor="end">${escapeXml(subtitle)}</text>
    ${body}
    ${elements(stats, options)}`,
    css,
    label,
  });
}
