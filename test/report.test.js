import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { computeStats } from '../src/stats.js';
import { sampleAccount } from './fixtures/account.js';

function render(query = {}, account = sampleAccount) {
  const options = parseOptions({ username: 'stellar-dev', layout: 'report', ...query });
  return renderCard(computeStats(account, { languages: options.langsCount }), options);
}
const text = (svg) =>
  svg
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

describe('report layout', () => {
  it('leads with the star count and writes the year up from the data', () => {
    const svg = render();
    assert.match(svg, /class="rp-big"[^>]*>17,656</);
    assert.match(svg, />THE STELLAR DEV REPORT</);
    const words = text(svg);
    assert.match(words, /Ten repositories carry them, led by nebula-ui with 8,421\./);
    assert.match(
      words,
      /The year brought 1,264 contributions on 278 days; the best one, May 14, had 31\./,
    );
    assert.match(words, /Busiest month: April\. Longest run: 39 days from Mar 10\./);
    assert.match(svg, />149 in April</);
  });

  it('is set in serif whatever the theme, with sans labels', () => {
    for (const theme of ['default', 'terminal', 'dracula']) {
      const svg = render({ theme });
      assert.match(svg, /text\{font-family:Georgia/);
      assert.doesNotMatch(svg, /letter-spacing:-\.06em/);
      // Monospace themes tighten commas; a serif headline must not be.
      assert.doesNotMatch(svg, /dx="-.17em"/);
    }
  });

  it('shrinks the headline for long numbers', () => {
    const size = (svg) => Number(svg.match(/class="rp-big" style="font-size:(\d+)px"/)[1]);
    const huge = {
      ...sampleAccount,
      repos: [{ ...sampleAccount.repos[0], stars: 123456789 }],
    };
    assert.ok(size(render()) >= 90);
    assert.ok(size(render({}, huge)) < 70);
  });

  it('copes with one repository, no stars and an empty year', () => {
    const one = { ...sampleAccount, repos: [sampleAccount.repos[0]] };
    assert.match(text(render({}, one)), /One repository carries them all: nebula-ui\./);
    const none = { ...sampleAccount, repos: [], totalRepos: 0 };
    const empty = render({}, none);
    assert.match(empty, /No starred repositories yet\./);
    assert.doesNotMatch(empty, /NaN|undefined/);
    const quiet = {
      ...sampleAccount,
      activity: {
        ...sampleAccount.activity,
        contributionCalendar: undefined,
        totalContributions: 0,
        days: sampleAccount.activity.days.map((day) => ({ ...day, count: 0 })),
      },
    };
    const svg = render({}, quiet);
    assert.doesNotMatch(svg, /NaN|undefined/);
    assert.match(text(svg), /A quiet year so far\./);
  });

  it('shows repositories and languages when there is no contribution data', () => {
    const svg = render({}, { ...sampleAccount, type: 'Organization', activity: null });
    assert.match(svg, />LANGUAGES</);
    assert.match(svg, />Public repositories</);
    assert.doesNotMatch(svg, /The year brought/);
    assert.doesNotMatch(svg, /NaN|undefined/);
  });

  it('escapes names and never puts a variable in an attribute', () => {
    const evil = {
      ...sampleAccount,
      name: '<b>&"x',
      repos: [{ ...sampleAccount.repos[0], name: '<script>', language: 'A&B' }],
    };
    const svg = render({}, evil);
    assert.doesNotMatch(svg, /<script>|<b>/);
    assert.match(svg, /&lt;script&gt;/);
    assert.doesNotMatch(svg, /(fill|stroke)="var\(/);
  });

  it('takes a custom masthead and drops animation when asked', () => {
    assert.match(render({ custom_title: 'Field notes' }), />FIELD NOTES</);
    assert.doesNotMatch(render({ disable_animations: 'true' }), /animation-delay|@keyframes/);
  });
});
