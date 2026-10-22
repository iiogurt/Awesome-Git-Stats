import {
  delay,
  escapeXml,
  formatCount,
  formatExact,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';
import { glossBar } from './materials.js';

const WIDTH = 495;
const HEIGHT = 220;
const LEFT = 25;
const RIGHT = WIDTH - 25;
const TOP = 70;
const BASE = 178;
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const r1 = (n) => Math.round(n * 10) / 10;

/** Contributions per month as a bar chart with the average marked. */
export function renderTimeline(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Year in Contributions`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const months = a.months;
  const max = Math.max(...months.map((m) => m.total), 1);
  const average = months.reduce((sum, m) => sum + m.total, 0) / Math.max(months.length, 1);
  const slot = (RIGHT - LEFT) / Math.max(months.length, 1);
  const barWidth = Math.min(26, slot * 0.62);
  const scale = (n) => (n / max) * (BASE - TOP);
  const peak = months.findIndex((m) => m.total === max);

  const bars = months
    .map((m, i) => {
      const h = Math.max(3, scale(m.total));
      const x = r1(LEFT + i * slot + (slot - barWidth) / 2);
      const label = MONTHS[Number(m.month.slice(5, 7)) - 1];
      const value =
        i === peak || i === months.length - 1
          ? `<text x="${r1(x + barWidth / 2)}" y="${r1(BASE - h - 6)}" class="value fade"${delay(options, 700 + i * 60)} text-anchor="middle">${formatCount(m.total)}</text>`
          : '';
      return `${glossBar({ x, y: BASE - h, width: barWidth, height: h, rx: 4, upright: true, glow: i === peak, fill: `bar${i === peak ? ' bar-peak' : ''}`, attrs: ` class="growy"${delay(options, 150 + i * 60)}` })}
        ${value}
        <text x="${r1(x + barWidth / 2)}" y="${BASE + 16}" class="axis" text-anchor="middle">${label}</text>`;
    })
    .join('');
  const avgY = r1(BASE - scale(average));

  const body = `
    <text x="${RIGHT}" y="35" class="total fade" text-anchor="end">${escapeXml(`${formatExact(a.total)} contributions`)}</text>
    <text x="${RIGHT}" y="52" class="avg-label fade" text-anchor="end">${escapeXml(`- - avg ${formatCount(Math.round(average))} a month`)}</text>
    <line x1="${LEFT}" y1="${BASE}" x2="${RIGHT}" y2="${BASE}" class="baseline"/>
    ${bars}
    <line x1="${LEFT}" y1="${avgY}" x2="${RIGHT}" y2="${avgY}" class="average fade"${delay(options, 1000)}/>`;

  const css = `
    .axis{font-size:10.5px;fill:var(--muted)}
    .total{font-size:12px;font-weight:600;fill:var(--muted)}
    .value{font-size:11px;font-weight:700;fill:var(--title)}
    .bar{fill:url(#ags-bar-fill)}
    .bar-peak{fill:var(--accent)}
    .baseline{stroke:var(--track);stroke-width:1}
    .average{stroke:var(--muted);stroke-width:1;stroke-dasharray:4 4;opacity:.7}
    .avg-label{font-size:10px;fill:var(--muted)}
    ${
      options.animate
        ? `@keyframes ags-growy{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    .growy{transform-box:fill-box;transform-origin:center bottom;transform:scaleY(0);animation:ags-growy .8s cubic-bezier(.22,1,.36,1) forwards}
    @media (prefers-reduced-motion: reduce){.growy{animation:none;transform:none}}`
        : ''
    }`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body: `<defs><linearGradient id="ags-bar-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".8"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity=".3"/></linearGradient></defs>${body}`,
    css,
    label: `${stats.name}: ${formatExact(a.total)} contributions in the last year, about ${Math.round(average)} a month`,
  });
}
