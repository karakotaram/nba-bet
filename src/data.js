// Draft Results - Update this once per season (current season: 2027 draft, 2026-27 NBA season)
// Each player's array is in draft-round order (index 0 = Round 1, ..., index 9 = Round 10).
// A keeper sits in the round it cost (e.g. Ian's Spurs cost his round-3 pick).
export const DRAFT = {
  Chris: [
    "Knicks", "Rockets", "Nuggets", "Pistons", "Magic",
    "Pacers", "Suns", "Pelicans", "Bulls", "Clippers"
  ],
  Ian: [
    "Thunder", "Cavaliers", "Spurs", "Heat", "Lakers",
    "Trail Blazers", "Hornets", "Grizzlies", "Jazz", "Kings"
  ],
  Karan: [
    "Celtics", "Timberwolves", "Raptors", "76ers", "Warriors",
    "Hawks", "Wizards", "Mavericks", "Nets", "Bucks"
  ]
};

// Round-1 pick order for the current DRAFT (snake: reverses every round).
export const DRAFT_ORDER = ["Ian", "Chris", "Karan"];

// Teams KEPT from the prior season (highlighted yellow in the source spreadsheet).
// 2027: Ian kept the Spurs (R3), Chris kept the Pacers (R6), Karan kept the 76ers (R4).
// Team names are unique across the draft, so a flat list is unambiguous.
export const KEPT_TEAMS = ["Spurs", "Pacers", "76ers"];

// 2026 draft (2025-26 season), archived for the 2026 Draft tab and as the
// keeper anchor for the 2027 draft room.
export const DRAFT_2026 = {
  Chris: [
    "Cavaliers", "Knicks", "Timberwolves", "Bucks", "Hawks",
    "Grizzlies", "Pacers", "Bulls", "Trail Blazers", "Jazz"
  ],
  Ian: [
    "Nuggets", "Magic", "Clippers", "Spurs", "Rockets",
    "Celtics", "Pelicans", "Kings", "Suns", "Wizards"
  ],
  Karan: [
    "Lakers", "Thunder", "Warriors", "Mavericks", "76ers",
    "Pistons", "Raptors", "Heat", "Hornets", "Nets"
  ]
};

// 2026: Chris kept the Knicks, Karan kept the Thunder, Ian kept the Rockets.
export const KEPT_TEAMS_2026 = ["Knicks", "Thunder", "Rockets"];

// Keeper rules for the annual draft (from the league spreadsheet).
export const KEEPER_RULES = [
  "Can't keep any team in the first three rounds.",
  "Forfeit your pick one round earlier for each year a team is kept.",
  "Forfeit your pick two rounds earlier if you keep last year's keeper."
];

// Vegas Projected Win Totals (2026-27 Consensus)
// UPDATE THESE MANUALLY: median line across BetMGM, Betfanatics, Boyd's Bets
// Last updated: Oct 21, 2026
export const VEGAS_PROJECTIONS = {
  "thunder": 62.5,
  "spurs": 59.5,
  "knicks": 52.5,
  "celtics": 51.5,
  "76ers": 50.5,
  "nuggets": 49.5,
  "pistons": 49.5,
  "cavaliers": 48.5,
  "rockets": 48.5,
  "timberwolves": 48.5,
  "lakers": 46.5,
  "heat": 46.5,
  "raptors": 46.5,
  "pacers": 44.5,
  "hawks": 43.5,
  "magic": 43.5,
  "trail blazers": 41.5,
  "suns": 40.5,
  "hornets": 38.5,
  "jazz": 37.5,
  "warriors": 36.5,
  "mavericks": 34.5,
  "wizards": 34.5,
  "bulls": 29.5,
  "grizzlies": 29.5,
  "pelicans": 28.5,
  "clippers": 27.5,
  "bucks": 25.5,
  "nets": 24.5,
  "kings": 20.5
};

// Historic Weekly Standings - 2025-26 Season
// UPDATE THIS WEEKLY: Add new week data as season progresses
// Format: { date: 'YYYY-MM-DD', standings: { Chris: pts, Ian: pts, Karan: pts } }
//
// INSTRUCTIONS:
// 1. Each week, open the app and note the current scores
// 2. Add a new entry below with the date, week number, and scores
//
// Example:
// {
//   date: '2025-11-18',
//   week: 'Week 1',
//   standings: { Chris: 99, Ian: 92, Karan: 107 }
// },
export const HISTORIC_STANDINGS = [
  // Start adding your weekly data here
];

// NBA Cup 2026-27 Results
// Update these as the tournament progresses
// Teams that made semifinals get 1 point each
// Runner-up gets 2 additional points (3 total)
// Champion gets 4 additional points (5 total)
// (2025-26: semis Thunder/Spurs/Magic/Knicks, runner-up Spurs, champion Knicks)
export const NBA_CUP_RESULTS = {
  semifinalists: [], // All 4 teams that made semis
  runnerUp: null,    // Finals loser
  champion: null     // Finals winner
};

// Playoffs 2026-27 Results
// The site fetches these live from ESPN once the playoffs start (src/api.js);
// this is only the starting value / manual fallback.
// Each series win (first round through conference finals) earns 6 points
// Finals winner gets 12 (the Finals is not also a 6-pt series win)
export const PLAYOFF_RESULTS = {
  // Track series wins per team (max 3: the Finals isn't counted here)
  // e.g., { "Thunder": 3, "Celtics": 2 } means Thunder won 3 series, Celtics won 2
  seriesWins: {},
  // Finals champion gets bonus 12 points
  finalsChampion: null
};

// League History - Past Winners
export const LEAGUE_HISTORY = [
  { year: 2020, first: "Karan", second: "Ian", third: "Chris" },
  { year: 2021, first: "Chris", second: "Ian", third: "Karan" },
  { year: 2022, first: "Ian", second: "Karan", third: "Chris" },
  { year: 2023, first: "Karan", second: "Chris", third: "Ian" },
  { year: 2024, first: "Karan", second: "Chris", third: "Ian" },
  { year: 2025, first: "Karan", second: "Ian", third: "Chris" },
  { year: 2026, first: "Chris", second: "Karan", third: "Ian" }
];

// Fallback standings if API fails
// Used only when ESPN is unreachable AND src/historicStandings.js has no
// snapshot yet (the app otherwise starts from the latest daily snapshot).
// 2026-27 opening night (through Oct 20, 2026).
export const FALLBACK_STANDINGS = {
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
};

// Team name normalization mapping
export const TEAM_NAME_MAP = {
  "lakers": "lakers",
  "clippers": "clippers",
  "warriors": "warriors",
  "knicks": "knicks",
  "nets": "nets",
  "cavaliers": "cavaliers",
  "cavs": "cavaliers",
  "timberwolves": "timberwolves",
  "wolves": "timberwolves",
  "trail blazers": "trail blazers",
  "blazers": "trail blazers",
  "76ers": "76ers",
  "sixers": "76ers"
};

export const normalize = (name) => {
  if (!name) return "";
  const n = name.toLowerCase();
  return TEAM_NAME_MAP[n] || n;
};
