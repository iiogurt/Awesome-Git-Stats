import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOptions } from '../src/options.js';
import { ART_DESCRIPTIONS, ART_STYLES, createRandom } from '../src/render/art.js';
import { renderCard } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { categories, designs, themeNames, themes } from '../src/themes.js';
import { sampleAccount } from './fixtures/account.js';

function render(query, username = 'stellar-dev') {
  return renderCard(computeStats(sampleAccount), parseOptions({ username, ...query }));
}

function assertWellFormed(svg) {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  assert.doesNotMatch(svg, /undefined|NaN|<script/i);
  const opened = (svg.match(/<g[\s>]/g) ?? []).length;
  const closed = (svg.match(/<\/g>/g) ?? []).length;
  assert.equal(opened, closed, 'unbalanced <g> tags');
  // Raw "<" or "&" in text (say, a glyph used as art) would make the whole image invalid.
  assert.doesNotMatch(svg, /<(?![a-zA-Z/!])/, 'unescaped <');
  assert.doesNotMatch(svg, /&(?!(amp|lt|gt|quot|#\d+);)/, 'unescaped &');
}

describe('createRandom', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = createRandom('seed');
    const b = createRandom('seed');
    const c = createRandom('other');
    const first = [a(), a(), a()];
    assert.deepEqual(first, [b(), b(), b()]);
    assert.notDeepEqual(first, [c(), c(), c()]);
    for (const n of first) assert.ok(n >= 0 && n < 1);
  });
});

describe('art styles', () => {
  for (const art of ART_STYLES) {
    it(`renders ${art} on every layout`, () => {
      for (const layout of ['overview', 'repos', 'compact', 'dashboard']) {
        const svg = render({ layout, theme: 'dark', art });
        assertWellFormed(svg);
        assert.match(svg, /class="art-layer"/);
      }
    });
  }

  it('gives each account its own art, and the same account the same art', () => {
    const a = render({ art: 'starfield' }, 'alice');
    assert.equal(a, render({ art: 'starfield' }, 'alice'));
    const layer = (svg) => svg.match(/<g class="art-layer"[\s\S]*?<\/g>/)[0];
    assert.notEqual(layer(a), layer(render({ art: 'starfield' }, 'bob')));
  });

  it('uses the theme default, can be switched off and ignores unknown styles', () => {
    assert.match(render({ theme: 'starry_night' }), /art-layer/);
    assert.doesNotMatch(render({ theme: 'starry_night', art: 'none' }), /art-layer/);
    assert.doesNotMatch(render({ theme: 'dark' }), /art-layer/);
    assert.match(render({ theme: 'starry_night', art: 'bogus' }), /art-layer/);
    assert.equal(parseOptions({ username: 'x', art: 'BOKEH' }).art, 'bokeh');
    assert.equal(parseOptions({ username: 'x', art: 'bogus' }).art, undefined);
  });

  it('never decorates the badge', () => {
    assert.doesNotMatch(render({ layout: 'badge', theme: 'starry_night' }), /art-layer/);
  });

  it('respects disable_animations and reduced motion', () => {
    for (const art of ART_STYLES) {
      assert.doesNotMatch(render({ art, disable_animations: 'true' }), /@keyframes/, art);
      assert.match(render({ art }), /prefers-reduced-motion: reduce\)\{\.art-layer/, art);
    }
  });
});

describe('artistic themes', () => {
  it('only use known art styles and fonts', () => {
    for (const [name, theme] of Object.entries(themes)) {
      if (theme.art) assert.ok(ART_STYLES.includes(theme.art), name);
      if (theme.font) assert.ok(['sans', 'mono', 'serif'].includes(theme.font), name);
    }
  });

  it('never put CSS variables in presentation attributes', () => {
    for (const theme of themeNames) {
      for (const layout of ['overview', 'repos', 'compact', 'badge']) {
        assert.doesNotMatch(render({ theme, layout }), /="var\(/, `${theme}/${layout}`);
      }
    }
    for (const art of ART_STYLES) assert.doesNotMatch(render({ art }), /="var\(/, art);
  });

  it('apply fonts, glow and border width', () => {
    assert.match(render({ theme: 'terminal' }), /monospace/);
    assert.match(render({ theme: 'parchment' }), /Georgia/);
    assert.match(render({ theme: 'synthwave' }), /drop-shadow/);
    assert.doesNotMatch(render({ theme: 'dark' }), /drop-shadow/);
    assert.match(render({ theme: 'pop_art' }), /stroke-width:3/);
  });
});

describe('link builder', () => {
  it('offers every design and art style', async () => {
    const { readFile } = await import('node:fs/promises');
    const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
    // The page's own code, formatted by Prettier, so evaluate rather than JSON.parse it.
    const source = html.match(/const CATALOG = (\{[\s\S]*?\});\n/)[1];
    const catalog = new Function(`return ${source}`)();
    assert.deepEqual(catalog.designs, designs, 'run npm run examples');
    assert.deepEqual(catalog.categories, categories);
    assert.deepEqual(Object.keys(catalog.art), ART_STYLES);
  });

  it('describes every art style', () => {
    for (const art of ART_STYLES) assert.ok(ART_DESCRIPTIONS[art], art);
  });
});
