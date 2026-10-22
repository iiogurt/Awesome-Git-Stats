import { computeActivity } from './activity.js';

const OTHER_COLOR = '#8b949e';

/**
 * Languages by bytes of code across repositories, or by the number of
 * repositories written mainly in each language when sizes are unknown
 * (the REST fallback). The rest is grouped into "Other".
 *
 * @returns {{ measure: 'bytes' | 'repos', items: object[] }}
 */
export function codeLanguages(repos, count = 5) {
  const bySize = repos.some((repo) => repo.codeLanguages);
  const totals = new Map();
  const add = (name, color, value) => {
    const entry = totals.get(name) ?? { name, color: color || OTHER_COLOR, value: 0 };
    entry.value += value;
    totals.set(name, entry);
  };
  for (const repo of repos) {
    if (bySize) for (const lang of repo.codeLanguages ?? []) add(lang.name, lang.color, lang.size);
    else if (repo.language) add(repo.language, repo.languageColor, 1);
  }
  const sorted = [...totals.values()].sort((a, b) => b.value - a.value);
  const items = sorted.slice(0, count);
  const rest = sorted.slice(count).reduce((sum, lang) => sum + lang.value, 0);
  if (rest > 0) items.push({ name: 'Other', color: OTHER_COLOR, value: rest });
  const total = items.reduce((sum, lang) => sum + lang.value, 0);
  return {
    measure: bySize ? 'bytes' : 'repos',
    items: items.map((lang) => ({ ...lang, share: total ? lang.value / total : 0 })),
  };
}

/**
 * Turn raw account data into the numbers the cards display.
 *
 * @param {object} account  result of fetchAccount()
 * @param {object} options
 * @param {string[]} [options.exclude]  repository names to ignore
 * @param {number}  [options.languages] how many languages to keep before grouping into "Other"
 */
export function computeStats(account, { exclude = [], languages = 5 } = {}) {
  const excluded = new Set(exclude.map((name) => name.toLowerCase()));
  const repos = account.repos
    .filter((repo) => !excluded.has(repo.name.toLowerCase()))
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));

  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);

  const byLanguage = new Map();
  for (const repo of repos) {
    if (!repo.language || repo.stars === 0) continue;
    const entry = byLanguage.get(repo.language) ?? {
      name: repo.language,
      color: repo.languageColor || OTHER_COLOR,
      stars: 0,
    };
    entry.stars += repo.stars;
    byLanguage.set(repo.language, entry);
  }

  const sorted = [...byLanguage.values()].sort((a, b) => b.stars - a.stars);
  const top = sorted.slice(0, languages);
  const rest = sorted.slice(languages).reduce((sum, lang) => sum + lang.stars, 0);
  if (rest > 0) top.push({ name: 'Other', color: OTHER_COLOR, stars: rest });
  const languageTotal = top.reduce((sum, lang) => sum + lang.stars, 0);
  const languageStats = top.map((lang) => ({
    ...lang,
    share: languageTotal ? lang.stars / languageTotal : 0,
  }));

  return {
    login: account.login,
    name: account.name || account.login,
    type: account.type,
    followers: account.followers,
    totalStars,
    totalForks,
    // Repos are fetched only until stars run out, so prefer the API's total.
    repoCount: Math.max(
      (account.totalRepos ?? 0) - (account.repos.length - repos.length),
      repos.length,
    ),
    starredRepoCount: repos.filter((repo) => repo.stars > 0).length,
    topRepos: repos,
    languages: languageStats,
    codeLanguages: codeLanguages(repos, languages),
    languageCount: byLanguage.size,
    activity: computeActivity(account.activity),
  };
}
