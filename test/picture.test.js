import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { promisify } from 'node:util';
import { PROJECT_URL, darkPath, pictureHtml, variantQueries } from '../src/picture.js';

describe('darkPath', () => {
  it('adds -dark before the extension', () => {
    assert.equal(darkPath('assets/stars.svg'), 'assets/stars-dark.svg');
    assert.equal(darkPath('my.cards/stars'), 'my.cards/stars-dark');
  });
});

describe('variantQueries', () => {
  const base = { username: 'octocat', theme: 'catppuccin_latte' };

  it('renders only one card without dark settings', () => {
    const { light, dark } = variantQueries({ base, options: 'count=8' });
    assert.deepEqual(light, { count: '8', ...base });
    assert.equal(dark, null);
  });

  it('shares options and lets dark options win', () => {
    const { light, dark } = variantQueries({
      base,
      options: 'art=sakura&hide_border=true',
      darkTheme: 'tokyonight',
      darkOptions: 'art=starfield',
    });
    assert.equal(light.art, 'sakura');
    assert.deepEqual(dark, {
      username: 'octocat',
      theme: 'tokyonight',
      art: 'starfield',
      hide_border: 'true',
    });
  });

  it('uses the matching light and dark variant of a design', () => {
    const { light, dark } = variantQueries({
      base: { username: 'octocat', theme: 'tokyonight' },
      options: 'hide_border=true',
      darkTheme: 'match',
      darkOptions: 'art=starfield',
    });
    assert.equal(light.theme, 'tokyonight_light');
    assert.equal(dark.theme, 'tokyonight');
    assert.equal(light.hide_border, 'true');
    assert.equal(dark.art, 'starfield');
    assert.equal(light.art, undefined);
  });

  it('matches the default theme when none is given', () => {
    const { light, dark } = variantQueries({ base: { username: 'octocat' }, darkTheme: 'match' });
    assert.equal(light.theme, 'default');
    assert.equal(dark.theme, 'dark');
  });

  it('renders a dark card from dark options alone', () => {
    const { dark } = variantQueries({ base, darkOptions: 'bg_color=000000' });
    assert.equal(dark.theme, 'catppuccin_latte');
    assert.equal(dark.bg_color, '000000');
  });
});

describe('pictureHtml', () => {
  it('uses the dark source for dark mode and escapes attributes', () => {
    const html = pictureHtml({ light: '/a?x=1&y=2', dark: 'b.svg', alt: 'My "stars"' });
    assert.match(html, /<source media="\(prefers-color-scheme: dark\)" srcset="b\.svg" \/>/);
    assert.match(html, /src="\/a\?x=1&amp;y=2"/);
    assert.match(html, /alt="My &quot;stars&quot;"/);
    assert.doesNotMatch(html, /<a /);
  });

  it('wraps the card in a link when given one', () => {
    const html = pictureHtml({ light: 'a.svg', dark: 'b.svg', href: PROJECT_URL });
    assert.match(
      html,
      /^<a href="https:\/\/github\.com\/iiogurt\/Awesome-Git-Stats">\n {2}<picture>/,
    );
    assert.match(html, /<\/picture>\n<\/a>$/);
  });
});

describe('GitHub Action script', () => {
  const run = promisify(execFile);
  const fakeFetch = new URL('./fixtures/fake-fetch.js', import.meta.url).href;
  const script = new URL('../scripts/action.js', import.meta.url).pathname;

  it('writes a light and a dark card', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ags-action-'));
    try {
      const summary = join(dir, 'summary.md');
      await run(process.execPath, ['--import', fakeFetch, script], {
        cwd: dir,
        env: {
          ...process.env,
          INPUT_USERNAME: 'octocat',
          INPUT_THEME: 'catppuccin_latte',
          INPUT_DARK_THEME: 'tokyonight',
          INPUT_DARK_OPTIONS: 'art=starfield',
          INPUT_PATH: 'assets/stars.svg',
          INPUT_TOKEN: 't',
          GITHUB_OUTPUT: join(dir, 'output'),
          GITHUB_STEP_SUMMARY: summary,
        },
      });
      const lightSvg = await readFile(join(dir, 'assets/stars.svg'), 'utf8');
      const darkSvg = await readFile(join(dir, 'assets/stars-dark.svg'), 'utf8');
      assert.match(lightSvg, /--bg:#eff1f5/);
      assert.match(darkSvg, /--bg:#1a1b27/);
      assert.match(darkSvg, /art-layer/);
      assert.equal(
        await readFile(join(dir, 'output'), 'utf8'),
        'path=assets/stars.svg\ndark-path=assets/stars-dark.svg\n',
      );
      const text = await readFile(summary, 'utf8');
      assert.match(text, /srcset="assets\/stars-dark\.svg"/);
      assert.match(text, /<a href="https:\/\/github\.com\/iiogurt\/Awesome-Git-Stats">/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
