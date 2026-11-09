import { renderBadge } from './badge.js';
import { renderCompact } from './compact.js';
import { renderDashboard } from './dashboard.js';
import { renderGoal } from './goal.js';
import { renderHeatmap } from './heatmap.js';
import { renderLab } from './lab.js';
import { renderLanguages } from './languages.js';
import { renderOverview } from './overview.js';
import { renderGist, renderPin } from './pin.js';
import { renderRadar } from './radar.js';
import { renderRepos } from './repos.js';
import { renderSkyline } from './skyline.js';
import { renderStats } from './stats.js';
import { renderStreak } from './streak.js';
import { renderTimeline } from './timeline.js';
import { renderTreemap } from './treemap.js';

import { useFinish } from './materials.js';
import { REPO_LIMIT } from '../github.js';

export { renderError } from './error.js';

const renderers = {
  overview: renderOverview,
  repos: renderRepos,
  compact: renderCompact,
  badge: renderBadge,
  dashboard: renderDashboard,
  stats: renderStats,
  languages: renderLanguages,
  pin: renderPin,
  gist: renderGist,
  streak: renderStreak,
  heatmap: renderHeatmap,
  skyline: renderSkyline,
  radar: renderRadar,
  treemap: renderTreemap,
  timeline: renderTimeline,
  goal: renderGoal,
  lab: renderLab,
};

/**
 * Render the requested layout. `data` is computeStats() output, or for the
 * pin and gist layouts the repository or gist as fetched.
 */
export function renderCard(data, options) {
  const render = renderers[options.layout] ?? renderOverview;
  useFinish(options.finish);
  // Totals that leave out repositories past the fetch limit say so, in a footnote and
  // the accessible title (the badge only has room for the title).
  const footnote = data.partial && !ACTIVITY_ONLY.includes(options.layout) ? PARTIAL_NOTE : null;
  return render(data, footnote ? { ...options, footnote } : options);
}

// Layouts that show only contribution activity, which the repository limit doesn't affect.
const ACTIVITY_ONLY = ['streak', 'heatmap', 'timeline', 'skyline', 'goal'];

export const PARTIAL_NOTE = `First ${REPO_LIMIT.toLocaleString('en-US')} repositories only`;
