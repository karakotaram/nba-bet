#!/usr/bin/env node
// Checks that the site's playoff scoring still works against ESPN.
// Run by .github/workflows/check-playoff-scoring.yml (weekly, and daily during
// the playoffs); a failed run emails the repo owner.
//
// 1. Regression: rebuild the 2025-26 playoffs with the site's own fetcher
//    (fetchPlayoffResults in src/api.js) and compare with the real results.
//    This catches an ESPN API change months before it would cost points.
// 2. Live: once the current playoffs start, fetch them, sanity-check the
//    bracket math, and report each player's playoff points.

import { appendFileSync } from 'fs';
import { fetchPlayoffResults, PLAYOFF_SEASON, PLAYOFF_START } from '../src/api.js';
import { DRAFT, normalize } from '../src/data.js';

// 2025-26 playoffs (Knicks beat the Spurs 4-1 in the Finals). seriesWins
// leaves out the Finals, which is scored as +12 for the champion instead.
const EXPECTED_2026 = {
  seriesWins: {
    Knicks: 3, Spurs: 3, Cavaliers: 2, Thunder: 2,
    '76ers': 1, Pistons: 1, Lakers: 1, Timberwolves: 1,
  },
  finalsChampion: 'Knicks',
};

// 8 first-round + 4 second-round + 2 conference-final series (the Finals is
// tracked as finalsChampion, not as a series win).
const MAX_SERIES_WINS = 14;

const failures = [];
const summary = [];
const fail = msg => {
  failures.push(msg);
  console.error(`✗ ${msg}`);
};

// Same rule as getPlayoffBonus in src/scoring.js: +6 per series win, +12 for
// the Finals champion.
const playoffPoints = (results, team) =>
  6 * (results.seriesWins[team] || 0) + (results.finalsChampion === team ? 12 : 0);

// Bracket sanity checks that hold at any point in the playoffs.
function checkBracket(label, results) {
  const counts = Object.values(results.seriesWins);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total > MAX_SERIES_WINS) fail(`${label}: ${total} series wins (max ${MAX_SERIES_WINS})`);
  if (counts.some(c => c > 3)) fail(`${label}: a team has more than 3 series wins`);
  const champ = results.finalsChampion;
  if (champ && results.seriesWins[champ] !== 3) {
    fail(`${label}: champion ${champ} has ${results.seriesWins[champ] || 0} series wins (expected 3)`);
  }
  if (champ && total !== MAX_SERIES_WINS) {
    fail(`${label}: champion crowned but only ${total} of ${MAX_SERIES_WINS} series wins found`);
  }
}

const sameResults = (a, b) =>
  a.finalsChampion === b.finalsChampion &&
  JSON.stringify(Object.entries(a.seriesWins).sort()) === JSON.stringify(Object.entries(b.seriesWins).sort());

// --- 1. Regression against 2025-26 -----------------------------------------
const past = await fetchPlayoffResults(2026);
if (!past) {
  fail('2025-26: playoff fetch failed (see the ESPN error above)');
} else if (!sameResults(past, EXPECTED_2026)) {
  fail(`2025-26: results don't match the real playoffs.\n  got:      ${JSON.stringify(past)}\n  expected: ${JSON.stringify(EXPECTED_2026)}`);
} else {
  checkBracket('2025-26', past);
  console.log('✓ 2025-26 playoffs rebuilt correctly (Knicks champions)');
  summary.push('✅ 2025-26 regression: rebuilt correctly (Knicks champions)');
}

// --- 2. Current playoffs ----------------------------------------------------
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
if (today < PLAYOFF_START) {
  console.log(`· ${PLAYOFF_SEASON} playoffs start ${PLAYOFF_START}; nothing live to check yet`);
  summary.push(`⏳ ${PLAYOFF_SEASON} playoffs: not started (site fetches from ${PLAYOFF_START})`);
} else {
  const live = await fetchPlayoffResults(PLAYOFF_SEASON);
  if (!live) {
    fail(`${PLAYOFF_SEASON}: playoff fetch failed (see the ESPN error above)`);
  } else {
    checkBracket(String(PLAYOFF_SEASON), live);

    // Every team with playoff points must belong to a player.
    const owner = {};
    Object.entries(DRAFT).forEach(([player, teams]) => teams.forEach(t => { owner[normalize(t)] = player; }));
    const scored = [...new Set([...Object.keys(live.seriesWins), live.finalsChampion].filter(Boolean))];
    scored.filter(t => !owner[normalize(t)]).forEach(t => fail(`${PLAYOFF_SEASON}: ${t} has playoff wins but isn't on any roster`));

    const rows = Object.entries(DRAFT).map(([player, teams]) => {
      const pts = teams.reduce((sum, t) => sum + playoffPoints(live, t), 0);
      const detail = teams.filter(t => playoffPoints(live, t) > 0).map(t => `${t} ${playoffPoints(live, t)}`).join(', ');
      return { player, pts, detail };
    }).sort((a, b) => b.pts - a.pts);

    console.log(`✓ ${PLAYOFF_SEASON} playoff points:`);
    rows.forEach(r => console.log(`  ${r.player}: ${r.pts}${r.detail ? ` (${r.detail})` : ''}`));
    summary.push(
      `🏀 ${PLAYOFF_SEASON} playoff points${live.finalsChampion ? ` — ${live.finalsChampion} won the title` : ''}`,
      '',
      '| Player | Playoff pts | Teams |',
      '| --- | --- | --- |',
      ...rows.map(r => `| ${r.player} | ${r.pts} | ${r.detail || '—'} |`),
    );
  }
}

if (failures.length) summary.unshift('❌ **Playoff scoring check failed**', '', ...failures.map(f => `- ${f.split('\n')[0]}`), '');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
process.exit(failures.length ? 1 : 0);
