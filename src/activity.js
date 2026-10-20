/**
 * Statistics derived from a user's contribution calendar.
 *
 * "Today" is the last day of the calendar GitHub returns, never the server
 * clock, so results are stable for a given response (and in tests).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Current and longest streak of consecutive days with contributions.
 * A streak still counts as current when today has no contributions yet,
 * so it doesn't "break" in the morning before you've pushed anything.
 */
export function computeStreaks(days) {
  let longest = { length: 0, start: null, end: null };
  let run = { length: 0, start: null };
  for (const day of days) {
    if (day.count > 0) {
      if (run.length === 0) run.start = day.date;
      run.length += 1;
      if (run.length > longest.length) {
        longest = { length: run.length, start: run.start, end: day.date };
      }
    } else {
      run = { length: 0, start: null };
    }
  }

  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  while (i >= 0 && days[i].count > 0) {
    current += 1;
    i -= 1;
  }
  return { current, longest };
}

/** Contributions per weekday, Monday first. */
export function weekdayTotals(days) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    totals[(weekday + 6) % 7] += day.count;
  }
  return totals;
}

/** Contributions per calendar month for the last `count` months, oldest first. */
export function monthlyTotals(days, count = 12) {
  const months = new Map();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    months.set(key, (months.get(key) ?? 0) + day.count);
  }
  return [...months.entries()].slice(-count).map(([month, total]) => ({ month, total }));
}

/**
 * Heatmap intensity 0–4 for each day, based on quartiles of the active days
 * (the same idea GitHub uses), so one huge day doesn't flatten the rest.
 */
export function contributionLevels(days) {
  const active = days
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);
  if (!active.length) return days.map(() => 0);
  const quantile = (q) => active[Math.min(active.length - 1, Math.floor(q * active.length))];
  const thresholds = [quantile(0.25), quantile(0.5), quantile(0.75)];
  return days.map(({ count }) => {
    if (count === 0) return 0;
    if (count <= thresholds[0]) return 1;
    if (count <= thresholds[1]) return 2;
    if (count <= thresholds[2]) return 3;
    return 4;
  });
}

/** Summarise raw activity data into what the dashboard displays. */
export function computeActivity(activity) {
  if (!activity) return null;
  const days = activity.days ?? [];
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const best = days.reduce((top, day) => (day.count > (top?.count ?? 0) ? day : top), null);
  const today = days.at(-1)?.date ?? null;
  const years =
    activity.createdAt && today
      ? Math.max(
          0,
          Math.floor((Date.parse(today) - Date.parse(activity.createdAt)) / (365.25 * DAY_MS)),
        )
      : null;

  return {
    days,
    levels: contributionLevels(days),
    total: activity.totalContributions ?? total,
    activeDays,
    average: days.length ? total / days.length : 0,
    best,
    streaks: computeStreaks(days),
    weekdays: weekdayTotals(days),
    months: monthlyTotals(days),
    joinedYear: activity.createdAt ? Number(activity.createdAt.slice(0, 4)) : null,
    years,
    following: activity.following ?? null,
    pullRequests: activity.pullRequests ?? null,
    issues: activity.issues ?? null,
    contributedTo: activity.contributedTo ?? null,
    mix: {
      commits: activity.commits ?? 0,
      pullRequests: activity.prsThisYear ?? 0,
      reviews: activity.reviews ?? 0,
      issues: activity.issuesThisYear ?? 0,
    },
    privateContributions: activity.restricted ?? 0,
  };
}
