import {
  FLAME_PATH,
  delay,
  escapeXml,
  formatExact,
  icon,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';
import { glassDisc, ringLight } from './materials.js';

const WIDTH = 495;
const HEIGHT = 195;
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const DAY_MS = 86400000;

/** "Mar 3", or "Mar 3, 2025" when the year differs from `today`. */
export function shortDate(iso, today) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const sameYear = today && today.slice(0, 4) === iso.slice(0, 4);
  return `${MONTHS[month - 1]} ${day}${sameYear ? '' : `, ${year}`}`;
}

const shift = (iso, days) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

// The dates of the current streak: it ends today, or yesterday if today is still empty.
function currentRange(days, length) {
  if (!length) return null;
  const last = days.at(-1);
  const end = last.count > 0 ? last.date : shift(last.date, -1);
  return [shift(end, -(length - 1)), end];
}

function range([start, end], today) {
  if (start === end) return shortDate(start, today);
  return `${shortDate(start, today)} – ${end === today ? 'Present' : shortDate(end, today)}`;
}

function column({ x, value, label, dates, options, index, accent = false }) {
  return `<g class="rise"${delay(options, 200 + index * 150)}>
    <text x="${x}" y="${accent ? 113 : 103}" class="${accent ? 'streak-big' : 'big'}" text-anchor="middle">${escapeXml(value)}</text>
    <text x="${x}" y="${accent ? 162 : 135}" class="${accent ? 'label-accent' : 'label'}" text-anchor="middle">${escapeXml(label)}</text>
    <text x="${x}" y="${accent ? 179 : 155}" class="dates" text-anchor="middle">${escapeXml(dates)}</text>
  </g>`;
}

/** Current and longest contribution streak and the year's total, streak-stats style. */
export function renderStreak(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Contribution Streak`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const today = a.days.at(-1)?.date ?? null;
  const { current, longest } = a.streaks;
  const currentDates = currentRange(a.days, current);
  const cx = WIDTH / 2;
  const ring = `<g class="fade"${delay(options, 100)}>
      ${glassDisc({ cx, cy: 98, r: 33 })}
      <circle cx="${cx}" cy="98" r="38" class="ring"/>
      ${ringLight({ cx, cy: 98, r: 38, stroke: 6 })}
      <circle cx="${cx}" cy="60" r="11" class="flame-gap"/>
      <g class="flame">${icon(FLAME_PATH, { x: cx - 9, y: 50, size: 18, className: 'icon-accent' })}</g>
    </g>`;
  const body = `
    <line x1="165" y1="58" x2="165" y2="178" class="divider"/>
    <line x1="330" y1="58" x2="330" y2="178" class="divider"/>
    ${column({ x: 82, value: formatExact(a.total), label: 'Total contributions', dates: a.days.length ? range([a.days[0].date, today], today) : '', options, index: 0 })}
    ${ring}
    ${column({ x: cx, value: formatExact(current), label: 'Current streak', dates: currentDates ? range(currentDates, today) : 'Start one today', options, index: 1, accent: true })}
    ${column({ x: 412, value: formatExact(longest.length), label: 'Longest streak', dates: longest.length ? range([longest.start, longest.end], today) : '—', options, index: 2 })}`;

  const css = `
    .big{font-size:28px;font-weight:800;fill:var(--title)}
    .streak-big{font-size:28px;font-weight:800;fill:var(--accent)}
    .label{font-size:13px;font-weight:600;fill:var(--text)}
    .label-accent{font-size:13px;font-weight:700;fill:var(--accent)}
    .dates{font-size:11px;fill:var(--muted)}
    .divider{stroke:var(--track);stroke-width:1}
    .ring{fill:none;stroke:var(--accent);stroke-width:6}
    .flame-gap{fill:var(--bg)}
    ${
      options.animate
        ? `@keyframes ags-flicker{0%,100%{transform:scale(1)}50%{transform:scale(1.15,1.08)}}
    .flame{transform-box:fill-box;transform-origin:center bottom;animation:ags-flicker 1.6s ease-in-out 1s infinite}
    @media (prefers-reduced-motion: reduce){.flame{animation:none}}`
        : ''
    }`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body,
    css,
    label: `${stats.name}: ${formatExact(a.total)} contributions in the last year, current streak ${current} days, longest streak ${longest.length} days`,
  });
}
