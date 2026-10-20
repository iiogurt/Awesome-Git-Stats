# Awesome Git Stats: project guide

Read this before changing anything. Human-facing details live in `README.md` (usage, options)
and `CONTRIBUTING.md` (workflow); this file is the condensed version plus the non-obvious rules.

## What the app is

A service that renders SVG cards of the GitHub stars an account (user or organization) has
earned, for embedding in profile READMEs with one Markdown image link:
`https://<deployment>/api/stars?username=octocat&layout=repos&theme=tokyonight`.

- Layouts: `overview` (default), `repos`, `compact`, `badge`, `dashboard`. The dashboard also
  fetches contribution activity (a second GraphQL query, users only, token required) and
  derives streaks, heatmap levels and weekday/monthly totals in `src/activity.js`.
- 33 themes in `src/themes.js`: 20 classic palettes (`auto` follows light/dark mode) and 13
  artistic themes that add background art, fonts and glow. `*_color` overrides work on all.
- 13 background **art styles** in `src/render/art.js` (`art=` on any theme, `art=none` to
  disable), generated from a PRNG seeded with the username, so each account's art is unique
  but stable.
- Two ways to use it (README "How it works"): the **GitHub Action** (recommended, no hosting;
  renders on a schedule and commits the SVG itself, see `action.yml`) or a **live link** to a
  Vercel deployment. A deployment can be personal (`ALLOWED_USERNAMES`) or public, spreading
  requests across `GITHUB_TOKEN` + `GITHUB_TOKENS` with failover on rate limits.
- The URL query parameters and the Action inputs are the **public API**. Removing or changing
  the meaning of one is a breaking change (major version).

## Architecture

| Path                           | Role                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `api/stars.js`                 | Vercel function; re-exports `src/handler.js`                           |
| `src/handler.js`               | `createCard(query)` → `{ status, svg, cacheSeconds }`; never throws    |
| `src/options.js`               | Query parsing/validation; unknown values fall back to defaults         |
| `src/github.js`                | GraphQL (with token) or REST fallback; normalises repos; `GitHubError` |
| `src/stats.js`                 | Totals, top repos, stars per language (rest grouped into "Other")      |
| `src/activity.js`              | Streaks, heatmap levels, weekday/monthly totals from the calendar      |
| `src/themes.js`                | Theme tokens: `bg border title text muted accent track` (+ `gradient`) |
| `src/render/*.js`              | One renderer per layout, `common.js` for the frame and helpers         |
| `src/render/art.js`            | Background art styles, drawn by the frame behind the content           |
| `src/cache.js`                 | In-memory TTL cache (stores promises to dedupe concurrent requests)    |
| `public/index.html`            | Link builder page served at the deployment root                        |
| `bin/cli.js`                   | CLI; `scripts/action.js` + `action.yml` for the GitHub Action          |
| `scripts/dev.js`               | Local server on :3000                                                  |
| `scripts/generate-examples.js` | Renders `assets/examples/*.svg` and `docs/themes.md` from fixtures     |

Zero runtime dependencies. Dev dependencies: ESLint (flat config), Prettier.

## Commands

```sh
npm run check      # lint + prettier --check + tests: run before every commit
npm test           # node:test, all network calls mocked
npm run examples   # regenerate assets/examples (CI fails if they are stale)
npm run format     # prettier --write
npm run dev        # local server; GITHUB_TOKEN switches to GraphQL
```

## Coding standards

- Node.js **22+**, ES modules, plain JavaScript (no TypeScript, no build step).
- Prettier: single quotes, 100 columns, trailing commas. ESLint must pass with no warnings.
- Match the surrounding style: small pure functions, short JSDoc on exported functions,
  comments only where the reason isn't obvious.
- Keep runtime dependency-free. Ask before adding any dependency.
- Every behaviour change gets a test in `test/*.test.js` (`node:test` + `node:assert/strict`).
  Use `test/helpers.js` (`mockFetch`, `graphqlPage`, `graphqlRepo`) instead of real HTTP.

### SVG rules (easy to get wrong)

- **Escape every piece of text** that reaches the SVG with `escapeXml` (usernames, repo names,
  custom titles, labels). Only hex colours validated by `parseColor` go into attributes.
- **No `var(--x)` in presentation attributes** (`fill="var(--accent)"` does not work). Use a
  CSS class (`.accent`, `.track`, …) or a `style`; theme colours are CSS custom properties.
- Text cannot be measured in an `<img>`; layout uses the `measureText`/`truncate` heuristics.
- Art must use the seeded `rand()` (never `Math.random()`), colour via `--art1..3` classes, stay
  subtle behind text, and put animations in `motion` (dropped for reduced motion).
- Animations are CSS only (no JS in SVGs), must end in a visible state (`forwards`), and are
  disabled under `prefers-reduced-motion` and with `disable_animations`.
- Errors render as an on-theme error card, never a broken image or a thrown exception.
- After visual changes, run `npm run examples` and look at the result. In the cloud sandbox,
  Chromium is available via Playwright (`executablePath: '/opt/pw-browsers/chromium'`) for
  screenshots.

## Git workflow

- `main` is the default and only long-lived branch. It is **protected**: no direct pushes,
  changes land through pull requests that are **squash-merged** with green CI.
- Merging is **automatic**: the Auto-merge workflow enables squash auto-merge for PRs from the
  owner, Dependabot and release-please, and deletes the branch after merge. So a PR opened
  here merges as soon as CI is green; open it as a draft if it should wait for review.
- Work branches: `<type>/<short-description>` (e.g. `feat/heatmap-layout`), short-lived,
  deleted after merge. (Claude sessions may be assigned a `claude/…` branch; use that one.)
- Commit messages and PR titles follow **Conventional Commits** (`feat:`, `fix:`, `docs:`,
  `ci:`, `chore:`, `refactor:`, `test:`, `perf:`; `!` or `BREAKING CHANGE:` for majors). The
  PR title becomes the squash commit and is checked by CI.
- Required checks: Lint & format, Test (Node 22), Test (Node 24), Examples up to date, Action
  smoke test, Conventional commit title.

## Releases and versioning

- Semantic Versioning. Current line: **v1** (first release v1.0.0).
- **release-please** (`.github/workflows/release.yml`) opens a release PR from conventional
  commits on `main`; merging it bumps `package.json`, updates `CHANGELOG.md`, tags `vX.Y.Z`,
  publishes the GitHub release and moves the major tag (`v1`) used by Action users.
- **Never** bump the version, edit released `CHANGELOG.md` sections or create tags by hand.
- Release PRs are opened with the release bot's token (`RELEASE_APP_ID` +
  `RELEASE_APP_PRIVATE_KEY`, or `RELEASE_TOKEN`), so they get CI and auto-merge like any PR.
  Without that secret they fall back to `GITHUB_TOKEN`, get no CI and stay blocked.
- `vX.Y.Z` tags are immutable (ruleset); only major tags like `v1` move.

## Repository setup (already done)

Rulesets from `.github/rulesets/` are imported, squash-only merging with auto-merge and
auto-delete of head branches is on, Actions may create PRs, Dependabot groups GitHub Actions updates into one PR,
CodeQL runs weekly and on PRs. `CODEOWNERS` assigns `@iiogurt`.

## Environment notes

- The cloud sandbox cannot reach `api.github.com` user endpoints, so live API calls fail
  there (they render a rate-limit error card). Rely on the mocked tests; real API behaviour
  is exercised by the CI "Action smoke test" job.
