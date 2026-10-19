#!/usr/bin/env node
// Render a card to a file, e.g. from a GitHub Actions workflow:
//   awesome-git-stats --username octocat --theme dracula --out stars.svg
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { createCard } from '../src/handler.js';

const STRING_OPTIONS = [
  'username',
  'layout',
  'theme',
  'custom_title',
  'label',
  'count',
  'langs_count',
  'exclude',
  'hide',
  'border_radius',
  'bg_color',
  'border_color',
  'title_color',
  'text_color',
  'muted_color',
  'accent_color',
  'track_color',
];
const BOOLEAN_OPTIONS = ['hide_border', 'hide_title', 'disable_animations', 'include_forks'];

const { values } = parseArgs({
  options: {
    ...Object.fromEntries(STRING_OPTIONS.map((name) => [name, { type: 'string' }])),
    ...Object.fromEntries(BOOLEAN_OPTIONS.map((name) => [name, { type: 'boolean' }])),
    out: { type: 'string', short: 'o', default: 'stars.svg' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help || !values.username) {
  console.log(`Usage: awesome-git-stats --username <name> [options] [--out stars.svg]

Options mirror the URL parameters documented in the README, e.g.
  --layout overview|repos|compact|badge   --theme tokyonight
  --count 5   --exclude repo-a,repo-b     --hide_border   --disable_animations

Set GITHUB_TOKEN to use the GraphQL API (recommended).`);
  process.exit(values.help ? 0 : 1);
}

const query = {};
for (const name of STRING_OPTIONS) if (values[name] !== undefined) query[name] = values[name];
for (const name of BOOLEAN_OPTIONS) if (values[name]) query[name] = 'true';

const { status, svg } = await createCard(query);
await writeFile(values.out, `${svg}\n`);
if (status !== 200) {
  console.error(
    `Failed to render card (HTTP ${status}). An error card was written to ${values.out}.`,
  );
  process.exit(1);
}
console.log(`Wrote ${values.out}`);
