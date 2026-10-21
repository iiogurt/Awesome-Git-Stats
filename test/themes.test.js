import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { categories, designs, themeNames, themePair, themes } from '../src/themes.js';

// WCAG relative luminance of a #rrggbb colour.
function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every colour the background can have: the plain colour and all gradient stops.
const backgrounds = (theme) => [theme.bg, ...(theme.gradient?.slice(1) ?? [])];
const stops = (theme) => theme.gradient?.slice(1) ?? [];

describe('designs', () => {
  it('give every theme exactly one light and dark pair', () => {
    const members = designs.flatMap((d) => [d.light, d.dark]);
    assert.equal(new Set(members).size, members.length, 'a theme is in two designs');
    for (const name of themeNames.filter((n) => !['light', 'auto'].includes(n))) {
      assert.ok(members.includes(name), `${name} has no design`);
    }
    for (const name of members) assert.ok(themes[name], `unknown theme ${name}`);
  });

  it('sort every design into a category, with art unless it is classic', () => {
    for (const { id, category, artistic, light } of designs) {
      assert.ok(category in categories, `${id} category`);
      assert.equal(category === 'classic', !artistic, `${id} artistic`);
      assert.equal(Boolean(themes[light].art), Boolean(artistic), `${id} art`);
    }
    for (const category of Object.keys(categories)) {
      assert.ok(
        designs.some((d) => d.category === category),
        `${category} is empty`,
      );
    }
  });

  it('put a light theme in light mode and a dark theme in dark mode', () => {
    for (const { id, light, dark } of designs) {
      for (const bg of backgrounds(themes[light])) assert.ok(luminance(bg) > 0.5, `${id} light`);
      assert.ok(luminance(themes[dark].bg) < 0.1, `${id} dark`);
      for (const bg of stops(themes[dark])) assert.ok(luminance(bg) < 0.25, `${id} dark`);
    }
  });

  it('keep the art style and font of a design in both modes', () => {
    for (const { id, light, dark } of designs) {
      assert.equal(themes[light].art, themes[dark].art, `${id} art`);
      assert.equal(themes[light].font, themes[dark].font, `${id} font`);
    }
  });

  it('keep text readable in every theme', () => {
    for (const name of themeNames) {
      const theme = themes[name];
      assert.ok(contrast(theme.title, theme.bg) >= 3, `${name} title`);
      assert.ok(contrast(theme.text, theme.bg) >= 4.5, `${name} text`);
      assert.ok(contrast(theme.muted, theme.bg) >= 3, `${name} muted`);
      // Text only covers part of a gradient, so its far stops get a looser limit.
      for (const bg of stops(theme)) {
        assert.ok(contrast(theme.title, bg) >= 3, `${name} title on ${bg}`);
        assert.ok(contrast(theme.text, bg) >= 3, `${name} text on ${bg}`);
      }
    }
  });
});

describe('themePair', () => {
  it('finds the matching variant from either side', () => {
    const tokyo = { light: 'tokyonight_light', dark: 'tokyonight' };
    assert.deepEqual(themePair('tokyonight'), tokyo);
    assert.deepEqual(themePair('tokyonight_light'), tokyo);
    assert.deepEqual(themePair('sakura'), { light: 'sakura', dark: 'sakura_dark' });
  });

  it('maps the plain light, dark and auto themes to GitHub colours', () => {
    for (const name of ['default', 'light', 'dark', 'auto', 'unknown']) {
      assert.deepEqual(themePair(name), { light: 'default', dark: 'dark' });
    }
  });
});
