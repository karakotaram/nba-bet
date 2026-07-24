// Draft engine for the 2027 draft room (mock + live share this logic).
//
// League scoring is by CONFERENCE SEED (16 - seed), so "team value" here is the
// projected seed value derived from Vegas win totals — the same re-ranking the
// tracker's Vegas projections use. CPU seats draft best-available by that value.
//
// Keeper rules (confirmed for 2027, starting fresh):
//   - Anchor = the round a team was taken in the 2026 draft.
//   - Keeping a team costs a pick 1 round earlier than its 2026 round, or
//     2 rounds earlier if it was ALSO last year's keeper (a consecutive keep).
//   - A keeper is only legal if that cost round is >= MIN_KEEPER_ROUND (3);
//     rounds 1-2 can't be used to keep. (So Rockets R5 -> R3 legal; Knicks/
//     Thunder R2 -> R0 illegal.)

import { DRAFT, KEPT_TEAMS, VEGAS_PROJECTIONS, normalize } from './data';
import { FINAL_REGULAR_SEASON_STANDINGS } from './historicStandings';

export const PLAYERS = ['Chris', 'Ian', 'Karan'];
export const ROUNDS = 10;
export const MIN_KEEPER_ROUND = 3; // rounds 1-2 are off-limits for keepers (option B)

const KEPT_SET = new Set(KEPT_TEAMS.map(normalize));

// --- TEAM POOL -------------------------------------------------------------
// All 30 teams with conference, 2025-26 record, Vegas win total, and the
// projected conference-seed value used for ranking picks.
export function buildTeamPool() {
  const pool = [];
  ['East', 'West'].forEach(conf => {
    FINAL_REGULAR_SEASON_STANDINGS[conf].forEach(t => {
      const vegasWins = VEGAS_PROJECTIONS[normalize(t.team)] ?? 30;
      pool.push({ name: t.team, conf, w: t.w, l: t.l, vegasWins, projSeed: null, projValue: 0 });
    });
  });
  // Rank within conference by Vegas wins -> seed -> points (16 - seed).
  ['East', 'West'].forEach(conf => {
    pool
      .filter(t => t.conf === conf)
      .sort((a, b) => b.vegasWins - a.vegasWins)
      .forEach((t, i) => {
        t.projSeed = i + 1;
        t.projValue = 16 - (i + 1);
      });
  });
  return pool;
}

// --- 2026 ANCHOR -----------------------------------------------------------
// Map every team to who drafted it in 2026 and in which round (keeper anchor).
export function build2026DraftMap() {
  const map = {};
  PLAYERS.forEach(player => {
    (DRAFT[player] || []).forEach((team, idx) => {
      map[normalize(team)] = { player, round: idx + 1, team };
    });
  });
  return map;
}

// --- KEEPERS ---------------------------------------------------------------
// Per-player keeper options with computed cost round and legality.
// Returns { Chris: [...], Ian: [...], Karan: [...] } sorted by cost round.
export function computeKeeperOptions() {
  const map = build2026DraftMap();
  const result = { Chris: [], Ian: [], Karan: [] };
  Object.values(map).forEach(({ player, round, team }) => {
    const keptLastYear = KEPT_SET.has(normalize(team));
    const costRound = round - (keptLastYear ? 2 : 1);
    const eligible = costRound >= MIN_KEEPER_ROUND;
    result[player].push({ team, round2026: round, keptLastYear, costRound, eligible });
  });
  PLAYERS.forEach(p =>
    result[p].sort((a, b) => a.costRound - b.costRound || a.round2026 - b.round2026)
  );
  return result;
}

// Validate a keeper selection: no two of a player's keepers can share a cost
// round, and every keeper must be eligible. Returns { valid, errors: [] }.
export function validateKeepers(keepers) {
  const errors = [];
  const options = computeKeeperOptions();
  PLAYERS.forEach(player => {
    const kept = keepers[player] || [];
    const usedRounds = {};
    kept.forEach(({ team, costRound }) => {
      const opt = options[player].find(o => normalize(o.team) === normalize(team));
      if (!opt) {
        errors.push(`${player}: ${team} was not drafted by ${player} in 2026.`);
      } else if (!opt.eligible) {
        errors.push(`${player}: ${team} can't be kept (cost round ${opt.costRound} < ${MIN_KEEPER_ROUND}).`);
      }
      const r = opt ? opt.costRound : costRound;
      if (usedRounds[r]) {
        errors.push(`${player}: two keepers both cost round ${r} (${usedRounds[r]} & ${team}).`);
      } else {
        usedRounds[r] = team;
      }
    });
  });
  return { valid: errors.length === 0, errors };
}

// --- SNAKE ORDER -----------------------------------------------------------
// playerOrder = pick order for round 1 (e.g. loser first). Returns 30 slots.
export function buildSnakeSlots(playerOrder) {
  const slots = [];
  for (let r = 1; r <= ROUNDS; r++) {
    const order = r % 2 === 1 ? playerOrder : [...playerOrder].reverse();
    order.forEach((player, i) => {
      slots.push({
        overall: slots.length + 1,
        round: r,
        pickInRound: i + 1,
        player,
        team: null,
        keeper: false,
        cpu: false,
      });
    });
  }
  return slots;
}

// Pre-fill each keeper into its owner's pick in the keeper's cost round.
// keepers: { player: [{ team, costRound }] }. Returns a new slots array.
export function applyKeepers(slots, keepers) {
  const next = slots.map(s => ({ ...s }));
  Object.entries(keepers || {}).forEach(([player, kept]) => {
    (kept || []).forEach(({ team, costRound }) => {
      const slot = next.find(s => s.player === player && s.round === costRound && !s.team);
      if (slot) {
        slot.team = team;
        slot.keeper = true;
      }
    });
  });
  return next;
}

// --- POOL STATE ------------------------------------------------------------
// Teams still available given what's already on the board.
export function availableTeams(pool, slots) {
  const taken = new Set(slots.filter(s => s.team).map(s => normalize(s.team)));
  return pool.filter(t => !taken.has(normalize(t.name)));
}

// Index of the next slot that still needs a pick (keeper slots are pre-filled
// and skipped). Returns -1 when the draft is complete.
export function nextOpenIndex(slots, from = 0) {
  for (let i = from; i < slots.length; i++) {
    if (!slots[i].team) return i;
  }
  return -1;
}

// --- CPU PICK --------------------------------------------------------------
// Best-available by projected value, with light randomness among the top few
// so runs aren't identical. rng defaults to Math.random (injectable for tests).
export function cpuPick(pool, slots, rng = Math.random) {
  const avail = availableTeams(pool, slots).sort(
    (a, b) => b.projValue - a.projValue || b.vegasWins - a.vegasWins
  );
  if (avail.length === 0) return null;

  const topN = Math.min(3, avail.length);
  // Weight toward the best pick: ~65% / ~25% / ~10% for the top three.
  const weights = [0.65, 0.25, 0.1].slice(0, topN);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  let idx = 0;
  for (let i = 0; i < topN; i++) {
    if (roll < weights[i]) {
      idx = i;
      break;
    }
    roll -= weights[i];
  }
  return avail[idx].name;
}

// Convenience: default draft order = reverse of last season's finish (loser
// picks first). 2026 finish was Chris 1st, Karan 2nd, Ian 3rd.
export const DEFAULT_ORDER_2027 = ['Ian', 'Karan', 'Chris'];
