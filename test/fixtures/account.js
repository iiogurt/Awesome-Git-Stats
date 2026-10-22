import { sampleActivity } from './activity.js';

// Bytes of code per language in some of the sample repositories.
const lang = (name, color, size) => ({ name, color, size });
const CODE = {
  'nebula-ui': [
    lang('TypeScript', '#3178c6', 912000),
    lang('CSS', '#663399', 141000),
    lang('HTML', '#e34c26', 38000),
  ],
  'quasar-db': [lang('Rust', '#dea584', 1240000), lang('Shell', '#89e051', 12000)],
  'orbit-cli': [lang('Go', '#00ADD8', 486000), lang('Makefile', '#427819', 4000)],
  'pulsar-ml': [lang('Python', '#3572A5', 388000), lang('Jupyter Notebook', '#DA5B0B', 210000)],
  'comet.vim': [lang('Vim Script', '#199f4b', 64000)],
  'gravity-hooks': [lang('TypeScript', '#3178c6', 98000)],
  'eclipse-theme': [lang('CSS', '#663399', 52000), lang('JavaScript', '#f1e05a', 21000)],
  'meteor-shower': [lang('JavaScript', '#f1e05a', 74000)],
  dotfiles: [lang('Shell', '#89e051', 31000), lang('Lua', '#000080', 18000)],
  blackhole: [lang('C', '#555555', 156000)],
};

/** A fictional account used by tests and to generate README examples. */
export const sampleAccount = {
  login: 'stellar-dev',
  name: 'Stellar Dev',
  type: 'User',
  followers: 2480,
  totalRepos: 64,
  activity: sampleActivity,
  repos: [
    {
      name: 'nebula-ui',
      stars: 8421,
      forks: 612,
      language: 'TypeScript',
      languageColor: '#3178c6',
    },
    { name: 'quasar-db', stars: 3954, forks: 241, language: 'Rust', languageColor: '#dea584' },
    { name: 'orbit-cli', stars: 2210, forks: 133, language: 'Go', languageColor: '#00ADD8' },
    { name: 'pulsar-ml', stars: 1288, forks: 97, language: 'Python', languageColor: '#3572A5' },
    { name: 'comet.vim', stars: 640, forks: 41, language: 'Vim Script', languageColor: '#199f4b' },
    {
      name: 'gravity-hooks',
      stars: 512,
      forks: 30,
      language: 'TypeScript',
      languageColor: '#3178c6',
    },
    { name: 'eclipse-theme', stars: 377, forks: 25, language: 'CSS', languageColor: '#663399' },
    {
      name: 'meteor-shower',
      stars: 145,
      forks: 12,
      language: 'JavaScript',
      languageColor: '#f1e05a',
    },
    { name: 'dotfiles', stars: 88, forks: 9, language: 'Shell', languageColor: '#89e051' },
    { name: 'blackhole', stars: 21, forks: 2, language: 'C', languageColor: '#555555' },
    { name: 'notes', stars: 0, forks: 0, language: null, languageColor: null },
  ].map((repo) => ({
    description: '',
    isFork: false,
    isArchived: false,
    codeLanguages: CODE[repo.name] ?? [],
    ...repo,
  })),
};

/** A pinned repository, as fetchRepo() returns it. */
export const sampleRepo = {
  name: 'nebula-ui',
  fullName: 'stellar-dev/nebula-ui',
  description:
    'A themeable component library for space-age dashboards, with charts, cards and a dark mode that follows the stars.',
  stars: 8421,
  forks: 612,
  isFork: false,
  isArchived: false,
  isTemplate: false,
  language: 'TypeScript',
  languageColor: '#3178c6',
};

/** A pinned gist, as fetchGist() returns it. */
export const sampleGist = {
  id: 'aa5a315d61ae9438b18d',
  name: 'constellations.json',
  description:
    'All 88 IAU constellations with their abbreviations, brightest stars and area in square degrees.',
  stars: 41,
  forks: 13,
  isFork: false,
  language: 'JSON',
  languageColor: '#292929',
};
