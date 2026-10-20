import { sampleActivity } from './activity.js';

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
  ].map((repo) => ({ description: '', isFork: false, isArchived: false, ...repo })),
};
