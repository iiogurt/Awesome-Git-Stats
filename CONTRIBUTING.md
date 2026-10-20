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

Add an entry to `src/themes.js` defining all seven colour tokens, and optionally `gradient`,
`art`, `art1`–`art3`, `font`, `glow` or `borderWidth` (documented at the top of the file).
Add it to the `<select>` in `public/index.html` and to the theme lists in `README.md`, then run
`npm run examples`, which also regenerates `docs/themes.md`. Check that text stays readable on
the background, including on top of the art.

### Adding an art style

Add a generator to `styles` in `src/render/art.js` and its name to `ART_STYLES`, plus a
description in `scripts/generate-examples.js` and an `<option>` in `public/index.html`. Rules:

- Use the seeded `rand()` for every random choice, so cards are stable for each username.
- Colour through the `art-c1`/`art-c2`/`art-c3`/`art-line` classes or `style="…var(--art1)"`,
  never `fill="var(…)"`, so the art follows the theme, colour overrides and dark mode.
- Keep it subtle (low opacity, away from text) and small: a few KB per card.
- Put animations in `motion`; they are dropped for `disable_animations` and reduced motion.

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

### Automation

Nobody needs to merge, squash or clean up by hand:

- The **Auto-merge** workflow turns on squash auto-merge for pull requests from the repository
  owner, Dependabot and release-please. Each one merges by itself once every required check is
  green, and its branch is deleted afterwards. Pull requests from anyone else wait for a review.
- The **Release** workflow keeps a release pull request open on `main`. It is auto-merged like
  any other pull request, which tags the version, publishes the GitHub release and moves the
  major tag (`v1`).
- Vercel deploys `main` to production after every merge.
- As a safety net the Release workflow also runs every hour, so a merged release pull request
  is always published even if its merge didn't start the workflow.

To stop a pull request from merging automatically, mark it as a draft or disable auto-merge on
it.

### Repository settings (maintainers, one-time)

- **Default branch:** `main`.
- **Rulesets:** import [`.github/rulesets/main.json`](.github/rulesets/main.json) and
  [`.github/rulesets/release-tags.json`](.github/rulesets/release-tags.json) under
  _Settings → Rules → Rulesets → New ruleset → Import a ruleset_. They require pull requests,
  passing checks and linear history on `main`, and make `vX.Y.Z` tags immutable.
- **Pull requests:** allow squash merging only, use the PR title as the commit message, enable
  _Allow auto-merge_ and _Automatically delete head branches_.
- **Actions:** allow GitHub Actions to create and approve pull requests.
- **Release bot:** GitHub doesn't run workflows for pull requests or merges made with the
  built-in `GITHUB_TOKEN`, so release pull requests would never get CI and merges wouldn't
  start the Release workflow. Give the workflows their own identity, either:
  - **a GitHub App (recommended, never expires):** create one under _Settings → Developer
    settings → GitHub Apps → New GitHub App_ with no webhook and the repository permissions
    _Contents: Read and write_ and _Pull requests: Read and write_. Install it on this
    repository, then add its App ID as the Actions **variable** `RELEASE_APP_ID` and a
    generated private key as the Actions **secret** `RELEASE_APP_PRIVATE_KEY`; or
  - **a fine-grained personal access token:** limited to this repository with the same two
    permissions, saved as the Actions secret `RELEASE_TOKEN`. Renew it before it expires.
- **First release:** run the _Release_ workflow manually on `main` (_Actions → Release → Run
  workflow_). It publishes `v1.0.0` from `CHANGELOG.md` and creates the `v1` tag; release-please
  takes over from there.

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
