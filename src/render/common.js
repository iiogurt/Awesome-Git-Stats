import { renderArt } from './art.js';
import { materials } from './materials.js';

const FONTS = {
  sans: "'Segoe UI', Ubuntu, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, Consolas, monospace",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
};

/** Escape a value so it is safe to embed in SVG text and attribute values. */
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a count in a compact, human friendly way: 950, 1.2k, 12.3k, 1.5M. */
export function formatCount(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const units = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k'],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = n / size;
      const digits = Math.abs(scaled) >= 100 ? 0 : 1;
      return `${Number(scaled.toFixed(digits))}${suffix}`;
    }
  }
  return String(Math.round(n));
}

/** Format a count with thousands separators: 12345 -> 12,345. */
export function formatExact(value) {
  return Math.round(Number(value) || 0).toLocaleString('en-US');
}

/**
 * Rough text width estimate used for layout and truncation. SVG images
 * cannot measure text, so we rely on average glyph widths.
 */
export function measureText(text, fontSize = 14, weight = 400) {
  const factor = weight >= 600 ? 0.6 : 0.55;
  let width = 0;
  for (const ch of String(text)) {
    if (/[ilj.,:;'|!]/.test(ch)) width += 0.3;
    else if (/[mwMW@]/.test(ch)) width += 0.9;
    else if (/[0-9]/.test(ch)) width += 0.58;
    else if (/[A-Z]/.test(ch)) width += 0.68;
    else if (ch.codePointAt(0) > 0x2e80) width += 1;
    else width += factor;
  }
  return width * fontSize;
}

/** Truncate text with an ellipsis so it fits within maxWidth pixels. */
export function truncate(text, maxWidth, fontSize = 14, weight = 400) {
  const value = String(text);
  if (measureText(value, fontSize, weight) <= maxWidth) return value;
  const chars = [...value];
  while (chars.length > 1 && measureText(`${chars.join('')}…`, fontSize, weight) > maxWidth) {
    chars.pop();
  }
  return `${chars.join('')}…`;
}

/** Possessive form for titles: "Ada" -> "Ada's", "James" -> "James'". */
export function possessive(name) {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

export const STAR_PATH =
  'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z';

export const FORK_PATH =
  'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z';

export const REPO_PATH =
  'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z';

export const PEOPLE_PATH =
  'M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z';

export const FLAME_PATH =
  'M8 .5c.6 2.4 2.1 3.6 3.3 4.9C12.5 6.7 13.5 8 13.5 10a5.5 5.5 0 0 1-11 0c0-1.9.9-3.3 2.1-4.4.2 1.4.9 2.4 2 2.9C6.2 5.6 6.9 2.9 8 .5Zm0 9c-.9.8-1.5 1.6-1.5 2.6a1.5 1.5 0 0 0 3 0c0-1-.6-1.8-1.5-2.6Z';
export const TROPHY_PATH =
  'M4 1.5h8V3h2.5v1.8A3.2 3.2 0 0 1 11.7 8a4 4 0 0 1-2.9 2.4V12.5H11V14H5v-1.5h2.2v-2.1A4 4 0 0 1 4.3 8 3.2 3.2 0 0 1 1.5 4.8V3H4V1.5Zm0 3H3v.3c0 .7.4 1.3 1 1.6V4.5Zm8 0v1.9c.6-.3 1-.9 1-1.6v-.3h-1Z';
export const PR_PATH =
  'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z';
export const CALENDAR_PATH =
  'M4.5 0a.75.75 0 0 1 .75.75V1.5h5.5V.75a.75.75 0 0 1 1.5 0v.75h1.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.75 15H2.25A1.75 1.75 0 0 1 .5 13.75V3.25c0-.966.784-1.75 1.75-1.75h1.5V.75A.75.75 0 0 1 4.5 0ZM2 6v7.75c0 .138.112.25.25.25h11.5a.25.25 0 0 0 .25-.25V6Z';

export const COMMIT_PATH =
  'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z';

export const ISSUE_PATH =
  'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z';

export const EYE_PATH =
  'M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z';

export const GIST_PATH =
  'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8 9.22 6.53a.75.75 0 0 1 0-1.06ZM6.78 6.53 5.31 8l1.47 1.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2-2a.75.75 0 0 1 0-1.06l2-2a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z';

/** Render a 16x16 octicon path scaled to `size` at (x, y). */
export function icon(path, { x, y, size = 16, className = 'icon' }) {
  const scale = size / 16;
  return `<path class="${className}" transform="translate(${x} ${y}) scale(${scale})" d="${path}"/>`;
}

function themeVars(colors) {
  return [
    `--bg:${colors.bg}`,
    `--border:${colors.border}`,
    `--title:${colors.title}`,
    `--text:${colors.text}`,
    `--muted:${colors.muted}`,
    `--accent:${colors.accent}`,
    `--track:${colors.track}`,
    `--art1:${colors.art1 ?? colors.accent}`,
    `--art2:${colors.art2 ?? colors.title}`,
    `--art3:${colors.art3 ?? colors.accent}`,
    `--shade:${colors.shade ?? '#000000'}`,
  ].join(';');
}

function backgroundDefs(theme, id) {
  if (!theme.gradient) return '';
  const [angle, ...stops] = theme.gradient;
  const step = stops.length > 1 ? 100 / (stops.length - 1) : 0;
  const stopTags = stops
    .map((color, i) => `<stop offset="${Math.round(i * step)}%" stop-color="${color}"/>`)
    .join('');
  return `<linearGradient id="${id}" gradientTransform="rotate(${angle} 0.5 0.5)">${stopTags}</linearGradient>`;
}

/**
 * Wrap card content in a themed SVG frame. Colours are exposed as CSS
 * custom properties so the `auto` theme can follow the viewer's colour
 * scheme via a media query.
 */
export function renderFrame({
  width,
  height,
  theme,
  options,
  title,
  body,
  css = '',
  label,
  withArt = true,
}) {
  const { radius, hideBorder, hideTitle, animate } = options;
  const gradId = 'ags-bg';
  const bgFill = theme.gradient ? `url(#${gradId})` : 'var(--bg)';
  const borderOpacity = hideBorder ? 0 : 1;
  const darkBlock = theme.dark
    ? `@media (prefers-color-scheme: dark){svg{${themeVars(theme.dark)}}}`
    : '';
  const motion = animate
    ? `@keyframes ags-fade{from{opacity:0}to{opacity:1}}
    @keyframes ags-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes ags-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    @keyframes ags-twinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.12) rotate(8deg)}}
    .fade{opacity:0;animation:ags-fade .6s ease-out forwards}
    .rise{opacity:0;animation:ags-rise .6s ease-out forwards}
    .grow{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:ags-grow .9s cubic-bezier(.22,1,.36,1) forwards}
    .twinkle{transform-box:fill-box;transform-origin:center;animation:ags-twinkle 3s ease-in-out 1s infinite}
    @media (prefers-reduced-motion: reduce){.fade,.rise,.grow,.twinkle{animation:none;opacity:1;transform:none}}`
    : '';
  const titleBlock =
    hideTitle || !title ? '' : `<text x="25" y="35" class="title fade">${escapeXml(title)}</text>`;
  const offset = hideTitle && title ? -25 : 0;
  const finalHeight = height + offset;
  const font = FONTS[theme.font] ?? FONTS.sans;
  const strokeWidth = theme.borderWidth ?? 1;
  const inset = strokeWidth / 2;
  const glow = theme.glow
    ? '.title,.big{filter:drop-shadow(0 0 6px var(--accent))}.icon-accent{filter:drop-shadow(0 0 4px var(--accent))}'
    : '';
  const finish = materials(body, options.finish, { animate });
  const artName = options.art ?? theme.art;
  const art =
    withArt && artName && artName !== 'none'
      ? renderArt(artName, { width, height: finalHeight, seed: options.username, animate })
      : null;
  const artLayer = art
    ? `<clipPath id="ags-clip"><rect x="${inset}" y="${inset}" rx="${radius}" width="${width - strokeWidth}" height="${finalHeight - strokeWidth}"/></clipPath>
  <g class="art-layer" clip-path="url(#ags-clip)" aria-hidden="true">${art.layer}</g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${finalHeight}" viewBox="0 0 ${width} ${finalHeight}" fill="none" role="img" aria-labelledby="ags-title">
  <title id="ags-title">${escapeXml(label || title || 'GitHub stars')}</title>
  <defs>${backgroundDefs(theme, gradId)}${art?.defs ?? ''}${finish.defs}</defs>
  <style>
    svg{${themeVars(theme)}}
    ${darkBlock}
    text{font-family:${font}${theme.font === 'mono' ? ';letter-spacing:-.06em' : ''}}
    .title{font-size:18px;font-weight:600;fill:var(--title)}
    .text{fill:var(--text)}
    .muted{fill:var(--muted)}
    .accent{fill:var(--accent)}
    .icon{fill:var(--muted)}
    .icon-accent{fill:var(--accent)}
    .track{fill:var(--track)}
    .glass{fill:var(--bg);fill-opacity:.55}
    .card{fill:${bgFill};stroke:var(--border);stroke-width:${strokeWidth};stroke-opacity:${borderOpacity}}
    ${glow}
    ${motion}
    ${art?.css ?? ''}
    ${finish.css}
    ${css}
  </style>
  <rect x="${inset}" y="${inset}" rx="${radius}" width="${width - strokeWidth}" height="${finalHeight - strokeWidth}" class="card"/>
  ${artLayer}
  ${titleBlock}
  <g transform="translate(0 ${offset})">${body}</g>
</svg>`;
}

/** Animation delay helper; returns an inline style attribute or nothing. */
export function delay(options, ms) {
  return options.animate ? ` style="animation-delay:${ms}ms"` : '';
}

/** Split text into at most `maxLines` lines of `maxWidth` pixels, with an ellipsis if cut. */
export function wrapText(text, maxWidth, { fontSize = 12, maxLines = 2 } = {}) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let i = 0;
  while (i < words.length && lines.length < maxLines) {
    let line = words[i++];
    while (i < words.length && measureText(`${line} ${words[i]}`, fontSize) <= maxWidth) {
      line += ` ${words[i++]}`;
    }
    lines.push(line);
  }
  // Whatever doesn't fit goes on the last line, which truncate() cuts with an ellipsis.
  if (i < words.length) lines[lines.length - 1] += ` ${words.slice(i).join(' ')}`;
  return lines.map((line) => truncate(line, maxWidth, fontSize));
}

/** On-theme placeholder for layouts that need contribution data the account doesn't have. */
export function renderNoActivity(stats, options, { width, height, title }) {
  const why =
    stats.type === 'Organization'
      ? 'Contribution activity is only available for user accounts.'
      : 'Contribution activity needs a GitHub token. The Action provides one automatically.';
  const lines = wrapText(why, width - 60, { fontSize: 12, maxLines: 3 });
  const top = height / 2 - (lines.length - 1) * 9 + 10;
  return renderFrame({
    width,
    height,
    theme: options.theme,
    options,
    title,
    body: lines
      .map(
        (line, i) =>
          `<text x="${width / 2}" y="${top + i * 18}" class="muted" font-size="12" text-anchor="middle">${escapeXml(line)}</text>`,
      )
      .join(''),
    label: `${stats.name}: no contribution data`,
  });
}
