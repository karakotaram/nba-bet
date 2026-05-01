import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, RotateCcw, Info } from 'lucide-react';
import { DRAFT, normalize } from './data';
import { calculateScoresFromStandings } from './scoring';

const PLAYER_TEXT = { Karan: 'text-blue-400', Chris: 'text-emerald-400', Ian: 'text-purple-400' };
const PLAYER_DOT = { Karan: 'bg-blue-500', Chris: 'bg-emerald-500', Ian: 'bg-purple-500' };

const TEAM_OWNER = (() => {
  const map = {};
  Object.entries(DRAFT).forEach(([player, teams]) => {
    teams.forEach(t => { map[normalize(t)] = player; });
  });
  return map;
})();

const ownerOf = (team) => (team ? TEAM_OWNER[normalize(team)] || null : null);

// NBA bracket pairings by seed: 1v8, 4v5, 3v6, 2v7
const BRACKET_PAIRS = [[0, 7], [3, 4], [2, 5], [1, 6]];

const buildR1 = (top8) => BRACKET_PAIRS.map(([hi, lo]) => ({
  high: top8[hi]?.team,
  low: top8[lo]?.team
}));

// Pre-fill picks from real playoff results: a team that has won >= N series in
// real life is set as the winner of round N.
const buildInitialPicks = (eastR1, westR1, real) => {
  const picks = {};
  const sw = real?.seriesWins || {};
  const has = (team, n) => team && (sw[team] || 0) >= n;

  const fillConf = (conf, r1) => {
    r1.forEach((m, i) => {
      if (has(m.high, 1)) picks[`${conf}_r1_${i}`] = m.high;
      else if (has(m.low, 1)) picks[`${conf}_r1_${i}`] = m.low;
    });
    [
      [`${conf}_semi_0`, picks[`${conf}_r1_0`], picks[`${conf}_r1_1`]],
      [`${conf}_semi_1`, picks[`${conf}_r1_2`], picks[`${conf}_r1_3`]]
    ].forEach(([key, a, b]) => {
      if (has(a, 2)) picks[key] = a;
      else if (has(b, 2)) picks[key] = b;
    });
    const semi0 = picks[`${conf}_semi_0`];
    const semi1 = picks[`${conf}_semi_1`];
    if (has(semi0, 3)) picks[`${conf}_cf`] = semi0;
    else if (has(semi1, 3)) picks[`${conf}_cf`] = semi1;
  };

  fillConf('east', eastR1);
  fillConf('west', westR1);

  if (real?.finalsChampion) picks.champion = real.finalsChampion;
  return picks;
};

// Every pick (R1 → Finals) is a 6-pt series win; the champion key also flags
// the +12 finals bonus.
const buildSimulatedResults = (picks) => {
  const seriesWins = {};
  Object.entries(picks).forEach(([key, team]) => {
    if (!team) return;
    seriesWins[team] = (seriesWins[team] || 0) + 1;
  });
  return { seriesWins, finalsChampion: picks.champion || null };
};

// When a pick changes, anything downstream of it is now stale and gets cleared.
const downstreamKeys = (key) => {
  if (key === 'champion') return [];
  if (key.endsWith('_cf')) return ['champion'];
  if (key.includes('_semi_')) {
    const conf = key.split('_')[0];
    return [`${conf}_cf`, 'champion'];
  }
  if (key.includes('_r1_')) {
    const [conf, , idx] = key.split('_');
    const semiIdx = Math.floor(parseInt(idx) / 2);
    return [`${conf}_semi_${semiIdx}`, `${conf}_cf`, 'champion'];
  }
  return [];
};

const TeamRow = ({ team, isWinner, isLoser, hasWinner, onPick, seed }) => {
  if (!team) {
    return <div className="px-3 py-2.5 text-slate-500 italic text-sm">TBD</div>;
  }
  const owner = ownerOf(team);
  return (
    <button
      onClick={onPick}
      className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors ${
        isWinner
          ? 'bg-blue-500/15 border-l-2 border-blue-400'
          : isLoser
            ? 'opacity-40 hover:opacity-70'
            : hasWinner
              ? 'hover:bg-slate-700/40'
              : 'hover:bg-slate-700/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {seed != null && <span className="text-xs font-mono text-slate-500 w-4 shrink-0">{seed}</span>}
        <span className={`text-sm truncate ${isWinner ? 'font-semibold text-white' : 'text-slate-300'}`}>{team}</span>
      </div>
      {owner && (
        <span className={`text-[11px] font-medium shrink-0 ${PLAYER_TEXT[owner]}`}>{owner}</span>
      )}
    </button>
  );
};

const MatchupCard = ({ matchup, onPick, teamSeed }) => {
  const { home, away, winner, key } = matchup;
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
      <TeamRow
        team={home}
        isWinner={winner === home && !!home}
        isLoser={!!winner && winner !== home && !!home}
        hasWinner={!!winner}
        onPick={() => home && onPick(key, home)}
        seed={teamSeed[home]}
      />
      <div className="border-t border-slate-700/60" />
      <TeamRow
        team={away}
        isWinner={winner === away && !!away}
        isLoser={!!winner && winner !== away && !!away}
        hasWinner={!!winner}
        onPick={() => away && onPick(key, away)}
        seed={teamSeed[away]}
      />
    </div>
  );
};

export default function Simulator({ standings, realPlayoffResults }) {
  const eastR1 = useMemo(() => buildR1(standings.East.slice(0, 8)), [standings.East]);
  const westR1 = useMemo(() => buildR1(standings.West.slice(0, 8)), [standings.West]);

  const teamSeed = useMemo(() => {
    const map = {};
    standings.East.slice(0, 8).forEach((t, i) => { map[t.team] = i + 1; });
    standings.West.slice(0, 8).forEach((t, i) => { map[t.team] = i + 1; });
    return map;
  }, [standings]);

  const initialPicks = useMemo(
    () => buildInitialPicks(eastR1, westR1, realPlayoffResults),
    [eastR1, westR1, realPlayoffResults]
  );

  const [picks, setPicks] = useState(initialPicks);

  // If the underlying data refreshes, reset to whatever real results say.
  // User's local picks get blown away — acceptable tradeoff vs. drifting
  // out of sync with reality.
  useEffect(() => {
    setPicks(initialPicks);
  }, [initialPicks]);

  const handlePick = (key, team) => {
    setPicks(prev => {
      const next = { ...prev, [key]: team };
      downstreamKeys(key).forEach(k => { delete next[k]; });
      return next;
    });
  };

  const handleReset = () => setPicks(initialPicks);

  const matchups = useMemo(() => {
    const m = {};
    eastR1.forEach((mu, i) => {
      m[`east_r1_${i}`] = { key: `east_r1_${i}`, home: mu.high, away: mu.low, winner: picks[`east_r1_${i}`] || null };
    });
    westR1.forEach((mu, i) => {
      m[`west_r1_${i}`] = { key: `west_r1_${i}`, home: mu.high, away: mu.low, winner: picks[`west_r1_${i}`] || null };
    });
    ['east', 'west'].forEach(conf => {
      m[`${conf}_semi_0`] = {
        key: `${conf}_semi_0`,
        home: picks[`${conf}_r1_0`] || null,
        away: picks[`${conf}_r1_1`] || null,
        winner: picks[`${conf}_semi_0`] || null
      };
      m[`${conf}_semi_1`] = {
        key: `${conf}_semi_1`,
        home: picks[`${conf}_r1_2`] || null,
        away: picks[`${conf}_r1_3`] || null,
        winner: picks[`${conf}_semi_1`] || null
      };
      m[`${conf}_cf`] = {
        key: `${conf}_cf`,
        home: picks[`${conf}_semi_0`] || null,
        away: picks[`${conf}_semi_1`] || null,
        winner: picks[`${conf}_cf`] || null
      };
    });
    m.champion = {
      key: 'champion',
      home: picks.east_cf || null,
      away: picks.west_cf || null,
      winner: picks.champion || null
    };
    return m;
  }, [picks, eastR1, westR1]);

  const simulatedResults = useMemo(() => buildSimulatedResults(picks), [picks]);
  const sim = useMemo(
    () => calculateScoresFromStandings(standings, simulatedResults),
    [standings, simulatedResults]
  );
  const real = useMemo(
    () => calculateScoresFromStandings(standings, realPlayoffResults),
    [standings, realPlayoffResults]
  );

  const sortedLeaders = Object.entries(sim.scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Simulated leaderboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedLeaders.map(([player, score], idx) => {
          const delta = score - real.scores[player];
          return (
            <div
              key={player}
              className={`relative bg-slate-800 border rounded-xl p-6 flex flex-col items-center ${
                idx === 0 ? 'ring-2 ring-blue-500 border-blue-500/50 bg-slate-800/80' : 'border-slate-700'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-3 right-3 text-yellow-500">
                  <Trophy size={18} />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${PLAYER_DOT[player]}`} />
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{player}</span>
              </div>
              <span className="text-5xl font-black text-white tracking-tighter">{score}</span>
              <span className="text-xs text-slate-500 mt-2">Simulated total</span>
              <div className="mt-3 text-xs">
                <span
                  className={
                    delta > 0
                      ? 'text-green-400 font-semibold'
                      : delta < 0
                        ? 'text-red-400 font-semibold'
                        : 'text-slate-500'
                  }
                >
                  {delta > 0 ? '+' : ''}{delta} from current
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 max-w-2xl">
          <Info className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
          <span>
            Click a team in any matchup to set them as the series winner. Each series win is +6 pts; the NBA Finals champion gets an additional +12.
            Completed series are pre-filled from live results.
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to live results
        </button>
      </div>

      {/* Conference brackets */}
      {[{ label: 'Eastern', conf: 'east' }, { label: 'Western', conf: 'west' }].map(({ label, conf }) => (
        <div key={conf} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{label} Conference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Round 1</h4>
              {[0, 1, 2, 3].map(i => (
                <MatchupCard
                  key={i}
                  matchup={matchups[`${conf}_r1_${i}`]}
                  onPick={handlePick}
                  teamSeed={teamSeed}
                />
              ))}
            </div>
            <div className="space-y-3 md:pt-8">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conf Semis</h4>
              {[0, 1].map(i => (
                <div key={i} className="md:pt-12 md:first:pt-0">
                  <MatchupCard
                    matchup={matchups[`${conf}_semi_${i}`]}
                    onPick={handlePick}
                    teamSeed={teamSeed}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3 md:pt-8 md:flex md:flex-col md:justify-center">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conf Finals</h4>
              <MatchupCard
                matchup={matchups[`${conf}_cf`]}
                onPick={handlePick}
                teamSeed={teamSeed}
              />
            </div>
          </div>
        </div>
      ))}

      {/* NBA Finals */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          NBA Finals
          <span className="text-xs font-normal text-slate-500">(winner +6 series, +12 champion)</span>
        </h3>
        <div className="max-w-md mx-auto">
          <MatchupCard matchup={matchups.champion} onPick={handlePick} teamSeed={teamSeed} />
        </div>
      </div>
    </div>
  );
}
