import { delay, escapeXml, renderFrame, truncate } from './common.js';

const r1 = (n) => Math.round(n * 10) / 10;
const pct = (share) => `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;

function legend(items, options, { x, y, step = 22, width = 150 }) {
  return items
    .map((lang, i) => {
      const ly = y + i * step;
      return `<g class="rise"${delay(options, 300 + i * 80)}>
        <circle cx="${x + 5}" cy="${ly - 4}" r="5" fill="${lang.color}"/>
        <text x="${x + 17}" y="${ly}" class="lang-name">${escapeXml(truncate(lang.name, width - 60, 12))}</text>
        <text x="${x + width}" y="${ly}" class="lang-pct" text-anchor="end">${pct(lang.share)}</text>
      </g>`;
    })
    .join('');
}

function bars(items, options, width) {
  const barWidth = width - 50;
  return items
    .map((lang, i) => {
      const y = 62 + i * 38;
      return `<g class="rise"${delay(options, 150 + i * 90)}>
        <text x="25" y="${y}" class="lang-name">${escapeXml(truncate(lang.name, barWidth - 50, 12))}</text>
        <text x="${width - 25}" y="${y}" class="lang-pct" text-anchor="end">${pct(lang.share)}</text>
        <rect x="25" y="${y + 8}" width="${barWidth}" height="8" rx="4" class="track"/>
        <rect x="25" y="${y + 8}" width="${r1(Math.max(4, lang.share * barWidth))}" height="8" rx="4" fill="${lang.color}" class="grow"${delay(options, 300 + i * 90)}/>
      </g>`;
    })
    .join('');
}

function donut(items, options, { cx, cy, r, stroke }) {
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const gap = items.length > 1 ? 2 : 0;
  const arcs = items
    .map((lang) => {
      const length = Math.max(lang.share * circumference - gap, 0.5);
      const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${lang.color}" stroke-width="${stroke}" fill="none" stroke-dasharray="${r1(length)} ${r1(circumference)}" stroke-dashoffset="${r1(-offset)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += lang.share * circumference;
      return arc;
    })
    .join('');
  return `<g class="spin-in"${delay(options, 150)}><circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${stroke}" fill="none" class="ring-track"/>${arcs}</g>`;
}

function pie(items, options, { cx, cy, r }) {
  let angle = -Math.PI / 2;
  const point = (a) => `${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`;
  const slices = items
    .map((lang) => {
      const sweep = lang.share * Math.PI * 2;
      const slice =
        lang.share >= 0.999
          ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${lang.color}"/>`
          : `<path d="M${cx} ${cy}L${point(angle)}A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(angle + sweep)}Z" fill="${lang.color}" class="slice"/>`;
      angle += sweep;
      return slice;
    })
    .join('');
  return `<g class="spin-in"${delay(options, 150)}>${slices}</g>`;
}

// 100 squares, shared out by the largest remainder method so they add up exactly.
function waffle(items, options, { x, y, size, gap }) {
  const exact = items.map((lang) => lang.share * 100);
  const counts = exact.map(Math.floor);
  const order = exact.map((v, i) => [v - counts[i], i]).sort((a, b) => b[0] - a[0]);
  const missing = 100 - counts.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k += 1) counts[order[k][1]] += 1;
  const colors = counts.flatMap((n, i) => Array(n).fill(items[i].color));
  return colors
    .map((color, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      return `<rect x="${x + col * (size + gap)}" y="${y + row * (size + gap)}" width="${size}" height="${size}" rx="2" fill="${color}" class="fade"${delay(options, 150 + (row + col) * 30)}/>`;
    })
    .join('');
}

/** Most used languages by code size, as bars, a donut, a pie or a waffle chart. */
export function renderLanguages(stats, options) {
  const { measure, items } = stats.codeLanguages;
  const title = options.customTitle ?? 'Most Used Languages';
  const style = options.langStyle;
  const note = measure === 'bytes' ? 'by code size' : 'by repositories';
  let width = 350;
  let height;
  let chart;
  if (!items.length) {
    height = 120;
    chart = `<text x="${width / 2}" y="78" class="lang-name" text-anchor="middle">No code yet</text>`;
  } else if (style === 'bars') {
    height = 62 + items.length * 38 + 8;
    chart = bars(items, options, width);
  } else if (style === 'waffle') {
    width = 420;
    height = Math.max(210, 70 + items.length * 22);
    chart = `${waffle(items, options, { x: 25, y: 52, size: 13, gap: 2.5 })}${legend(items, options, { x: 200, y: 66, width: 195 })}`;
  } else {
    width = 400;
    height = Math.max(190, 70 + items.length * 22);
    const cy = Math.round(52 + (height - 52 - 20) / 2);
    const shape =
      style === 'pie'
        ? pie(items, options, { cx: 90, cy, r: 62 })
        : donut(items, options, { cx: 90, cy, r: 52, stroke: 20 });
    const top = Math.round(cy - ((items.length - 1) * 22) / 2 + 4);
    chart = `${shape}${legend(items, options, { x: 190, y: top, width: 185 })}`;
  }

  const css = `
    .lang-name{font-size:12px;fill:var(--text)}
    .lang-pct{font-size:11px;fill:var(--muted)}
    .lang-note{font-size:11px;fill:var(--muted)}
    .ring-track{stroke:var(--track)}
    .slice{stroke:var(--bg);stroke-width:1.5}
    ${
      options.animate
        ? `@keyframes ags-spin-in{from{opacity:0;transform:rotate(-90deg) scale(.7)}to{opacity:1;transform:none}}
    .spin-in{opacity:0;transform-box:fill-box;transform-origin:center;animation:ags-spin-in 1s cubic-bezier(.22,1,.36,1) forwards}
    @media (prefers-reduced-motion: reduce){.spin-in{animation:none;opacity:1;transform:none}}`
        : ''
    }`;

  return renderFrame({
    width,
    height,
    theme: options.theme,
    options,
    title,
    body: `<text x="${width - 25}" y="35" class="lang-note fade" text-anchor="end">${note}</text>${chart}`,
    css,
    label: items.length
      ? `${stats.name}'s most used languages ${note}: ${items.map((l) => `${l.name} ${pct(l.share)}`).join(', ')}`
      : `${stats.name} has no code yet`,
  });
}
