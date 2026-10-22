import {
  CALENDAR_PATH,
  FLAME_PATH,
  FORK_PATH,
  PEOPLE_PATH,
  PR_PATH,
  REPO_PATH,
  STAR_PATH,
  TROPHY_PATH,
  delay,
  escapeXml,
  formatCount,
  formatExact,
  icon,
  measureText,
  possessive,
  renderFrame,
  truncate,
} from './common.js';
import { glassPanel, glossBar, gridGloss, gridSheen, orb, track } from './materials.js';

const WIDTH = 820;
const HEIGHT = 470;
const LEFT = 25;
const RIGHT = WIDTH - 25;

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const r1 = (n) => Math.round(n * 10) / 10;

// Exact up to 9,999 so mid-sized numbers stay precise, compact beyond that.
const count = (n) => (n < 10000 ? formatExact(n) : formatCount(n));

function plural(n, word) {
  return `${formatExact(n)} ${word}${n === 1 ? '' : 's'}`;
}

function tiles(stats, options) {
  const a = stats.activity;
  const items = a
    ? [
        { path: STAR_PATH, label: 'Stars earned', value: formatCount(stats.totalStars) },
        {
          path: CALENDAR_PATH,
          label: 'Contributions',
          value: count(a.total),
          note: 'last 12 months',
        },
        { path: FLAME_PATH, label: 'Current streak', value: plural(a.streaks.current, 'day') },
        {
          path: TROPHY_PATH,
          label: 'Longest streak',
          value: plural(a.streaks.longest.length, 'day'),
        },
        {
          path: PR_PATH,
          label: 'Pull requests',
          value: a.pullRequests != null ? count(a.pullRequests) : '—',
          note: a.pullRequests != null ? 'all time' : '',
        },
        {
          path: PEOPLE_PATH,
          label: 'Followers',
          value: stats.followers != null ? formatCount(stats.followers) : '—',
        },
      ]
    : // Without contribution data, show what the repositories tell us instead.
      [
        { path: STAR_PATH, label: 'Stars earned', value: formatCount(stats.totalStars) },
        { path: FORK_PATH, label: 'Forks', value: formatCount(stats.totalForks) },
        { path: REPO_PATH, label: 'Public repos', value: formatCount(stats.repoCount) },
        { path: TROPHY_PATH, label: 'Starred repos', value: formatCount(stats.starredRepoCount) },
        { path: CALENDAR_PATH, label: 'Languages', value: formatCount(stats.languageCount ?? 0) },
        stats.followers != null
          ? { path: PEOPLE_PATH, label: 'Followers', value: formatCount(stats.followers) }
          : {
              path: STAR_PATH,
              label: 'Top repo',
              value: formatCount(stats.topRepos[0]?.stars ?? 0),
            },
      ];
  const gap = 10;
  const width = (RIGHT - LEFT - gap * (items.length - 1)) / items.length;
  return items
    .map((item, i) => {
      const x = r1(LEFT + i * (width + gap));
      return `<g class="rise"${delay(options, 80 + i * 70)}>
      ${glassPanel({ x, y: 52, width, height: 60, rx: 9, base: 'tile' })}
      ${icon(item.path, { x: r1(x + width - 26), y: 62, size: 14, className: 'icon-accent' })}
      <text x="${r1(x + 12)}" y="70" class="tile-label">${escapeXml(item.label)}</text>
      <text x="${r1(x + 12)}" y="95" class="tile-value">${escapeXml(truncate(item.value, width - 20, 19, 700))}</text>
      ${item.note ? `<text x="${r1(x + 12)}" y="107" class="tile-note">${escapeXml(item.note)}</text>` : ''}
    </g>`;
    })
    .join('');
}

function heatmap(activity, options) {
  const { days, levels } = activity;
  const cell = 9;
  const step = 11;
  const top = 160;
  const offset = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
  const columns = new Map();
  days.forEach((day, i) => {
    const index = i + offset;
    const col = Math.floor(index / 7);
    const row = index % 7;
    if (!columns.has(col)) columns.set(col, { first: row, last: row, cells: [] });
    const column = columns.get(col);
    column.last = row;
    column.cells.push(
      `<rect x="${LEFT + col * step}" y="${top + row * step}" width="${cell}" height="${cell}" rx="2" class="hm${levels[i]}"/>`,
    );
  });

  let lastLabel = -3;
  let previousMonth = null;
  let months = '';
  days.forEach((day, i) => {
    const col = Math.floor((i + offset) / 7);
    const month = Number(day.date.slice(5, 7)) - 1;
    if (month !== previousMonth && col - lastLabel >= 3 && col < 52) {
      months += `<text x="${LEFT + col * step}" y="${top - 6}" class="axis">${MONTHS[month]}</text>`;
      lastLabel = col;
    }
    previousMonth = month;
  });

  const width = columns.size * step - (step - cell);
  // Each column carries its own strip of gloss, so it fades in with its cells.
  const cols = [...columns.entries()]
    .map(([col, { first, last, cells }]) => {
      const gloss = gridGloss({
        id: 'ags-hm-sheen',
        x: LEFT + col * step,
        y: top + first * step,
        width: cell,
        height: (last - first) * step + cell,
      });
      return `<g class="fade"${delay(options, 250 + col * 12)}>${cells.join('')}${gloss}</g>`;
    })
    .join('');
  const legendX = LEFT + width;
  const legend = [4, 3, 2, 1, 0]
    .map(
      (level, i) =>
        `<rect x="${legendX - 30 - (i + 1) * step}" y="${top + 7 * step + 6}" width="${cell}" height="${cell}" rx="2" class="hm${level}"/>`,
    )
    .join('');
  const best = activity.best
    ? `Best day ${formatExact(activity.best.count)} · ${r1(activity.average)} a day · ${formatExact(activity.activeDays)} active days`
    : '';
  return {
    width,
    svg: `<text x="${LEFT}" y="138" class="section">Contributions in the last year</text>
    <text x="${legendX}" y="138" class="axis" text-anchor="end">${escapeXml(best)}</text>
    ${gridSheen({ id: 'ags-hm-sheen', x: LEFT, y: top, cell, step })}${months}${cols}
    <text x="${legendX - 30 - 5 * step - 6}" y="${top + 7 * step + 14}" class="axis" text-anchor="end">Less</text>
    ${legend}
    <text x="${legendX}" y="${top + 7 * step + 14}" class="axis" text-anchor="end">More</text>`,
  };
}

function weekdays(activity, options, x0) {
  const totals = activity.weekdays;
  const max = Math.max(...totals, 1);
  const width = RIGHT - x0;
  const slot = width / 7;
  const base = 232;
  const peak = totals.indexOf(Math.max(...totals));
  const bars = totals
    .map((total, i) => {
      const h = Math.max(3, (total / max) * 62);
      const x = r1(x0 + i * slot + (slot - 14) / 2);
      return `${glossBar({ x, y: base - h, width: 14, height: h, rx: 3, upright: true, glow: i === peak, fill: `bar${i === peak ? ' bar-peak' : ''}`, attrs: ` class="growy"${delay(options, 400 + i * 60)}` })}
      <text x="${r1(x + 7)}" y="${base + 14}" class="axis" text-anchor="middle">${WEEKDAYS[i]}</text>`;
    })
    .join('');
  return `<text x="${x0}" y="138" class="section">Weekly rhythm</text>
    ${glassPanel({ x: x0, y: base - 66, width, height: 66, rx: 4, base: 'ghost' })}
    ${bars}`;
}

function monthly(activity, options) {
  const months = activity.months;
  const x0 = LEFT;
  const width = 280;
  const top = 296;
  const height = 64;
  const max = Math.max(...months.map((m) => m.total), 1);
  const stepX = months.length > 1 ? width / (months.length - 1) : 0;
  const points = months.map((m, i) => [
    r1(x0 + i * stepX),
    r1(top + height - (m.total / max) * height),
  ]);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  const area = `${line}L${points.at(-1)[0]} ${top + height}L${x0} ${top + height}Z`;
  const peakIndex = months.findIndex((m) => m.total === max);
  const [px, py] = points[peakIndex];
  const labels = months
    .map(
      (m, i) =>
        `<text x="${points[i][0]}" y="${top + height + 16}" class="axis" text-anchor="middle">${MONTHS[Number(m.month.slice(5, 7)) - 1][0]}</text>`,
    )
    .join('');
  const dots = points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" class="dot"/>`).join('');
  return `<text x="${x0}" y="282" class="section">Monthly activity</text>
    <path d="${area}" fill="url(#ags-area)"/>
    <path d="${line}" class="spark draw" pathLength="1"/>
    <g class="fade"${delay(options, 900)}>${dots}
      <text x="${px}" y="${py - 8}" class="peak" text-anchor="middle">${formatCount(max)}</text>
    </g>
    ${labels}`;
}

function mix(activity, options) {
  const x0 = 345;
  const width = 200;
  const rows = [
    ['Commits', activity.mix.commits],
    ['Pull requests', activity.mix.pullRequests],
    ['Code reviews', activity.mix.reviews],
    ['Issues', activity.mix.issues],
  ];
  const max = Math.max(...rows.map(([, n]) => n), 1);
  const body = rows
    .map(([label, n], i) => {
      const y = 302 + i * 24;
      return `<text x="${x0}" y="${y}" class="row-label">${label}</text>
      <text x="${x0 + width}" y="${y}" class="row-value" text-anchor="end">${formatExact(n)}</text>
      ${track({ x: x0, y: y + 5, width, height: 6 })}
      ${glossBar({ x: x0, y: y + 5, width: Math.max(6, (n / max) * width), height: 6, fill: `mix${i}`, attrs: ` class="grow"${delay(options, 500 + i * 90)}` })}`;
    })
    .join('');
  const footer = [
    activity.contributedTo != null
      ? `${formatExact(activity.contributedTo)} repos contributed to`
      : '',
    activity.privateContributions ? `${formatExact(activity.privateContributions)} private` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return `<text x="${x0}" y="282" class="section">Contribution mix</text>${body}
    <text x="${x0}" y="${302 + 4 * 24 + 2}" class="axis">${escapeXml(footer)}</text>`;
}

function topRepos(stats, options, x0 = 575) {
  const width = RIGHT - x0;
  const repos = stats.topRepos.filter((repo) => repo.stars > 0).slice(0, 4);
  const max = repos[0]?.stars ?? 1;
  const body = repos.length
    ? repos
        .map((repo, i) => {
          const y = 302 + i * 24;
          const count = formatCount(repo.stars);
          const nameWidth = width - measureText(count, 12, 700) - 24;
          return `<text x="${x0}" y="${y}" class="row-label">${escapeXml(truncate(repo.name, nameWidth, 12, 600))}</text>
        ${icon(STAR_PATH, { x: r1(x0 + width - measureText(count, 12, 700) - 15), y: y - 10, size: 11, className: 'icon-accent' })}
        <text x="${RIGHT}" y="${y}" class="row-value" text-anchor="end">${count}</text>
        ${track({ x: x0, y: y + 5, width, height: 6 })}
        ${glossBar({ x: x0, y: y + 5, width: Math.max(6, (repo.stars / max) * width), height: 6, fill: repo.languageColor ?? 'accent', attrs: ` class="grow"${delay(options, 600 + i * 90)}` })}`;
        })
        .join('')
    : `<text x="${x0}" y="310" class="axis">No starred repositories yet ✨</text>`;
  return `<text x="${x0}" y="282" class="section">Most starred</text>${body}
    <text x="${x0}" y="${302 + 4 * 24 + 2}" class="axis">${plural(stats.repoCount, 'public repo')} · ${formatCount(stats.totalForks)} forks</text>`;
}

function languages(stats, options) {
  const top = 428;
  const width = RIGHT - LEFT;
  let x = LEFT;
  const segments = stats.languages
    .map((lang) => {
      const w = lang.share * width;
      const rect = `<rect x="${r1(x)}" y="${top}" width="${r1(w)}" height="8" fill="${lang.color}"/>`;
      x += w;
      return rect;
    })
    .join('');
  let lx = LEFT;
  const legend = stats.languages
    .map((lang) => {
      const text = `${lang.name} ${Math.round(lang.share * 100)}%`;
      const item = `${orb({ cx: lx + 4, cy: top + 22, r: 4, fill: lang.color })}
        <text x="${r1(lx + 12)}" y="${top + 26}" class="axis-strong">${escapeXml(text)}</text>`;
      lx += measureText(text, 11) * 0.92 + 28;
      return lx < RIGHT + 20 ? item : '';
    })
    .join('');
  return `<text x="${LEFT}" y="${top - 8}" class="section">Stars by language</text>
    <clipPath id="ags-langs"><rect x="${LEFT}" y="${top}" width="${width}" height="8" rx="4"/></clipPath>
    ${track({ x: LEFT, y: top, width, height: 8 })}
    ${stats.languages.length ? `<g clip-path="url(#ags-langs)"><g class="grow"${delay(options, 700)}>${segments}<rect x="${LEFT}" y="${top}" width="${width}" height="8" fill="url(#ags-sheen)"/></g></g>${legend}` : ''}`;
}

function emptyState(stats) {
  const why =
    stats.type === 'Organization'
      ? 'Contribution activity is only available for user accounts.'
      : 'Contribution activity needs a GitHub token. The Action provides one automatically.';
  return `${glassPanel({ x: LEFT, y: 128, width: RIGHT - LEFT, height: 122, rx: 10, base: 'ghost' })}
    <text x="${WIDTH / 2}" y="194" class="row-label" text-anchor="middle">${escapeXml(why)}</text>`;
}

export function renderDashboard(stats, options) {
  const a = stats.activity;
  const title = options.customTitle ?? `${possessive(stats.name)} GitHub in Numbers`;
  const since =
    a?.joinedYear != null
      ? `On GitHub since ${a.joinedYear}${a.years ? ` · ${plural(a.years, 'year')}` : ''}`
      : '';

  let middle;
  if (a) {
    const map = heatmap(a, options);
    middle = `${map.svg}
      ${weekdays(a, options, LEFT + map.width + 30)}
      ${monthly(a, options)}
      ${mix(a, options)}`;
  } else {
    middle = emptyState(stats);
  }

  const body = `
  <text x="${RIGHT}" y="35" class="since fade" text-anchor="end">${escapeXml(since)}</text>
  ${tiles(stats, options)}
  ${middle}
  ${a ? topRepos(stats, options) : topRepos(stats, options, LEFT)}
  ${languages(stats, options)}`;

  const css = `
    .since{font-size:12px;fill:var(--muted)}
    .tile{fill:var(--track);opacity:.6}
    .tile-label{font-size:11px;fill:var(--muted)}
    .tile-value{font-size:19px;font-weight:700;fill:var(--title)}
    .tile-note{font-size:9.5px;fill:var(--muted)}
    .section{font-size:13px;font-weight:600;fill:var(--text)}
    .axis{font-size:10.5px;fill:var(--muted)}
    .axis-strong{font-size:11px;fill:var(--text)}
    .row-label{font-size:12px;fill:var(--text)}
    .row-value{font-size:12px;font-weight:700;fill:var(--title)}
    .peak{font-size:10.5px;font-weight:700;fill:var(--accent)}
    .ghost{fill:var(--track);opacity:.35}
    .hm0{fill:var(--track)}
    .hm1,.hm2,.hm3,.hm4{fill:var(--accent)}
    .hm1{fill-opacity:.28}.hm2{fill-opacity:.5}.hm3{fill-opacity:.75}
    .bar{fill:var(--accent);fill-opacity:.55}.bar-peak{fill-opacity:1}
    .mix0,.mix1,.mix2,.mix3{fill:var(--accent)}
    .mix1{fill-opacity:.75}.mix2{fill-opacity:.55}.mix3{fill-opacity:.38}
    .spark{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
    .dot{fill:var(--bg);stroke:var(--accent);stroke-width:1.6}
    ${
      options.animate
        ? `@keyframes ags-growy{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes ags-dash{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    .growy{transform-box:fill-box;transform-origin:center bottom;transform:scaleY(0);animation:ags-growy .8s cubic-bezier(.22,1,.36,1) forwards}
    .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ags-dash 1.6s ease-out .5s forwards}
    @media (prefers-reduced-motion: reduce){.growy,.draw{animation:none;transform:none;stroke-dashoffset:0}}`
        : ''
    }`;

  const extraDefs = `<linearGradient id="ags-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient>`;

  const label = a
    ? `${stats.name}: ${formatExact(stats.totalStars)} stars, ${formatExact(a.total)} contributions in the last year, current streak ${plural(a.streaks.current, 'day')}`
    : `${stats.name}: ${formatExact(stats.totalStars)} GitHub stars`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body: `<defs>${extraDefs}</defs>${body}`,
    css,
    label,
  });
}
