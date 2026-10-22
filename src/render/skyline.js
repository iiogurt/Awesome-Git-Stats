import {
  delay,
  escapeXml,
  formatExact,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';

const WIDTH = 600;
const HEIGHT = 330;
// Screen vectors of one week (to the right, sloping down) and one weekday (away from the
// viewer, up and to the right), and the tallest tower: a three-quarter view of the year.
const WEEK = [7.4, 2.2];
const DAY = [4.2, -3.6];
const MAX_HEIGHT = 90;

const r1 = (n) => Math.round(n * 10) / 10;
const point = ([x, y], dy = 0) => `${r1(x)} ${r1(y - dy)}`;

// One day: a tile on the floor, or a tower with a lit roof and the sides that face the viewer.
function tower(origin, week, day, height, level) {
  const at = (w, d) => [origin[0] + w * WEEK[0] + d * DAY[0], origin[1] + w * WEEK[1] + d * DAY[1]];
  // The tile is a little smaller than its cell so neighbours keep a thin gap.
  const base = [
    at(week + 0.08, day + 0.08),
    at(week + 0.92, day + 0.08),
    at(week + 0.92, day + 0.92),
    at(week + 0.08, day + 0.92),
  ];
  const roof = `M${base.map((p) => point(p, height)).join('L')}Z`;
  if (!height) return `<path d="${roof}" class="sk0"/>`;
  // A side shows when its outward normal points down the screen, towards the viewer.
  const turn = base.reduce((sum, [x, y], i) => {
    const [nx, ny] = base[(i + 1) % 4];
    return sum + x * ny - nx * y;
  }, 0);
  let sides = '';
  base.forEach((a, i) => {
    const b = base[(i + 1) % 4];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const [nx, ny] = turn > 0 ? [dy, -dx] : [-dy, dx];
    if (ny <= 0) return;
    const shade = nx < 0 ? 'skl' : 'skr';
    sides += `<path d="M${point(a)}L${point(b)}L${point(b, height)}L${point(a, height)}Z" class="${shade}${level}"/>`;
  });
  return `${sides}<path d="${roof}" class="skt${level}"/>`;
}

/**
 * The last year of contributions as a 3D city: one tower per day, its height
 * by the day's contributions, weeks running to the right.
 */
export function renderSkyline(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} GitHub Skyline`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const days = a.days;
  const offset = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
  const weeks = Math.ceil((days.length + offset) / 7);
  const max = Math.max(...days.map((d) => d.count), 1);
  // Fit the floor's bounding box into the card, below the title and above the footer.
  const corners = [
    [0, 0],
    [weeks, 0],
    [0, 7],
    [weeks, 7],
  ].map(([w, d]) => [w * WEEK[0] + d * DAY[0], w * WEEK[1] + d * DAY[1]]);
  const minX = Math.min(...corners.map((c) => c[0]));
  const maxX = Math.max(...corners.map((c) => c[0]));
  const minY = Math.min(...corners.map((c) => c[1]));
  const origin = [(WIDTH - (maxX - minX)) / 2 - minX, 58 + MAX_HEIGHT - minY];

  // Paint back to front: the further up the screen a tile is, the further away.
  const towers = days
    .map((day, i) => {
      const week = Math.floor((i + offset) / 7);
      const weekday = (i + offset) % 7;
      const height = day.count ? Math.max(3, Math.sqrt(day.count / max) * MAX_HEIGHT) : 0;
      const depth = (week + 0.5) * WEEK[1] + (weekday + 0.5) * DAY[1];
      return { depth, x: week, svg: tower(origin, week, weekday, height, a.levels[i]) };
    })
    .sort((p, q) => p.depth - q.depth || p.x - q.x);
  // The city rises in waves from the back, a few towers at a time.
  const chunk = 12;
  let city = '';
  for (let i = 0; i < towers.length; i += chunk) {
    const group = towers
      .slice(i, i + chunk)
      .map((t) => t.svg)
      .join('');
    city += `<g class="rise"${delay(options, 100 + (i / chunk) * 35)}>${group}</g>`;
  }

  const first = days[0]?.date ?? '';
  const last = days.at(-1)?.date ?? '';
  const footer = `${formatExact(a.total)} contributions · ${first.slice(0, 7)} to ${last.slice(0, 7)}`;
  const best = a.best ? `tallest tower: ${formatExact(a.best.count)} on ${a.best.date}` : '';

  // Opaque shades, so towers hide the ones behind them: the accent mixed into the
  // background by level, and darker sides. Old browsers fall back to the plain accent.
  const shades = [1, 2, 3, 4]
    .map((level) => {
      const color = `color-mix(in srgb,var(--accent) ${[45, 65, 85, 100][level - 1]}%,var(--bg))`;
      const fill = (shade) =>
        `fill:var(--accent);fill:${shade === 100 ? color : `color-mix(in srgb,${color} ${shade}%,#000)`}`;
      return `.skt${level}{${fill(100)}}.skl${level}{${fill(80)}}.skr${level}{${fill(62)}}`;
    })
    .join('');
  const css = `
    .sk0{fill:var(--track)}
    ${shades}
    .footer{font-size:12px;font-weight:600;fill:var(--text)}
    .axis{font-size:10.5px;fill:var(--muted)}`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body: `${city}
      <text x="25" y="${HEIGHT - 22}" class="footer fade"${delay(options, 1300)}>${escapeXml(footer)}</text>
      <text x="${WIDTH - 25}" y="${HEIGHT - 22}" class="axis fade"${delay(options, 1400)} text-anchor="end">${escapeXml(best)}</text>`,
    css,
    label: `${stats.name}'s contributions as a 3D skyline: ${formatExact(a.total)} in the last year`,
  });
}
