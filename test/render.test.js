import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LAYOUTS, parseOptions } from '../src/options.js';
import { FINISH_NAMES } from '../src/render/materials.js';
import { renderCard, renderError } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { themeNames } from '../src/themes.js';
import { sampleAccount, sampleGist, sampleRepo } from './fixtures/account.js';

function render(query, account = sampleAccount) {
  const options = parseOptions({
    username: 'stellar-dev',
    repo: 'nebula-ui',
    gist: sampleGist.id,
    ...query,
  });
  // Pinned repositories and gists are rendered from their own data.
  if (options.layout === 'pin') return renderCard(sampleRepo, options);
  if (options.layout === 'gist') return renderCard(sampleGist, options);
  return renderCard(computeStats(account), options);
}

function assertWellFormed(svg) {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  assert.doesNotMatch(svg, /<script/i);
  assert.doesNotMatch(svg, /undefined|NaN/);
  const opened = (svg.match(/<g[\s>]/g) ?? []).length;
  const closed = (svg.match(/<\/g>/g) ?? []).length;
  assert.equal(opened, closed, 'unbalanced <g> tags');
  // Every gradient, pattern and clip path a card refers to is defined in it.
  const defined = new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  for (const [, id] of svg.matchAll(/url\(#([^)]+)\)/g)) {
    assert.ok(defined.has(id), `url(#${id}) has no definition`);
  }
}

describe('renderCard', () => {
  for (const layout of LAYOUTS) {
    for (const theme of themeNames) {
      it(`renders ${layout} with the ${theme} theme`, () => {
        assertWellFormed(render({ layout, theme }));
      });
    }
  }

  it('shows the total and the top repositories', () => {
    assert.match(render({}), /17,656/);
    const repos = render({ layout: 'repos', count: '3' });
    assert.match(repos, /nebula-ui/);
    assert.match(repos, /orbit-cli/);
    assert.doesNotMatch(repos, /pulsar-ml/);
  });

  it('escapes user controlled text', () => {
    const account = {
      ...sampleAccount,
      name: '<img src=x onerror=alert(1)>',
      repos: [{ ...sampleAccount.repos[0], name: '"><script>alert(1)</script>' }],
    };
    for (const layout of LAYOUTS) {
      const svg = render({ layout, custom_title: '</text><script>' }, account);
      assertWellFormed(svg);
      assert.doesNotMatch(svg, /<img/);
    }
  });

  it('removes animations when disabled', () => {
    assert.match(render({}), /@keyframes/);
    assert.doesNotMatch(render({ disable_animations: 'true' }), /@keyframes|animation-delay/);
  });

  it('respects hide_title, hide_border and hide', () => {
    const svg = render({ hide_title: 'true', hide_border: 'true', hide: 'forks,followers' });
    assert.doesNotMatch(svg, /class="title/);
    assert.match(svg, /stroke-opacity:0/);
    assert.doesNotMatch(svg, />forks</);
    assert.doesNotMatch(svg, />followers</);
    assert.match(svg, />public repos</);
  });

  it('includes a dark variant for the auto theme', () => {
    assert.match(render({ theme: 'auto' }), /prefers-color-scheme: dark/);
  });

  it('renders empty accounts gracefully', () => {
    const empty = { login: 'empty', name: 'Empty', repos: [], totalRepos: 0 };
    for (const layout of LAYOUTS) assertWellFormed(render({ layout }, empty));
  });

  it('uses a custom badge label', () => {
    assert.match(render({ layout: 'badge', label: 'stargazers' }), />stargazers</);
  });
});

describe('renderError', () => {
  it('renders a themed error card', () => {
    const options = parseOptions({ username: 'x', theme: 'dracula' });
    const svg = renderError({ message: 'User not found', code: 'NOT_FOUND' }, options);
    assertWellFormed(svg);
    assert.match(svg, /User not found/);
    assert.match(svg, /Double-check/);
  });
});

describe('repos without a language', () => {
  it('fall back to the theme accent through a class', () => {
    const account = {
      ...sampleAccount,
      repos: [{ ...sampleAccount.repos[0], language: 'Mystery', languageColor: null }],
    };
    const svg = render({ layout: 'repos' }, account);
    assert.match(svg, /<g class="grow"[^>]*><rect[^>]*class="accent halo"/);
    assert.doesNotMatch(svg, /fill="var\(/);
  });
});

describe('materials', () => {
  it('give bars, rings and legend dots gloss and depth', () => {
    const svg = render({ layout: 'languages', lang_style: 'donut' });
    assert.match(svg, /fill="url\(#ags-sphere\)"/);
    assert.match(svg, /stroke="url\(#ags-ring-light\)"/);
    assert.match(svg, /class="glass"/);
    assert.match(render({ layout: 'repos' }), /fill="url\(#ags-inset\)"/);
  });

  it('only define the gradients a card uses', () => {
    const svg = render({ layout: 'badge' });
    assert.doesNotMatch(svg, /ags-sheen|ags-sphere/);
    const pie = render({ layout: 'languages', lang_style: 'pie' });
    assert.match(pie, /id="ags-dome"/);
    assert.doesNotMatch(pie, /id="ags-inset"/);
  });
});

describe('finishes', () => {
  const stopsOf = (svg, id) => svg.match(new RegExp(`id="${id}"[^>]*>(.*?)</`))[1];

  it('render every layout well formed in every finish', () => {
    for (const layout of LAYOUTS) {
      for (const finish of FINISH_NAMES) {
        for (const theme of ['tokyonight', 'light']) {
          assertWellFormed(render({ layout, finish, theme }));
          assertWellFormed(render({ layout, finish, theme, disable_animations: 'true' }));
        }
      }
    }
  });

  it('look different from each other', () => {
    const cards = FINISH_NAMES.map((finish) => render({ layout: 'dashboard', finish }));
    assert.equal(new Set(cards).size, FINISH_NAMES.length);
  });

  it('keep the gloss as the default', () => {
    assert.equal(render({ layout: 'repos' }), render({ layout: 'repos', finish: 'gloss' }));
    assert.equal(render({ layout: 'repos', finish: 'velvet' }), render({ layout: 'repos' }));
  });

  it('cut pixel shapes into a mosaic with square corners', () => {
    const svg = render({ layout: 'repos', finish: 'pixel' });
    assert.match(svg, /fill="url\(#ags-pix\)"/);
    assert.match(svg, /id="ags-pix"/);
    // Only the card itself keeps its rounded corners.
    assert.doesNotMatch(svg.replace(/<rect[^>]*class="card"\/>/, ''), /rx="[1-9]/);
    assert.doesNotMatch(svg, /<circle/);
  });

  it('hollow neon shapes into outlines', () => {
    const svg = render({ layout: 'languages', finish: 'neon' });
    assert.match(svg, /class="hollow"/);
    assert.match(svg, /\.hollow\{fill:var\(--bg\)/);
  });

  it('hatch and outline sketches by hand, the same way every time', () => {
    const svg = render({ layout: 'repos', finish: 'sketch' });
    assert.match(svg, /fill="url\(#ags-hatch\)"/);
    assert.match(svg, /class="pencil"/);
    assert.equal(svg, render({ layout: 'repos', finish: 'sketch' }));
  });

  it('extrude blocks with a side under every bar', () => {
    const gloss = render({ layout: 'repos' });
    const block = render({ layout: 'repos', finish: 'block' });
    const rects = (svg) => (svg.match(/<rect/g) ?? []).length;
    assert.ok(rects(block) > rects(gloss) + 20);
  });

  it('animate the holographic foil only when animations are on', () => {
    assert.match(render({ layout: 'repos', finish: 'holo' }), /@keyframes ags-holo/);
    assert.doesNotMatch(
      render({ layout: 'repos', finish: 'holo', disable_animations: 'true' }),
      /@keyframes ags-holo/,
    );
  });

  it('turn chrome colours to metal and keep soft and paper', () => {
    assert.match(render({ layout: 'repos', finish: 'chrome' }), /fill="#9aa3ad"/);
    const soft = render({ layout: 'repos', finish: 'soft' });
    const paper = render({ layout: 'repos', finish: 'paper' });
    assert.notEqual(stopsOf(soft, 'ags-sheen'), stopsOf(paper, 'ags-sheen'));
  });

  it('paint nothing extra when flat', () => {
    const flat = render({ layout: 'languages', lang_style: 'donut', finish: 'flat' });
    assert.doesNotMatch(flat, /url\(#ags-(sheen|sphere|inset|ring-light|hole)\)/);
  });
});

describe('dashboard layout', () => {
  it('shows tiles, heatmap, charts and repos', () => {
    const svg = render({ layout: 'dashboard' });
    assertWellFormed(svg);
    for (const text of [
      'Current streak',
      '19 days',
      '39 days',
      'Weekly rhythm',
      'Monthly activity',
    ]) {
      assert.match(svg, new RegExp(text), text);
    }
    assert.equal((svg.match(/class="hm\d"/g) ?? []).length, 371 + 5);
    assert.match(svg, /On GitHub since 2018 · 8 years/);
  });

  it('falls back gracefully without contribution data', () => {
    const org = { ...sampleAccount, type: 'Organization', followers: null, activity: null };
    const svg = render({ layout: 'dashboard' }, org);
    assertWellFormed(svg);
    assert.match(svg, /only available for user accounts/);
    assert.match(svg, />Public repos</);
    assert.doesNotMatch(svg, /class="hm\d"/);
    const user = render({ layout: 'dashboard' }, { ...sampleAccount, activity: null });
    assert.match(user, /needs a GitHub token/);
  });
});
