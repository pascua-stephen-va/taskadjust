# TaskAdjust — Interactive Settlement, Refund & Overtime Engine

TaskAdjust is a browser-based financial calculation and audit tool for Virtual Assistant retainer operations. It standardizes settlement tie-ups, plan prorations, active account credits, and overtime billing with live itemized breakdowns, one-click client email copy, and Excel/CSV scenario benchmarking.

## Features

- **Four Operational Settlement Modes**
  - **Cancellation Tie-Up**: Calculates earned revenue, unused business days, processing fee deductions, and net client refund or balance due.
  - **Plan Proration**: Computes unused plan credits on upgrades/downgrades, one-time invoice totals, and forward recurring billing dates.
  - **Active Credit / Refund**: Derives daily and hourly rates (Full-Time 8h / Part-Time 4h) for invoice credits or direct cash refunds.
  - **Overtime (OT) Calculation**: Supports 150% standard regular OT, 100% legacy straight-time OT, and 200% holiday OT.
- **Scenario Matrix & Spreadsheet Integration**: Preloaded benchmark cases across all 4 modes with one-click loading, custom `.xlsx` / `.csv` import, and multi-sheet `.xlsx` / `.csv` export.
- **Theme System**: Light, Dark, and Auto (system-synced) theme switcher with flicker-free initialization.
- **Local Draft Persistence & Tour Guide**: Automatically preserves active calculator inputs across refreshes, with one-click reset to defaults and an interactive 6-step Tour Guide.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4**
- **Motion** (`motion/react`) & **Lucide Icons**
- **SheetJS** (`xlsx`) for client-side Excel & CSV import/export

## Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

The development server runs at `http://localhost:3000`.

### Build & Typecheck

```bash
npm run lint
npm run build
```

Production assets are output to `./dist`.

## Deploying to GitHub Pages

This repository includes `.github/workflows/deploy.yml`, which automatically installs dependencies with `npm install --legacy-peer-deps`, builds `./dist`, and deploys to GitHub Pages on pushes to `main`.

1. Push this repository to GitHub.
2. Open **Settings → Pages** in your GitHub repository.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` or manually run the **Build and Deploy to GitHub Pages** workflow from the **Actions** tab.
