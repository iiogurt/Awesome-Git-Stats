import {
  STAR_PATH,
  delay,
  escapeXml,
  formatCount,
  icon,
  measureText,
  possessive,
  renderFrame,
  truncate,
} from './common.js';
import { glossBar, orb, track } from './materials.js';

const WIDTH = 495;
const ROW = 40;
const TOP = 52;
const BAR_X = 25;
const BAR_WIDTH = WIDTH - 50;

function row(repo, index, maxStars, options) {
  const y = TOP + index * ROW;
  const count = formatCount(repo.stars);
  const countWidth = measureText(count, 12, 600);
  const starX = WIDTH - 25 - countWidth - 20;
  const langText = repo.language ? truncate(repo.language, 90, 11) : '';
  const langWidth = langText ? measureText(langText, 11) + 16 : 0;
  const langX = starX - 12 - langWidth;
  const nameWidth = Math.max(langX - BAR_X - 10, 80);
  const fill = maxStars ? Math.max((repo.stars / maxStars) * BAR_WIDTH, 8) : 8;
  const wait = 150 + index * 110;

  const language = langText
    ? `${orb({ cx: langX + 4, cy: y + 10, r: 4, fill: repo.languageColor ?? 'accent' })}
       <text x="${langX + 13}" y="${y + 14}" class="repo-lang">${escapeXml(langText)}</text>`
    : '';

  return `<g class="rise"${delay(options, wait)}>
    <text x="${BAR_X}" y="${y + 14}" class="repo-name">${escapeXml(truncate(repo.name, nameWidth, 13, 600))}</text>
    ${language}
    ${icon(STAR_PATH, { x: starX, y: y + 3, size: 13, className: 'icon-accent' })}
    <text x="${WIDTH - 25}" y="${y + 14}" class="repo-stars" text-anchor="end">${count}</text>
    ${track({ x: BAR_X, y: y + 21, width: BAR_WIDTH, height: 8 })}
  </g>
  ${glossBar({ x: BAR_X, y: y + 21, width: fill, height: 8, fill: repo.languageColor ?? 'accent', attrs: ` class="grow"${delay(options, wait + 150)}` })}`;
}

export function renderRepos(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Most Starred Repos`;
  const repos = stats.topRepos.slice(0, options.count);
  const maxStars = repos[0]?.stars ?? 0;
  const rows = repos.length ? repos.length : 1;
  const height = TOP + rows * ROW + 8;

  const body = repos.length
    ? repos.map((repo, i) => row(repo, i, maxStars, options)).join('')
    : `<text x="${WIDTH / 2}" y="${TOP + 18}" class="repo-lang" text-anchor="middle">No public repositories yet ✨</text>`;

  const css = `
    .repo-name{font-size:13px;font-weight:600;fill:var(--text)}
    .repo-lang{font-size:11px;fill:var(--muted)}
    .repo-stars{font-size:12px;font-weight:600;fill:var(--text)}`;

  return renderFrame({
    width: WIDTH,
    height,
    theme: options.theme,
    options,
    title,
    body,
    css,
    label: `${stats.name}'s most starred repositories`,
  });
}
