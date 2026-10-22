import {
  FORK_PATH,
  PEOPLE_PATH,
  REPO_PATH,
  STAR_PATH,
  delay,
  escapeXml,
  formatCount,
  formatExact,
  icon,
  possessive,
  renderFrame,
  truncate,
} from './common.js';
import { glassDisc, orb, ringLight } from './materials.js';

const WIDTH = 495;
const HEIGHT = 195;

function statColumn({ x, path, value, label, options, index }) {
  return `<g class="rise"${delay(options, 300 + index * 120)}>
    ${icon(path, { x, y: 128, size: 14 })}
    <text x="${x + 20}" y="140" class="stat-value">${escapeXml(value)}</text>
    <text x="${x}" y="160" class="stat-label">${escapeXml(label)}</text>
  </g>`;
}

function donut(languages, options, { cx, cy, r, stroke }) {
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const gap = languages.length > 1 ? 1.5 : 0;
  const segments = languages
    .map((lang) => {
      const length = Math.max(lang.share * circumference - gap, 0.5);
      const segment = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${lang.color}" stroke-width="${stroke}" fill="none" stroke-dasharray="${length.toFixed(2)} ${circumference.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += lang.share * circumference;
      return segment;
    })
    .join('');
  return `<g class="pop"${delay(options, 250)}>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${stroke}" fill="none" class="ring-track"/>
    ${segments}
    ${ringLight({ cx, cy, r, stroke })}
    ${glassDisc({ cx, cy, r: r - stroke / 2 - 4 })}
    <g class="twinkle">${icon(STAR_PATH, { x: cx - 10, y: cy - 10, size: 20, className: 'icon-accent' })}</g>
  </g>`;
}

function legend(languages, options) {
  return languages
    .map((lang, i) => {
      const y = 70 + i * 22;
      const pct = `${Math.round(lang.share * 100)}%`;
      return `<g class="rise"${delay(options, 350 + i * 90)}>
        ${orb({ cx: 267, cy: y - 4, r: 5, fill: lang.color })}
        <text x="279" y="${y}" class="lang-name">${escapeXml(truncate(lang.name, 70, 12))}</text>
        <text x="375" y="${y}" class="lang-pct" text-anchor="end">${pct}</text>
      </g>`;
    })
    .join('');
}

export function renderOverview(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} GitHub Stars`;
  const big =
    stats.totalStars >= 100000 ? formatCount(stats.totalStars) : formatExact(stats.totalStars);
  const repoWord = stats.starredRepoCount === 1 ? 'repo' : 'repos';

  const columns = [
    { key: 'forks', path: FORK_PATH, value: formatCount(stats.totalForks), label: 'forks' },
    { key: 'repos', path: REPO_PATH, value: formatCount(stats.repoCount), label: 'public repos' },
  ];
  if (stats.followers !== null && stats.followers !== undefined) {
    columns.push({
      key: 'followers',
      path: PEOPLE_PATH,
      value: formatCount(stats.followers),
      label: 'followers',
    });
  }
  const statsBlock = columns
    .filter((column) => !options.hide.includes(column.key))
    .map((column, index) => statColumn({ ...column, x: 25 + index * 78, options, index }))
    .join('');

  const top = stats.topRepos[0];
  const topLine =
    top && top.stars > 0 && !options.hide.includes('top')
      ? `<g class="fade"${delay(options, 700)}>
          <text x="25" y="183" class="top-line">Top repo <tspan class="top-name">${escapeXml(truncate(top.name, 140, 12, 600))}</tspan> · ★ ${formatCount(top.stars)}</text>
        </g>`
      : '';

  const languagesBlock = stats.languages.length
    ? `${legend(stats.languages, options)}${donut(stats.languages, options, { cx: 432, cy: 112, r: 36, stroke: 12 })}`
    : `<text x="350" y="115" class="lang-name" text-anchor="middle">No starred repos yet ✨</text>`;

  const body = `
  <g class="rise"${delay(options, 100)}>
    <g class="twinkle">${icon(STAR_PATH, { x: 25, y: 60, size: 30, className: 'icon-accent' })}</g>
    <text x="66" y="87" class="big">${big}</text>
    <text x="25" y="110" class="caption">stars earned across ${formatCount(stats.starredRepoCount)} ${repoWord}</text>
  </g>
  ${statsBlock}
  ${topLine}
  ${languagesBlock}`;

  const css = `
    .big{font-size:32px;font-weight:800;fill:var(--title)}
    .caption{font-size:12.5px;fill:var(--muted)}
    .stat-value{font-size:15px;font-weight:700;fill:var(--text)}
    .stat-label{font-size:11px;fill:var(--muted)}
    .lang-name{font-size:12px;fill:var(--text)}
    .lang-pct{font-size:11px;fill:var(--muted)}
    .top-line{font-size:12px;fill:var(--muted)}
    .top-name{font-weight:600;fill:var(--text)}
    .ring-track{stroke:var(--track)}
    ${
      options.animate
        ? `@keyframes ags-pop{from{opacity:0;transform:scale(.6) rotate(-40deg)}to{opacity:1;transform:none}}
    .pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:ags-pop .9s cubic-bezier(.22,1,.36,1) forwards}
    @media (prefers-reduced-motion: reduce){.pop{animation:none;opacity:1;transform:none}}`
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
    label: `${stats.name} has earned ${formatExact(stats.totalStars)} GitHub stars`,
  });
}
