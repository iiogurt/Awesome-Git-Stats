import {
  STAR_PATH,
  delay,
  escapeXml,
  formatCount,
  formatExact,
  icon,
  measureText,
  renderFrame,
} from './common.js';
import { orb, track } from './materials.js';

const WIDTH = 350;
const HEIGHT = 128;
const BAR_X = 25;
const BAR_WIDTH = WIDTH - 50;

function stackedBar(languages, options) {
  let x = BAR_X;
  const segments = languages
    .map((lang) => {
      const width = lang.share * BAR_WIDTH;
      const rect = `<rect x="${x.toFixed(2)}" y="86" width="${width.toFixed(2)}" height="8" fill="${lang.color}"/>`;
      x += width;
      return rect;
    })
    .join('');
  return `<clipPath id="ags-bar"><rect x="${BAR_X}" y="86" width="${BAR_WIDTH}" height="8" rx="4"/></clipPath>
  ${track({ x: BAR_X, y: 86, width: BAR_WIDTH, height: 8 })}
  <g clip-path="url(#ags-bar)"><g class="grow"${delay(options, 300)}>${segments}<rect x="${BAR_X}" y="86" width="${BAR_WIDTH}" height="8" fill="url(#ags-sheen)"/></g></g>`;
}

function inlineLegend(languages, options) {
  let x = BAR_X;
  const items = [];
  for (const [i, lang] of languages.entries()) {
    const text = `${lang.name} ${Math.round(lang.share * 100)}%`;
    const width = measureText(text, 11) * 0.92 + 24;
    if (x + width > WIDTH - 15) break;
    items.push(`<g class="fade"${delay(options, 500 + i * 80)}>
      ${orb({ cx: x + 4, cy: 110, r: 4, fill: lang.color })}
      <text x="${x + 12}" y="114" class="legend">${escapeXml(text)}</text>
    </g>`);
    x += width;
  }
  return items.join('');
}

export function renderCompact(stats, options) {
  const title = options.customTitle ?? stats.name;
  const total = formatCount(stats.totalStars);
  const totalWidth = measureText(total, 28, 800);
  const repoWord = stats.starredRepoCount === 1 ? 'repo' : 'repos';

  const languages = stats.languages.length
    ? `${stackedBar(stats.languages, options)}${inlineLegend(stats.languages, options)}`
    : track({ x: BAR_X, y: 86, width: BAR_WIDTH, height: 8 });

  const body = `
  <g class="rise"${delay(options, 100)}>
    <g class="twinkle">${icon(STAR_PATH, { x: 25, y: 51, size: 22, className: 'icon-accent' })}</g>
    <text x="55" y="72" class="big">${total}</text>
    <text x="${55 + totalWidth + 8}" y="72" class="caption">stars across ${formatCount(stats.starredRepoCount)} ${repoWord}</text>
  </g>
  ${languages}`;

  const css = `
    .big{font-size:28px;font-weight:800;fill:var(--title)}
    .caption{font-size:12.5px;fill:var(--muted)}
    .legend{font-size:11px;fill:var(--text)}`;

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
