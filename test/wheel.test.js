import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOptions } from '../src/options.js';
import { renderCard } from '../src/render/index.js';
import { bestDayLabel } from '../src/render/wheel.js';
import { computeStats } from '../src/stats.js';
import { sampleAccount } from './fixtures/account.js';
import { hasTag } from './helpers.js';

const WIDTH = 820;
const HEIGHT = 470;

function render(query = {}, account = sampleAccount) {
  const options = parseOptions({ username: 'stellar-dev', layout: 'wheel', ...query });
  return renderCard(computeStats(account, { languages: options.langsCount }), options);
}

/** The sample account with its days replaced by `map(day, i)`. */
function withDays(map, extra = {}) {
  const days = sampleAccount.activity.days.map((day, i) => ({ ...day, count: map(day, i) }));
  return { ...sampleAccount, activity: { ...sampleAccount.activity, days, ...extra } };
}

/** The sample year with one outstanding day at `index`. */
function bestAt(index, count = 40) {
  return withDays((day, i) => (i === index ? count : Math.min(day.count, 20)));
}

const attr = (tag, name) => Number(tag.match(new RegExp(`\\b${name}="([-\\d.]+)"`))[1]);

describe('wheel layout', () => {
  it('draws one bar per day and puts the year total in the centre', () => {
    const svg = render();
    const days = sampleAccount.activity.days.length;
    const bars = svg.match(/<line [^>]*class="w[0-4b]"/g);
    assert.equal(bars.length, days);
    assert.equal(svg.match(/class="wb"/g).length, 1);
    const total = sampleAccount.activity.days.reduce((sum, day) => sum + day.count, 0);
    assert.match(svg, new RegExp(`class="wt"[^>]*>${total.toLocaleString('en-US')}<`));
    assert.match(svg, /Year on GitHub/);
    assert.match(svg, /Best day/);
  });

  it('keeps the best-day label inside the card wherever the day falls', () => {
    const n = sampleAccount.activity.days.length;
    const indices = [0, 20, 46, 70, 92, 120, 150, 185, 214, 250, 278, 300, 330, n - 1];
    for (const count of [40, 123456]) {
      for (const index of indices) {
        const stats = computeStats(bestAt(index, count));
        const { box } = bestDayLabel(stats.activity, index);
        const where = `day ${index}, count ${count}`;
        assert.ok(box.x >= 25 && box.x + box.width <= 480, `x out of bounds for ${where}`);
        assert.ok(box.y >= 0 && box.y + box.height <= HEIGHT - 10, `y out of bounds for ${where}`);

        const svg = render({ disable_animations: 'true' }, bestAt(index, count));
        for (const tag of svg.match(/<text [^>]*class="wb[lvd]"[^>]*>/g)) {
          const x = attr(tag, 'x');
          const y = attr(tag, 'y');
          assert.ok(x >= 25 && x <= WIDTH / 2 + 80, `label x ${x} for ${where}`);
          assert.ok(y >= 40 && y <= HEIGHT - 10, `label y ${y} for ${where}`);
        }
      }
    }
  });

  it('anchors the label away from the wheel', () => {
    const n = sampleAccount.activity.days.length;
    const anchor = (index) => render({}, bestAt(index)).match(/class="wbl" text-anchor="(\w+)"/)[1];
    assert.equal(anchor(0), 'middle'); // top
    assert.equal(anchor(Math.round(n / 4)), 'start'); // right
    assert.equal(anchor(Math.round(n / 2)), 'middle'); // bottom
    assert.equal(anchor(Math.round((3 * n) / 4)), 'end'); // left
  });

  it('renders a year without contributions, without a best day or NaN', () => {
    const svg = render(
      {},
      withDays(() => 0),
    );
    assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
    assert.doesNotMatch(svg, /Best day/);
    assert.doesNotMatch(svg, /class="wb"/);
    assert.match(svg, /class="wt"[^>]*>0</);
    assert.match(svg, /0 a day/);
  });

  it('swaps missing numbers for other facts', () => {
    const account = {
      ...sampleAccount,
      followers: null,
      repos: [],
      activity: { ...sampleAccount.activity, pullRequests: null },
    };
    const svg = render({}, account);
    assert.doesNotMatch(svg, /NaN|undefined|null/);
    assert.match(svg, />Forks</);
    assert.match(svg, />Public repos</);
    assert.doesNotMatch(svg, />Followers</);
    assert.match(svg, /No starred repositories yet/);
    assert.match(svg, /No languages yet/);
  });

  it('escapes and truncates repository names', () => {
    const hostile = `<script>alert("x")</script>-${'very-long-name-'.repeat(4)}`;
    const account = {
      ...sampleAccount,
      repos: [{ ...sampleAccount.repos[0], name: hostile }, ...sampleAccount.repos.slice(1)],
    };
    const svg = render({}, account);
    assert.equal(hasTag(svg, 'script'), false);
    assert.match(svg, /class="rl">&lt;script&gt;alert\(…</);
  });

  it('shows the no-activity card without contribution data', () => {
    const svg = render({}, { ...sampleAccount, activity: null });
    assert.match(svg, /Contribution activity needs a GitHub token/);
    assert.doesNotMatch(svg, /class="w[0-4]"/);
  });

  it('keeps theme colours out of presentation attributes in every finish', () => {
    for (const finish of ['flat', 'gloss', 'neon', 'pixel']) {
      for (const theme of ['default', 'github_dark', 'terminal', 'starry_night']) {
        const svg = render({ finish, theme });
        assert.doesNotMatch(svg, /(fill|stroke)="var\(/, `${theme} ${finish}`);
      }
    }
  });

  it('keeps the SVG light', () => {
    const svg = render({ disable_animations: 'true' });
    // Coordinates are rounded to one decimal.
    assert.doesNotMatch(svg, /\b[xy][12]?="-?\d+\.\d{2,}"/);
    assert.ok(svg.length < 80000, `${svg.length} bytes`);
  });
});
