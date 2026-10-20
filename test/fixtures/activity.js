/**
 * A deterministic year of contributions for the fictional sample account:
 * 53 full weeks (Sunday to Saturday) ending 2026-10-17, busier on weekdays,
 * with a few quiet spells, a 38-day streak in spring and a current streak.
 */
function buildDays() {
  const days = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const start = Date.UTC(2025, 9, 12); // Sunday
  for (let i = 0; i < 53 * 7; i += 1) {
    const date = new Date(start + i * 86400000);
    const iso = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const season = 1 + 0.6 * Math.sin((i / 371) * Math.PI * 2);
    let count = Math.round(rand() * (weekend ? 3 : 9) * season);
    if (rand() < (weekend ? 0.45 : 0.12)) count = 0;
    // A long streak in spring and an ongoing one at the end.
    if (i >= 150 && i < 188) count = Math.max(count, 1 + Math.round(rand() * 6));
    if (i === 188) count = 0;
    if (i >= 356) count = Math.max(count, 2 + Math.round(rand() * 5));
    if (i >= 60 && i < 70) count = 0; // a holiday
    if (i === 214) count = 31; // the best day
    days.push({ date: iso, count });
  }
  return days;
}

export const sampleActivity = {
  createdAt: '2018-03-14T09:21:00Z',
  following: 87,
  pullRequests: 642,
  issues: 318,
  contributedTo: 57,
  commits: 1184,
  prsThisYear: 163,
  issuesThisYear: 71,
  reviews: 228,
  restricted: 96,
  totalContributions: null,
  days: buildDays(),
};
