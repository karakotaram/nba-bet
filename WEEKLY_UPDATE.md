# Weekly Update Guide

## Every Monday Morning (or whenever you want to track progress)

### Step 1: Refresh the App
1. Open http://localhost:3000
2. Click the "Refresh" button in the header
3. Wait for it to load the latest NBA standings

### Step 2: Record Current Scores
Write down the scores shown at the top:

```
Date: ________
Chris: _____
Ian: _____
Karan: _____
```

### Step 3: Update src/data.js

Open `src/data.js` and find the `HISTORIC_STANDINGS` array.

Add a new entry:

```javascript
export const HISTORIC_STANDINGS = [
  // Previous weeks...

  // Week X - [Today's Date]
  {
    date: '2025-XX-XX',        // ← Today's date (YYYY-MM-DD format)
    week: 'Week X',            // ← Increment the week number
    standings: {
      Chris: XXX,              // ← Score from Step 2
      Ian: XXX,                // ← Score from Step 2
      Karan: XXX               // ← Score from Step 2
    }
  },
];
```

### Step 4: Save and View
1. Save the file
2. The app will automatically reload
3. Check the "Overview" tab to see the updated trajectory chart

---

## Example

Let's say today is **November 18, 2025** and the scores are:
- Chris: 99
- Ian: 92
- Karan: 107

You would add:

```javascript
export const HISTORIC_STANDINGS = [
  {
    date: '2025-11-18',
    week: 'Week 1',
    standings: { Chris: 99, Ian: 92, Karan: 107 }
  },
];
```

Next week (November 25):
```javascript
export const HISTORIC_STANDINGS = [
  {
    date: '2025-11-18',
    week: 'Week 1',
    standings: { Chris: 99, Ian: 92, Karan: 107 }
  },
  {
    date: '2025-11-25',
    week: 'Week 2',
    standings: { Chris: 101, Ian: 94, Karan: 110 }
  },
];
```

---

## Updating Vegas Odds (Monthly)

When sportsbooks update their season win totals (usually monthly):

1. Visit:
   - https://sportsbook.fanduel.com/nba-futures
   - https://www.covers.com/sport/basketball/nba/odds

2. Open `src/data.js`

3. Update the `VEGAS_PROJECTIONS` object with new values:

```javascript
export const VEGAS_PROJECTIONS = {
  "thunder": 63.5,     // ← Update these
  "cavaliers": 55.5,   // ← With new odds
  // ... etc
};
```

---

## Troubleshooting

**Q: The standings aren't updating**
- Click the Refresh button
- Check your browser console (F12) for error messages
- The API caches data for 1 hour, so wait if you just refreshed

**Q: Historic chart shows "Simulated" warning**
- This means you haven't added any entries to `HISTORIC_STANDINGS` yet
- Follow Step 3 above to add your first week

**Q: A team's points seem wrong**
- Check the team name matches exactly in the draft
- Open browser console and look for team matching errors
- The API might be temporarily down - try refreshing
