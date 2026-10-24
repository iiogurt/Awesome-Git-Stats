import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  circularMean,
  elementSymbol,
  entropy,
  gini,
  hIndex,
  linearFit,
  lorenz,
  moments,
  spectrum,
  weekBits,
  zipf,
} from '../src/science.js';

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);

describe('science', () => {
  it('computes the h-index', () => {
    assert.equal(hIndex([]), 0);
    assert.equal(hIndex([0, 0]), 0);
    assert.equal(hIndex([10, 8, 5, 4, 3]), 4);
    assert.equal(hIndex([25, 8, 5, 3, 3]), 3);
    assert.equal(hIndex([100]), 1);
  });

  it('computes the Gini coefficient and Lorenz curve', () => {
    assert.equal(gini([]), 0);
    close(gini([5, 5, 5, 5]), 0);
    close(gini([0, 0, 0, 10]), 0); // zeros are left out: one repo is not a distribution
    close(gini([1, 3]), 0.25);
    assert.deepEqual(lorenz([3, 1]), [
      [0, 0],
      [0.5, 0.25],
      [1, 1],
    ]);
  });

  it('computes entropy in bits and moments', () => {
    close(entropy([1, 1, 1, 1]), 2);
    close(entropy([7, 0]), 0);
    assert.equal(entropy([]), 0);
    const { mean, sd } = moments([2, 4, 4, 4, 5, 5, 7, 9]);
    close(mean, 5);
    close(sd, 2);
    assert.deepEqual(moments([]), { mean: 0, sd: 0 });
  });

  it('fits a line by least squares', () => {
    const fit = linearFit([0, 1, 2, 3], [1, 3, 5, 7]);
    close(fit.slope, 2);
    close(fit.intercept, 1);
    close(fit.r2, 1);
    assert.deepEqual(linearFit([1], [4]), { slope: 0, intercept: 4, r2: 0 });
  });

  it('finds the dominant period of a series', () => {
    const weekly = Array.from({ length: 364 }, (_, t) => (t % 7 < 5 ? 10 : 0));
    close(spectrum(weekly).period, 7);
    assert.equal(spectrum(Array(30).fill(3)).period, null);
    assert.deepEqual(spectrum([1, 2]), { amplitudes: [], period: null });
  });

  it('computes the circular mean of weekday totals', () => {
    const wednesday = circularMean([0, 0, 9, 0, 0, 0, 0]);
    close(wednesday.index, 2);
    close(wednesday.length, 1);
    close(circularMean([1, 1, 1, 1, 1, 1, 1]).length, 0);
    close(circularMean([0, 0, 0, 0, 0, 0, 5]).index, 6);
    assert.deepEqual(circularMean([0, 0, 0]), { index: 0, length: 0 });
  });

  it('fits a power law to stars by rank', () => {
    const { alpha, fit } = zipf([1000, 500, 333.3333, 250, 0]);
    close(alpha, 1, 1e-4);
    close(fit.r2, 1, 1e-6);
  });

  it('encodes the calendar as one byte per week', () => {
    // 2024-01-07 is a Sunday: one full week, then Monday of the next.
    const days = ['07', '08', '09', '10', '11', '12', '13', '14', '15'].map((d, i) => ({
      date: `2024-01-${d}`,
      count: [1, 0, 1, 0, 0, 0, 1, 0, 2][i],
    }));
    assert.equal(weekBits(days), '4502');
    assert.equal(weekBits([]), '');
  });

  it('names languages like chemical elements, without duplicates', () => {
    const taken = new Set();
    assert.equal(elementSymbol('TypeScript', taken), 'Ts');
    assert.equal(elementSymbol('Python', taken), 'Py');
    assert.equal(elementSymbol('C++', taken), 'C⁺');
    assert.equal(elementSymbol('C#', taken), 'C♯');
    assert.equal(elementSymbol('C', taken), 'C');
    assert.equal(elementSymbol('PHP', taken), 'Ph');
    assert.equal(elementSymbol('Perl', taken), 'Pe');
    assert.equal(elementSymbol('Pascal', taken), 'Pa');
    assert.equal(elementSymbol('Python 3', taken), 'Pt');
  });
});
