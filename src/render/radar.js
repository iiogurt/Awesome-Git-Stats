import { computeRank, rankScores } from '../rank.js';
import {
  delay,
  escapeXml,
  formatCount,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';
import { cover, orb } from './materials.js';

const WIDTH = 495;
const HEIGHT = 270;
const CX = 160;
const CY = 155;
const R = 78;

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * The account's profile on six axes (commits, pull requests, reviews, issues,
 * stars, followers), each scaled so the middle ring is a typical GitHub user.
 */
export function renderRadar(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Contribution Profile`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const numbers = {
    commits: a.mix.commits,
    pullRequests: a.pullRequests,
    reviews: a.mix.reviews,
    issues: a.issues,
    stars: stats.totalStars,
    followers: stats.followers,
  };
  const axes = [
    ['commits', 'Commits'],
    ['pullRequests', 'Pull requests'],
    ['reviews', 'Reviews'],
    ['issues', 'Issues'],
    ['stars', 'Stars'],
    ['followers', 'Followers'],
  ];
  const scores = rankScores(numbers);
  const angle = (i) => -Math.PI / 2 + (i * Math.PI * 2) / axes.length;
  const at = (i, radius) => [Math.cos(angle(i)) * radius, Math.sin(angle(i)) * radius];
  const ring = (f) =>
    axes
      .map((_, i) =>
        at(i, R * f)
          .map(r1)
          .join(' '),
      )
      .join('L');

  const grid = [0.25, 0.5, 0.75, 1]
    .map((f) => `<path d="M${ring(f)}Z" class="grid${f === 0.5 ? ' grid-mid' : ''}"/>`)
    .join('');
  const spokes = axes
    .map((_, i) => `<path d="M0 0L${at(i, R).map(r1).join(' ')}" class="grid"/>`)
    .join('');
  // Never quite zero, so an empty axis still shows a sliver of shape.
  const shape = axes
    .map(([key], i) =>
      at(i, R * Math.max(0.04, scores[key]))
        .map(r1)
        .join(' '),
    )
    .join('L');
  const dots = axes
    .map(([key], i) => {
      const [x, y] = at(i, R * Math.max(0.04, scores[key]));
      return orb({ cx: x, cy: y, r: 3.5, fill: 'accent' });
    })
    .join('');
  const labels = axes
    .map(([, label], i) => {
      const [x, y] = at(i, R + 16);
      const anchor = Math.abs(x) < 5 ? 'middle' : x > 0 ? 'start' : 'end';
      return `<text x="${r1(x)}" y="${r1(y + 4)}" class="axis" text-anchor="${anchor}">${label}</text>`;
    })
    .join('');

  const rank = computeRank(numbers);
  const list = axes
    .map(([key, label], i) => {
      const y = 112 + i * 22;
      return `<g class="rise"${delay(options, 500 + i * 80)}>
        <text x="330" y="${y}" class="row-label">${label}</text>
        <text x="${WIDTH - 25}" y="${y}" class="row-value" text-anchor="end">${formatCount(numbers[key] ?? 0)}</text>
      </g>`;
    })
    .join('');

  const body = `
    <g transform="translate(${CX} ${CY})">
      <g class="fade">${grid}${spokes}</g>
      <g class="grow-out"${delay(options, 250)}><path d="M${shape}Z" class="shape"/>${cover({ d: `M${shape}Z` }, 'shape')}${dots}</g>
      <g class="fade"${delay(options, 400)}>${labels}</g>
    </g>
    <g class="fade"${delay(options, 300)}>
      <text x="330" y="80" class="rank">${escapeXml(rank.level)}</text>
      <text x="370" y="80" class="rank-note">${escapeXml(`rank, top ${rank.percentile < 1 ? '<1' : Math.round(rank.percentile)}%`)}</text>
    </g>
    ${list}`;

  const css = `
    .grid{fill:none;stroke:var(--track);stroke-width:1}
    .grid-mid{stroke-dasharray:3 3;stroke:var(--muted);stroke-opacity:.5}
    .shape{fill:var(--accent);fill-opacity:.32;stroke:var(--accent);stroke-width:2;stroke-linejoin:round}
    .axis{font-size:11px;fill:var(--muted)}
    .rank{font-size:30px;font-weight:800;fill:var(--title)}
    .rank-note{font-size:11px;fill:var(--muted)}
    .row-label{font-size:12px;fill:var(--text)}
    .row-value{font-size:12px;font-weight:700;fill:var(--title)}
    ${
      options.animate
        ? `@keyframes ags-grow-out{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    .grow-out{transform:scale(0);animation:ags-grow-out 1.1s cubic-bezier(.22,1,.36,1) forwards}
    @media (prefers-reduced-motion: reduce){.grow-out{animation:none;transform:none}}`
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
    label: `${stats.name}'s contribution profile, rank ${rank.level}`,
  });
}
