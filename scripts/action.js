#!/usr/bin/env node
// Entry point for the GitHub Action defined in action.yml. Inputs arrive as
// environment variables so they are never interpolated into a shell.
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createCard } from '../src/handler.js';

const env = process.env;
const query = {
  ...Object.fromEntries(new URLSearchParams(env.INPUT_OPTIONS ?? '')),
  username: env.INPUT_USERNAME,
  layout: env.INPUT_LAYOUT || undefined,
  theme: env.INPUT_THEME || undefined,
};
const path = env.INPUT_PATH || 'awesome-git-stats.svg';

const { status, svg } = await createCard(query, { env: {}, token: env.INPUT_TOKEN });
if (status !== 200) {
  console.error(
    `::error::Could not render the card (HTTP ${status}). Existing file left untouched.`,
  );
  process.exit(1);
}
await mkdir(dirname(path), { recursive: true });
await writeFile(path, `${svg}\n`);
if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `path=${path}\n`);
console.log(`Wrote ${path}`);
