import { computeRank } from '../rank.js';
import {
  delay,
  escapeXml,
  formatCount,
  formatExact,
  renderFrame,
  renderNoActivity,
} from './common.js';
import { cellRx, glossBar, gridCast, gridGloss, gridSheen, track } from './materials.js';

const WIDTH = 820;
const HEIGHT = 500;
const LEFT = 32;
const INFO_X = 350;
const LANG_X = 440;
const BAR = 30; // height of the window's title bar
const FONT = 12.5;
const CH = FONT * 0.6; // width of one character in a monospace font
const MONO = "'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, Consolas, monospace";

const WEEKS = 26;
const CELL = 9;
const STEP = 11;
const MAP_TOP = 104;
const KEY_WIDTH = 11; // characters, dots included

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const r1 = (n) => Math.round(n * 10) / 10;

/** Cut text to `max` characters with an ellipsis: the font is monospace, so this is exact. */
function cut(text, max) {
  const chars = [...String(text)];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('');
}

function plural(n, word) {
  return `${formatExact(n)} ${word}${n === 1 ? '' : 's'}`;
}

function prompt(y, command, options, ms) {
  return `<text x="${LEFT}" y="${y}" class="term fade"${delay(options, ms)}><tspan class="term-arrow">➜</tspan> <tspan class="term-home">~</tspan> ${escapeXml(command)}</text>`;
}

// The last 26 weeks of the contribution calendar, one column per week.
function heatmap(activity, options) {
  const { days, levels } = activity;
  const offset = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
  const total = Math.ceil((days.length + offset) / 7);
  const first = Math.max(0, total - WEEKS);
  const columns = new Map();
  days.forEach((day, i) => {
    const col = Math.floor((i + offset) / 7) - first;
    if (col < 0) return;
    const row = (i + offset) % 7;
    const column = columns.get(col) ?? { first: row, cells: [] };
    column.last = row;
    column.cells.push(
      `<rect x="${LEFT + col * STEP}" y="${MAP_TOP + row * STEP}" width="${CELL}" height="${CELL}" rx="${cellRx(1.5)}" class="hm${levels[i]}"/>`,
    );
    columns.set(col, column);
  });
  const grid = [...columns.entries()]
    .map(([col, { first: top, last, cells }]) => {
      const area = {
        id: 'ags-hm-sheen',
        x: LEFT + col * STEP,
        y: MAP_TOP + top * STEP,
        width: CELL,
        height: (last - top) * STEP + CELL,
      };
      return `<g class="fade"${delay(options, 200 + col * 15)}>${gridCast(area)}${cells.join('')}${gridGloss(area)}</g>`;
    })
    .join('');
  return `<text x="${LEFT}" y="${MAP_TOP - 12}" class="term-dim">last ${WEEKS} weeks</text>
    ${gridSheen({ id: 'ags-hm-sheen', x: LEFT, y: MAP_TOP, cell: CELL, step: STEP, rx: 1.5 })}${grid}`;
}

// Twelve monthly totals as block-character bars, with the months' initials under them.
function sparkline(activity, options) {
  const months = activity.months.slice(-12);
  const max = Math.max(0, ...months.map((m) => m.total));
  const x0 = LEFT + 8 * CH;
  const base = 216;
  const height = 16;
  const bars = months
    .map((m, i) => {
      const x = r1(x0 + i * 2 * CH);
      // Eighths, like ▁▂▃▄▅▆▇█: an empty month still shows the lowest block.
      const level = max ? Math.max(1, Math.ceil((m.total / max) * 8)) : 1;
      const h = r1((level / 8) * height);
      return `${glossBar({ x, y: r1(base - h), width: r1(CH), height: h, rx: 0.5, upright: true, glow: false, fill: m.total ? 'accent' : 'track' })}
      <text x="${r1(x + CH / 2)}" y="${base + 16}" class="term-dim" text-anchor="middle">${MONTHS[Number(m.month.slice(5, 7)) - 1][0]}</text>`;
    })
    .join('');
  const peak = months.find((m) => m.total === max);
  const note =
    max > 0
      ? `peak ${formatExact(max)} in ${MONTHS[Number(peak.month.slice(5, 7)) - 1]}`
      : 'no contributions yet';
  return `<g class="fade"${delay(options, 500)}>
    <text x="${LEFT}" y="${base}" class="term-dim">months</text>${bars}
    <text x="${LEFT}" y="${base + 36}" class="term-dim">${escapeXml(note)}</text>
  </g>`;
}

function infoRows(stats) {
  const a = stats.activity;
  const rank = computeRank({
    commits: a.mix.commits,
    pullRequests: a.pullRequests,
    issues: a.issues,
    reviews: a.mix.reviews,
    stars: stats.totalStars,
    followers: stats.followers,
  });
  const top = rank.percentile < 1 ? '<1' : Math.round(rank.percentile);
  const best = a.streaks.longest?.length ?? 0;
  return [
    ['stars', formatExact(stats.totalStars), 'strong'],
    ['repos', `${formatExact(stats.repoCount)} public · ${formatCount(stats.totalForks)} forks`],
    stats.followers != null && ['followers', formatExact(stats.followers)],
    ['contribs', `${formatExact(a.total)} in the last year`, 'hot'],
    ['streak', `${plural(a.streaks.current, 'day')} (best ${formatExact(best)})`, 'hot'],
    a.pullRequests != null && ['prs', `${formatExact(a.pullRequests)} all time`],
    ['reviews', formatExact(a.mix.reviews)],
    ['rank', `${rank.level} · top ${top}%`, 'strong'],
    a.joinedYear != null && [
      'since',
      `${a.joinedYear}${a.years ? ` · ${plural(a.years, 'year')}` : ''}`,
    ],
  ].filter(Boolean);
}

function info(stats, options) {
  const login = cut(stats.login, 46);
  const rows = infoRows(stats)
    .map(([key, value, tone], i) => {
      const y = 124 + i * 19;
      return `<g class="fade"${delay(options, 250 + i * 60)}>
      <text x="${INFO_X}" y="${y}" class="term-key">${key}<tspan class="term-dots">${'.'.repeat(KEY_WIDTH - key.length)}</tspan></text>
      <text x="${INFO_X + (KEY_WIDTH + 1) * CH}" y="${y}" class="term${tone ? ` term-${tone}` : ''}">${escapeXml(value)}</text>
    </g>`;
    })
    .join('');
  const ruleWidth = r1(([...login].length + 7) * CH);
  return `<g class="fade"${delay(options, 150)}>
    <text x="${INFO_X}" y="${MAP_TOP - 12}" class="term-user">${escapeXml(login)}<tspan class="term-at">@</tspan>github</text>
    <rect x="${INFO_X}" y="${MAP_TOP - 4}" width="${ruleWidth}" height="1.5" class="term-rule"/>
  </g>${rows}`;
}

function repoTable(stats, options) {
  const nameX = LEFT + 2 * CH;
  const starsX = nameX + 25 * CH; // right edge of the stars column
  const langX = starsX + 2 * CH;
  const repos = stats.topRepos.filter((repo) => repo.stars > 0).slice(0, 5);
  const rows = repos.length
    ? repos
        .map((repo, i) => {
          const y = 358 + i * 19;
          return `<g class="fade"${delay(options, 750 + i * 60)}>
      <text x="${r1(nameX)}" y="${y}" class="term">${escapeXml(cut(repo.name, 19))}</text>
      <text x="${r1(starsX)}" y="${y}" class="term term-num" text-anchor="end">${formatCount(repo.stars)}</text>
      <text x="${r1(langX)}" y="${y}" class="term-dim">${escapeXml(cut(repo.language ?? '—', 13))}</text>
    </g>`;
        })
        .join('')
    : `<text x="${r1(nameX)}" y="358" class="term-dim">no starred repositories yet</text>`;
  return `<g class="fade"${delay(options, 700)}>
    <text x="${r1(nameX)}" y="338" class="term-dim">REPO</text>
    <text x="${r1(starsX)}" y="338" class="term-dim" text-anchor="end">STARS</text>
    <text x="${r1(langX)}" y="338" class="term-dim">LANG</text>
  </g>${rows}`;
}

function languageTable(stats, options) {
  const barX = LANG_X + 13 * CH;
  const pctX = WIDTH - LEFT;
  const barWidth = r1(pctX - 5 * CH - barX);
  const langs = stats.languages.slice(0, 5);
  const max = Math.max(...langs.map((lang) => lang.share), 0) || 1;
  const rows = langs.length
    ? langs
        .map((lang, i) => {
          const y = 358 + i * 19;
          const width = r1(Math.max(3, (lang.share / max) * barWidth));
          return `<g class="fade"${delay(options, 800 + i * 60)}>
      <text x="${LANG_X}" y="${y}" class="term">${escapeXml(cut(lang.name, 12))}</text>
      ${track({ x: r1(barX), y: y - 10, width: barWidth, height: 11 })}
      ${glossBar({ x: r1(barX), y: y - 10, width, height: 11, rx: 1, fill: lang.color, attrs: ` class="grow"${delay(options, 850 + i * 60)}` })}
      <text x="${pctX}" y="${y}" class="term-dim" text-anchor="end">${Math.round(lang.share * 100)}%</text>
    </g>`;
        })
        .join('')
    : `<text x="${LANG_X}" y="358" class="term-dim">no languages yet</text>`;
  return `<g class="fade"${delay(options, 700)}>
    <text x="${LANG_X}" y="338" class="term-dim">LANGUAGE</text>
    <text x="${r1(barX)}" y="338" class="term-dim">SHARE OF STARS</text>
  </g>${rows}`;
}

function titleBar(stats, options) {
  const r = Math.min(options.radius, BAR / 2);
  const text = options.customTitle ?? `${stats.login} — gitfetch`;
  const dots = ['#ff5f57', '#febc2e', '#28c840']
    .map((fill, i) => `<circle cx="${20 + i * 18}" cy="${BAR / 2}" r="5.5" fill="${fill}"/>`)
    .join('');
  return `<path d="M0.5 ${BAR}V${r}A${r} ${r} 0 0 1 ${r} 0.5H${WIDTH - r}A${r} ${r} 0 0 1 ${WIDTH - 0.5} ${r}V${BAR}Z" class="term-bar"/>
  <rect x="0.5" y="${BAR}" width="${WIDTH - 1}" height="1" class="term-edge"/>
  ${dots}
  ${options.hideTitle ? '' : `<text x="${WIDTH / 2}" y="${BAR / 2 + 4}" class="term-title" text-anchor="middle">${escapeXml(cut(text, 90))}</text>`}`;
}

/** A terminal window running a neofetch-style tool: calendar, key numbers and top lists. */
export function renderTerminal(stats, options) {
  const a = stats.activity;
  if (!a) {
    return renderNoActivity(stats, options, {
      width: WIDTH,
      height: HEIGHT,
      title: options.customTitle ?? `${stats.login} — gitfetch`,
    });
  }

  const cursorX = LEFT + 4 * CH;
  const body = `${titleBar(stats, options)}
  ${prompt(60, `gitfetch ${cut(stats.login, 80)}`, options, 0)}
  ${heatmap(a, options)}
  ${sparkline(a, options)}
  ${info(stats, options)}
  ${prompt(304, 'gitfetch --top --langs', options, 650)}
  ${repoTable(stats, options)}
  ${languageTable(stats, options)}
  <g class="fade"${delay(options, 1100)}>
    <text x="${LEFT}" y="472" class="term"><tspan class="term-arrow">➜</tspan> <tspan class="term-home">~</tspan></text>
    <rect x="${r1(cursorX)}" y="460" width="${r1(CH * 0.9)}" height="15" class="term-cursor"/>
  </g>`;

  const css = `
    text{font-family:${MONO};letter-spacing:0;font-size:${FONT}px}
    .term{fill:var(--text)}
    .term-dim{fill:var(--muted)}
    .term-title{font-size:11.5px;fill:var(--muted)}
    .term-bar{fill:var(--track);fill-opacity:.55}
    .term-edge{fill:var(--border);fill-opacity:.6}
    .term-arrow{fill:var(--accent);font-weight:700}
    .term-home{fill:var(--title)}
    .term-user{fill:var(--accent);font-weight:700}
    .term-at{fill:var(--muted);font-weight:400}
    .term-rule{fill:var(--muted);fill-opacity:.6}
    .term-key{fill:var(--title);font-weight:700}
    .term-dots{fill:var(--muted);font-weight:400}
    .term-strong{fill:var(--title);font-weight:700}
    .term-hot{fill:var(--accent)}
    .term-num{fill:var(--accent)}
    .term-cursor{fill:var(--text)}
    .hm0{fill:var(--track)}
    .hm1,.hm2,.hm3,.hm4{fill:var(--accent)}
    .hm1{fill-opacity:.28}.hm2{fill-opacity:.5}.hm3{fill-opacity:.75}
    ${
      options.animate
        ? `@keyframes ags-blink{50%{opacity:0}}
    .term-cursor{animation:ags-blink 1s steps(1) 1.8s 6}
    @media (prefers-reduced-motion: reduce){.term-cursor{animation:none}}`
        : ''
    }`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title: null,
    body,
    css,
    label: `${stats.name}: ${formatExact(stats.totalStars)} stars, ${formatExact(a.total)} contributions in the last year, current streak ${plural(a.streaks.current, 'day')}`,
  });
}
