# Contributing

Thanks for helping make Awesome Git Stats better! Bug reports, themes, docs and code are all
welcome.

## Getting started

```sh
git clone https://github.com/iiogurt/Awesome-Git-Stats.git
cd Awesome-Git-Stats
npm install
cp .env.example .env   # optional: add a GITHUB_TOKEN
npm run dev            # http://localhost:3000
```

## Project layout

| Path             | What lives there                                       |
| ---------------- | ------------------------------------------------------ |
| `api/stars.js`   | Vercel function entry point                            |
| `src/handler.js` | Request handling, validation and caching               |
| `src/github.js`  | GitHub GraphQL / REST data fetching                    |
| `src/stats.js`   | Turns repositories into totals and language breakdowns |
| `src/themes.js`  | Built-in themes and colour overrides                   |
| `src/render/`    | One file per layout, plus shared SVG helpers           |
| `public/`        | Link builder served on the deployment's home page      |
| `scripts/`       | Dev server, example generator and Action entry point   |
| `test/`          | Unit tests (`node:test`, no network access)            |

## Making changes

1. Create a short-lived branch from `main` (see [Branches](#branches)).
2. Make your change and add or update tests.
3. If the cards look different, run `npm run examples` and commit the updated SVGs. CI checks
   that they are up to date.
4. Run `npm run check` (lint, formatting and tests).
5. Open a pull request.

### Adding a theme

Add an entry to `src/themes.js` defining all seven colour tokens, add it to the `<select>` in
`public/index.html` and to the theme lists in `README.md`, then run `npm run examples` and
regenerate the table in `docs/themes.md`. Check that text is readable on the background.

## Branches

`main` is the only long-lived branch. It is always releasable and protected: nobody pushes to
it directly, and every change lands through a squash-merged pull request with green CI.

Name work branches `<type>/<short-description>`, using the same types as commit messages:

| Example                    | For                     |
| -------------------------- | ----------------------- |
| `feat/heatmap-layout`      | New features            |
| `fix/long-repo-names`      | Bug fixes               |
| `docs/action-example`      | Documentation only      |
| `ci/node-24`, `chore/deps` | Tooling and maintenance |

Keep branches small and short-lived, update them by merging or rebasing on `main`, and let
GitHub delete them after merge. Bot branches (`dependabot/…`, `release-please--…`) are created
and cleaned up automatically.

### Repository settings (maintainers)

- **Default branch:** `main`.
- **Rulesets:** import [`.github/rulesets/main.json`](.github/rulesets/main.json) and
  [`.github/rulesets/release-tags.json`](.github/rulesets/release-tags.json) under
  _Settings → Rules → Rulesets → New ruleset → Import a ruleset_. They require pull requests,
  passing checks and linear history on `main`, and make `vX.Y.Z` tags immutable.
- **Pull requests:** allow squash merging only, use the PR title as the commit message, and
  enable _Automatically delete head branches_.
- **Actions:** allow GitHub Actions to create pull requests (needed by release-please).
- **First release:** run the _Release_ workflow manually on `main` (_Actions → Release → Run
  workflow_). It publishes `v1.0.0` from `CHANGELOG.md` and creates the `v1` tag; release-please
  takes over from there.

Release pull requests opened by release-please don't trigger CI (GitHub doesn't run workflows
for changes made with `GITHUB_TOKEN`), so an admin merges them using the ruleset bypass.

## Commit messages and releases

We use [Conventional Commits](https://www.conventionalcommits.org/). Pull requests are
squash-merged, so the **PR title** becomes the commit message and is checked by CI:

- `feat: add heatmap layout` → minor release
- `fix: truncate long repository names` → patch release
- `feat!: rename the stars endpoint` or a `BREAKING CHANGE:` footer → major release
- `docs:`, `chore:`, `ci:`, `test:`, `refactor:` → no release on their own

[release-please](https://github.com/googleapis/release-please) watches `main` and keeps a
release pull request open that bumps the version in `package.json` and updates
`CHANGELOG.md`. Merging that pull request tags the release (`vX.Y.Z`), publishes a GitHub
release and moves the major tag (`v1`) used by Action users.

The URL parameters and Action inputs are the public API. Removing or changing the meaning of
one is a breaking change.

## Code of conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
