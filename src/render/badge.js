import {
  STAR_PATH,
  escapeXml,
  formatCount,
  formatExact,
  icon,
  measureText,
  renderFrame,
} from './common.js';

const HEIGHT = 28;

export function renderBadge(stats, options) {
  const label = options.label;
  const value = formatCount(stats.totalStars);
  const labelWidth = Math.ceil(measureText(label, 12, 600)) + 38;
  const valueWidth = Math.ceil(measureText(value, 12, 700)) + 22;
  const width = labelWidth + valueWidth;
  const radius = Math.min(options.radius, HEIGHT / 2);

  const body = `
  <clipPath id="ags-badge"><rect width="${width}" height="${HEIGHT}" rx="${radius}"/></clipPath>
  <g clip-path="url(#ags-badge)">
    <rect width="${labelWidth}" height="${HEIGHT}" class="badge-left"/>
  </g>
  ${icon(STAR_PATH, { x: 11, y: 7, size: 14, className: 'badge-ink' })}
  <text x="31" y="18.5" class="badge-label">${escapeXml(label)}</text>
  <text x="${labelWidth + valueWidth / 2}" y="18.5" class="badge-value" text-anchor="middle">${value}</text>`;

  const css = `
    .badge-left{fill:var(--accent)}
    .badge-ink{fill:#1b1f24}
    .badge-label{font-size:12px;font-weight:600;fill:#1b1f24}
    .badge-value{font-size:12px;font-weight:700;fill:var(--title)}`;

  return renderFrame({
    width,
    height: HEIGHT,
    theme: options.theme,
    options: { ...options, radius, animate: false },
    withArt: false,
    title: null,
    body,
    css,
    label: `${stats.name}: ${formatExact(stats.totalStars)} GitHub stars`,
  });
}
