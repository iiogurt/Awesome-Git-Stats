<div align="center">

# ⭐ Awesome Git Stats

**Show off the stars your projects have earned with beautiful, themeable cards for your GitHub profile README.**

[![CI](https://github.com/iiogurt/Awesome-Git-Stats/actions/workflows/ci.yml/badge.svg)](https://github.com/iiogurt/Awesome-Git-Stats/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/iiogurt/Awesome-Git-Stats?sort=semver)](https://github.com/iiogurt/Awesome-Git-Stats/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<img src="assets/examples/overview.svg" alt="Overview card" width="495">

</div>

## Features

- **Just a link.** Paste one Markdown line into your README. No build step, no JavaScript.
- **Four layouts.** A rich overview, a top repos chart, a compact card and a tiny badge.
- **20 themes.** From `tokyonight` and `dracula` to gradient themes like `sunset` and `aurora`.
- **Follows dark mode.** The `auto` theme switches with the viewer's GitHub theme.
- **Smooth animations.** Subtle, and switched off for people who prefer reduced motion.
- **Users and organizations.** Works for any public GitHub account.
- **Fast and friendly.** Cached responses, and a readable error card instead of a broken image.

## Quick start

Add this to your profile README (the repository named after your username), replacing
`YOUR-DEPLOYMENT` with your instance (see [Deploy your own](#deploy-your-own)) and `octocat`
with your username:

```md
![My GitHub stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat)
```

That's it. Prefer not to host anything? Use the [GitHub Action](#github-action) instead.

## Layouts

Choose a layout with `&layout=`.

| Layout               | Preview                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `overview` (default) | <img src="assets/examples/overview.svg" alt="overview" width="400"> |
| `repos`              | <img src="assets/examples/repos.svg" alt="repos" width="400">       |
| `compact`            | <img src="assets/examples/compact.svg" alt="compact" width="300">   |
| `badge`              | <img src="assets/examples/badge.svg" alt="badge">                   |

```md
![Top repos](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=repos&theme=tokyonight)
![Stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=compact&theme=dracula)
![Stars](https://YOUR-DEPLOYMENT.vercel.app/api/stars?username=octocat&layout=badge)
```

## Themes

`default` · `light` · `dark` · `auto` · `github_dark` · `tokyonight` · `dracula` · `nord` ·
`gruvbox` · `catppuccin` · `catppuccin_latte` · `rose_pine` · `solarized_light` ·
`solarized_dark` · `monokai` · `radical` · `sunset` · `aurora` · `ocean` · `candy`

See them all in the **[theme gallery](docs/themes.md)**.

### Match GitHub's light and dark mode

Use `theme=auto` and the card follows the viewer's colour scheme. Or pick a different theme for
each mode with GitHub's `<picture>` support:

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

All options are URL query parameters. Unknown values fall back to defaults, so a typo will
never break your README.

| Parameter            | Description                                                                       | Default    |
| -------------------- | --------------------------------------------------------------------------------- | ---------- |
| `username`           | GitHub user or organization (**required**)                                        |            |
| `layout`             | `overview`, `repos`, `compact` or `badge`                                         | `overview` |
| `theme`              | Any [theme](docs/themes.md)                                                       | `default`  |
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

## Deploy your own

GitHub limits how often its API can be queried, so every user (or team) runs their own free
instance. It takes about two minutes:

1. Create a [personal access token](https://github.com/settings/personal-access-tokens/new).
   No permissions are needed: public data only.
2. Click the button below, sign in to Vercel and set `GITHUB_TOKEN` to your token.

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiiogurt%2FAwesome-Git-Stats&env=GITHUB_TOKEN&envDescription=A%20GitHub%20token%20with%20no%20extra%20scopes)

3. Open your deployment's home page to build your card link interactively.

| Environment variable | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `GITHUB_TOKEN`       | GitHub token. Without it the slower REST API is used (60 requests per hour). |
| `ALLOWED_USERNAMES`  | Optional comma separated allowlist, so your instance only serves your cards. |

The function is a plain Node.js request handler (`src/handler.js`), so it also runs on any
Node 22+ host; see `scripts/dev.js` for a minimal server.

## GitHub Action

Don't want to host anything? Generate the card inside your profile repository on a schedule
and reference the file instead:

```yaml
# .github/workflows/stars.yml
name: Update stars card
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  card:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: iiogurt/Awesome-Git-Stats@v1
        with:
          layout: overview
          theme: tokyonight
          options: hide_border=true
          path: assets/stars.svg
      - run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add assets/stars.svg
          git commit -m 'chore: update stars card' || exit 0
          git push
```

Then in your README:

```md
![My GitHub stars](assets/stars.svg)
```

| Input      | Description                          | Default                 |
| ---------- | ------------------------------------ | ----------------------- |
| `username` | Account to render                    | Repository owner        |
| `layout`   | Card layout                          | `overview`              |
| `theme`    | Theme                                | `default`               |
| `options`  | Any other options, as a query string |                         |
| `path`     | Output file                          | `awesome-git-stats.svg` |
| `token`    | Token for the GitHub API             | `${{ github.token }}`   |

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

## License

[MIT](LICENSE)
