# Security

Sparplan is a static website with no accounts and no server. It stores nothing about its
visitors: the watchlist, saved plans and settings stay in each visitor's own browser.

## Reporting a problem

Please report security issues privately: on this repository, go to **Security → Report a
vulnerability**. Don't open a public issue for them.

## How it's protected

- **No secrets in the code.** The only secret, the SEC contact address, is a GitHub Actions
  secret, given only to the step that fetches data. Secret scanning with push protection
  blocks committing keys or tokens.
- **Locked-down publishing.** The workflow starts with no permissions, and each job asks only
  for what it needs. Third-party actions are pinned to exact commits and limited to
  GitHub's own; Dependabot proposes updates after a one-week cooldown. Only `main` can
  publish, and `main` can't be force-pushed or deleted.
- **Checked data.** Market data comes from outside sources (Yahoo Finance, Riksbank,
  Finansinspektionen, SEC). Before anything is published, the workflow rejects data with
  markup characters, unexpected symbols or currencies, or invalid numbers. If a check fails,
  the previous version stays live.
- **Safe page.** A Content-Security-Policy allows scripts, styles, fonts and data only from
  the site itself (no inline scripts, no `eval`), and outside text is escaped before it's
  shown. The site is served over HTTPS only.
- **No third parties.** Fonts are self-hosted (SIL Open Font License, licences in
  `app/web/fonts/`), so opening the app sends no request to Google or anyone else. The
  workflow fails if an outside resource is added.
- **Desktop version** (`app/Sparplan.ps1`): listens on this computer only (localhost), rejects
  other host names, and needs a per-launch random token to start a data refresh.
