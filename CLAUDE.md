# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NBA Bet 2027 (2026-27 NBA season) is a React app that tracks a fantasy basketball league where 3 players (Chris, Ian, Karan) draft NBA teams and earn points based on conference standings. Points are calculated as `16 - conference_rank` (15 pts for 1st seed, 1 pt for 15th seed). The worst team overall gets a +3 bonus.

## Commands

```bash
npm start          # Run dev server at localhost:3000
npm run build      # Production build to build/
npm run deploy     # Deploy to GitHub Pages (runs build first)
npm test           # Run tests with Jest
```

## Architecture

### Data Flow
1. **Live standings**: `api.js` fetches from ESPN API (`site.api.espn.com/apis/v2/sports/basketball/nba/standings`), cached 1 hour in localStorage
2. **Vegas projections**: Manual updates in `VEGAS_PROJECTIONS` object in `data.js`
3. **Historic tracking**: Daily standings appended to `historicStandings.js` by a GitHub Actions cron (`scripts/update-standings.mjs`); past seasons are archived as `historicStandings<YEAR>.js`

### Key Files

- **`src/data.js`** - Configuration hub:
  - `DRAFT` / `DRAFT_ORDER` / `KEPT_TEAMS` - Current season's draft (round order), round-1 snake order, and keepers
  - `DRAFT_2026` / `KEPT_TEAMS_2026` - Archived 2026 draft (2026 Draft tab + keeper anchor for the dormant draft rooms)
  - `VEGAS_PROJECTIONS` - Win total odds (update from FanDuel/Covers/SportsBettingDime)
  - `NBA_CUP_RESULTS` - NBA Cup semifinalists, runner-up, and champion
  - `PLAYOFF_RESULTS` - Playoff series wins and finals champion
  - `FALLBACK_STANDINGS` - Used when ESPN API fails
  - `LEAGUE_HISTORY` - Past season results
  - `normalize()` - Team name normalization helper

- **`src/api.js`** - ESPN API integration with caching
- **`src/historicStandings.js`** - `DAILY_STANDINGS` object keyed by date (YYYY-MM-DD format)
- **`src/App.js`** - Main React component; scoring logic is `calculateScoresFromStandings()` in `src/scoring.js`
- **`src/DraftBoard.js`** - Draft board + keeper rules cards for the 2027/2026 Draft tabs
- **`src/Draft2027.js`, `MockDraftRoom.js`, `LiveDraftRoom.js`, `draftEngine.js`** - Mock/live draft rooms, not linked from the UI since the 2027 draft is done; see the note atop `draftEngine.js` to reuse them

### Scoring Calculation
The scoring logic in `src/scoring.js` calculates points per team:
- **Regular Season**: `16 - conference_rank` (15 pts for 1st seed, 1 pt for 15th seed)
- **Last Place Bonus**: +3 for the worst overall record
- **NBA Cup**: +1 for semifinalists (not advancing), +2 for runner-up, +4 for champion (exclusive, not cumulative)
- **Playoffs**: +6 per series win, +12 for finals champion

## Updating Data

### Vegas Odds (periodic)
Update `VEGAS_PROJECTIONS` in `src/data.js` with current win totals. Use lowercase team names matching the existing keys (e.g., "thunder", "trail blazers", "76ers").

### Historic Standings
Add new entries to `DAILY_STANDINGS` in `src/historicStandings.js` with format:
```javascript
"YYYY-MM-DD": {
  East: [{ team: "TeamName", w: 0, l: 0 }, ...],
  West: [{ team: "TeamName", w: 0, l: 0 }, ...]
}
```

### NBA Cup Results
Update `NBA_CUP_RESULTS` in `src/data.js` as the tournament progresses:
```javascript
NBA_CUP_RESULTS = {
  semifinalists: ["Thunder", "Rockets", "Bucks", "Hawks"],  // All 4 semifinalists
  runnerUp: "Bucks",       // Finals loser
  champion: "Thunder"      // Finals winner
}
```

### Playoff Results
Update `PLAYOFF_RESULTS` in `src/data.js` as playoffs progress:
```javascript
PLAYOFF_RESULTS = {
  seriesWins: { "Thunder": 3, "Celtics": 2 },  // Series wins per team
  finalsChampion: "Thunder"  // Finals winner
}
```

## Tech Stack
- React 19, Tailwind CSS 3, Recharts, Lucide icons
- Create React App (react-scripts 5.0.1)
- Deployed to GitHub Pages
