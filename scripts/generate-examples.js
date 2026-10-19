#!/usr/bin/env node
// Renders example cards from fixture data into assets/examples so the README
// can show previews without hitting the GitHub API.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { themeNames } from '../src/themes.js';
import { sampleAccount } from '../test/fixtures/account.js';

const outDir = fileURLToPath(new URL('../assets/examples/', import.meta.url));

function render(query) {
  const options = parseOptions({ username: sampleAccount.login, ...query });
  const languages =
    options.layout === 'overview' ? Math.min(options.langsCount, 4) : options.langsCount;
  return renderCard(computeStats(sampleAccount, { languages }), options);
}

const files = {
  'overview.svg': render({}),
  'repos.svg': render({ layout: 'repos', theme: 'tokyonight' }),
  'compact.svg': render({ layout: 'compact', theme: 'dracula' }),
  'badge.svg': render({ layout: 'badge', theme: 'github_dark' }),
  'auto.svg': render({ theme: 'auto' }),
};
for (const theme of themeNames) {
  files[`theme-${theme}.svg`] = render({ layout: 'compact', theme, disable_animations: 'true' });
}

await mkdir(outDir, { recursive: true });
await Promise.all(
  Object.entries(files).map(([name, svg]) =>
    writeFile(new URL(name, `file://${outDir}`), `${svg}\n`),
  ),
);
console.log(`Wrote ${Object.keys(files).length} examples to assets/examples/`);
