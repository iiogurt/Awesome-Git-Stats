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

1. Create a branch from `main`.
2. Make your change and add or update tests.
3. If the cards look different, run `npm run examples` and commit the updated SVGs. CI checks
   that they are up to date.
4. Run `npm run check` (lint, formatting and tests).
5. Open a pull request.

### Adding a theme

Add an entry to `src/themes.js` defining all seven colour tokens, add it to the `<select>` in
`public/index.html` and to the theme lists in `README.md`, then run `npm run examples` and
regenerate the table in `docs/themes.md`. Check that text is readable on the background.

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
