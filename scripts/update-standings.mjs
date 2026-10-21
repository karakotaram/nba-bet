#!/usr/bin/env node
// Fetches today's NBA standings from ESPN and appends to historicStandings.js
// Used by the daily GitHub Actions workflow (.github/workflows/update-standings.yml)
//
// Season lifecycle, driven by ESPN's season calendar:
//   - before the regular season: nothing to do
//   - regular season: append one snapshot per day, keyed by ET date
//   - play-in: nothing to do (records are final, 7/8 seeds still undecided)
//   - once the playoffs start: rewrite the final regular-season snapshot in
//     official seed order (tiebreakers + play-in 7/8), set
//     REGULAR_SEASON_END_DATE so the site freezes regular-season points, and
//     tell the workflow to disable itself (season_over=true)
//
// Testing overrides: STANDINGS_NOW (ISO time to treat as now) and
// STANDINGS_FILE (path of the file to update).

import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sortBySeed } from '../src/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STANDINGS_FILE = process.env.STANDINGS_FILE || join(__dirname, '..', 'src', 'historicStandings.js');
const NOW = process.env.STANDINGS_NOW ? new Date(process.env.STANDINGS_NOW) : new Date();

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
        const seedObj = stats.find(s => s.name === 'playoffSeed');
        const wins = winsObj?.value || 0;
        const losses = lossesObj?.value || 0;

        standingsArray.push({
          team: TEAM_NAME_MAP[teamName] || teamName,
          w: parseInt(wins),
          l: parseInt(losses),
          playoffSeed: seedObj?.value != null ? parseInt(seedObj.value) : null
        });
      });
    }
  });

  return { standings: { East: eastStandings, West: westStandings }, seasons: data.seasons };
}

// A team that hasn't played yet counts as .500, not .000, so it isn't ranked
// below winless teams in the first days of the season.
const winPct = t => (t.w + t.l ? t.w / (t.w + t.l) : 0.5);
const sortByWinPct = (a, b) => winPct(b) - winPct(a);

const sortStandings = (standings, compare) => ({
  East: [...standings.East].sort(compare),
  West: [...standings.West].sort(compare),
});

function etDateStr(date) {
  // Use US Eastern time since NBA games finish by ~midnight ET
  const et = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const y = et.getFullYear();
  const m = String(et.getMonth() + 1).padStart(2, '0');
  const d = String(et.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Regular-season / postseason boundaries for the season containing `now`,
// from the `seasons` calendar ESPN sends with the standings. regEndKey is the
// ET date of the morning after the last regular-season games, i.e. the key of
// the final daily snapshot.
function seasonCalendar(seasons, now) {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const season = seasons.find(s => new Date(s.startDate) <= now && now < new Date(s.endDate)) || seasons[0];
  const type = abbr => season.types?.find(t => t.abbreviation === abbr);
  const reg = type('reg');
  const post = type('post');
  if (!reg || !post) return null;
  return {
    regStart: new Date(reg.startDate),
    regEndKey: etDateStr(new Date(reg.endDate)),
    postStart: new Date(post.startDate),
  };
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

// Insert an entry before the `};` that closes DAILY_STANDINGS (other exports
// follow it, and the object is empty on the first day of a season).
function insertEntry(content, dateStr, standings) {
  const OPEN = 'export const DAILY_STANDINGS = {';
  const start = content.indexOf(OPEN);
  const close = start === -1 ? -1 : content.indexOf('\n};', start);
  if (close === -1) throw new Error('Failed to find insertion point in historicStandings.js');

  const isEmpty = content.slice(start + OPEN.length, close).trim() === '';
  const newEntry = formatStandingsEntry(dateStr, standings);
  return content.slice(0, close) + (isEmpty ? '\n' : ',\n\n') + newEntry + content.slice(close);
}

// Replace the entry for dateStr (entries close with a line of exactly "  }"),
// or insert it if that day's snapshot is missing.
function upsertEntry(content, dateStr, standings) {
  const entry = new RegExp(`  "${dateStr}": \\{[\\s\\S]*?\\n  \\}`);
  if (!entry.test(content)) return insertEntry(content, dateStr, standings);
  return content.replace(entry, () => formatStandingsEntry(dateStr, standings));
}

function assertTeamCount(standings) {
  if (standings.East.length !== 15 || standings.West.length !== 15) {
    throw new Error(`Unexpected team count: ${standings.East.length}E + ${standings.West.length}W`);
  }
}

// Step outputs for the workflow (commit message, whether to disable itself).
function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

const FROZEN_RE = /export const REGULAR_SEASON_END_DATE = "(\d{4}-\d{2}-\d{2})";/;
const UNFROZEN_LINE = 'export const REGULAR_SEASON_END_DATE = null;';

async function main() {
  const today = etDateStr(NOW);
  console.log(`Fetching standings for ${today}...`);

  const { standings, seasons } = await fetchESPNStandings();
  let content = readFileSync(STANDINGS_FILE, 'utf-8');
  const calendar = seasonCalendar(seasons, NOW);
  const frozenDate = content.match(FROZEN_RE)?.[1];

  if (!calendar) {
    console.log('::warning::ESPN sent no season calendar; appending without season checks');
  }

  // Already frozen: nothing to add this season. A new season needs a fresh
  // file first, so fail loudly rather than mixing seasons.
  if (frozenDate) {
    if (calendar && etDateStr(calendar.regStart) > frozenDate) {
      throw new Error(
        `historicStandings.js is frozen at ${frozenDate} but a new regular season starts ` +
        `${etDateStr(calendar.regStart)}. Archive it first (README: "Re-enabling for next season").`
      );
    }
    console.log(`Season already frozen at ${frozenDate}; nothing to do.`);
    setOutput('season_over', 'true');
    return;
  }

  if (calendar && NOW < calendar.regStart) {
    console.log(`Regular season starts ${etDateStr(calendar.regStart)}; nothing to do yet.`);
    return;
  }

  // Regular season (including the morning after the last games): daily snapshot.
  if (!calendar || today <= calendar.regEndKey) {
    assertTeamCount(standings);
    if (content.includes(`"${today}"`)) {
      console.log(`${today} already exists in historicStandings.js, skipping.`);
      return;
    }
    writeFileSync(STANDINGS_FILE, insertEntry(content, today, sortStandings(standings, sortByWinPct)));
    setOutput('commit_message', `Update daily standings for ${today}`);
    console.log(`Added ${today} to historicStandings.js`);
    return;
  }

  if (NOW < calendar.postStart) {
    console.log('Play-in underway; final standings freeze once the playoffs start.');
    return;
  }

  // Playoffs have started, so ESPN's seeds now reflect tiebreakers and the
  // play-in. Rewrite the final regular-season snapshot in that order and freeze.
  assertTeamCount(standings);
  const endKey = calendar.regEndKey;
  if (!content.includes(UNFROZEN_LINE)) throw new Error(`historicStandings.js is missing "${UNFROZEN_LINE}"`);
  content = upsertEntry(content, endKey, sortStandings(standings, sortBySeed));
  content = content.replace(UNFROZEN_LINE, `export const REGULAR_SEASON_END_DATE = "${endKey}";`);
  writeFileSync(STANDINGS_FILE, content);
  setOutput('commit_message', `Freeze final regular-season standings (${endKey})`);
  setOutput('season_over', 'true');
  console.log(`Froze final regular-season standings at ${endKey} (seeded order).`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
