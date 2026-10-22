/**
 * A GitHub "rank" from S to C, in the spirit of github-readme-stats: each
 * number is compared with a typical value (the median), squashed to 0–1 and
 * weighted, so no single huge number dominates and everyone gets a fair grade.
 */

const exponential = (x) => 1 - 2 ** -x;
const logNormal = (x) => x / (1 + x);

// [field, median, weight, curve]
const FACTORS = [
  ['commits', 250, 2, exponential],
  ['pullRequests', 50, 3, exponential],
  ['issues', 25, 1, exponential],
  ['reviews', 2, 1, exponential],
  ['stars', 50, 4, logNormal],
  ['followers', 10, 1, logNormal],
];

const LEVELS = [
  [1, 'S'],
  [12.5, 'A+'],
  [25, 'A'],
  [37.5, 'A-'],
  [50, 'B+'],
  [62.5, 'B'],
  [75, 'B-'],
  [87.5, 'C+'],
  [100, 'C'],
];

/** Each number on a 0–1 scale, where 0.5 is a typical value: the radar chart's axes. */
export function rankScores(numbers) {
  return Object.fromEntries(
    FACTORS.map(([field, median, , curve]) => [
      field,
      curve(Math.max(0, Number(numbers[field]) || 0) / median),
    ]),
  );
}

/**
 * @param {object} numbers commits (last year), pullRequests, issues, reviews, stars, followers
 * @returns {{ level: string, percentile: number }} percentile: the share of people ranked
 *   higher, so 5 means "top 5%"
 */
export function computeRank(numbers) {
  const scores = rankScores(numbers);
  let score = 0;
  let weights = 0;
  for (const [field, , weight] of FACTORS) {
    score += weight * scores[field];
    weights += weight;
  }
  const percentile = (1 - score / weights) * 100;
  const level = LEVELS.find(([limit]) => percentile <= limit)[1];
  return { level, percentile };
}
