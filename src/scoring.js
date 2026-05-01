import { DRAFT, NBA_CUP_RESULTS, normalize } from './data';

// Compute league scores for a given standings snapshot + playoff results.
// playoffResults shape: { seriesWins: { TeamName: count }, finalsChampion: TeamName | null }
export function calculateScoresFromStandings(standingsData, playoffResults = { seriesWins: {}, finalsChampion: null }) {
  const scores = { Chris: 0, Ian: 0, Karan: 0 };
  const details = { Chris: [], Ian: [], Karan: [] };
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

  let worstTeam = null;
  let worstWinPct = 1.0;
  [...standingsData.East, ...standingsData.West].forEach(team => {
    const winPct = team.w / (team.w + team.l || 1);
    if (winPct < worstWinPct) {
      worstWinPct = winPct;
      worstTeam = normalize(team.team);
    }
  });

  const getNbaCupBonus = (teamName) => {
    const n = normalize(teamName);
    if (NBA_CUP_RESULTS.champion && normalize(NBA_CUP_RESULTS.champion) === n) return 4;
    if (NBA_CUP_RESULTS.runnerUp && normalize(NBA_CUP_RESULTS.runnerUp) === n) return 2;
    if (NBA_CUP_RESULTS.semifinalists.some(t => normalize(t) === n)) return 1;
    return 0;
  };

  const seriesWinsMap = playoffResults?.seriesWins || {};
  const finalsChampion = playoffResults?.finalsChampion || null;

  const getPlayoffBonus = (teamName) => {
    const n = normalize(teamName);
    let bonus = 0;
    const seriesWins = seriesWinsMap[teamName] ||
                       Object.entries(seriesWinsMap).find(([key]) => normalize(key) === n)?.[1] || 0;
    bonus += seriesWins * 6;
    if (finalsChampion && normalize(finalsChampion) === n) bonus += 12;
    return bonus;
  };

  Object.keys(DRAFT).forEach(player => {
    DRAFT[player].forEach((teamName, draftIndex) => {
      const data = findTeamData(teamName);
      const draftPosition = draftIndex + 1;
      const regularSeasonPoints = 16 - data.rank;
      const isWorstTeam = normalize(teamName) === worstTeam;
      const lastPlaceBonus = isWorstTeam ? 3 : 0;
      const nbaCupBonus = getNbaCupBonus(teamName);
      const playoffBonus = getPlayoffBonus(teamName);
      const totalPoints = regularSeasonPoints + lastPlaceBonus + nbaCupBonus + playoffBonus;
      const expectedPoints = 16 - draftPosition;
      const relativeToExpected = totalPoints - expectedPoints;

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
}
