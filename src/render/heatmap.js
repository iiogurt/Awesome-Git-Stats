import {
  delay,
  escapeXml,
  formatExact,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';
import { gridCast, gridGloss, gridSheen } from './materials.js';

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const CELL = 11;
const STEP = 14;
const LEFT = 58;
const TOP = 74;
const HEIGHT = 210;

/** The contribution calendar on its own, large, with month and weekday labels. */
export function renderHeatmap(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Contributions`;
  const a = stats.activity;
  const days = a?.days ?? [];
  const offset = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
  // A year is 53 weeks; keep that width even without data, so the card's size is stable.
  const weeks = Math.max(53, Math.ceil((days.length + offset) / 7));
  const width = LEFT + weeks * STEP - (STEP - CELL) + 25;
  if (!a) return renderNoActivity(stats, options, { width, height: HEIGHT, title });

  const columns = new Map();
  days.forEach((day, i) => {
    const col = Math.floor((i + offset) / 7);
    const row = (i + offset) % 7;
    const column = columns.get(col) ?? { first: row, cells: [] };
    column.last = row;
    column.cells.push(
      `<rect x="${LEFT + col * STEP}" y="${TOP + row * STEP}" width="${CELL}" height="${CELL}" rx="2.5" class="hm${a.levels[i]}"><title>${escapeXml(`${day.date}: ${day.count}`)}</title></rect>`,
    );
    columns.set(col, column);
  });
  // Each column carries its own strip of gloss and shadow, so they fade in with its cells.
  const grid = [...columns.entries()]
    .map(([col, { first, last, cells }]) => {
      const area = {
        id: 'ags-hm-sheen',
        x: LEFT + col * STEP,
        y: TOP + first * STEP,
        width: CELL,
        height: (last - first) * STEP + CELL,
      };
      return `<g class="fade"${delay(options, 150 + col * 14)}>${gridCast(area)}${cells.join('')}${gridGloss(area)}</g>`;
    })
    .join('');

  let months = '';
  let lastLabel = -3;
  let previous = null;
  days.forEach((day, i) => {
    const col = Math.floor((i + offset) / 7);
    const month = Number(day.date.slice(5, 7)) - 1;
    if (month !== previous && col - lastLabel >= 3 && col < weeks - 1) {
      months += `<text x="${LEFT + col * STEP}" y="${TOP - 8}" class="axis">${MONTHS[month]}</text>`;
      lastLabel = col;
    }
    previous = month;
  });
  const weekdays = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(([row, name]) => `<text x="25" y="${TOP + row * STEP + 9}" class="axis">${name}</text>`)
    .join('');

  const right = width - 25;
  const legendY = TOP + 7 * STEP + 14;
  const legend = [0, 1, 2, 3, 4]
    .map(
      (level, i) =>
        `<rect x="${right - 30 - (5 - i) * STEP}" y="${legendY - 9}" width="${CELL}" height="${CELL}" rx="2.5" class="hm${level}"/><rect x="${right - 30 - (5 - i) * STEP}" y="${legendY - 9}" width="${CELL}" height="${CELL}" rx="2.5" fill="url(#ags-sheen)"/>`,
    )
    .join('');
  const summary = `${formatExact(a.total)} contributions in the last year`;
  const best = a.best
    ? `best day ${formatExact(a.best.count)} · ${formatExact(a.activeDays)} active days`
    : '';

  const body = `
    <text x="${right}" y="35" class="axis fade" text-anchor="end">${escapeXml(best)}</text>
    ${gridSheen({ id: 'ags-hm-sheen', x: LEFT, y: TOP, cell: CELL, step: STEP, rx: 2.5 })}${months}${weekdays}${grid}
    <text x="25" y="${legendY}" class="summary fade"${delay(options, 600)}>${escapeXml(summary)}</text>
    <text x="${right - 36 - 5 * STEP}" y="${legendY}" class="axis" text-anchor="end">Less</text>
    ${legend}
    <text x="${right}" y="${legendY}" class="axis" text-anchor="end">More</text>`;

  const css = `
    .axis{font-size:10.5px;fill:var(--muted)}
    .summary{font-size:12px;font-weight:600;fill:var(--text)}
    .hm0{fill:var(--track)}
    .hm1,.hm2,.hm3,.hm4{fill:var(--accent)}
    .hm1{fill-opacity:.28}.hm2{fill-opacity:.5}.hm3{fill-opacity:.75}`;

  return renderFrame({
    width,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body,
    css,
    label: `${stats.name}: ${summary}`,
  });
}
