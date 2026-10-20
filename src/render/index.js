import { renderBadge } from './badge.js';
import { renderCompact } from './compact.js';
import { renderDashboard } from './dashboard.js';
import { renderOverview } from './overview.js';
import { renderRepos } from './repos.js';

export { renderError } from './error.js';

const renderers = {
  overview: renderOverview,
  repos: renderRepos,
  compact: renderCompact,
  badge: renderBadge,
  dashboard: renderDashboard,
};

/** Render the requested layout for already computed stats. */
export function renderCard(stats, options) {
  const render = renderers[options.layout] ?? renderOverview;
  return render(stats, options);
}
