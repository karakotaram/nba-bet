#!/usr/bin/env node
// Script to backfill historic standings from Basketball Reference
// Usage: node scripts/backfill-standings.mjs

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
  "Los Angeles Clippers": "Clippers",
  "Los Angeles Lakers": "Lakers",
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

const EAST_TEAMS = new Set([
  "Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers",
  "Pistons", "Pacers", "Heat", "Bucks", "Knicks", "Magic",
  "76ers", "Raptors", "Wizards"
]);

function shortName(fullName) {
  return TEAM_NAME_MAP[fullName] || fullName;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchStandingsForDate(year, month, day) {
  const url = `https://www.basketball-reference.com/friv/standings.fcgi?month=${month}&day=${day}&year=${year}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const html = await resp.text();

  // Parse standings tables from HTML
  // Basketball Reference has two tables: Eastern and Western conference
  const teams = [];

  // Match rows like: <td ...><a href="...">Team Name</a></td><td ...>W</td><td ...>L</td>
  // The standings table rows have team links and W-L columns
  const tableRegex = /<table[^>]*id="(standings_e|standings_w)"[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const conf = tableMatch[1] === "standings_e" ? "East" : "West";
    const tableHtml = tableMatch[2];

    // Match each row with team data
    const rowRegex = /<tr[^>]*>[\s\S]*?<th[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/th>\s*<td[^>]*>([\d]+)<\/td>\s*<td[^>]*>([\d]+)<\/td>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const fullName = rowMatch[1].trim();
      const w = parseInt(rowMatch[2]);
      const l = parseInt(rowMatch[3]);
      const name = shortName(fullName);
      teams.push({ team: name, w, l, conf });
    }
  }

  if (teams.length === 0) {
    // Try alternative parsing - sometimes the HTML structure differs
    // Look for the expanded standings format
    const altRegex = /<tr[^>]*>\s*<td[^>]*class="left"[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/td>\s*<td[^>]*>([\d]+)<\/td>\s*<td[^>]*>([\d]+)<\/td>/gi;
    let altMatch;
    while ((altMatch = altRegex.exec(html)) !== null) {
      const fullName = altMatch[1].trim();
      const w = parseInt(altMatch[2]);
      const l = parseInt(altMatch[3]);
      const name = shortName(fullName);
      const conf = EAST_TEAMS.has(name) ? "East" : "West";
      teams.push({ team: name, w, l, conf });
    }
  }

  const east = teams.filter(t => t.conf === "East")
    .sort((a, b) => {
      const wpctA = a.w + a.l > 0 ? a.w / (a.w + a.l) : 0;
      const wpctB = b.w + b.l > 0 ? b.w / (b.w + b.l) : 0;
      return wpctB - wpctA || b.w - a.w;
    })
    .map(({ team, w, l }) => ({ team, w, l }));

  const west = teams.filter(t => t.conf === "West")
    .sort((a, b) => {
      const wpctA = a.w + a.l > 0 ? a.w / (a.w + a.l) : 0;
      const wpctB = b.w + b.l > 0 ? b.w / (b.w + b.l) : 0;
      return wpctB - wpctA || b.w - a.w;
    })
    .map(({ team, w, l }) => ({ team, w, l }));

  return { East: east, West: west };
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function standingsToJS(dateStr, standings) {
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
  const startDate = new Date(2025, 10, 18); // Nov 18, 2025
  const endDate = new Date(2026, 1, 11);    // Feb 11, 2026

  const results = [];
  let current = new Date(startDate);
  let count = 0;

  while (current <= endDate) {
    const dateStr = formatDate(current);
    const month = current.getMonth() + 1;
    const day = current.getDate();
    const year = current.getFullYear();

    count++;
    process.stderr.write(`Fetching ${dateStr} (${count})...\n`);

    try {
      const standings = await fetchStandingsForDate(year, month, day);
      if (standings.East.length === 15 && standings.West.length === 15) {
        results.push({ date: dateStr, standings });
        process.stderr.write(`  ✓ ${standings.East.length}E + ${standings.West.length}W teams\n`);
      } else {
        process.stderr.write(`  ⚠ Unexpected team count: ${standings.East.length}E + ${standings.West.length}W - skipping\n`);
      }
    } catch (err) {
      process.stderr.write(`  ✗ Error: ${err.message}\n`);
    }

    // Rate limit: ~3 seconds between requests to be respectful
    await sleep(3000);

    current.setDate(current.getDate() + 1);
  }

  // Output JS entries
  const jsEntries = results.map(r => standingsToJS(r.date, r.standings));
  console.log(jsEntries.join(",\n\n"));
}

main().catch(console.error);
