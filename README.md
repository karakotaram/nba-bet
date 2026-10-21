# NBA Bet 2027 - Tracker

A React app to track your NBA fantasy league standings throughout the 2026-27 season.

## Features

- **Auto-updating NBA Standings**: Fetches live standings from ESPN API (updates every hour)
- **Manual Vegas Odds**: Easily update projected win totals
- **Historic Tracking**: Track weekly progress throughout the season
- **Interactive Charts**: Visualize season trajectory and performance
- **Responsive Design**: Works on desktop and mobile

## Getting Started

```bash
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## How to Update Data

### 1. NBA Standings (Auto-Updated)

NBA standings are **automatically fetched** from the ESPN API when you:
- First load the app
- Click the "Refresh" button in the header
- After 1 hour (cached data expires)

If the API is unavailable, it will use fallback data from `src/data.js`.

### 2. Vegas Win Total Projections (Manual)

Edit `src/data.js` and update the `VEGAS_PROJECTIONS` object:

```javascript
export const VEGAS_PROJECTIONS = {
  "thunder": 63.5,    // Update these numbers
  "cavaliers": 55.5,  // from FanDuel, Covers, etc.
  "nuggets": 53.5,
  // ... rest of teams
};
```

**Where to get Vegas odds:**
- [FanDuel Sportsbook](https://sportsbook.fanduel.com/nba-futures)
- [Covers.com](https://www.covers.com/sport/basketball/nba/odds)
- [BetMGM](https://sports.betmgm.com/en/sports/basketball-7)

### 3. Historic Weekly Standings (MANUAL TRACKING REQUIRED)

**Important**: You must manually add new entries to `HISTORIC_STANDINGS` in `src/data.js` each week to track progress.

> **Note**: The ESPN API doesn't provide historic standings data, so you need to record the current scores weekly.

```javascript
export const HISTORIC_STANDINGS = [
  {
    date: '2025-11-01',
    week: 'Week 1',
    standings: { Chris: 95, Ian: 88, Karan: 102 }
  },
  {
    date: '2025-11-08',
    week: 'Week 2',
    standings: { Chris: 97, Ian: 90, Karan: 105 }
  },
  // Add new weeks here!
  {
    date: '2025-11-15',  // Current date
    week: 'Week 3',      // Increment week number
    standings: {
      Chris: 99,   // Calculate from current standings
      Ian: 92,
      Karan: 107
    }
  },
];
```

**How to calculate weekly standings:**
1. Click "Refresh" to get latest NBA standings
2. Note down each player's current points from the scoreboard
3. Add a new entry to `HISTORIC_STANDINGS` with:
   - Current date
   - Week number
   - Each player's current points

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   NBA BET 2026                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Live NBA Standings (ESPN API)                     │
│  ↓ Auto-fetched every hour                        │
│  ↓ Cached in browser                              │
│  ↓                                                 │
│  Calculate Current Points                          │
│  ↓                                                 │
│  Compare with:                                     │
│  • Vegas Projections (manual in data.js)          │
│  • Historic Data (manual weekly updates)          │
│  ↓                                                 │
│  Display Charts & Rankings                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Scoring System

- **1st seed in conference**: 15 points
- **2nd seed**: 14 points
- **3rd seed**: 13 points
- ...
- **15th seed**: 1 point

Each player drafts 10 teams (5 from each conference). Points are calculated based on current conference standings.

## Troubleshooting

### Standings not updating?

1. Click the "Refresh" button in the header
2. Check browser console for API errors
3. If ESPN API is down, update `FALLBACK_STANDINGS` in `src/data.js` manually

### Vegas projections seem wrong?

Update the `VEGAS_PROJECTIONS` object in `src/data.js` with the latest odds from sportsbooks.

### Historic chart shows simulated data?

Add real weekly data to the `HISTORIC_STANDINGS` array in `src/data.js`. The chart will automatically switch from simulated to real data once you have entries.

## File Structure

```
src/
├── App.js           # Main React component
├── api.js           # ESPN API integration
├── data.js          # ⭐ Edit this file for manual updates
├── index.css        # Tailwind styles
└── index.js         # App entry point
```

## Weekly Maintenance Checklist

- [ ] Click "Refresh" to get latest standings
- [ ] Record current points for each player
- [ ] Add new week to `HISTORIC_STANDINGS` in `src/data.js`
- [ ] (Monthly) Update `VEGAS_PROJECTIONS` with latest odds

## Daily Standings Automation (GitHub Actions)

`.github/workflows/update-standings.yml` runs `scripts/update-standings.mjs`
every morning to fetch NBA standings from ESPN and commit them to
`src/historicStandings.js` (the `Update daily standings for YYYY-MM-DD`
commits), then triggers the GitHub Pages deploy so the points chart updates.

It follows ESPN's season calendar, so it turns itself off:

- **Regular season:** one snapshot per day.
- **Play-in:** no changes (records are final, 7/8 seeds still being decided).
- **First run after the playoffs start:** rewrites the final regular-season
  snapshot in official seed order (tiebreakers + play-in 7/8 seeds), sets
  `REGULAR_SEASON_END_DATE` (the site then scores regular-season points from
  that frozen snapshot instead of live ESPN standings), and **disables the
  workflow**.

**Status: ENABLED for the 2026-27 season** (re-enabled Oct 21, 2026). The
2025-26 daily standings are archived in `src/historicStandings2026.js`.

`workflow_dispatch` stays available, so you can trigger a run manually from the
GitHub Actions tab at any time (it's a no-op outside the regular season).

### Re-enabling for next season (e.g. NBA Bet 2028)

1. Archive the season: rename `src/historicStandings.js` to
   `src/historicStandings<YEAR>.js`, and start a new `src/historicStandings.js`
   with an empty `export const DAILY_STANDINGS = {\n};` followed by the
   `REGULAR_SEASON_END_DATE = null` / `FINAL_REGULAR_SEASON_STANDINGS` exports
   (copy them from the archived file and reset the date to `null`). The script
   fills in the first day.
2. Push to `main`, then re-enable the workflow: Actions tab → "Update Daily
   Standings" → **Enable workflow** (or `gh workflow enable update-standings.yml`).
   Enabling it early is fine; it waits for the regular season to start.

If you forget step 1, the first run of the new season fails (and emails you)
rather than mixing two seasons in one file.

## Playoff Scoring Check (GitHub Actions)

`.github/workflows/check-playoff-scoring.yml` runs
`scripts/check-playoff-scoring.mjs` weekly (Mondays), and daily from April to
June. It rebuilds the 2025-26 playoffs with the site's own ESPN fetcher and
compares them with the real results (Knicks champions), so an ESPN API change
fails the run, and emails you, months before it would cost points. Once the
playoffs start, it also checks the live bracket math, and the run summary shows
each player's playoff points.

Note: GitHub pauses scheduled workflows in a repo with no commits for 60 days
(it emails a warning first). If that happens after the season freezes in
April, re-enable it from the Actions tab.

## Deployment

To deploy this app:

```bash
npm run build
```

Then deploy the `build/` folder to:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- Any static hosting service

## Technologies Used

- React 19
- Tailwind CSS 3
- Recharts (charting library)
- Lucide React (icons)
- ESPN NBA API (free, no auth required)
