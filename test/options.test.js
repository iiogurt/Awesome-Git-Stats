import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CACHE, OptionsError, isValidUsername, parseOptions } from '../src/options.js';
import { resolveTheme, themes } from '../src/themes.js';

describe('isValidUsername', () => {
  it('accepts valid GitHub logins', () => {
    for (const name of ['octocat', 'a', 'my-user-1', 'A1']) assert.ok(isValidUsername(name), name);
  });

  it('rejects invalid logins', () => {
    for (const name of [
      '',
      '-start',
      'end-',
      'double--dash',
      'x'.repeat(40),
      'bad name',
      '../etc',
    ]) {
      assert.ok(!isValidUsername(name), name);
    }
  });
});

describe('parseOptions', () => {
  it('requires a username', () => {
    assert.throws(() => parseOptions({}), OptionsError);
    assert.throws(() => parseOptions({ username: 'not valid' }), /Invalid/);
  });

  it('applies defaults', () => {
    const options = parseOptions({ username: 'octocat' });
    assert.equal(options.layout, 'overview');
    assert.equal(options.themeName, 'default');
    assert.equal(options.animate, true);
    assert.equal(options.count, 5);
    assert.equal(options.cacheSeconds, CACHE.default);
    assert.equal(options.label, 'stars');
  });

  it('falls back on unknown layout and theme instead of failing', () => {
    const options = parseOptions({ username: 'octocat', layout: 'nope', theme: 'nope' });
    assert.equal(options.layout, 'overview');
    assert.equal(options.themeName, 'default');
  });

  it('parses booleans, lists and clamps numbers', () => {
    const options = parseOptions({
      username: 'octocat',
      hide_border: '',
      disable_animations: 'true',
      count: '50',
      border_radius: '-4',
      cache_seconds: '1',
      exclude: 'a, b ,,c',
      hide: 'Forks',
    });
    assert.equal(options.hideBorder, true);
    assert.equal(options.animate, false);
    assert.equal(options.count, 10);
    assert.equal(options.radius, 0);
    assert.equal(options.cacheSeconds, CACHE.min);
    assert.deepEqual(options.exclude, ['a', 'b', 'c']);
    assert.deepEqual(options.hide, ['forks']);
  });

  it('uses the first value of repeated parameters', () => {
    assert.equal(parseOptions({ username: ['octocat', 'other'] }).username, 'octocat');
  });
});

describe('themes', () => {
  const tokens = ['bg', 'border', 'title', 'text', 'muted', 'accent', 'track'];

  it('every theme defines every colour token', () => {
    for (const [name, theme] of Object.entries(themes)) {
      for (const token of tokens) assert.ok(theme[token], `${name}.${token}`);
    }
  });

  it('applies valid overrides and ignores invalid ones', () => {
    const theme = resolveTheme('sunset', { bg: '123456', title: 'red;}<script>', accent: '#abc' });
    assert.equal(theme.bg, '#123456');
    assert.equal(theme.gradient, undefined);
    assert.equal(theme.title, themes.sunset.title);
    assert.equal(theme.accent, '#abc');
  });

  it('drops the dark variant of auto when overridden', () => {
    assert.ok(resolveTheme('auto').dark);
    assert.equal(resolveTheme('auto', { accent: 'ff0000' }).dark, undefined);
  });
});
