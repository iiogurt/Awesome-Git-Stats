import {
  FORK_PATH,
  GIST_PATH,
  REPO_PATH,
  STAR_PATH,
  delay,
  escapeXml,
  formatCount,
  icon,
  measureText,
  renderFrame,
  truncate,
  wrapText,
} from './common.js';

const WIDTH = 400;
const HEIGHT = 120;

function badge(text, x) {
  const width = measureText(text, 10) + 14;
  return {
    width,
    svg: `<rect x="${x}" y="19" width="${width.toFixed(1)}" height="18" rx="9" class="badge"/>
      <text x="${(x + width / 2).toFixed(1)}" y="31.5" class="badge-text" text-anchor="middle">${escapeXml(text)}</text>`,
  };
}

// The footer row: language, stars and forks, each only when known.
function footer(item, options) {
  let x = 25;
  const parts = [];
  if (item.language) {
    const fill = item.languageColor ? ` fill="${item.languageColor}"` : ' class="accent"';
    parts.push(`<circle cx="${x + 6}" cy="98" r="6"${fill}/>
      <text x="${x + 18}" y="102" class="meta">${escapeXml(truncate(item.language, 110, 12))}</text>`);
    x += measureText(truncate(item.language, 110, 12), 12) + 36;
  }
  for (const [path, count] of [
    [STAR_PATH, item.stars],
    [FORK_PATH, item.forks],
  ]) {
    if (count == null) continue;
    const text = formatCount(count);
    parts.push(
      `${icon(path, { x, y: 90, size: 15 })}<text x="${x + 21}" y="102" class="meta">${text}</text>`,
    );
    x += measureText(text, 12) + 44;
  }
  return `<g class="rise"${delay(options, 300)}>${parts.join('')}</g>`;
}

function renderPinned(item, options, { path, name, badges, label }) {
  // Badges sit right after the name, so leave them room and measure the name first.
  const shown = truncate(name, WIDTH - 75 - badges.length * 70, 16, 700);
  let badgeX = 50 + measureText(shown, 16, 700) + 10;
  const badgeSvg = [];
  for (const text of badges) {
    const b = badge(text, badgeX);
    badgeSvg.push(b.svg);
    badgeX += b.width + 6;
  }
  const description = item.description
    ? wrapText(item.description, WIDTH - 50, { fontSize: 12, maxLines: 2 })
    : ['No description'];
  const body = `
    <g class="fade">
      ${icon(path, { x: 25, y: 20, size: 16 })}
      <text x="50" y="34" class="pin-title">${escapeXml(shown)}</text>
      ${badgeSvg.join('')}
    </g>
    <g class="fade"${delay(options, 150)}>${description
      .map((line, i) => `<text x="25" y="${60 + i * 17}" class="desc">${escapeXml(line)}</text>`)
      .join('')}</g>
    ${footer(item, options)}`;
  const css = `
    .pin-title{font-size:16px;font-weight:700;fill:var(--title)}
    .desc{font-size:12px;fill:var(--text)}
    .meta{font-size:12px;fill:var(--muted)}
    .badge{fill:none;stroke:var(--muted);stroke-opacity:.6}
    .badge-text{font-size:10px;fill:var(--muted)}`;
  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title: null,
    body,
    css,
    label,
  });
}

/** A pinned repository: name, description, language, stars and forks. */
export function renderPin(repo, options) {
  const badges = [
    repo.isArchived && 'Archived',
    repo.isTemplate && 'Template',
    repo.isFork && 'Fork',
  ].filter(Boolean);
  const name =
    options.customTitle ??
    (options.repo?.owner.toLowerCase() === options.username.toLowerCase()
      ? repo.name
      : (repo.fullName ?? repo.name));
  return renderPinned(repo, options, {
    path: REPO_PATH,
    name,
    badges,
    label: `${repo.fullName ?? repo.name}: ${repo.description || 'repository'}, ${repo.stars} stars`,
  });
}

/** A pinned gist: file name, description, language, stars and forks. */
export function renderGist(gist, options) {
  return renderPinned(gist, options, {
    path: GIST_PATH,
    name: options.customTitle ?? gist.name,
    badges: gist.isFork ? ['Fork'] : [],
    label: `Gist ${gist.name}: ${gist.description || 'no description'}`,
  });
}
