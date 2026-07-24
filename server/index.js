// Real-time draft server for the NBA Bet 2027 live "Draft Now" room.
//
// One global room (the 2027 draft). The server is the authoritative source of
// truth for draft state; clients render it and send actions. Draft config
// (team pool, snake slots, keeper pre-fills) is computed on the commissioner's
// client and sent with `startDraft`, so the server stays data-agnostic and
// just enforces turn order, team availability, the per-pick timer, and undo.

const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
// Comma-separated allowlist; defaults cover the GitHub Pages site + local dev.
const ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'https://karakotaram.github.io,http://localhost:3000'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const PLAYERS = ['Chris', 'Ian', 'Karan'];
const PICK_SECONDS_DEFAULT = 90;
// Where a submitted draft is persisted. Point DATA_DIR at a Railway volume for
// durability across redeploys; otherwise it lives in the container FS.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const RESULT_FILE = path.join(DATA_DIR, 'draft-2027.json');

const app = express();
app.use(cors({ origin: ORIGINS }));
app.get('/', (_req, res) => res.send('NBA Bet draft server OK'));
app.get('/health', (_req, res) => res.json({ ok: true, phase: room.phase, saved: !!savedResult }));
// The most recently submitted draft (used to feed the season tracker).
app.get('/result', (_req, res) =>
  savedResult ? res.json(savedResult) : res.status(404).json({ error: 'no draft submitted yet' })
);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGINS, methods: ['GET', 'POST'] } });

// --- room state -----------------------------------------------------------
function freshRoom() {
  return {
    phase: 'lobby', // 'lobby' | 'drafting' | 'done'
    seats: { Chris: null, Ian: null, Karan: null }, // player -> socketId
    order: ['Ian', 'Karan', 'Chris'],
    pool: [], // [{ name, conf, w, l, vegasWins, projValue }]
    slots: [], // [{ overall, round, player, team, keeper }]
    currentIndex: -1,
    pickSeconds: PICK_SECONDS_DEFAULT,
    deadline: null, // ms timestamp the current pick expires
    saved: false, // whether this completed draft has been submitted
  };
}
let room = freshRoom();
let timer = null;

// --- submitted-result persistence -----------------------------------------
function loadSavedResult() {
  try {
    return JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}
function persistResult(result) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
    return true;
  } catch (e) {
    console.warn('Failed to persist draft result:', e.message);
    return false;
  }
}
let savedResult = loadSavedResult();

const norm = s => (s || '').toLowerCase();

function nextOpenIndex(slots, from = 0) {
  for (let i = from; i < slots.length; i++) if (!slots[i].team) return i;
  return -1;
}

function availableTeams() {
  const taken = new Set(room.slots.filter(s => s.team).map(s => norm(s.team)));
  return room.pool.filter(t => !taken.has(norm(t.name)));
}

function publicState() {
  return {
    phase: room.phase,
    seats: room.seats,
    order: room.order,
    pool: room.pool,
    slots: room.slots,
    currentIndex: room.currentIndex,
    pickSeconds: room.pickSeconds,
    deadline: room.deadline,
    saved: room.saved,
  };
}
const broadcast = () => io.emit('state', publicState());

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
function startTimer() {
  clearTimer();
  if (room.phase !== 'drafting' || room.currentIndex < 0) {
    room.deadline = null;
    return;
  }
  room.deadline = Date.now() + room.pickSeconds * 1000;
  timer = setTimeout(() => {
    // Timeout -> auto-pick the best available team for whoever is on the clock.
    const avail = availableTeams().sort(
      (a, b) => b.projValue - a.projValue || b.vegasWins - a.vegasWins
    );
    if (avail.length) applyPick(avail[0].name);
  }, room.pickSeconds * 1000);
}

function applyPick(team) {
  const idx = room.currentIndex;
  if (idx < 0) return;
  const slot = room.slots[idx];
  if (!slot || slot.team) return;
  if (availableTeams().findIndex(t => norm(t.name) === norm(team)) === -1) return;
  slot.team = team;
  const next = nextOpenIndex(room.slots);
  room.currentIndex = next;
  if (next === -1) {
    room.phase = 'done';
    room.deadline = null;
    clearTimer();
  } else {
    startTimer();
  }
  broadcast();
}

// --- sockets ---------------------------------------------------------------
io.on('connection', socket => {
  socket.emit('state', publicState());

  socket.on('claimSeat', ({ player } = {}) => {
    if (!PLAYERS.includes(player)) return;
    // A socket holds at most one seat; release any it already had.
    PLAYERS.forEach(p => {
      if (room.seats[p] === socket.id) room.seats[p] = null;
    });
    if (!room.seats[player]) room.seats[player] = socket.id;
    broadcast();
  });

  socket.on('releaseSeat', () => {
    PLAYERS.forEach(p => {
      if (room.seats[p] === socket.id) room.seats[p] = null;
    });
    broadcast();
  });

  socket.on('startDraft', ({ order, pool, slots, pickSeconds } = {}) => {
    if (room.phase === 'drafting') return;
    if (!Array.isArray(order) || !Array.isArray(pool) || !Array.isArray(slots)) return;
    room.order = order;
    room.pool = pool;
    room.slots = slots.map(s => ({ ...s }));
    room.pickSeconds = Number(pickSeconds) > 0 ? Number(pickSeconds) : PICK_SECONDS_DEFAULT;
    room.currentIndex = nextOpenIndex(room.slots);
    room.phase = room.currentIndex === -1 ? 'done' : 'drafting';
    startTimer();
    broadcast();
  });

  socket.on('makePick', ({ player, team } = {}) => {
    if (room.phase !== 'drafting') return;
    const slot = room.slots[room.currentIndex];
    if (!slot || slot.player !== player) return; // not this player's turn
    if (room.seats[player] !== socket.id) return; // must own the seat
    applyPick(team);
  });

  // Commissioner action: revert the most recent non-keeper pick.
  socket.on('undo', () => {
    if (room.phase === 'lobby') return;
    for (let i = room.slots.length - 1; i >= 0; i--) {
      if (room.slots[i].team && !room.slots[i].keeper) {
        room.slots[i].team = null;
        break;
      }
    }
    room.phase = 'drafting';
    room.currentIndex = nextOpenIndex(room.slots);
    startTimer();
    broadcast();
  });

  // Save the completed draft durably so it can feed the season tracker.
  socket.on('submitDraft', () => {
    if (room.phase !== 'done') return;
    const rosters = {};
    PLAYERS.forEach(p => { rosters[p] = []; });
    [...room.slots]
      .sort((a, b) => a.round - b.round)
      .forEach(s => {
        if (s.team && rosters[s.player]) rosters[s.player].push({ team: s.team, round: s.round, keeper: !!s.keeper });
      });
    const result = {
      season: 2027,
      order: room.order,
      rosters,
      slots: room.slots,
      savedAt: new Date().toISOString(),
    };
    // Only report success if the durable write actually landed.
    if (!persistResult(result)) {
      socket.emit('submitError', { message: 'Could not save the draft to disk. Please try again.' });
      return;
    }
    savedResult = result;
    room.saved = true;
    broadcast();
  });

  // Commissioner action: wipe back to the lobby (keeps claimed seats).
  socket.on('resetRoom', () => {
    clearTimer();
    const seats = room.seats;
    room = freshRoom();
    room.seats = seats;
    broadcast();
  });

  socket.on('disconnect', () => {
    PLAYERS.forEach(p => {
      if (room.seats[p] === socket.id) room.seats[p] = null;
    });
    broadcast();
  });
});

server.listen(PORT, () => console.log(`NBA Bet draft server listening on :${PORT} (origins: ${ORIGINS.join(', ')})`));
