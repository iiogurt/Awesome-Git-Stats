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

import { harmonise, themeTone } from '../colors.js';
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
  const shown = options.langColors === 'theme' ? matchLanguageColors(data, options.theme) : data;
  return render(shown, footnote ? { ...options, footnote } : options);
}

// The data with every language colour moved toward the theme's tone (`lang_colors=theme`).
function matchLanguageColors(data, theme) {
  const tone = themeTone(theme);
  const match = (color) => (color ? harmonise(color, tone) : color);
  const recolor = (lang) => ({ ...lang, color: match(lang.color) });
  return {
    ...data,
    ...(data.languageColor ? { languageColor: match(data.languageColor) } : {}),
    ...(data.languages ? { languages: data.languages.map(recolor) } : {}),
    ...(data.codeLanguages
      ? { codeLanguages: { ...data.codeLanguages, items: data.codeLanguages.items.map(recolor) } }
      : {}),
    ...(data.topRepos
      ? {
          topRepos: data.topRepos.map((repo) => ({
            ...repo,
            languageColor: match(repo.languageColor),
          })),
        }
      : {}),
  };
}

// Layouts that show only contribution activity, which the repository limit doesn't affect.
const ACTIVITY_ONLY = ['streak', 'heatmap', 'timeline', 'skyline', 'goal'];

export const PARTIAL_NOTE = `First ${REPO_LIMIT.toLocaleString('en-US')} repositories only`;
