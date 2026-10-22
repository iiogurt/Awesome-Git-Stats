import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { codeLanguages, computeStats } from '../src/stats.js';
import { sampleAccount } from './fixtures/account.js';

describe('computeStats', () => {
  it('sums stars and forks', () => {
    const stats = computeStats(sampleAccount);
    assert.equal(stats.totalStars, 17656);
    assert.equal(stats.totalForks, 1202);
    assert.equal(stats.starredRepoCount, 10);
    assert.equal(stats.repoCount, 64);
    assert.equal(stats.topRepos[0].name, 'nebula-ui');
  });

  it('groups languages by stars and collapses the rest into Other', () => {
    const stats = computeStats(sampleAccount, { languages: 3 });
    assert.deepEqual(
      stats.languages.map((lang) => lang.name),
      ['TypeScript', 'Rust', 'Go', 'Other'],
    );
    assert.equal(stats.languages[0].stars, 8933);
    const share = stats.languages.reduce((sum, lang) => sum + lang.share, 0);
    assert.ok(Math.abs(share - 1) < 1e-9);
  });

  it('excludes repositories case-insensitively', () => {
    const stats = computeStats(sampleAccount, { exclude: ['NEBULA-UI'] });
    assert.equal(stats.totalStars, 17656 - 8421);
    assert.equal(stats.topRepos[0].name, 'quasar-db');
    assert.equal(stats.repoCount, 63);
  });

  it('handles accounts without repositories', () => {
    const stats = computeStats({ login: 'empty', name: '', repos: [], totalRepos: 0 });
    assert.equal(stats.totalStars, 0);
    assert.equal(stats.name, 'empty');
    assert.deepEqual(stats.languages, []);
  });
});

describe('codeLanguages', () => {
  const repo = (language, code) => ({
    name: language,
    stars: 0,
    forks: 0,
    language,
    codeLanguages: code,
  });

  it('adds up bytes of code across repositories and groups the rest', () => {
    const repos = [
      repo('Go', [
        { name: 'Go', color: '#00add8', size: 600 },
        { name: 'Shell', color: '#89e051', size: 100 },
      ]),
      repo('Rust', [{ name: 'Rust', color: '#dea584', size: 300 }]),
    ];
    const { measure, items } = codeLanguages(repos, 2);
    assert.equal(measure, 'bytes');
    assert.deepEqual(
      items.map((l) => [l.name, l.value, l.share]),
      [
        ['Go', 600, 0.6],
        ['Rust', 300, 0.3],
        ['Other', 100, 0.1],
      ],
    );
  });

  it('counts repositories per main language without sizes', () => {
    const repos = [repo('Go'), repo('Go'), repo('Rust'), repo(null)];
    const { measure, items } = codeLanguages(repos);
    assert.equal(measure, 'repos');
    assert.deepEqual(
      items.map((l) => [l.name, l.value]),
      [
        ['Go', 2],
        ['Rust', 1],
      ],
    );
  });
});
