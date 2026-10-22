import { computeRank } from '../rank.js';
import {
  COMMIT_PATH,
  EYE_PATH,
  FORK_PATH,
  ISSUE_PATH,
  PEOPLE_PATH,
  PR_PATH,
  REPO_PATH,
  STAR_PATH,
  delay,
  escapeXml,
  formatCount,
  formatExact,
  icon,
  possessive,
  renderFrame,
} from './common.js';

const WIDTH = 495;
const HEIGHT = 195;
const RING = { cx: 410, cy: 108, r: 46 };

// Exact up to 99,999 so the numbers read like a stats sheet, compact beyond.
const value = (n) => (n == null ? '—' : n < 100000 ? formatExact(n) : formatCount(n));

function rows(stats) {
  const a = stats.activity;
  if (!a) {
    return [
      ['stars', STAR_PATH, 'Total stars earned', stats.totalStars],
      ['forks', FORK_PATH, 'Total forks', stats.totalForks],
      ['repos', REPO_PATH, 'Public repositories', stats.repoCount],
      ['followers', PEOPLE_PATH, 'Followers', stats.followers],
    ];
  }
  return [
    ['stars', STAR_PATH, 'Total stars earned', stats.totalStars],
    ['commits', COMMIT_PATH, 'Commits (last year)', a.mix.commits],
    ['prs', PR_PATH, 'Pull requests', a.pullRequests],
    ['issues', ISSUE_PATH, 'Issues', a.issues],
    ['reviews', EYE_PATH, 'Code reviews (last year)', a.mix.reviews],
    ['contribs', REPO_PATH, 'Contributed to (repos)', a.contributedTo],
  ];
}

function rankRing(rank, options) {
  const { cx, cy, r } = RING;
  // The ring fills by how far ahead of everyone the account is.
  const progress = Math.max(0.04, 1 - rank.percentile / 100);
  const top = rank.percentile < 1 ? '<1' : Math.round(rank.percentile);
  return `<g class="fade"${delay(options, 200)}>
    <circle cx="${cx}" cy="${cy}" r="${r}" class="rank-track"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" class="rank-ring" pathLength="100" stroke-dasharray="100" style="stroke-dashoffset:${(100 - progress * 100).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + 9}" class="rank-level" text-anchor="middle">${escapeXml(rank.level)}</text>
    <text x="${cx}" y="${cy + r + 22}" class="rank-note" text-anchor="middle">${escapeXml(`top ${top}%`)}</text>
  </g>`;
}

/** Classic stats card: the main numbers with icons, and an S to C rank. */
export function renderStats(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} GitHub Stats`;
  const visible = rows(stats).filter(([key]) => !options.hide.includes(key));
  const step = visible.length > 5 ? 22 : 26;
  const body = visible
    .map(([, path, label, n], i) => {
      const y = 70 + i * step;
      return `<g class="rise"${delay(options, 150 + i * 90)}>
        ${icon(path, { x: 25, y: y - 12, size: 15, className: 'icon-accent' })}
        <text x="50" y="${y}" class="stat-label">${escapeXml(label)}:</text>
        <text x="${stats.activity ? 310 : 280}" y="${y}" class="stat-value" text-anchor="end">${value(n)}</text>
      </g>`;
    })
    .join('');

  const a = stats.activity;
  const showRank = a && !options.hide.includes('rank');
  const rank = a
    ? computeRank({
        commits: a.mix.commits,
        pullRequests: a.pullRequests,
        issues: a.issues,
        reviews: a.mix.reviews,
        stars: stats.totalStars,
        followers: stats.followers,
      })
    : null;
  const note = a
    ? ''
    : `<text x="${RING.cx}" y="${RING.cy}" class="rank-note" text-anchor="middle"><tspan x="${RING.cx}">Commits and rank</tspan><tspan x="${RING.cx}" dy="15">need a GitHub token</tspan></text>`;

  const css = `
    .stat-label{font-size:13px;font-weight:600;fill:var(--text)}
    .stat-value{font-size:13px;font-weight:700;fill:var(--title)}
    .rank-track{fill:none;stroke:var(--track);stroke-width:8}
    .rank-ring{fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round}
    .rank-level{font-size:26px;font-weight:800;fill:var(--title)}
    .rank-note{font-size:11px;fill:var(--muted)}
    ${
      options.animate
        ? `@keyframes ags-rank{from{stroke-dashoffset:100}}
    .rank-ring{animation:ags-rank 1.4s cubic-bezier(.22,1,.36,1) .3s backwards}
    @media (prefers-reduced-motion: reduce){.rank-ring{animation:none}}`
        : ''
    }`;

  return renderFrame({
    // Without the rank ring there's nothing on the right, so the card narrows.
    width: a && !showRank ? 340 : WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body: `${body}${showRank ? rankRing(rank, options) : note}`,
    css,
    label: rank
      ? `${stats.name}: GitHub rank ${rank.level}, ${formatExact(stats.totalStars)} stars, ${formatExact(a.mix.commits)} commits in the last year`
      : `${stats.name}: ${formatExact(stats.totalStars)} GitHub stars`,
  });
}
