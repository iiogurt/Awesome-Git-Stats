import {
  delay,
  escapeXml,
  formatCount,
  formatExact,
  measureText,
  possessive,
  renderFrame,
  renderNoActivity,
  truncate,
} from './common.js';
import { cover, glossBar, orb, track } from './materials.js';

const WIDTH = 820;
const HEIGHT = 470;
const LEFT = 25;
const RIGHT = WIDTH - 25;
const TOP = 50;

// The wheel: centred in the left part of the card, below the title.
const SPLIT = 480;
const CX = 240;
const CY = 256;
const R0 = 104; // where the bars start
const R_MAX = 62; // length of the busiest day's bar
const MIN_BAR = 4;
const IDLE_BAR = 1.5;

// The right column.
const COL = 480;
const COL_WIDTH = RIGHT - COL;
const HALF = 145;
const COL2 = RIGHT - HALF;

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const r1 = (n) => Math.round(n * 10) / 10;

function plural(n, word) {
  return `${formatExact(n)} ${word}${n === 1 ? '' : 's'}`;
}

const monthName = (date) => MONTHS[Number(date.slice(5, 7)) - 1];
const shortDate = (date) => `${monthName(date)} ${Number(date.slice(8, 10))}`;

// Monospace themes draw every glyph alike, about .55em with the frame's tighter spacing.
const MONO_EM = 0.56;

/** Text width estimate; monospace themes count characters instead. */
function textWidth(text, size, weight, mono) {
  return mono ? [...String(text)].length * MONO_EM * size : measureText(text, size, weight);
}

/** Truncate text with an ellipsis to fit `width` pixels. */
function fit(text, width, size, weight, mono) {
  if (!mono) return truncate(text, width, size, weight);
  const chars = [...String(text)];
  const max = Math.floor(width / (MONO_EM * size));
  return chars.length <= max ? chars.join('') : `${chars.slice(0, Math.max(1, max - 1)).join('')}…`;
}

const angleOf = (i, n) => (i / n) * Math.PI * 2 - Math.PI / 2;

function barLength(count, max) {
  return count > 0 ? MIN_BAR + (count / max) * R_MAX : IDLE_BAR;
}

/** One radial line per day, clockwise from the top, classed by level. */
function dayBars(activity, bestIndex) {
  const { days, levels } = activity;
  const n = days.length;
  const max = Math.max(...days.map((d) => d.count), 1);
  return days
    .map((day, i) => {
      const t = angleOf(i, n);
      const c = Math.cos(t);
      const s = Math.sin(t);
      const end = R0 + barLength(day.count, max);
      const cls = i === bestIndex ? 'wb' : `w${levels[i] ?? 0}`;
      return `<line x1="${r1(CX + c * R0)}" y1="${r1(CY + s * R0)}" x2="${r1(CX + c * end)}" y2="${r1(CY + s * end)}" class="${cls}"/>`;
    })
    .join('');
}

/**
 * Month names inside the ring, each at the middle of its days. A month cut in
 * two by the window (the same month a year apart) is named only where it has
 * more days, and slivers under a week are left out.
 */
function monthLabels(days) {
  const n = days.length;
  const groups = [];
  days.forEach((day, i) => {
    const key = day.date.slice(0, 7);
    if (groups.at(-1)?.key !== key) groups.push({ key, first: i, last: i });
    else groups.at(-1).last = i;
  });
  const size = (g) => g.last - g.first + 1;
  const first = groups[0];
  const last = groups.at(-1);
  if (groups.length > 1 && first.key.slice(5) === last.key.slice(5)) {
    groups.splice(size(first) >= size(last) ? -1 : 0, 1);
  }
  const radius = R0 - 15;
  return groups
    .filter((g) => size(g) >= 7)
    .map((g) => {
      const t = angleOf((g.first + g.last) / 2, n);
      const x = r1(CX + Math.cos(t) * radius);
      const y = r1(CY + Math.sin(t) * radius + 3.5);
      return `<text x="${x}" y="${y}" class="wm" text-anchor="middle">${MONTHS[Number(g.key.slice(5)) - 1]}</text>`;
    })
    .join('');
}

/** The year's total in the middle of the wheel, scaled down if it is long. */
function centre(activity, mono) {
  const total = formatExact(activity.total);
  const inner = (R0 - 33) * 2;
  const size = Math.min(34, r1(34 * (inner / textWidth(total, 34, 800, mono))));
  const average = activity.average;
  const perDay = `${average >= 10 ? formatExact(average) : r1(average)} a day`;
  return `<text x="${CX}" y="${CY + 4}" class="wt" style="font-size:${size}px" text-anchor="middle">${total}</text>
    <text x="${CX}" y="${CY + 22}" class="wl" text-anchor="middle">${activity.total === 1 ? 'contribution' : 'contributions'}</text>
    <text x="${CX}" y="${CY + 38}" class="wa" text-anchor="middle">${escapeXml(perDay)}</text>`;
}

/**
 * Where the best day's call-out goes: a short leader along the bar's direction,
 * then three short lines anchored away from the wheel (start on the right,
 * end on the left, middle at the top and bottom) and clamped inside the left
 * part of the card whatever the angle. Returns the SVG and the label's box.
 */
export function bestDayLabel(activity, bestIndex, { mono = false } = {}) {
  const { days } = activity;
  const n = days.length;
  const best = days[bestIndex];
  const max = Math.max(...days.map((d) => d.count), 1);
  const t = angleOf(bestIndex, n);
  const c = Math.cos(t);
  const s = Math.sin(t);
  const tip = R0 + barLength(best.count, max);
  const from = tip + 3;
  let to = tip + 11;
  const at = tip + 15;
  // Three short lines rather than one long one, so the label fits beside the wheel.
  const lines = [
    ['Best day', 10, 400, 'wbl'],
    [formatExact(best.count), 13, 700, 'wbv'],
    [shortDate(best.date), 10, 400, 'wbd'],
  ];
  const width = Math.max(
    ...lines.map(([text, size, weight]) => textWidth(text, size, weight, mono)),
  );
  const height = 38; // cap of the first line to baseline of the last
  const baselines = [8, 23, 36];

  const anchor = c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle';
  let left = CX + c * at;
  if (anchor === 'end') left -= width;
  else if (anchor === 'middle') left -= width / 2;
  let top = CY + s * at;
  if (s < -0.35) top -= height;
  else if (s <= 0.35) top -= height / 2;

  left = Math.min(Math.max(left, LEFT), SPLIT - 10 - width);
  top = Math.min(Math.max(top, TOP), HEIGHT - 12 - height);
  const x = anchor === 'end' ? left + width : anchor === 'middle' ? left + width / 2 : left;
  // A label pushed back towards the wheel shortens the leader rather than covering it.
  if (anchor === 'start') to = Math.min(to, (left - 4 - CX) / c);
  if (anchor === 'end') to = Math.min(to, (left + width + 4 - CX) / c);
  const leader =
    to > from
      ? `<line x1="${r1(CX + c * from)}" y1="${r1(CY + s * from)}" x2="${r1(CX + c * to)}" y2="${r1(CY + s * to)}" class="wlead"/>`
      : '';
  const text = lines
    .map(
      ([line, , , cls], i) =>
        `<text x="${r1(x)}" y="${r1(top + baselines[i])}" class="${cls}" text-anchor="${anchor}">${escapeXml(line)}</text>`,
    )
    .join('');
  const svg = `${leader}${text}`;
  return { svg, box: { x: left, y: top, width, height } };
}

function tiles(stats, options, mono) {
  const a = stats.activity;
  const items = [
    ['Stars earned', formatCount(stats.totalStars)],
    ['Current streak', plural(a.streaks.current, 'day')],
    ['Longest streak', plural(a.streaks.longest.length, 'day')],
    a.pullRequests != null
      ? ['Pull requests', formatCount(a.pullRequests)]
      : ['Forks', formatCount(stats.totalForks)],
    stats.followers != null
      ? ['Followers', formatCount(stats.followers)]
      : ['Public repos', formatCount(stats.repoCount)],
    ['Active days', formatExact(a.activeDays)],
  ];
  const width = COL_WIDTH / 3;
  return items
    .map(([label, value], i) => {
      const x = r1(COL + (i % 3) * width);
      const y = 78 + Math.floor(i / 3) * 60;
      return `<g class="rise"${delay(options, 150 + i * 60)}>
      <text x="${x}" y="${y}" class="tl">${escapeXml(fit(label, width - 8, 10.5, 400, mono))}</text>
      <text x="${x}" y="${y + 26}" class="tv">${escapeXml(fit(value, width - 8, 22, 700, mono))}</text>
    </g>`;
    })
    .join('');
}

function topRepos(stats, options, mono) {
  const repos = stats.topRepos.filter((repo) => repo.stars > 0).slice(0, 4);
  const rows = repos.length
    ? repos
        .map((repo, i) => {
          const y = 236 + i * 24;
          const stars = formatCount(repo.stars);
          const nameWidth = HALF - 14 - textWidth(stars, 12, 700, mono) - 10;
          return `<g class="rise"${delay(options, 450 + i * 70)}>
        ${orb({ cx: COL + 4, cy: y - 4, r: 4, fill: repo.languageColor ?? 'accent' })}
        <text x="${COL + 14}" y="${y}" class="rl">${escapeXml(fit(repo.name, nameWidth, 12, 400, mono))}</text>
        <text x="${COL + HALF}" y="${y}" class="rs" text-anchor="end">${stars}</text>
      </g>`;
        })
        .join('')
    : `<text x="${COL}" y="236" class="wm">No starred repositories yet</text>`;
  return `<text x="${COL}" y="212" class="sec">Most starred</text>${rows}`;
}

function mix(activity, options) {
  const rows = [
    ['Commits', activity.mix.commits],
    ['Pull requests', activity.mix.pullRequests],
    ['Reviews', activity.mix.reviews],
    ['Issues', activity.mix.issues],
  ];
  const max = Math.max(...rows.map(([, n]) => n), 1);
  const body = rows
    .map(([label, n], i) => {
      const y = 236 + i * 24;
      return `<text x="${COL2}" y="${y}" class="rl">${label}</text>
      <text x="${RIGHT}" y="${y}" class="rv" text-anchor="end">${formatExact(n)}</text>
      ${track({ x: COL2, y: y + 5, width: HALF, height: 3 })}
      ${n > 0 ? glossBar({ x: COL2, y: y + 5, width: r1(Math.max(4, (n / max) * HALF)), height: 3, fill: `mix${i}`, attrs: ` class="grow"${delay(options, 500 + i * 80)}` }) : ''}`;
    })
    .join('');
  return `<text x="${COL2}" y="212" class="sec">The year in work</text>${body}`;
}

function languages(stats, options, mono) {
  const top = 366;
  const langs = stats.languages;
  let x = COL;
  const segments = langs
    .map((lang) => {
      const w = lang.share * COL_WIDTH;
      const rect = `<rect x="${r1(x)}" y="${top}" width="${r1(w)}" height="8" fill="${lang.color}"/>`;
      x += w;
      return rect;
    })
    .join('');
  // Legend on up to two rows; what doesn't fit is left out.
  let lx = COL;
  let row = 0;
  const legend = langs
    .map((lang) => {
      const text = `${lang.name} ${Math.round(lang.share * 100)}%`;
      const w = textWidth(text, 11, 400, mono) + 12;
      if (lx + w > RIGHT && lx > COL) {
        row += 1;
        lx = COL;
      }
      if (row > 1 || lx + w > RIGHT + 4) return '';
      const y = top + 26 + row * 18;
      const item = `${orb({ cx: lx + 4, cy: y - 4, r: 4, fill: lang.color })}
        <text x="${r1(lx + 12)}" y="${y}" class="lg">${escapeXml(text)}</text>`;
      lx += w + 14;
      return item;
    })
    .join('');
  return `<text x="${COL}" y="${top - 12}" class="sec">Stars by language</text>
    <clipPath id="ags-wheel-langs"><rect x="${COL}" y="${top}" width="${COL_WIDTH}" height="8" rx="4"/></clipPath>
    ${track({ x: COL, y: top, width: COL_WIDTH, height: 8 })}
    ${
      langs.length
        ? `<g clip-path="url(#ags-wheel-langs)"><g class="grow"${delay(options, 700)}>${segments}${cover({ x: COL, y: top, width: COL_WIDTH, height: 8 }, 'bar')}</g></g>${legend}`
        : `<text x="${COL}" y="${top + 26}" class="wm">No languages yet</text>`
    }`;
}

function footer(stats, mono) {
  const a = stats.activity;
  const parts = [
    a.joinedYear != null ? `On GitHub since ${a.joinedYear}` : '',
    plural(stats.repoCount, 'public repo'),
    a.pullRequests != null ? `${formatCount(stats.totalForks)} forks` : '',
  ].filter(Boolean);
  const text = fit(parts.join(' · '), COL_WIDTH, 11, 400, mono);
  return `<text x="${COL}" y="452" class="wm">${escapeXml(text)}</text>`;
}

/** The subtitle: the window the wheel covers, if it fits beside the title. */
function subtitle(days, title, options, mono) {
  // Without a title, the content moves up into the subtitle's place.
  if (!days.length || options.hideTitle) return '';
  const from = days[0].date;
  const to = days.at(-1).date;
  const range = `${monthName(from)} ${from.slice(0, 4)} – ${monthName(to)} ${to.slice(0, 4)}`;
  const room = RIGHT - LEFT - textWidth(title, 18, 600, mono) - 24;
  const text = [`${range} · one bar per day`, range].find(
    (t) => textWidth(t, 11.5, 400, mono) <= room,
  );
  return text ? `<text x="${RIGHT}" y="35" class="sub fade" text-anchor="end">${text}</text>` : '';
}

/**
 * A year wheel: every day of the last year as a radial bar around the year's
 * total, with headline numbers, top repositories, the contribution mix and
 * stars by language beside it.
 */
export function renderWheel(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Year on GitHub`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const mono = options.theme.font === 'mono';
  const days = a.days;
  // A year without contributions has no best day to call out.
  const best = a.best?.count > 0 ? days.findIndex((d) => d.date === a.best.date) : -1;

  const body = `
  ${subtitle(days, title, options, mono)}
  <g class="fade"${delay(options, 100)}>
    <circle cx="${CX}" cy="${CY}" r="${R0 - 4}" class="wring"/>
    <g class="wheel">${dayBars(a, best)}</g>
    ${monthLabels(days)}
  </g>
  <g class="rise"${delay(options, 300)}>${centre(a, mono)}</g>
  ${best >= 0 ? `<g class="fade"${delay(options, 700)}>${bestDayLabel(a, best, { mono }).svg}</g>` : ''}
  ${tiles(stats, options, mono)}
  <line x1="${COL}" y1="186" x2="${RIGHT}" y2="186" class="rule"/>
  ${topRepos(stats, options, mono)}
  ${mix(a, options)}
  <line x1="${COL}" y1="330" x2="${RIGHT}" y2="330" class="rule"/>
  ${languages(stats, options, mono)}
  ${footer(stats, mono)}`;

  const css = `
    .sub{font-size:11.5px;fill:var(--muted)}
    .wring{fill:none;stroke:var(--track);stroke-width:1}
    .wheel line{stroke-width:1.5;stroke-linecap:round}
    .w0{stroke:var(--track)}
    .w1,.w2,.w3,.w4{stroke:var(--accent)}
    .w1{stroke-opacity:.35}.w2{stroke-opacity:.55}.w3{stroke-opacity:.78}
    .wb{stroke:var(--title);stroke-width:2.2px}
    .wm{font-size:10px;fill:var(--muted)}
    .wt{font-weight:800;fill:var(--title)}
    .wl{font-size:11.5px;fill:var(--muted)}
    .wa{font-size:11px;fill:var(--accent)}
    .wlead{stroke:var(--title);stroke-width:1;stroke-opacity:.7}
    .wbl{font-size:10px;fill:var(--muted)}
    .wbv{font-size:13px;font-weight:700;fill:var(--title)}
    .wbd{font-size:10px;fill:var(--text)}
    .tl{font-size:${mono ? 9.5 : 10.5}px;fill:var(--muted)}
    .tv{font-size:22px;font-weight:700;fill:var(--title)}
    .rule{stroke:var(--track);stroke-width:1}
    .sec{font-size:12.5px;font-weight:600;fill:var(--text)}
    .rl{font-size:12px;fill:var(--text)}
    .rs{font-size:12px;font-weight:700;fill:var(--accent)}
    .rv{font-size:12px;font-weight:700;fill:var(--title)}
    .lg{font-size:11px;fill:var(--text)}
    .mix0,.mix1,.mix2,.mix3{fill:var(--accent)}
    .mix1{fill-opacity:.75}.mix2{fill-opacity:.55}.mix3{fill-opacity:.38}`;

  const label =
    `${stats.name}: ${formatExact(a.total)} contributions in the last year` +
    (best >= 0
      ? `, best day ${formatExact(days[best].count)} on ${shortDate(days[best].date)}`
      : '') +
    `, ${formatExact(stats.totalStars)} stars`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body,
    css,
    label,
  });
}
