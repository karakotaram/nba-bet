# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NBA Bet 2026 is a React app that tracks a fantasy basketball league where 3 players (Chris, Ian, Karan) draft NBA teams and earn points based on conference standings. Points are calculated as `16 - conference_rank` (15 pts for 1st seed, 1 pt for 15th seed). The worst team overall gets a +3 bonus.

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
3. **Historic tracking**: Daily standings stored in `historicStandings.js`, plus auto-saved to localStorage on each refresh

### Key Files

- **`src/data.js`** - Configuration hub:
  - `DRAFT` - Which teams each player drafted
  - `VEGAS_PROJECTIONS` - Win total odds (update from FanDuel/Covers/SportsBettingDime)
  - `NBA_CUP_RESULTS` - NBA Cup semifinalists, runner-up, and champion
  - `PLAYOFF_RESULTS` - Playoff series wins and finals champion
  - `FALLBACK_STANDINGS` - Used when ESPN API fails
  - `LEAGUE_HISTORY` - Past season results
  - `normalize()` - Team name normalization helper

- **`src/api.js`** - ESPN API integration with caching
- **`src/historicStandings.js`** - `DAILY_STANDINGS` object keyed by date (YYYY-MM-DD format)
- **`src/App.js`** - Main React component with scoring logic in `calculateScoresFromStandings()`

### Scoring Calculation
The scoring logic in `App.js:115-240` calculates points per team:
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
