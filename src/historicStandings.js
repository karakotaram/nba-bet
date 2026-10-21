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
  }
};
