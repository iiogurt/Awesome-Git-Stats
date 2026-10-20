#!/usr/bin/env node
// Entry point for the GitHub Action defined in action.yml. Inputs arrive as
// environment variables so they are never interpolated into a shell.
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createCard } from '../src/handler.js';
import { darkPath, pictureHtml, variantQueries } from '../src/picture.js';

const env = process.env;
const { light, dark } = variantQueries({
  base: {
    username: env.INPUT_USERNAME,
    ...(env.INPUT_LAYOUT ? { layout: env.INPUT_LAYOUT } : {}),
    ...(env.INPUT_THEME ? { theme: env.INPUT_THEME } : {}),
  },
  options: env.INPUT_OPTIONS,
  darkTheme: env.INPUT_DARK_THEME,
  darkOptions: env.INPUT_DARK_OPTIONS,
});
const path = env.INPUT_PATH || 'awesome-git-stats.svg';
const cards = [{ query: light, path }];
if (dark) cards.push({ query: dark, path: env.INPUT_DARK_PATH || darkPath(path) });

// Render everything before writing anything, so a failure leaves all files untouched.
const rendered = [];
for (const card of cards) {
  const { status, svg } = await createCard(card.query, { env: {}, token: env.INPUT_TOKEN });
  if (status !== 200) {
    console.error(
      `::error::Could not render ${card.path} (HTTP ${status}). Existing files left untouched.`,
    );
    process.exit(1);
  }
  rendered.push({ ...card, svg });
}
for (const { path: file, svg } of rendered) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${svg}\n`);
  console.log(`Wrote ${file}`);
}

const outputs = [`path=${path}`, `dark-path=${dark ? cards[1].path : ''}`];
if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
if (dark && env.GITHUB_STEP_SUMMARY) {
  const snippet = pictureHtml({ light: path, dark: cards[1].path });
  await appendFile(
    env.GITHUB_STEP_SUMMARY,
    `### Light and dark card\n\nPaste this into your README (paths relative to it):\n\n\`\`\`html\n${snippet}\n\`\`\`\n`,
  );
}
