# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue. Instead, use
[GitHub's private vulnerability reporting](https://github.com/iiogurt/Awesome-Git-Stats/security/advisories/new).
You can expect an initial response within a week.

Things we especially care about:

- Markup or script injection into the generated SVG (for example through repository names,
  display names or query parameters).
- Ways to make a deployment leak its `GITHUB_TOKEN`.
