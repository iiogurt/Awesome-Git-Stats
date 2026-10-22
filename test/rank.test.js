import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeRank } from '../src/rank.js';

describe('computeRank', () => {
  it('gives very active accounts an S and quiet ones a C', () => {
    const busy = { commits: 1200, pullRequests: 640, issues: 180, reviews: 230 };
    assert.equal(computeRank({ ...busy, stars: 17000, followers: 2500 }).level, 'S');
    assert.equal(computeRank({ commits: 20, stars: 3, followers: 2 }).level, 'C');
    assert.deepEqual(computeRank({}), { level: 'C', percentile: 100 });
  });

  it('ranks typical numbers in the middle and rises with every number', () => {
    const median = {
      commits: 250,
      pullRequests: 50,
      issues: 25,
      reviews: 2,
      stars: 50,
      followers: 10,
    };
    const typical = computeRank(median);
    assert.match(typical.level, /^[AB]/);
    for (const field of Object.keys(median)) {
      const more = computeRank({ ...median, [field]: median[field] * 4 });
      assert.ok(more.percentile < typical.percentile, field);
    }
  });

  it('ignores missing and negative numbers', () => {
    assert.equal(computeRank({ stars: -5, commits: 'x' }).percentile, 100);
  });
});
