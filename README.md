<div align="center">

# ⭐ Awesome Git Stats

**Show off the stars your projects have earned with beautiful, themeable cards for your GitHub profile README.**

[![CI](https://github.com/iiogurt/Awesome-Git-Stats/actions/workflows/ci.yml/badge.svg)](https://github.com/iiogurt/Awesome-Git-Stats/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/iiogurt/Awesome-Git-Stats?sort=semver)](https://github.com/iiogurt/Awesome-Git-Stats/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<img src="assets/examples/overview.svg" alt="Overview card" width="495">

</div>

## Features

- **Five layouts.** A rich overview, a top repos chart, a compact card, a tiny badge and a
  full **dashboard** with streaks, a contribution heatmap and activity charts.
- **33 themes.** 13 artistic themes with generated background art (starry skies, synthwave
  grids, aurora, blueprints, contour maps…), plus 20 classic palettes like `tokyonight`.
- **13 art styles.** Put any art style on any theme. The art is generated from your username,
  so your starfield is yours alone.
- **Follows dark mode.** The `auto` theme switches with the viewer's GitHub theme.
- **Smooth animations.** Subtle, and switched off for people who prefer reduced motion.
- **Users and organizations.** Works for any public GitHub account.
- **No server needed.** Generate the card with a GitHub Action, or serve it live if you prefer.

## How it works: pick one of two ways

A README can only show images. Something has to fetch your stars from the GitHub API and draw
that image, and there are two places where this can happen:

|                 | **1. GitHub Action** (recommended)           | **2. Live link**                                        |
| --------------- | -------------------------------------------- | ------------------------------------------------------- |
| What you set up | One workflow file in your profile repository | A link to a running instance                            |
| Hosting         | **None.** GitHub Actions runs it for free    | A Vercel deployment (yours, or someone's public one)    |
| Token           | None, the workflow's built-in token is used  | The instance owner provides one or more                 |
| Card updates    | On your schedule, e.g. daily                 | On view, cached for a few hours                         |
| Depends on      | Only GitHub                                  | The instance staying up and within GitHub's rate limits |
| In your README  | `![Stars](assets/stars.svg)`                 | `![Stars](https://…/api/stars?username=you)`            |

Star counts change slowly, so for a personal profile the Action is the simplest and most
reliable choice. Choose the live link if you want to share one instance with others or need
the card to update within hours rather than once a day.

Services such as github-readme-stats work the second way: their maintainers pay for and run
one public instance for everybody, which is why you don't host anything, and why their cards
can break for everyone when that instance hits GitHub's limits.

## Option 1: GitHub Action (no hosting)

Everything happens inside your profile repository (the repository named after your username).

**1. Add a workflow.** Create `.github/workflows/stars.yml`:

```yaml
name: Update stars card

on:
  schedule:
    - cron: '0 3 * * *' # every day at 03:00 UTC
  workflow_dispatch: # adds a "Run workflow" button

permissions:
  contents: write # lets the Action commit the card

jobs:
  card:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: iiogurt/Awesome-Git-Stats@v1
        with:
          theme: tokyonight
          path: assets/stars.svg
```

**2. Run it once.** Open the _Actions_ tab, pick _Update stars card_ and click _Run workflow_.
The Action renders the card and commits `assets/stars.svg`. Afterwards it runs daily and
commits only when your numbers changed.

**3. Show it in your README:**

```md
![My GitHub stars](assets/stars.svg)
```

### More cards, and options

Add one step per card. Any [option](#options) goes into `options` as a query string:

```yaml
- uses: iiogurt/Awesome-Git-Stats@v1
  with:
    layout: repos
    theme: dracula
    options: count=8&hide_border=true&exclude=dotfiles
    path: assets/top-repos.svg
```

### Action inputs

| Input            | Description                                      | Default                           |
| ---------------- | ------------------------------------------------ | --------------------------------- |
| `username`       | Account to render                                | Repository owner                  |
| `layout`         | `overview`, `repos`, `compact` or `badge`        | `overview`                        |
| `theme`          | Any [theme](docs/themes.md)                      | `default`                         |
| `options`        | Any other [options](#options), as a query string |                                   |
| `path`           | Output file                                      | `awesome-git-stats.svg`           |
| `commit`         | Commit and push the card when it changed         | `true`                            |
| `commit-message` | Message for that commit                          | `chore: update GitHub stars card` |
| `token`          | Token for the GitHub API                         | `${{ github.token }}`             |

Outputs: `path` (the written file) and `changed` (`true` when a new card was committed). Set
`commit: false` to commit yourself, for example to bundle several files into one commit.

## Option 2: Live link (hosted instance)

The card is drawn on request by a small serverless function. There's nothing to maintain once
it's deployed, but it does need a Vercel account (the free plan is enough).

### Deploy an instance

1. Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new).
   It needs no permissions at all, because only public data is read. Give it an expiry date
   and renew it when it runs out.
2. Click the button, sign in to Vercel and paste the token as `GITHUB_TOKEN`:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiiogurt%2FAwesome-Git-Stats&env=GITHUB_TOKEN&envDescription=A%20GitHub%20token%20with%20no%20extra%20scopes)

3. In the Vercel project, open _Settings → Environment Variables_ and make sure `GITHUB_TOKEN`
   (and `GITHUB_TOKENS`, if you use it) is marked **Sensitive**, so its value can't be read
   back, even by project members. If Vercel shows "Needs Attention", use _Rotate Variable_ and
   save the token again as Sensitive, then redeploy.
4. Open the deployment's home page. It has a link builder with a live preview, so you can
   pick a layout and theme and copy the Markdown line:

   ```md
   ![My GitHub stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat)
   ```

### Just for you, or for everyone

- **Personal instance:** set `ALLOWED_USERNAMES=your-name` so nobody else can use up your
  token's rate limit. A single token is plenty.
- **Public instance:** leave the allowlist empty and share the link. GitHub allows each token
  roughly 5,000 uncached cards per hour, so for many users add more tokens (ideally from
  different accounts) in `GITHUB_TOKENS`. Requests are spread across all of them, and when one
  token hits its limit the next one is used automatically. Responses are cached by Vercel's CDN
  (4 hours by default), so popular cards cost almost nothing.

| Environment variable | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`       | A GitHub token. Without any token the REST API is used (60 requests per hour). |
| `GITHUB_TOKENS`      | More tokens for a busy instance, separated by commas or new lines.             |
| `ALLOWED_USERNAMES`  | Optional comma separated allowlist of accounts this instance serves.           |

Tokens stay on the server: they are only sent to `api.github.com` and never appear in a card,
an error message or the link builder. A token without permissions can only read public data,
so the worst a leaked one allows is using up its rate limit. Still, revoke and replace a token
you've shared by accident.

The function is a plain Node.js request handler (`src/handler.js`), so it also runs on any
Node 22+ host; see `scripts/dev.js` for a minimal server.

## Layouts

Choose a layout with `layout:` in the Action or `&layout=` in a live link.

| Layout               | Preview                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `overview` (default) | <img src="assets/examples/overview.svg" alt="overview" width="400">   |
| `repos`              | <img src="assets/examples/repos.svg" alt="repos" width="400">         |
| `compact`            | <img src="assets/examples/compact.svg" alt="compact" width="300">     |
| `badge`              | <img src="assets/examples/badge.svg" alt="badge">                     |
| `dashboard`          | <img src="assets/examples/dashboard.svg" alt="dashboard" width="400"> |

```md
![Top repos](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=repos&theme=tokyonight)
![Stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=compact&theme=dracula)
![Stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=badge)
![My GitHub](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=dashboard&theme=synthwave)
```

### The dashboard

<img src="assets/examples/dashboard-synthwave.svg" alt="dashboard layout with the synthwave theme" width="820">

`layout=dashboard` puts everything on one 820 px wide card:

- **Headline tiles:** stars, contributions in the last 12 months, current and longest streak,
  all-time pull requests and followers.
- **Contribution heatmap** for the last year, with your best day, daily average and number of
  active days, plus your **weekly rhythm** (which weekdays you're most active).
- **Monthly activity** trend, the **contribution mix** (commits, pull requests, code reviews,
  issues), repos contributed to and private contributions.
- **Most starred repos** and **stars by language**.

Streaks count consecutive days with at least one contribution. A streak still counts as current
if you haven't contributed yet today. Contribution data comes from GitHub's GraphQL API, so it
needs a token (the GitHub Action uses its built-in one) and is only available for user
accounts; organisations get repository statistics instead. It includes private contributions
only if you've enabled _Include private contributions on my profile_ in your GitHub settings.

## Themes

### Artistic themes

<img src="assets/examples/theme-synthwave.svg" alt="synthwave theme" width="400"> <img src="assets/examples/theme-starry_night.svg" alt="starry_night theme" width="400">
<img src="assets/examples/theme-blueprint.svg" alt="blueprint theme" width="400"> <img src="assets/examples/theme-sakura.svg" alt="sakura theme" width="400">

`starry_night` · `constellation` · `northern_lights` · `synthwave` · `cyberpunk` · `terminal` ·
`blueprint` · `parchment` · `topographic` · `pop_art` · `glass` · `sakura` · `deep_sea`

### Classic themes

`default` · `light` · `dark` · `auto` · `github_dark` · `tokyonight` · `dracula` · `nord` ·
`gruvbox` · `catppuccin` · `catppuccin_latte` · `rose_pine` · `solarized_light` ·
`solarized_dark` · `monokai` · `radical` · `sunset` · `aurora` · `ocean` · `candy`

### Art styles

Combine any theme with any art style using `art=`, for example `theme=dracula&art=starfield`
(or `options: art=starfield` in the Action). `art=none` switches the art off.

`starfield` · `constellation` · `aurora` · `synthwave` · `waves` · `topography` · `blueprint` ·
`halftone` · `scanlines` · `grain` · `bokeh` · `sakura` · `circuit`

See every theme and art style in the **[theme gallery](docs/themes.md)**.

### Match GitHub's light and dark mode

Use `theme=auto` and the card follows the viewer's colour scheme. Or pick a different theme for
each mode with GitHub's `<picture>` support. With the Action, render two files (for example
`assets/stars-dark.svg` and `assets/stars-light.svg`) and use those paths instead of the links:

```html
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&theme=tokyonight"
  />
  <img
    alt="My GitHub stars"
    src="https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&theme=catppuccin_latte"
  />
</picture>
```

## Options

The same options work in both ways of using the project: as `options:` in the Action
(`count=8&hide_border=true`) or as URL parameters in a live link. Unknown values fall back to
defaults, so a typo will never break your README.

| Parameter            | Description                                                                       | Default    |
| -------------------- | --------------------------------------------------------------------------------- | ---------- |
| `username`           | GitHub user or organization (**required**)                                        |            |
| `layout`             | `overview`, `repos`, `compact` or `badge`                                         | `overview` |
| `theme`              | Any [theme](docs/themes.md)                                                       | `default`  |
| `art`                | Background [art style](docs/themes.md#art-styles), or `none`                      | theme's    |
| `custom_title`       | Replace the card title (max 60 characters)                                        |            |
| `hide_title`         | Hide the title                                                                    | `false`    |
| `hide_border`        | Hide the border                                                                   | `false`    |
| `border_radius`      | Corner radius, `0`–`30`                                                           | `10`       |
| `disable_animations` | Turn animations off                                                               | `false`    |
| `count`              | Repositories shown in the `repos` layout, `1`–`10`                                | `5`        |
| `langs_count`        | Languages shown before grouping into "Other", `1`–`8` (max 4 in `overview`)       | `5`        |
| `hide`               | Comma separated stats to hide in `overview`: `forks`, `repos`, `followers`, `top` |            |
| `exclude`            | Comma separated repository names to leave out                                     |            |
| `include_forks`      | Count stars on forked repositories                                                | `false`    |
| `label`              | Label text of the `badge` layout (max 24 characters)                              | `stars`    |
| `cache_seconds`      | Cache lifetime, `1800`–`86400`                                                    | `14400`    |
| `*_color`            | Colour overrides: `bg`, `border`, `title`, `text`, `muted`, `accent`, `track`     |            |

Example with a few options combined:

```md
![Stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&theme=nord&hide_border=true&exclude=dotfiles,notes&accent_color=ff6b6b)
```

### What is counted?

Stars on the account's **public, owned, non-fork repositories** (add `include_forks=true` to
include forks). Stars per language use each repository's primary language.

## Command line

```sh
GITHUB_TOKEN=... npx github:iiogurt/Awesome-Git-Stats --username octocat --layout repos --theme dracula --out stars.svg
```

## Development

Requires Node.js 22 or newer.

```sh
npm install
npm run dev          # http://localhost:3000 (set GITHUB_TOKEN for the GraphQL API)
npm test             # unit tests
npm run check        # lint + format check + tests
npm run examples     # regenerate the preview images in assets/examples
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, commit conventions and release process.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). The URL parameters and the
Action inputs are the public API: breaking changes to them only happen in a new major version.
All notable changes are listed in the [changelog](CHANGELOG.md).

## Acknowledgements

This project was inspired by
[github-stats-extended](https://github.com/stats-organization/github-stats-extended) and the
project it builds on, [github-readme-stats](https://github.com/anuraghazra/github-readme-stats).
Their cards showed how much a small SVG can add to a profile README, and the idea of a public
link builder, themes and per-colour overrides comes from them. Awesome Git Stats is an
independent implementation focused on stars, with a GitHub Action so nobody has to host
anything. Thank you to their authors and contributors.

## License

[MIT](LICENSE)
