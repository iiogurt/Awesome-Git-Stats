import {
  STAR_PATH,
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

const WIDTH = 495;
const HEIGHT = 270;
const AREA = { x: 25, y: 52, w: WIDTH - 50, h: HEIGHT - 52 - 22 };
const MAX_REPOS = 12;

const r1 = (n) => Math.round(n * 10) / 10;

// How far the rectangles of a row are from squares, for the given short side.
function worst(row, side) {
  const sum = row.reduce((s, v) => s + v.area, 0);
  const max = Math.max(...row.map((v) => v.area));
  const min = Math.min(...row.map((v) => v.area));
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/** Squarified treemap: rectangles with areas proportional to `value`, as square as possible. */
export function squarify(items, { x, y, w, h }) {
  const total = items.reduce((s, item) => s + item.value, 0) || 1;
  let rest = items.map((item) => ({ item, area: (item.value / total) * w * h }));
  const out = [];
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]];
    while (
      row.length < rest.length &&
      worst([...row, rest[row.length]], side) <= worst(row, side)
    ) {
      row.push(rest[row.length]);
    }
    const sum = row.reduce((s, v) => s + v.area, 0);
    if (w >= h) {
      const width = sum / h;
      let cy = y;
      for (const v of row) {
        out.push({ item: v.item, x, y: cy, w: width, h: v.area / width });
        cy += v.area / width;
      }
      x += width;
      w -= width;
    } else {
      const height = sum / w;
      let cx = x;
      for (const v of row) {
        out.push({ item: v.item, x: cx, y, w: v.area / height, h: height });
        cx += v.area / height;
      }
      y += height;
      h -= height;
    }
    rest = rest.slice(row.length);
  }
  return out;
}

// Dark text on light language colours, white on dark ones.
function textColor(color) {
  const hex = color.length < 7 ? color.replace(/[\da-f]/gi, '$&$&') : color;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6 ? '#1f2328' : '#ffffff';
}

/** Repositories as a treemap: area by stars, colour by language. */
export function renderTreemap(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Repositories`;
  const repos = stats.topRepos.filter((repo) => repo.stars > 0).slice(0, MAX_REPOS);
  const cells = squarify(
    repos.map((repo) => ({ ...repo, value: repo.stars })),
    AREA,
  )
    .map(({ item, x, y, w, h }, i) => {
      const fill = item.languageColor ? ` fill="${item.languageColor}"` : '';
      const ink = item.languageColor ? textColor(item.languageColor) : null;
      const inkAttr = ink ? ` fill="${ink}"` : '';
      const inkClass = ink ? '' : ' on-accent';
      const name = truncate(item.name, w - 16, 12, 700);
      const count = formatCount(item.stars);
      const showName = w > 46 && h > 24 && name.length > 1;
      const showStars = showName && h > 44 && w > measureText(count, 11) + 34;
      const label = showName
        ? `<text x="${r1(x + 8)}" y="${r1(y + 18)}" class="cell-name${inkClass}"${inkAttr}>${escapeXml(name)}</text>`
        : '';
      const stars = showStars
        ? `<g opacity=".85">${icon(STAR_PATH, { x: r1(x + 8), y: r1(y + 26), size: 11, className: `cell-icon${inkClass}` }).replace('<path', `<path${inkAttr}`)}<text x="${r1(x + 23)}" y="${r1(y + 36)}" class="cell-stars${inkClass}"${inkAttr}>${count}</text></g>`
        : '';
      return `<g class="pop"${delay(options, 100 + i * 70)}>
        <rect x="${r1(x + 1.5)}" y="${r1(y + 1.5)}" width="${r1(Math.max(0, w - 3))}" height="${r1(Math.max(0, h - 3))}" rx="5"${fill} class="cell${item.languageColor ? '' : ' accent'}"><title>${escapeXml(`${item.name}: ${formatExact(item.stars)} stars`)}</title></rect>
        ${label}${stars}
      </g>`;
    })
    .join('');

  const body = repos.length
    ? `${cells}<text x="25" y="${HEIGHT - 9}" class="note fade"${delay(options, 900)}>${escapeXml(`${formatExact(stats.totalStars)} stars across ${formatExact(stats.starredRepoCount)} repositories · area by stars, colour by language`)}</text>`
    : `<text x="${WIDTH / 2}" y="150" class="note" text-anchor="middle">No starred repositories yet</text>`;

  const css = `
    .cell{fill-opacity:.9}
    .cell-name{font-size:12px;font-weight:700}
    .cell-stars{font-size:11px;font-weight:600}
    .on-accent{fill:var(--bg)}
    .note{font-size:11px;fill:var(--muted)}
    ${
      options.animate
        ? `@keyframes ags-pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
    .pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:ags-pop .6s cubic-bezier(.22,1,.36,1) forwards}
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
    label: `${stats.name}'s repositories by stars: ${repos.map((r) => `${r.name} ${r.stars}`).join(', ')}`,
  });
}
