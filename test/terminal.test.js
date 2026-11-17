import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { sampleAccount } from './fixtures/account.js';
import { stripTags } from './helpers.js';

function render(query = {}, account = sampleAccount, tweak = (stats) => stats) {
  const options = parseOptions({ username: 'stellar-dev', layout: 'terminal', ...query });
  return renderCard(tweak(computeStats(account, { languages: options.langsCount })), options);
}

// The visible text of the card, with the tspans that split numbers removed.
const text = (svg) =>
  stripTags(
    svg.replace(/<title[^>]*>[\s\S]*?<\/title>/g, '').replace(/<style>[\s\S]*?<\/style>/g, ''),
  )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

describe('terminal layout', () => {
  it('draws the window and the prompts', () => {
    const svg = render({ disable_animations: 'true' });
    assert.match(svg, /width="820" height="500"/);
    assert.match(svg, /stellar-dev — gitfetch/);
    const visible = text(svg);
    assert.match(visible, /gitfetch stellar-dev/);
    assert.match(visible, /gitfetch --top --langs/);
    assert.match(visible, /stellar-dev@github/);
    assert.match(visible, /last 26 weeks/);
    assert.match(visible, /peak 149 in Apr/);
  });

  it("shows the fixture's numbers in the key rows", () => {
    const visible = text(render({ disable_animations: 'true' }));
    for (const row of [
      /stars\.+\s*17,656/,
      /repos\.+\s*64 public · 1\.2k forks/,
      /followers\.+\s*2,480/,
      /contribs\.+\s*1,264 in the last year/,
      /streak\.+\s*19 days \(best 39\)/,
      /prs\.+\s*642 all time/,
      /reviews\.+\s*228/,
      /rank\.+\s*S · top <1%/,
      /since\.+\s*2018 · 8 years/,
    ]) {
      assert.match(visible, row);
    }
  });

  it('lists the top repositories and languages', () => {
    const visible = text(render());
    for (const name of ['nebula-ui', 'quasar-db', 'orbit-cli', 'pulsar-ml', 'comet.vim', '8.4k']) {
      assert.ok(visible.includes(name), name);
    }
    assert.ok(!visible.includes('gravity-hooks'), 'only five repositories');
    assert.match(visible, /TypeScript\s*51%/);
  });

  it('uses a custom title for the window', () => {
    assert.match(render({ custom_title: 'My box' }), />My box</);
  });

  it('escapes and truncates hostile names', () => {
    const account = {
      ...sampleAccount,
      login: 'x<y>&z',
      repos: sampleAccount.repos.map((repo, i) =>
        i === 0 ? { ...repo, name: '<script>alert("x")</script>-and-a-very-long-name' } : repo,
      ),
    };
    const svg = render({}, account);
    assert.ok(!svg.includes('<script>'));
    assert.ok(!svg.includes('x<y>'));
    assert.match(svg, /x&lt;y&gt;&amp;z/);
    assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)…/);
  });

  it('renders the no-activity card without contribution data', () => {
    const svg = render({}, { ...sampleAccount, activity: null });
    assert.match(svg, /Contribution activity needs a GitHub token/);
    assert.ok(!svg.includes('--top --langs'));
    const org = render({}, { ...sampleAccount, type: 'Organization', activity: null });
    assert.match(org, /only available for user accounts/);
  });

  it('handles an account with no repositories, languages or streak', () => {
    const svg = render({ disable_animations: 'true' }, { ...sampleAccount, repos: [] }, (s) => ({
      ...s,
      followers: null,
      activity: {
        ...s.activity,
        pullRequests: null,
        streaks: { current: 0, longest: { length: 0, start: null, end: null } },
      },
    }));
    const visible = text(svg);
    assert.match(visible, /no starred repositories yet/);
    assert.match(visible, /no languages yet/);
    assert.match(visible, /streak\.+\s*0 days \(best 0\)/);
    assert.ok(!/followers\.|prs\./.test(visible), 'rows without data are left out');
    assert.ok(!svg.includes('NaN') && !svg.includes('undefined'));
  });

  it('copes with less than 26 weeks of days and quiet months', () => {
    const svg = render({}, sampleAccount, (s) => ({
      ...s,
      activity: {
        ...s.activity,
        days: s.activity.days.slice(-20),
        levels: s.activity.levels.slice(-20),
        months: s.activity.months.map((m) => ({ ...m, total: 0 })),
      },
    }));
    assert.equal((svg.match(/class="hm\d"/g) ?? []).length, 20);
    assert.match(text(svg), /no contributions yet/);
  });

  it('keeps theme colours out of presentation attributes', () => {
    for (const theme of ['default', 'github_dark', 'terminal', 'sakura']) {
      for (const finish of ['flat', 'gloss', 'neon']) {
        assert.ok(!render({ theme, finish }).includes('fill="var('), `${theme} ${finish}`);
      }
    }
  });

  it('is always monospace', () => {
    assert.match(render({ theme: 'default' }), /text\{font-family:'JetBrains Mono'/);
  });

  it('drops the animations with disable_animations', () => {
    assert.match(render(), /@keyframes ags-blink/);
    const svg = render({ disable_animations: 'true' });
    assert.ok(!svg.includes('@keyframes'));
    assert.ok(!svg.includes('animation-delay'));
  });
});
