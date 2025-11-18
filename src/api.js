// NBA API Service
// Uses ESPN's free public API for live NBA standings

/**
 * Fetch standings from ESPN's public API
 * This is free and doesn't require authentication
 */
export async function fetchESPNStandings() {
  try {
    console.log('🌐 Fetching from ESPN API...');
    const response = await fetch(
      'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings'
    );

    if (!response.ok) {
      throw new Error(`ESPN API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📡 ESPN API response received');

    // Parse ESPN standings data
    const eastStandings = [];
    const westStandings = [];

    // ESPN provides standings in their format, we need to transform it
    if (data.children) {
      console.log(`📊 Found ${data.children.length} conferences`);

      data.children.forEach(conference => {
        const isEast = conference.name === 'Eastern Conference';
        const standingsArray = isEast ? eastStandings : westStandings;
        console.log(`🏀 Processing ${conference.name}`);

        if (conference.standings && conference.standings.entries) {
          console.log(`  Teams in ${conference.name}: ${conference.standings.entries.length}`);

          conference.standings.entries.forEach(entry => {
            const teamName = entry.team.displayName;
            const stats = entry.stats;

            // Find wins and losses from stats array
            const winsObj = stats.find(s => s.name === 'wins');
            const lossesObj = stats.find(s => s.name === 'losses');

            const wins = winsObj?.value || 0;
            const losses = lossesObj?.value || 0;

            console.log(`  ${teamName}: ${wins}-${losses}`);

            standingsArray.push({
              team: normalizeTeamName(teamName),
              w: parseInt(wins),
              l: parseInt(losses)
            });
          });
        } else {
          console.warn(`  ⚠️  No standings entries found for ${conference.name}`);
        }
      });
    } else {
      console.warn('⚠️  No children found in API response');
    }

    // Sort by win percentage
    const sortByWinPct = (a, b) => {
      const pctA = a.w / (a.w + a.l || 1);
      const pctB = b.w / (b.w + b.l || 1);
      return pctB - pctA;
    };

    eastStandings.sort(sortByWinPct);
    westStandings.sort(sortByWinPct);

    console.log('✅ Successfully fetched NBA standings from ESPN API');
    console.log(`East: ${eastStandings.length} teams, West: ${westStandings.length} teams`);

    return {
      East: eastStandings,
      West: westStandings,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.warn('❌ ESPN API failed:', error.message);
    return null;
  }
}

/**
 * Normalize ESPN team names to match our draft format
 */
function normalizeTeamName(espnName) {
  const mapping = {
    'Atlanta Hawks': 'Hawks',
    'Boston Celtics': 'Celtics',
    'Brooklyn Nets': 'Nets',
    'Charlotte Hornets': 'Hornets',
    'Chicago Bulls': 'Bulls',
    'Cleveland Cavaliers': 'Cavaliers',
    'Dallas Mavericks': 'Mavericks',
    'Denver Nuggets': 'Nuggets',
    'Detroit Pistons': 'Pistons',
    'Golden State Warriors': 'Warriors',
    'Houston Rockets': 'Rockets',
    'Indiana Pacers': 'Pacers',
    'LA Clippers': 'Clippers',
    'Los Angeles Clippers': 'Clippers',
    'Los Angeles Lakers': 'Lakers',
    'LA Lakers': 'Lakers',
    'Memphis Grizzlies': 'Grizzlies',
    'Miami Heat': 'Heat',
    'Milwaukee Bucks': 'Bucks',
    'Minnesota Timberwolves': 'Timberwolves',
    'New Orleans Pelicans': 'Pelicans',
    'New York Knicks': 'Knicks',
    'Oklahoma City Thunder': 'Thunder',
    'Orlando Magic': 'Magic',
    'Philadelphia 76ers': '76ers',
    'Phoenix Suns': 'Suns',
    'Portland Trail Blazers': 'Trail Blazers',
    'Sacramento Kings': 'Kings',
    'San Antonio Spurs': 'Spurs',
    'Toronto Raptors': 'Raptors',
    'Utah Jazz': 'Jazz',
    'Washington Wizards': 'Wizards'
  };

  return mapping[espnName] || espnName;
}

/**
 * Get cached standings with cache expiration
 * Caches for 1 hour to reduce API calls
 */
export function getCachedStandings() {
  const cached = localStorage.getItem('nba_standings_cache');
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const ONE_HOUR = 60 * 60 * 1000;

    if (age < ONE_HOUR) {
      console.log(`📦 Using cached standings (${Math.round(age / 1000 / 60)} minutes old)`);
      return data;
    } else {
      console.log('⏰ Cache expired, will fetch fresh data');
    }
  } catch (error) {
    console.warn('Cache parse error:', error);
  }

  return null;
}

/**
 * Cache standings data
 */
export function cacheStandings(data) {
  try {
    localStorage.setItem('nba_standings_cache', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('💾 Cached standings data');
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Main function to get standings with caching and fallback
 */
export async function getStandings() {
  // Try cache first
  const cached = getCachedStandings();
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  console.log('🔄 Fetching fresh standings from ESPN API...');
  const standings = await fetchESPNStandings();

  if (standings) {
    cacheStandings(standings);
    return standings;
  }

  console.warn('⚠️  API unavailable, will use fallback data');
  return null; // Fallback will be used
}

/**
 * Fetch standings for a specific date
 * @param {string} date - Date in YYYYMMDD format
 */
export async function fetchStandingsByDate(date) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?dates=${date}`
    );

    if (!response.ok) {
      throw new Error(`ESPN API Error: ${response.status}`);
    }

    const data = await response.json();

    // Parse standings data (same structure as current standings)
    const eastStandings = [];
    const westStandings = [];

    if (data.children) {
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
              team: normalizeTeamName(teamName),
              w: parseInt(wins),
              l: parseInt(losses)
            });
          });
        }
      });
    }

    // Sort by win percentage
    const sortByWinPct = (a, b) => {
      const pctA = a.w / (a.w + a.l || 1);
      const pctB = b.w / (b.w + b.l || 1);
      return pctB - pctA;
    };

    eastStandings.sort(sortByWinPct);
    westStandings.sort(sortByWinPct);

    return {
      East: eastStandings,
      West: westStandings,
      date: date
    };

  } catch (error) {
    console.warn(`Failed to fetch standings for ${date}:`, error.message);
    return null;
  }
}

/**
 * Fetch historic weekly standings
 * Starts 7 days after season start and fetches weekly snapshots
 */
export async function fetchHistoricStandings() {
  const SEASON_START = new Date('2025-10-22'); // 2025-26 season
  const FIRST_WEEK = new Date(SEASON_START);
  FIRST_WEEK.setDate(FIRST_WEEK.getDate() + 7); // 7 days after season start

  const today = new Date();
  const weeklyData = [];
  let weekNumber = 1;
  let currentDate = new Date(FIRST_WEEK);

  // Calculate max weeks (should be around 4-5 weeks into season)
  const maxWeeks = Math.ceil((today - FIRST_WEEK) / (7 * 24 * 60 * 60 * 1000));
  console.log(`📅 Fetching historic standings (up to ${maxWeeks} weeks)...`);

  // Fetch data for each week until today (max 10 weeks to avoid issues)
  while (currentDate <= today && weekNumber <= Math.min(maxWeeks, 10)) {
    const dateStr = formatDate(currentDate);
    console.log(`  Fetching Week ${weekNumber}: ${dateStr}`);

    try {
      const standings = await fetchStandingsByDate(dateStr);

      if (standings && standings.East.length > 0 && standings.West.length > 0) {
        weeklyData.push({
          date: dateStr,
          week: `Week ${weekNumber}`,
          standings: standings
        });
        console.log(`    ✓ Got data for ${standings.East.length + standings.West.length} teams`);
      } else {
        console.log(`    ✗ No data available for this week`);
      }
    } catch (error) {
      console.warn(`    ✗ Failed to fetch week ${weekNumber}:`, error.message);
    }

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`✅ Fetched ${weeklyData.length} weeks of historic data`);
  return weeklyData;
}

/**
 * Format date as YYYYMMDD for ESPN API
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
