// Draft Results - Update this once per season
export const DRAFT = {
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

// Vegas Projected Win Totals (2025-26 Consensus)
// UPDATE THESE MANUALLY: Sources: FanDuel, Covers, SportsBettingDime
// Last updated: Dec 4, 2025
export const VEGAS_PROJECTIONS = {
  "thunder": 67.5,
  "nuggets": 56.5,
  "rockets": 56.5,
  "cavaliers": 55.5,
  "lakers": 53.5,
  "pistons": 52.5,
  "knicks": 51.5,
  "timberwolves": 49.5,
  "warriors": 47.5,
  "hawks": 47.5,
  "magic": 47.5,
  "heat": 46.5,
  "spurs": 45.5,
  "raptors": 45.5,
  "76ers": 44.5,
  "celtics": 42.5,
  "bucks": 42.5,
  "bulls": 42.5,
  "clippers": 40.5,
  "suns": 38.5,
  "trail blazers": 38.5,
  "grizzlies": 32.5,
  "mavericks": 31.5,
  "kings": 26.5,
  "hornets": 26.5,
  "pacers": 25.5,
  "pelicans": 23.5,
  "jazz": 21.5,
  "nets": 16.5,
  "wizards": 15.5
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

// League History - Past Winners
export const LEAGUE_HISTORY = [
  { year: 2020, first: "Karan", second: "Ian", third: "Chris" },
  { year: 2021, first: "Chris", second: "Ian", third: "Karan" },
  { year: 2022, first: "Ian", second: "Karan", third: "Chris" },
  { year: 2023, first: "Karan", second: "Chris", third: "Ian" },
  { year: 2024, first: "Karan", second: "Chris", third: "Ian" },
  { year: 2025, first: "Karan", second: "Ian", third: "Chris" }
];

// Fallback standings if API fails
// This data will be used if the NBA API is unavailable
export const FALLBACK_STANDINGS = {
  East: [
    { team: "Pistons", w: 12, l: 2 },
    { team: "Cavaliers", w: 10, l: 5 },
    { team: "Raptors", w: 9, l: 5 },
    { team: "Hawks", w: 9, l: 5 },
    { team: "Knicks", w: 8, l: 5 },
    { team: "76ers", w: 8, l: 5 },
    { team: "Heat", w: 8, l: 6 },
    { team: "Bulls", w: 7, l: 6 },
    { team: "Bucks", w: 8, l: 7 },
    { team: "Magic", w: 7, l: 7 },
    { team: "Celtics", w: 7, l: 7 },
    { team: "Hornets", w: 4, l: 10 },
    { team: "Nets", w: 2, l: 11 },
    { team: "Wizards", w: 1, l: 12 },
    { team: "Pacers", w: 1, l: 13 }
  ],
  West: [
    { team: "Thunder", w: 14, l: 1 },
    { team: "Nuggets", w: 10, l: 3 },
    { team: "Rockets", w: 9, l: 3 },
    { team: "Lakers", w: 10, l: 4 },
    { team: "Spurs", w: 9, l: 4 },
    { team: "Timberwolves", w: 9, l: 5 },
    { team: "Warriors", w: 9, l: 6 },
    { team: "Suns", w: 8, l: 6 },
    { team: "Trail Blazers", w: 6, l: 7 },
    { team: "Jazz", w: 5, l: 8 },
    { team: "Grizzlies", w: 4, l: 10 },
    { team: "Clippers", w: 4, l: 10 },
    { team: "Mavericks", w: 4, l: 11 },
    { team: "Kings", w: 3, l: 11 },
    { team: "Pelicans", w: 2, l: 12 }
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
