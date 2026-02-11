#!/usr/bin/env node
// Fetches today's NBA standings from ESPN and appends to historicStandings.js
// Used by the daily GitHub Actions workflow

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STANDINGS_FILE = join(__dirname, '..', 'src', 'historicStandings.js');

const TEAM_NAME_MAP = {
  "Atlanta Hawks": "Hawks",
  "Boston Celtics": "Celtics",
  "Brooklyn Nets": "Nets",
  "Charlotte Hornets": "Hornets",
  "Chicago Bulls": "Bulls",
  "Cleveland Cavaliers": "Cavaliers",
  "Dallas Mavericks": "Mavericks",
  "Denver Nuggets": "Nuggets",
  "Detroit Pistons": "Pistons",
  "Golden State Warriors": "Warriors",
  "Houston Rockets": "Rockets",
  "Indiana Pacers": "Pacers",
  "LA Clippers": "Clippers",
  "Los Angeles Clippers": "Clippers",
  "Los Angeles Lakers": "Lakers",
  "LA Lakers": "Lakers",
  "Memphis Grizzlies": "Grizzlies",
  "Miami Heat": "Heat",
  "Milwaukee Bucks": "Bucks",
  "Minnesota Timberwolves": "Timberwolves",
  "New Orleans Pelicans": "Pelicans",
  "New York Knicks": "Knicks",
  "Oklahoma City Thunder": "Thunder",
  "Orlando Magic": "Magic",
  "Philadelphia 76ers": "76ers",
  "Phoenix Suns": "Suns",
  "Portland Trail Blazers": "Trail Blazers",
  "Sacramento Kings": "Kings",
  "San Antonio Spurs": "Spurs",
  "Toronto Raptors": "Raptors",
  "Utah Jazz": "Jazz",
  "Washington Wizards": "Wizards",
};

async function fetchESPNStandings() {
  const response = await fetch(
    'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings'
  );

  if (!response.ok) {
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();
  const eastStandings = [];
  const westStandings = [];

  if (!data.children) {
    throw new Error('Unexpected ESPN API response structure');
  }

  data.children.forEach(conference => {
    const isEast = conference.name === 'Eastern Conference';
    const standingsArray = isEast ? eastStandings : westStandings;

    if (conference.standings && conference.standings.entries) {
      conference.standings.entries.forEach(entry => {
        const teamName = entry.team.displayName;
        const stats = entry.stats;
        const winsObj = stats.find(s => s.name === 'wins');
        const lossesObj = stats.find(s => s.name === 'losses');
        const wins = winsObj?.value || 0;
        const losses = lossesObj?.value || 0;

        standingsArray.push({
          team: TEAM_NAME_MAP[teamName] || teamName,
          w: parseInt(wins),
          l: parseInt(losses)
        });
      });
    }
  });

  const sortByWinPct = (a, b) => {
    const pctA = a.w / (a.w + a.l || 1);
    const pctB = b.w / (b.w + b.l || 1);
    return pctB - pctA;
  };

  eastStandings.sort(sortByWinPct);
  westStandings.sort(sortByWinPct);

  return { East: eastStandings, West: westStandings };
}

function getTodayDateStr() {
  // Use US Eastern time since NBA games finish by ~midnight ET
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const y = et.getFullYear();
  const m = String(et.getMonth() + 1).padStart(2, '0');
  const d = String(et.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatStandingsEntry(dateStr, standings) {
  let js = `  "${dateStr}": {\n`;
  for (const conf of ["East", "West"]) {
    js += `    ${conf}: [\n`;
    standings[conf].forEach((t, i) => {
      const comma = i < standings[conf].length - 1 ? "," : "";
      js += `      { team: "${t.team}", w: ${t.w}, l: ${t.l} }${comma}\n`;
    });
    js += `    ]${conf === "East" ? "," : ""}\n`;
  }
  js += `  }`;
  return js;
}

async function main() {
  const today = getTodayDateStr();
  console.log(`Fetching standings for ${today}...`);

  const standings = await fetchESPNStandings();

  if (standings.East.length !== 15 || standings.West.length !== 15) {
    console.error(`Unexpected team count: ${standings.East.length}E + ${standings.West.length}W`);
    process.exit(1);
  }

  console.log(`Got ${standings.East.length}E + ${standings.West.length}W teams`);

  // Read existing file
  const content = readFileSync(STANDINGS_FILE, 'utf-8');

  // Check if today's date already exists
  if (content.includes(`"${today}"`)) {
    console.log(`${today} already exists in historicStandings.js, skipping.`);
    process.exit(0);
  }

  // Insert new entry before the closing `};`
  const newEntry = formatStandingsEntry(today, standings);
  const updated = content.replace(/\n\};[\s]*$/, `,\n\n${newEntry}\n};\n`);

  if (updated === content) {
    console.error('Failed to find insertion point in historicStandings.js');
    process.exit(1);
  }

  writeFileSync(STANDINGS_FILE, updated);
  console.log(`Added ${today} to historicStandings.js`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
