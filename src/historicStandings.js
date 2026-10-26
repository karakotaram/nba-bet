// Historic NBA Standings - 2026-27 Season
// Source: ESPN standings API, appended daily by scripts/update-standings.mjs
// (GitHub Actions cron). Each key is the ET date the snapshot was taken, i.e.
// standings through the previous night's games.
// The 2025-26 season is archived in historicStandings2026.js.

export const DAILY_STANDINGS = {
  "2026-10-21": {
    East: [
      { team: "Pistons", w: 1, l: 0 },
      { team: "76ers", w: 1, l: 0 },
      { team: "Hawks", w: 0, l: 0 },
      { team: "Bulls", w: 0, l: 0 },
      { team: "Cavaliers", w: 0, l: 0 },
      { team: "Pacers", w: 0, l: 0 },
      { team: "Heat", w: 0, l: 0 },
      { team: "Bucks", w: 0, l: 0 },
      { team: "Nets", w: 0, l: 0 },
      { team: "Magic", w: 0, l: 0 },
      { team: "Wizards", w: 0, l: 0 },
      { team: "Raptors", w: 0, l: 0 },
      { team: "Hornets", w: 0, l: 0 },
      { team: "Knicks", w: 0, l: 1 },
      { team: "Celtics", w: 0, l: 1 }
    ],
    West: [
      { team: "Thunder", w: 1, l: 0 },
      { team: "Pelicans", w: 0, l: 0 },
      { team: "Mavericks", w: 0, l: 0 },
      { team: "Nuggets", w: 0, l: 0 },
      { team: "Warriors", w: 0, l: 0 },
      { team: "Rockets", w: 0, l: 0 },
      { team: "Clippers", w: 0, l: 0 },
      { team: "Lakers", w: 0, l: 0 },
      { team: "Timberwolves", w: 0, l: 0 },
      { team: "Suns", w: 0, l: 0 },
      { team: "Trail Blazers", w: 0, l: 0 },
      { team: "Kings", w: 0, l: 0 },
      { team: "Jazz", w: 0, l: 0 },
      { team: "Grizzlies", w: 0, l: 0 },
      { team: "Spurs", w: 0, l: 1 }
    ]
  },

  "2026-10-22": {
    East: [
      { team: "Pacers", w: 1, l: 0 },
      { team: "Raptors", w: 1, l: 0 },
      { team: "Wizards", w: 1, l: 0 },
      { team: "Pistons", w: 1, l: 0 },
      { team: "Hawks", w: 1, l: 0 },
      { team: "Hornets", w: 1, l: 0 },
      { team: "76ers", w: 1, l: 0 },
      { team: "Cavaliers", w: 0, l: 0 },
      { team: "Nets", w: 0, l: 1 },
      { team: "Knicks", w: 0, l: 1 },
      { team: "Magic", w: 0, l: 1 },
      { team: "Celtics", w: 0, l: 1 },
      { team: "Bucks", w: 0, l: 1 },
      { team: "Heat", w: 0, l: 1 },
      { team: "Bulls", w: 0, l: 1 }
    ],
    West: [
      { team: "Timberwolves", w: 1, l: 0 },
      { team: "Trail Blazers", w: 1, l: 0 },
      { team: "Clippers", w: 1, l: 0 },
      { team: "Lakers", w: 1, l: 0 },
      { team: "Grizzlies", w: 1, l: 0 },
      { team: "Rockets", w: 1, l: 0 },
      { team: "Thunder", w: 1, l: 0 },
      { team: "Nuggets", w: 0, l: 0 },
      { team: "Pelicans", w: 0, l: 1 },
      { team: "Spurs", w: 0, l: 1 },
      { team: "Mavericks", w: 0, l: 1 },
      { team: "Jazz", w: 0, l: 1 },
      { team: "Warriors", w: 0, l: 1 },
      { team: "Kings", w: 0, l: 1 },
      { team: "Suns", w: 0, l: 1 }
    ]
  },

  "2026-10-23": {
    East: [
      { team: "Pacers", w: 1, l: 0 },
      { team: "Raptors", w: 1, l: 0 },
      { team: "Wizards", w: 1, l: 0 },
      { team: "Pistons", w: 1, l: 0 },
      { team: "Hawks", w: 1, l: 0 },
      { team: "Hornets", w: 1, l: 0 },
      { team: "76ers", w: 2, l: 0 },
      { team: "Celtics", w: 0, l: 1 },
      { team: "Cavaliers", w: 0, l: 1 },
      { team: "Nets", w: 0, l: 1 },
      { team: "Knicks", w: 0, l: 1 },
      { team: "Magic", w: 0, l: 1 },
      { team: "Bucks", w: 0, l: 1 },
      { team: "Heat", w: 0, l: 1 },
      { team: "Bulls", w: 0, l: 1 }
    ],
    West: [
      { team: "Timberwolves", w: 1, l: 0 },
      { team: "Trail Blazers", w: 1, l: 0 },
      { team: "Clippers", w: 1, l: 0 },
      { team: "Lakers", w: 1, l: 0 },
      { team: "Grizzlies", w: 1, l: 0 },
      { team: "Rockets", w: 1, l: 0 },
      { team: "Thunder", w: 2, l: 0 },
      { team: "Pelicans", w: 0, l: 1 },
      { team: "Nuggets", w: 0, l: 1 },
      { team: "Spurs", w: 0, l: 1 },
      { team: "Mavericks", w: 0, l: 1 },
      { team: "Jazz", w: 0, l: 1 },
      { team: "Warriors", w: 0, l: 1 },
      { team: "Kings", w: 0, l: 1 },
      { team: "Suns", w: 0, l: 1 }
    ]
  },

  "2026-10-24": {
    East: [
      { team: "Hawks", w: 2, l: 0 },
      { team: "Pistons", w: 2, l: 0 },
      { team: "76ers", w: 2, l: 0 },
      { team: "Raptors", w: 2, l: 0 },
      { team: "Pacers", w: 1, l: 1 },
      { team: "Wizards", w: 1, l: 1 },
      { team: "Celtics", w: 1, l: 1 },
      { team: "Bulls", w: 1, l: 1 },
      { team: "Hornets", w: 1, l: 1 },
      { team: "Knicks", w: 0, l: 2 },
      { team: "Bucks", w: 0, l: 2 },
      { team: "Magic", w: 0, l: 2 },
      { team: "Heat", w: 0, l: 2 },
      { team: "Nets", w: 0, l: 1 },
      { team: "Cavaliers", w: 0, l: 1 }
    ],
    West: [
      { team: "Timberwolves", w: 2, l: 0 },
      { team: "Trail Blazers", w: 2, l: 0 },
      { team: "Lakers", w: 2, l: 0 },
      { team: "Thunder", w: 2, l: 0 },
      { team: "Grizzlies", w: 2, l: 0 },
      { team: "Rockets", w: 2, l: 0 },
      { team: "Clippers", w: 1, l: 1 },
      { team: "Jazz", w: 1, l: 1 },
      { team: "Mavericks", w: 1, l: 1 },
      { team: "Pelicans", w: 0, l: 2 },
      { team: "Spurs", w: 0, l: 2 },
      { team: "Warriors", w: 0, l: 2 },
      { team: "Kings", w: 0, l: 2 },
      { team: "Nuggets", w: 0, l: 1 },
      { team: "Suns", w: 0, l: 1 }
    ]
  },

  "2026-10-25": {
    East: [
      { team: "Pistons", w: 2, l: 0 },
      { team: "Raptors", w: 2, l: 0 },
      { team: "76ers", w: 3, l: 0 },
      { team: "Hawks", w: 2, l: 1 },
      { team: "Hornets", w: 2, l: 1 },
      { team: "Wizards", w: 2, l: 1 },
      { team: "Celtics", w: 1, l: 1 },
      { team: "Pacers", w: 1, l: 1 },
      { team: "Cavaliers", w: 1, l: 1 },
      { team: "Bulls", w: 1, l: 2 },
      { team: "Bucks", w: 0, l: 3 },
      { team: "Heat", w: 0, l: 3 },
      { team: "Knicks", w: 0, l: 2 },
      { team: "Nets", w: 0, l: 2 },
      { team: "Magic", w: 0, l: 2 }
    ],
    West: [
      { team: "Timberwolves", w: 2, l: 0 },
      { team: "Trail Blazers", w: 2, l: 0 },
      { team: "Lakers", w: 2, l: 0 },
      { team: "Thunder", w: 2, l: 0 },
      { team: "Grizzlies", w: 2, l: 0 },
      { team: "Rockets", w: 3, l: 0 },
      { team: "Clippers", w: 1, l: 1 },
      { team: "Nuggets", w: 1, l: 1 },
      { team: "Jazz", w: 1, l: 1 },
      { team: "Suns", w: 1, l: 1 },
      { team: "Spurs", w: 1, l: 2 },
      { team: "Mavericks", w: 1, l: 2 },
      { team: "Pelicans", w: 0, l: 3 },
      { team: "Warriors", w: 0, l: 3 },
      { team: "Kings", w: 0, l: 2 }
    ]
  },

  "2026-10-26": {
    East: [
      { team: "Pistons", w: 3, l: 0 },
      { team: "76ers", w: 3, l: 1 },
      { team: "Hawks", w: 2, l: 1 },
      { team: "Raptors", w: 2, l: 1 },
      { team: "Pacers", w: 2, l: 1 },
      { team: "Hornets", w: 2, l: 1 },
      { team: "Wizards", w: 2, l: 1 },
      { team: "Celtics", w: 1, l: 1 },
      { team: "Cavaliers", w: 1, l: 1 },
      { team: "Magic", w: 1, l: 2 },
      { team: "Bulls", w: 1, l: 2 },
      { team: "Knicks", w: 0, l: 3 },
      { team: "Bucks", w: 0, l: 3 },
      { team: "Nets", w: 0, l: 3 },
      { team: "Heat", w: 0, l: 3 }
    ],
    West: [
      { team: "Trail Blazers", w: 2, l: 0 },
      { team: "Timberwolves", w: 3, l: 0 },
      { team: "Thunder", w: 3, l: 0 },
      { team: "Lakers", w: 3, l: 0 },
      { team: "Grizzlies", w: 3, l: 0 },
      { team: "Rockets", w: 3, l: 0 },
      { team: "Nuggets", w: 1, l: 1 },
      { team: "Suns", w: 1, l: 1 },
      { team: "Spurs", w: 1, l: 2 },
      { team: "Clippers", w: 1, l: 2 },
      { team: "Jazz", w: 1, l: 2 },
      { team: "Mavericks", w: 1, l: 2 },
      { team: "Pelicans", w: 0, l: 3 },
      { team: "Warriors", w: 0, l: 3 },
      { team: "Kings", w: 0, l: 3 }
    ]
  }
};

// Set by scripts/update-standings.mjs once the playoffs start: the date of the
// final regular-season snapshot (rewritten in official seed order). From then on
// the site scores regular-season points from FINAL_REGULAR_SEASON_STANDINGS
// instead of live ESPN standings, whose seeds drift during the playoffs.
export const REGULAR_SEASON_END_DATE = null;
export const FINAL_REGULAR_SEASON_STANDINGS = REGULAR_SEASON_END_DATE ? DAILY_STANDINGS[REGULAR_SEASON_END_DATE] : null;
