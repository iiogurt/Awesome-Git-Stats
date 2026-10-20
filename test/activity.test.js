import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeActivity,
  computeStreaks,
  contributionLevels,
  monthlyTotals,
  weekdayTotals,
} from '../src/activity.js';
import { sampleActivity } from './fixtures/activity.js';

const days = (counts, start = '2026-01-05') =>
  counts.map((count, i) => {
    const date = new Date(Date.parse(`${start}T00:00:00Z`) + i * 86400000);
    return { date: date.toISOString().slice(0, 10), count };
  });

describe('computeStreaks', () => {
  it('finds the longest run and the current one', () => {
    const result = computeStreaks(days([1, 2, 0, 1, 1, 1, 0, 4, 5]));
    assert.equal(result.longest.length, 3);
    assert.equal(result.longest.start, '2026-01-08');
    assert.equal(result.longest.end, '2026-01-10');
    assert.equal(result.current, 2);
  });

  it('keeps the current streak alive when today is still empty', () => {
    assert.equal(computeStreaks(days([1, 1, 1, 0])).current, 3);
    assert.equal(computeStreaks(days([1, 1, 0, 0])).current, 0);
  });

  it('handles empty and all-zero calendars', () => {
    assert.deepEqual(computeStreaks([]), {
      current: 0,
      longest: { length: 0, start: null, end: null },
    });
    assert.equal(computeStreaks(days([0, 0, 0])).longest.length, 0);
  });
});

describe('weekdayTotals', () => {
  it('sums per weekday, Monday first', () => {
    // 2026-01-05 is a Monday.
    assert.deepEqual(weekdayTotals(days([1, 2, 3, 4, 5, 6, 7, 10])), [11, 2, 3, 4, 5, 6, 7]);
  });
});

describe('monthlyTotals', () => {
  it('groups by month and keeps the latest ones', () => {
    const result = monthlyTotals(days([1, 1, 1], '2026-01-30'), 2);
    assert.deepEqual(result, [
      { month: '2026-01', total: 2 },
      { month: '2026-02', total: 1 },
    ]);
  });
});

describe('contributionLevels', () => {
  it('maps zero to level 0 and spreads active days over 1-4', () => {
    const levels = contributionLevels(days([0, 1, 2, 3, 4, 5, 6, 7, 50]));
    assert.equal(levels[0], 0);
    assert.equal(levels.at(-1), 4);
    assert.ok(levels.slice(1).every((level) => level >= 1 && level <= 4));
  });

  it('returns zeros when nothing happened', () => {
    assert.deepEqual(contributionLevels(days([0, 0])), [0, 0]);
  });
});

describe('computeActivity', () => {
  it('summarises the sample year', () => {
    const a = computeActivity(sampleActivity);
    assert.equal(a.days.length, 371);
    assert.equal(a.total, 1264);
    assert.equal(a.streaks.current, 19);
    assert.equal(a.streaks.longest.length, 39);
    assert.deepEqual(a.best, { date: '2026-05-14', count: 31 });
    assert.equal(a.joinedYear, 2018);
    assert.equal(a.years, 8);
    assert.equal(a.months.length, 12);
    assert.equal(a.mix.commits, 1184);
  });

  it('returns null without data', () => {
    assert.equal(computeActivity(null), null);
  });
});
