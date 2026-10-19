import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LAYOUTS, parseOptions } from '../src/options.js';
import { renderCard, renderError } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { themeNames } from '../src/themes.js';
import { sampleAccount } from './fixtures/account.js';

function render(query, account = sampleAccount) {
  const options = parseOptions({ username: 'stellar-dev', ...query });
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
    assert.match(svg, /class="grow accent"/);
    assert.doesNotMatch(svg, /fill="var\(/);
  });
});
