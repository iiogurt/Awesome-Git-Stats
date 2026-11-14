import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { harmonise, themeTone } from '../src/colors.js';
import { ART_STYLES, ART_UNDER_CONTENT } from '../src/render/art.js';
import { designs, themes } from '../src/themes.js';
import { parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { sampleAccount } from './fixtures/account.js';

const LANGUAGES = ['#3178c6', '#dea584', '#00ADD8', '#3572A5', '#f1e05a', '#199f4b', '#555'];
const hueOf = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const apart = (a, b) => Math.abs(((b - a + 540) % 360) - 180);
const render = (query) =>
  renderCard(
    computeStats(sampleAccount, { languages: 4 }),
    parseOptions({ username: 'stellar-dev', disable_animations: 'true', ...query }),
  );

describe('themeTone', () => {
  it('finds the single hue of a one-colour theme', () => {
    const tone = themeTone(themes.terminal);
    assert.equal(tone.mono, true);
    assert.ok(apart(tone.hue, 120) < 30, `hue ${tone.hue}`);
  });

  it('has no hue for black and white, and none to lean to in a mixed theme', () => {
    assert.deepEqual(
      [themeTone(themes.pulsar_light).mono, themeTone(themes.pulsar_light).hue],
      [true, null],
    );
    assert.equal(themeTone(themes.synthwave).mono, false);
  });
});

describe('harmonise', () => {
  it('returns valid colours for every design', () => {
    for (const design of designs) {
      for (const name of [design.light, design.dark]) {
        const tone = themeTone(themes[name]);
        for (const color of LANGUAGES) assert.match(harmonise(color, tone), /^#[0-9a-f]{6}$/, name);
      }
    }
  });

  it('keeps every language within reach of a one-colour theme, and still apart', () => {
    const tone = themeTone(themes.terminal);
    const out = LANGUAGES.slice(0, 6).map((color) => harmonise(color, tone));
    for (const color of out) assert.ok(apart(hueOf(color), tone.hue) <= 25, color);
    assert.equal(new Set(out).size, out.length);
  });

  it('turns languages to greys in a black and white theme', () => {
    const tone = themeTone(themes.pulsar_light);
    for (const color of LANGUAGES) assert.equal(hueOf(harmonise(color, tone)), null);
  });

  it('keeps hues in a theme of several colours', () => {
    const tone = themeTone(themes.synthwave);
    for (const color of LANGUAGES.slice(0, 6)) {
      assert.ok(apart(hueOf(harmonise(color, tone)), hueOf(color.toLowerCase())) < 4, color);
    }
  });
});

describe('language colours on cards', () => {
  it("are GitHub's on classic themes and toned on designs with art", () => {
    assert.match(render({ theme: 'dracula' }), /stroke="#3178c6"/);
    const terminal = render({ theme: 'terminal' });
    assert.doesNotMatch(terminal, /#3178c6/);
    assert.match(render({ theme: 'terminal', lang_colors: 'github' }), /stroke="#3178c6"/);
    assert.doesNotMatch(render({ theme: 'dracula', lang_colors: 'theme' }), /stroke="#3178c6"/);
  });

  it('are toned in every layout that shows them', () => {
    for (const layout of ['repos', 'compact', 'languages', 'treemap', 'dashboard']) {
      assert.doesNotMatch(render({ layout, theme: 'terminal' }), /#3178c6/i, layout);
    }
  });
});

describe('art under the content', () => {
  it('names only known styles, with a strength between 0 and 1', () => {
    for (const [style, strength] of Object.entries(ART_UNDER_CONTENT)) {
      assert.ok(ART_STYLES.includes(style), style);
      assert.ok(strength > 0 && strength < 1, style);
    }
  });

  it('fades busy art under the content and leaves scenery whole', () => {
    const busy = render({ theme: 'matrix' });
    assert.match(busy, /<mask id="ags-artmask"/);
    assert.match(busy, /<g mask="url\(#ags-artmask\)">/);
    assert.doesNotMatch(render({ theme: 'starry_night' }), /ags-artmask/);
    assert.doesNotMatch(render({ theme: 'dracula' }), /ags-artmask/);
    assert.doesNotMatch(busy, /<filter|feGaussianBlur/);
  });
});
