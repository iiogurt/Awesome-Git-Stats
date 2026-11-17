import {
  FONTS,
  delay,
  escapeXml,
  formatExact,
  measureText,
  renderFrame,
  truncate,
  wrapText,
} from './common.js';

const WIDTH = 820;
const HEIGHT = 470;
const LEFT = 25;
const RIGHT = WIDTH - 25;
// Three columns under the headline, with a rule between them.
const COLUMNS = [LEFT, 300, 572];
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const MONTH_NAMES =
  'January February March April May June July August September October November December'.split(
    ' ',
  );

const r1 = (n) => Math.round(n * 10) / 10;
const plural = (n, word) => `${formatExact(n)} ${word}${n === 1 ? '' : 's'}`;
const monthOf = (iso) => Number(iso.slice(5, 7)) - 1;
const shortDate = (iso) => `${MONTHS[monthOf(iso)]} ${Number(iso.slice(8, 10))}`;

// Small numbers read better as words in running text.
const WORDS = 'Zero One Two Three Four Five Six Seven Eight Nine Ten'.split(' ');
const spelled = (n) => WORDS[n] ?? formatExact(n);

/** The standfirst: two sentences on who carries the stars and what the year held. */
function standfirst(stats) {
  const sentences = [];
  const [top] = stats.topRepos;
  const starred = stats.starredRepoCount;
  if (top?.stars > 0) {
    sentences.push(
      starred === 1
        ? `One repository carries them all: ${top.name}.`
        : `${spelled(starred)} repositories carry them, led by ${top.name} with ${formatExact(top.stars)}.`,
    );
  } else {
    sentences.push(
      `${plural(stats.repoCount, 'public repository').replace('ys', 'ies')}, none starred yet.`,
    );
  }
  const a = stats.activity;
  if (a?.total > 0) {
    const best = a.best?.count
      ? `; the best one, ${shortDate(a.best.date)}, had ${formatExact(a.best.count)}`
      : '';
    sentences.push(
      `The year brought ${plural(a.total, 'contribution')} on ${plural(a.activeDays, 'day')}${best}.`,
    );
  }
  return sentences.join(' ');
}

/** A caption for the year's chart, from the busiest month and the longest streak. */
function caption(activity) {
  const peak = activity.months.reduce((max, m) => (m.total > max.total ? m : max));
  const parts = [];
  if (peak.total > 0) parts.push(`Busiest month: ${MONTH_NAMES[monthOf(peak.month)]}.`);
  const { longest } = activity.streaks;
  if (longest.length > 1) {
    parts.push(`Longest run: ${longest.length} days from ${shortDate(longest.start)}.`);
  }
  return parts.join(' ') || 'A quiet year so far.';
}

function facts(stats) {
  const a = stats.activity;
  const rows = a
    ? [
        ['Contributions', formatExact(a.total)],
        ['Active days', formatExact(a.activeDays)],
        ['Longest streak', plural(a.streaks.longest.length, 'day')],
        ['Current streak', plural(a.streaks.current, 'day')],
        a.pullRequests != null ? ['Pull requests', formatExact(a.pullRequests)] : null,
      ]
    : [
        ['Public repositories', formatExact(stats.repoCount)],
        ['Starred repositories', formatExact(stats.starredRepoCount)],
        ['Languages', formatExact(stats.languageCount ?? 0)],
      ];
  if (stats.followers != null) rows.push(['Followers', formatExact(stats.followers)]);
  rows.push(['Forks', formatExact(stats.totalForks)]);
  if (a) rows.push(['Public repositories', formatExact(stats.repoCount)]);
  return rows.filter(Boolean).slice(0, 7);
}

function numbers(stats, options) {
  const x = COLUMNS[0];
  const right = COLUMNS[1] - 25;
  return facts(stats)
    .map(([label, value], i) => {
      const y = 242 + i * 24;
      return `<g class="fade"${delay(options, 300 + i * 50)}>
      <text x="${x}" y="${y}" class="rp-fact">${label}</text>
      <text x="${right}" y="${y}" class="rp-value" text-anchor="end">${value}</text>
      <line x1="${x}" y1="${y + 7}" x2="${right}" y2="${y + 7}" class="rp-dots"/></g>`;
    })
    .join('');
}

function ranking(stats, options) {
  const x = COLUMNS[1];
  const right = COLUMNS[2] - 25;
  const repos = stats.topRepos.filter((repo) => repo.stars > 0).slice(0, 5);
  if (!repos.length)
    return `<text x="${x}" y="244" class="rp-note">No starred repositories yet.</text>`;
  return repos
    .map((repo, i) => {
      const y = 243 + i * 34;
      const count = formatExact(repo.stars);
      const room = right - x - 28 - measureText(count, 15) - 12;
      return `<g class="fade"${delay(options, 400 + i * 60)}>
      <text x="${x}" y="${y + 7}" class="rp-rank">${i + 1}</text>
      <text x="${x + 28}" y="${y}" class="rp-repo">${escapeXml(truncate(repo.name, room, 15, 700))}</text>
      ${repo.language ? `<text x="${x + 28}" y="${y + 15}" class="rp-sans rp-small">${escapeXml(truncate(repo.language, room, 10.5))}</text>` : ''}
      <text x="${right}" y="${y + 5}" class="rp-count" text-anchor="end">${count}</text></g>`;
    })
    .join('');
}

function year(activity, options) {
  const x0 = COLUMNS[2];
  const base = 372;
  const height = 70;
  const months = activity.months;
  const max = Math.max(...months.map((m) => m.total), 1);
  const step = months.length > 1 ? (RIGHT - x0) / (months.length - 1) : 0;
  const points = months.map((m, i) => [r1(x0 + i * step), r1(base - (m.total / max) * height)]);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  const peak = Math.max(
    0,
    months.findIndex((m) => m.total === max),
  );
  const [px, py] = points[peak] ?? [x0, base];
  // Keep the peak's label inside the column.
  const anchor = px < x0 + 40 ? 'start' : px > RIGHT - 40 ? 'end' : 'middle';
  const labels = months
    .map((m, i) =>
      i % 2 === 0
        ? `<text x="${points[i][0]}" y="${base + 16}" class="rp-sans rp-axis" text-anchor="${i === 0 ? 'start' : 'middle'}">${MONTHS[monthOf(m.month)]}</text>`
        : '',
    )
    .join('');
  const words = wrapText(caption(activity), RIGHT - x0, { fontSize: 13, maxLines: 2 })
    .map((text, i) => `<tspan x="${x0}" y="${242 + i * 18}">${escapeXml(text)}</tspan>`)
    .join('');
  return `<text class="rp-caption fade"${delay(options, 500)}>${words}</text>
    <g class="fade"${delay(options, 600)}>
      <path d="${line}L${points.at(-1)[0]} ${base}L${x0} ${base}Z" class="rp-area"/>
      <path d="${line}" class="rp-line"/>
      <line x1="${x0}" y1="${base}" x2="${RIGHT}" y2="${base}" class="rp-rule"/>
      ${labels}
      ${
        activity.total > 0
          ? `<circle cx="${px}" cy="${py}" r="3.5" class="rp-dot"/>
      <text x="${px}" y="${r1(py - 9)}" class="rp-peak" text-anchor="${anchor}">${formatExact(max)} in ${MONTH_NAMES[monthOf(months[peak].month)]}</text>`
          : ''
      }
    </g>`;
}

// Without contribution data (organizations, no token) the third column lists languages.
function languageList(stats, options) {
  const x = COLUMNS[2];
  const langs = stats.languages.slice(0, 6);
  if (!langs.length) return `<text x="${x}" y="244" class="rp-note">No languages yet.</text>`;
  return langs
    .map((lang, i) => {
      const y = 242 + i * 24;
      return `<g class="fade"${delay(options, 500 + i * 50)}>
      <text x="${x}" y="${y}" class="rp-fact">${escapeXml(truncate(lang.name, 150, 14))}</text>
      <text x="${RIGHT}" y="${y}" class="rp-value" text-anchor="end">${Math.round(lang.share * 100)}%</text>
      <line x1="${x}" y1="${y + 7}" x2="${RIGHT}" y2="${y + 7}" class="rp-dots"/></g>`;
    })
    .join('');
}

// One strip for the languages, in the report's own inks rather than a rainbow.
function languageStrip(stats, options) {
  const width = RIGHT - LEFT;
  let x = LEFT;
  let labelEnd = 0;
  const parts = stats.languages.map((lang, i) => {
    const w = lang.share * width;
    const start = x;
    x += w;
    const text = `${lang.name} ${Math.round(lang.share * 100)}%`;
    const needed = measureText(text, 10.5, 600) + 10;
    let label = '';
    if (start >= labelEnd && start + needed <= RIGHT) {
      label = `<text x="${r1(start)}" y="448" class="rp-sans rp-small"><tspan class="rp-strong">${escapeXml(lang.name)}</tspan> ${Math.round(lang.share * 100)}%</text>`;
      labelEnd = start + needed;
    }
    return `<rect x="${r1(start)}" y="424" width="${r1(Math.max(w - 2, 1.5))}" height="5" class="rp-ink${Math.min(i, 5)}"/>${label}`;
  });
  return stats.languages.length
    ? `<g class="fade"${delay(options, 800)}>${parts.join('')}</g>`
    : '';
}

/** An editorial front page: the star count as the headline, the year in three columns. */
export function renderReport(stats, options) {
  const a = stats.activity;
  const masthead = options.customTitle ?? `The ${stats.name} Report`;
  const big = formatExact(stats.totalStars);
  // The headline shrinks to leave room for the standfirst.
  const bigSize = Math.min(96, Math.floor(300 / measureText(big, 1, 700)));
  const bigWidth = measureText(big, bigSize, 700);
  const tagX = r1(LEFT + bigWidth + 22);
  const first = a?.days[0]?.date;
  const last = a?.days.at(-1)?.date;
  const edition = a
    ? `${a.years ? `Vol. ${a.years} · ` : ''}${MONTHS[monthOf(first)]} ${first.slice(0, 4)} – ${MONTHS[monthOf(last)]} ${last.slice(0, 4)}`
    : plural(stats.repoCount, 'public repo');
  const introX = Math.max(540, tagX + 190);
  const intro = wrapText(standfirst(stats), RIGHT - introX, { fontSize: 15.5, maxLines: 5 });
  const introTop = 129 - (intro.length - 1) * 11;
  const heads = ['By the numbers', 'Most starred', a ? 'The year, month by month' : 'Languages'];

  const body = `
  <line x1="${LEFT}" y1="26" x2="${RIGHT}" y2="26" class="rp-bar"/>
  <text x="${LEFT}" y="48" class="rp-sans rp-kicker rp-strong">${escapeXml(truncate(masthead.toUpperCase(), 420, 14, 700))}</text>
  <text x="${RIGHT}" y="48" class="rp-sans rp-kicker rp-muted" text-anchor="end">${escapeXml(edition.toUpperCase())}</text>
  <line x1="${LEFT}" y1="58" x2="${RIGHT}" y2="58" class="rp-rule"/>
  <g class="rise"${delay(options, 100)}>
    <text x="${LEFT}" y="150" class="rp-big" style="font-size:${bigSize}px">${big}</text>
    <text x="${tagX}" y="112" class="rp-tag rp-accent">${stats.totalStars === 1 ? 'star,' : 'stars,'}</text>
    <text x="${tagX}" y="146" class="rp-tag">and counting.</text>
  </g>
  <text class="rp-intro fade"${delay(options, 250)}>${intro.map((text, i) => `<tspan x="${introX}" y="${introTop + i * 22}">${escapeXml(text)}</tspan>`).join('')}</text>
  <line x1="${LEFT}" y1="188" x2="${RIGHT}" y2="188" class="rp-hair"/>
  ${heads.map((text, i) => `<text x="${COLUMNS[i]}" y="214" class="rp-sans rp-kicker rp-accent rp-strong">${text.toUpperCase()}</text>`).join('')}
  <line x1="${COLUMNS[1] - 12.5}" y1="200" x2="${COLUMNS[1] - 12.5}" y2="398" class="rp-hair"/>
  <line x1="${COLUMNS[2] - 12.5}" y1="200" x2="${COLUMNS[2] - 12.5}" y2="398" class="rp-hair"/>
  ${numbers(stats, options)}
  ${ranking(stats, options)}
  ${a ? year(a, options) : languageList(stats, options)}
  <line x1="${LEFT}" y1="412" x2="${RIGHT}" y2="412" class="rp-rule"/>
  ${languageStrip(stats, options)}`;

  const css = `
    .rp-sans{font-family:${FONTS.sans}}
    .rp-kicker{font-size:10.5px;letter-spacing:.18em}
    .rp-strong{font-weight:700;fill:var(--title)}
    .rp-muted{fill:var(--muted)}
    .rp-accent{fill:var(--accent)}
    .rp-small{font-size:10.5px;fill:var(--muted)}
    .rp-axis{font-size:10px;fill:var(--muted)}
    .rp-big{font-weight:700;letter-spacing:-.03em;fill:var(--title)}
    .rp-tag{font-size:26px;font-style:italic;fill:var(--title)}
    .rp-tag.rp-accent{fill:var(--accent)}
    .rp-intro{font-size:15.5px;fill:var(--text)}
    .rp-fact{font-size:14px;fill:var(--text)}
    .rp-value{font-size:14px;font-weight:700;fill:var(--text)}
    .rp-rank{font-size:26px;font-style:italic;fill:var(--muted);fill-opacity:.45}
    .rp-repo{font-size:15px;font-weight:700;fill:var(--text)}
    .rp-count{font-size:15px;fill:var(--text)}
    .rp-caption{font-size:13px;font-style:italic;fill:var(--muted)}
    .rp-peak{font-size:13px;font-style:italic;fill:var(--text)}
    .rp-note{font-size:13px;font-style:italic;fill:var(--muted)}
    .rp-bar{stroke:var(--title);stroke-width:3}
    .rp-rule{stroke:var(--title);stroke-width:1}
    .rp-hair{stroke:var(--muted);stroke-opacity:.35;stroke-width:1}
    .rp-dots{stroke:var(--muted);stroke-opacity:.5;stroke-dasharray:1 3}
    .rp-line{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round}
    .rp-area{fill:var(--accent);fill-opacity:.1}
    .rp-dot{fill:var(--accent)}
    .rp-ink0{fill:var(--title)}.rp-ink1{fill:var(--accent)}
    .rp-ink2{fill:var(--muted)}.rp-ink3{fill:var(--muted);fill-opacity:.7}
    .rp-ink4{fill:var(--muted);fill-opacity:.45}.rp-ink5{fill:var(--muted);fill-opacity:.28}`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title: null,
    font: 'serif',
    body,
    css,
    label: a
      ? `${masthead}: ${formatExact(stats.totalStars)} stars, ${formatExact(a.total)} contributions in the last year`
      : `${masthead}: ${formatExact(stats.totalStars)} GitHub stars`,
  });
}
