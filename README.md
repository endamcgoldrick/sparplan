# Sparplan

Swedish savings options ranked by real risk. Every fund and share is scored from its actual
price history over the last 5 years, on the EU's official 1–7 risk scale, with a lump-sum
planner, a monthly-saving planner, a watchlist and saved plans, in Swedish or English.

For learning only. It is not financial advice.

- **App:** https://endamcgoldrick.github.io/sparplan/ No sign-in needed. It installs like an app
  and keeps working offline with the last data it saw.
- **Data:** refreshed automatically every weekday evening by GitHub (see *How it updates*).
  Your computer doesn't need to be on.

## Installing the app

- **Windows or Mac (Edge or Chrome):** open the address, then use the *Install* icon at the
  right of the address bar (or ⋯ menu → *Apps → Install Sparplan*).
- **iPhone:** open it in **Safari** → Share button → *Add to Home Screen*.
- **Android:** open it in **Chrome** → ⋮ menu → *Install app*.

Your watchlist, saved plans, language and theme are stored on each device separately.

## How it updates

`.github/workflows/publish.yml` runs:

| When | What it does |
|---|---|
| Weekdays at 18:15 Stockholm time (19:15 in summer) | Runs `refresh-data.ps1` for fresh prices and rates, checks the result, publishes |
| Every change to `main` | Publishes the new code with the data that's already live (about 1 minute) |
| *Actions → Refresh data and publish → Run workflow* | Publishes now; tick *Fetch fresh market data* to refresh too |

If a refresh fails (for example, Yahoo Finance briefly blocks GitHub's servers), nothing is
published and the app keeps the previous day's data. The run shows a red cross in the
*Actions* tab, and the next run tries again.

## One-time setup

1. **Pages:** *Settings → Pages → Build and deployment → Source: GitHub Actions*.
2. **US insider data (optional):** *Settings → Secrets and variables → Actions → New
   repository secret*. Name it `SEC_CONTACT`; the value is your email address. The SEC asks
   automated tools for a contact address. Without it the app still works, just without the
   US insider table.

## What's in this repository

| Path | What it is |
|---|---|
| `app/web/` | The app (plain HTML, CSS and JavaScript, no build step) |
| `app/web/core.js` | The calculations: risk level, returns, drops, Sharpe ratio, plan optimiser |
| `app/web/i18n.js` | Swedish translations (English text is the key) |
| `refresh-data.ps1` | Fetches prices (Yahoo Finance), rates and FX (Riksbank) and insider trades (Finansinspektionen, SEC) into `market-data.json` |
| `.github/workflows/publish.yml` | The schedule and publishing described above |
| `app/Sparplan.ps1`, `app/Start-Sparplan.vbs`, `app/Install-Shortcuts.ps1` | Optional Windows desktop version that runs from this folder |
| `sparplan.html` | The single-page version published as a claude.ai artifact |

`app/web/core.js` repeats the maths in `sparplan.html`. If a method changes in one, change the other.

## Running it on this PC

- **Desktop version:** `powershell -ExecutionPolicy Bypass -File app\Install-Shortcuts.ps1`
  once, then start *Sparplan* from the Start menu. It uses a local `market-data.json`
  (refreshed by `refresh-data.ps1`, which reads the SEC contact from a `.sec-contact` file that
  is never uploaded).
- **Making changes:** edit, then `git add -A`, `git commit -m "..."`, `git push`. The live app
  updates about a minute later.

## Method

Weekly dividend-adjusted closes for 5 years, converted to SEK at the Riksbank's official
EUR/SEK and USD/SEK fixings. Volatility is the standard deviation of weekly log returns × √52,
mapped to ESMA SRRI risk classes (bands 0.5 / 2 / 5 / 10 / 15 / 25%). Sharpe uses the 5-year
average 3-month T-bill rate. Past results are not forecasts.
