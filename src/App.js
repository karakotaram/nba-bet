import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, Calendar, AlertCircle, ArrowUp, Info, RefreshCw } from 'lucide-react';
import { getStandings } from './api';
import { DRAFT, VEGAS_PROJECTIONS, FALLBACK_STANDINGS, LEAGUE_HISTORY, NBA_CUP_RESULTS, PLAYOFF_RESULTS, normalize } from './data';
import { DAILY_STANDINGS } from './historicStandings';

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

const TeamRow = ({ teamName, points, record, rank, draftPosition, relativeToExpected }) => {
  let pointsColor = "text-slate-400";
  if (points >= 13) pointsColor = "text-emerald-400 font-bold";
  else if (points <= 5) pointsColor = "text-red-400";

  let relativeColor = "text-slate-400";
  if (relativeToExpected > 0) relativeColor = "text-green-400";
  else if (relativeToExpected < 0) relativeColor = "text-red-400";

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-2 rounded transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-6 text-center">
          <span className="text-xs font-mono text-slate-500">{rank}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">{teamName}</span>
          <span className="text-xs text-slate-500">
            ({record.w}-{record.l}) • Pick #{draftPosition}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-xs font-mono ${relativeColor}`}>
          {relativeToExpected > 0 ? '+' : ''}{relativeToExpected}
        </div>
        <div className={`text-sm ${pointsColor}`}>
          {points} pts
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [standings, setStandings] = useState(FALLBACK_STANDINGS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historicDataVersion, setHistoricDataVersion] = useState(0);

  // Fetch standings on mount
  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async (forceFresh = false) => {
    setIsRefreshing(true);
    try {
      console.log('🔄 App: Starting to fetch standings...');

      // Clear cache if forceFresh is true
      if (forceFresh) {
        console.log('🗑️  Clearing standings cache...');
        localStorage.removeItem('nba_standings_cache');
      }

      const data = await getStandings();
      console.log('📥 App: Received data:', data);

      if (data && data.East && data.West) {
        console.log(`✅ App: Setting standings - East: ${data.East.length} teams, West: ${data.West.length} teams`);
        setStandings({ East: data.East, West: data.West });
        setLastUpdated(new Date());

        // Save today's standings to localStorage for historic tracking
        saveTodayStandings({ East: data.East, West: data.West });
      } else {
        console.warn('⚠️  App: API returned null, using fallback');
        // Keep using fallback standings
      }
    } catch (error) {
      console.error('❌ App: Failed to fetch standings:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Save today's standings to localStorage
  const saveTodayStandings = (standingsData) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const stored = localStorage.getItem('historic_daily_standings');
      const historicData = stored ? JSON.parse(stored) : {};

      // Only save if we don't already have data for today
      if (!historicData[today]) {
        historicData[today] = standingsData;
        localStorage.setItem('historic_daily_standings', JSON.stringify(historicData));
        console.log(`💾 Saved standings for ${today}`);
        // Trigger re-render of historic data
        setHistoricDataVersion(v => v + 1);
      }
    } catch (error) {
      console.warn('Failed to save historic standings:', error);
    }
  };

  // Helper function to calculate scores from standings
  const calculateScoresFromStandings = (standingsData) => {
    const scores = { Chris: 0, Ian: 0, Karan: 0 };
    const details = { Chris: [], Ian: [], Karan: [] };

    // Breakdown tracking for each player
    const breakdown = {
      Chris: { regularSeason: 0, nbaCup: 0, playoffs: 0, lastPlaceBonus: 0 },
      Ian: { regularSeason: 0, nbaCup: 0, playoffs: 0, lastPlaceBonus: 0 },
      Karan: { regularSeason: 0, nbaCup: 0, playoffs: 0, lastPlaceBonus: 0 }
    };

    const findTeamData = (teamName) => {
      const n = normalize(teamName);
      let rank = standingsData.East.findIndex(t => normalize(t.team) === n);
      if (rank !== -1) return { ...standingsData.East[rank], rank: rank + 1, conf: 'East' };

      rank = standingsData.West.findIndex(t => normalize(t.team) === n);
      if (rank !== -1) return { ...standingsData.West[rank], rank: rank + 1, conf: 'West' };

      return { team: teamName, w: 0, l: 0, rank: 15, conf: 'Unknown' };
    };

    // Find the worst team overall (lowest win percentage across both conferences)
    let worstTeam = null;
    let worstWinPct = 1.0;

    [...standingsData.East, ...standingsData.West].forEach(team => {
      const winPct = team.w / (team.w + team.l || 1);
      if (winPct < worstWinPct) {
        worstWinPct = winPct;
        worstTeam = normalize(team.team);
      }
    });

    // Calculate NBA Cup bonus points per team
    const getNbaCupBonus = (teamName) => {
      const n = normalize(teamName);
      let bonus = 0;

      // Check if team made semifinals (1 point)
      if (NBA_CUP_RESULTS.semifinalists.some(t => normalize(t) === n)) {
        bonus += 1;
      }

      // Check if team is runner-up (additional 2 points)
      if (NBA_CUP_RESULTS.runnerUp && normalize(NBA_CUP_RESULTS.runnerUp) === n) {
        bonus += 2;
      }

      // Check if team is champion (additional 4 points instead of runner-up 2)
      if (NBA_CUP_RESULTS.champion && normalize(NBA_CUP_RESULTS.champion) === n) {
        bonus += 4; // Champion gets 4 additional (so 1 + 4 = 5 total if they made semis)
      }

      return bonus;
    };

    // Calculate Playoff bonus points per team
    const getPlayoffBonus = (teamName) => {
      const n = normalize(teamName);
      let bonus = 0;

      // Check series wins (6 points per series win)
      const seriesWins = PLAYOFF_RESULTS.seriesWins[teamName] ||
                         Object.entries(PLAYOFF_RESULTS.seriesWins).find(([key]) => normalize(key) === n)?.[1] || 0;
      bonus += seriesWins * 6;

      // Check if team won finals (additional 12 points)
      if (PLAYOFF_RESULTS.finalsChampion && normalize(PLAYOFF_RESULTS.finalsChampion) === n) {
        bonus += 12;
      }

      return bonus;
    };

    Object.keys(DRAFT).forEach(player => {
      DRAFT[player].forEach((teamName, draftIndex) => {
        const data = findTeamData(teamName);
        const draftPosition = draftIndex + 1; // Draft picks are 1-10
        let regularSeasonPoints = 16 - data.rank;

        // Add 3-point bonus ONLY for the worst team overall
        const isWorstTeam = normalize(teamName) === worstTeam;
        let lastPlaceBonus = 0;
        if (isWorstTeam) {
          lastPlaceBonus = 3;
        }

        // Get NBA Cup and Playoff bonuses
        const nbaCupBonus = getNbaCupBonus(teamName);
        const playoffBonus = getPlayoffBonus(teamName);

        // Total points for this team
        const totalPoints = regularSeasonPoints + lastPlaceBonus + nbaCupBonus + playoffBonus;

        // Calculate expected points based on draft position
        // Pick 1 should get ~15 pts, Pick 10 should get ~1 pt
        const expectedPoints = 16 - draftPosition;
        const relativeToExpected = totalPoints - expectedPoints;

        // Update breakdown
        breakdown[player].regularSeason += regularSeasonPoints;
        breakdown[player].lastPlaceBonus += lastPlaceBonus;
        breakdown[player].nbaCup += nbaCupBonus;
        breakdown[player].playoffs += playoffBonus;

        scores[player] += totalPoints;
        details[player].push({
          ...data,
          name: teamName,
          points: totalPoints,
          regularSeasonPoints,
          nbaCupBonus,
          playoffBonus,
          lastPlaceBonus,
          draftPosition,
          expectedPoints,
          relativeToExpected,
          isWorstTeam
        });
      });
      details[player].sort((a, b) => b.points - a.points);
    });

    return { scores, details, breakdown };
  };

  // --- LOGIC: CALCULATE CURRENT SCORES ---
  const scoreData = useMemo(() => {
    return calculateScoresFromStandings(standings);
  }, [standings]);

  // --- LOGIC: HISTORIC GRAPH DATA ---
  const historyData = useMemo(() => {
    // Merge hardcoded DAILY_STANDINGS with localStorage saved standings
    const allStandings = { ...DAILY_STANDINGS };

    try {
      const stored = localStorage.getItem('historic_daily_standings');
      if (stored) {
        const savedStandings = JSON.parse(stored);
        // Merge saved standings (will override hardcoded data if dates overlap)
        Object.assign(allStandings, savedStandings);
      }
    } catch (error) {
      console.warn('Failed to load saved historic standings:', error);
    }

    // Get all dates and sort chronologically
    const dates = Object.keys(allStandings).sort();

    if (dates.length > 0) {
      // Calculate scores for each historic date
      const data = dates.map(date => {
        const dayStandings = allStandings[date];
        const dayScores = calculateScoresFromStandings(dayStandings);

        // Format date as "Nov 17" for chart label
        const dateObj = new Date(date);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          week: label,
          Chris: dayScores.scores.Chris,
          Ian: dayScores.scores.Ian,
          Karan: dayScores.scores.Karan,
        };
      });

      // Add current standings as final point
      data.push({
        week: 'Now',
        Chris: scoreData.scores.Chris,
        Ian: scoreData.scores.Ian,
        Karan: scoreData.scores.Karan,
      });

      return data;
    } else {
      // Fallback: generate interpolated data if no historic data exists yet
      const weeks = 4;
      const data = [];
      const finalScores = scoreData.scores;

      for (let i = 0; i <= weeks; i++) {
        const progress = i / weeks;
        data.push({
          week: `Week ${i}`,
          Chris: Math.round(finalScores.Chris * progress),
          Ian: Math.round(finalScores.Ian * progress),
          Karan: Math.round(finalScores.Karan * progress),
        });
      }
      data[weeks] = {
        week: 'Now',
        Chris: finalScores.Chris,
        Ian: finalScores.Ian,
        Karan: finalScores.Karan
      };
      return data;
    }
  }, [scoreData, historicDataVersion]);

  // --- LOGIC: PROJECTED STANDINGS (USING VEGAS ODDS) ---
  const projectedStandings = useMemo(() => {
    const projections = { Chris: 0, Ian: 0, Karan: 0 };

    // 1. Map all teams to their Vegas Win Total
    let allTeams = [];
    ['East', 'West'].forEach(conf => {
      standings[conf].forEach(t => {
        const n = normalize(t.team);
        const vegasWins = VEGAS_PROJECTIONS[n] || 30;
        allTeams.push({ ...t, conf, vegasWins, originalName: t.team });
      });
    });

    // 2. Rank them within conference by VEGAS WINS
    const rankedEast = allTeams.filter(t => t.conf === 'East').sort((a, b) => b.vegasWins - a.vegasWins);
    const rankedWest = allTeams.filter(t => t.conf === 'West').sort((a, b) => b.vegasWins - a.vegasWins);

    // 3. Assign points based on Vegas Ranks
    Object.keys(DRAFT).forEach(player => {
      DRAFT[player].forEach(draftedTeam => {
        const n = normalize(draftedTeam);
        let rank = -1;

        let idx = rankedEast.findIndex(t => normalize(t.originalName) === n);
        if (idx !== -1) rank = idx + 1;
        else {
          idx = rankedWest.findIndex(t => normalize(t.originalName) === n);
          if (idx !== -1) rank = idx + 1;
        }

        if (rank !== -1) {
          projections[player] += (16 - rank);
        }
      });
    });

    return projections;
  }, [standings]);

  // --- LOGIC: TEAM PERFORMANCE VS VEGAS EXPECTATIONS ---
  const teamVsVegas = useMemo(() => {
    const teams = [];

    // Get all teams from both conferences
    ['East', 'West'].forEach(conf => {
      standings[conf].forEach((t, idx) => {
        const teamName = t.team;
        const n = normalize(teamName);
        const currentRank = idx + 1;
        const currentPoints = 16 - currentRank;

        // Get Vegas projected wins
        const vegasWins = VEGAS_PROJECTIONS[n] || 30;

        // Find Vegas-based rank within conference
        const confTeams = standings[conf].map(team => ({
          name: team.team,
          vegasWins: VEGAS_PROJECTIONS[normalize(team.team)] || 30
        })).sort((a, b) => b.vegasWins - a.vegasWins);

        const vegasRank = confTeams.findIndex(team => normalize(team.name) === n) + 1;
        const vegasPoints = 16 - vegasRank;

        const diff = currentPoints - vegasPoints;

        // Find which player drafted this team
        let owner = null;
        Object.keys(DRAFT).forEach(player => {
          if (DRAFT[player].some(team => normalize(team) === n)) {
            owner = player;
          }
        });

        teams.push({
          name: teamName,
          owner,
          conf,
          currentRank,
          currentPoints,
          vegasRank,
          vegasPoints,
          diff,
          record: `${t.w}-${t.l}`
        });
      });
    });

    // Sort by difference (biggest overperformers first)
    return teams.sort((a, b) => b.diff - a.diff);
  }, [standings]);

  const sortedLeaders = Object.entries(scoreData.scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NBA Bet 2026</h1>
              <p className="text-xs text-slate-400">Regular Season Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStandings(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs transition-colors disabled:opacity-50"
              title="Clear cache and fetch fresh data"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-slate-400">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Season 2025-26'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Scoreboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedLeaders.map(([name, score], index) => (
            <Card key={name} className={`relative p-6 flex flex-col items-center justify-center ${index === 0 ? 'ring-2 ring-blue-500 bg-slate-800/80' : ''}`}>
              {index === 0 && (
                <div className="absolute top-3 right-3 text-yellow-500 animate-pulse">
                  <Trophy size={18} />
                </div>
              )}
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{name}</span>
              <span className="text-5xl font-black text-white tracking-tighter">{score}</span>
              <span className="text-xs text-slate-500 mt-2">Current Points</span>

              <div className="mt-4 w-full pt-4 border-t border-slate-700/50 text-xs text-center">
                <span className="text-slate-400">Vegas Proj: <span className="text-slate-200 font-bold">{Math.round(projectedStandings[name])}</span></span>
              </div>
            </Card>
          ))}
        </section>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          {['overview', 'teams', 'projections', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Areas */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Season Trajectory
                  {Object.keys(DAILY_STANDINGS).length === 0 && (
                    <span className="text-xs text-amber-500 font-normal">(Simulated - Add daily data in src/historicStandings.js)</span>
                  )}
                  {Object.keys(DAILY_STANDINGS).length > 0 && (
                    <span className="text-xs text-green-400 font-normal">({Object.keys(DAILY_STANDINGS).length} days tracked)</span>
                  )}
                </h3>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Karan</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Chris</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Ian</div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 12 }} tickMargin={10} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="Karan" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Chris" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Ian" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Points Breakdown Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Points Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                      <th className="pb-3 pl-4">Player</th>
                      <th className="pb-3 text-center">Regular Season</th>
                      <th className="pb-3 text-center">NBA Cup</th>
                      <th className="pb-3 text-center">Playoffs</th>
                      <th className="pb-3 text-center">Last Place Bonus</th>
                      <th className="pb-3 text-right pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sortedLeaders.map(([player]) => {
                      const b = scoreData.breakdown[player];
                      const total = b.regularSeason + b.nbaCup + b.playoffs + b.lastPlaceBonus;
                      return (
                        <tr key={player} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/50">
                          <td className="py-4 pl-4 font-medium">{player}</td>
                          <td className="py-4 text-center text-slate-300">{b.regularSeason}</td>
                          <td className="py-4 text-center">
                            {b.nbaCup > 0 ? (
                              <span className="text-amber-400 font-semibold">{b.nbaCup}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            {b.playoffs > 0 ? (
                              <span className="text-green-400 font-semibold">{b.playoffs}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            {b.lastPlaceBonus > 0 ? (
                              <span className="text-purple-400 font-semibold">+{b.lastPlaceBonus}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-4 text-right pr-4">
                            <span className="text-white font-bold text-lg">{total}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-slate-500 space-y-1">
                <p><span className="text-slate-400">Regular Season:</span> 16 - conference rank per team</p>
                <p><span className="text-slate-400">NBA Cup:</span> Semi: +1, Runner-up: +2 more, Champion: +4 more</p>
                <p><span className="text-slate-400">Playoffs:</span> +6 per series win, Finals champion: +12 more</p>
                <p><span className="text-slate-400">Last Place Bonus:</span> +3 for worst overall record</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {['Karan', 'Chris', 'Ian'].map(player => (
              <Card key={player} className="p-0">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{player}</h3>
                    <span className="text-xl font-mono font-bold text-blue-400">{scoreData.scores[player]}</span>
                  </div>
                </div>
                <div className="p-2 max-h-[600px] overflow-y-auto">
                  {scoreData.details[player].map((team) => (
                    <TeamRow
                      key={team.name}
                      teamName={team.name}
                      points={team.points}
                      record={{ w: team.w, l: team.l }}
                      rank={team.rank}
                      draftPosition={team.draftPosition}
                      relativeToExpected={team.relativeToExpected}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Vegas Projections (FanDuel/Covers)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                      <th className="pb-3 pl-4">Player</th>
                      <th className="pb-3">Current Pts</th>
                      <th className="pb-3">Vegas Proj. Pts</th>
                      <th className="pb-3 text-right pr-4">Change</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {Object.entries(projectedStandings)
                      .sort(([, a], [, b]) => b - a)
                      .map(([player, projPts]) => {
                        const current = scoreData.scores[player];
                        const diff = Math.round(projPts - current);
                        return (
                          <tr key={player} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/50">
                            <td className="py-4 pl-4 font-medium">{player}</td>
                            <td className="py-4 text-slate-300">{current}</td>
                            <td className="py-4 text-white font-bold text-lg">{Math.round(projPts)}</td>
                            <td className="py-4 text-right pr-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${diff > 0 ? 'bg-green-500/20 text-green-400' : diff < 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-800/50 p-3 rounded border border-slate-700/50">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                <p>
                  Projections are calculated by re-ranking all 30 NBA teams based on their current <strong>Vegas Regular Season Win Total</strong> odds and re-applying your league's scoring rules (15 pts for 1st seed, 1 pt for 15th seed) to the projected seeds. Update Vegas odds in <code className="bg-slate-900 px-1 py-0.5 rounded">src/data.js</code>
                </p>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Overperformers */}
              <Card className="p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  Overperforming Vegas
                </h4>
                <div className="space-y-2">
                  {teamVsVegas.filter(t => t.diff > 0).slice(0, 10).map(team => (
                    <div key={team.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{team.name}</div>
                        <div className="text-xs text-slate-500">
                          {team.owner && <span className="text-blue-400">{team.owner}</span>} • {team.record} • {team.conf}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-green-400 font-semibold">+{team.diff}</div>
                        <div className="text-xs text-slate-500">#{team.currentRank} vs #{team.vegasRank}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Underperformers */}
              <Card className="p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Underperforming Vegas
                </h4>
                <div className="space-y-2">
                  {teamVsVegas.filter(t => t.diff < 0).slice(-10).reverse().map(team => (
                    <div key={team.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{team.name}</div>
                        <div className="text-xs text-slate-500">
                          {team.owner && <span className="text-blue-400">{team.owner}</span>} • {team.record} • {team.conf}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-red-400 font-semibold">{team.diff}</div>
                        <div className="text-xs text-slate-500">#{team.currentRank} vs #{team.vegasRank}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold">League History</h3>
              </div>

              <div className="space-y-4">
                {/* Championship Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  {['Karan', 'Chris', 'Ian'].map(player => {
                    const championships = LEAGUE_HISTORY.filter(y => y.first === player).length;
                    const secondPlace = LEAGUE_HISTORY.filter(y => y.second === player).length;
                    const thirdPlace = LEAGUE_HISTORY.filter(y => y.third === player).length;

                    return (
                      <div key={player} className="text-center">
                        <div className="text-sm text-slate-400 mb-2">{player}</div>
                        <div className="flex items-center justify-center gap-2">
                          {championships > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-lg font-bold text-yellow-400">{championships}</span>
                            </div>
                          )}
                          {secondPlace > 0 && (
                            <span className="text-sm text-slate-400">
                              <span className="font-semibold text-slate-300">{secondPlace}</span> 2nd
                            </span>
                          )}
                          {thirdPlace > 0 && (
                            <span className="text-sm text-slate-400">
                              <span className="font-semibold text-slate-300">{thirdPlace}</span> 3rd
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Year-by-year results */}
                <div className="space-y-2">
                  {[...LEAGUE_HISTORY].reverse().map((year) => (
                    <div key={year.year} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-300 w-16">{year.year}</span>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="font-semibold text-white">{year.first}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-400">2nd</span>
                            </div>
                            <span className="text-slate-300">{year.second}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-500">3rd</span>
                            </div>
                            <span className="text-slate-400">{year.third}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
