import React, { useReducer, useEffect, useMemo, useRef } from 'react';
import { Bot, User, Undo2, RotateCcw, Play, ChevronUp, ChevronDown, Star, Trophy } from 'lucide-react';
import { normalize } from './data';
import {
  PLAYERS, ROUNDS, DEFAULT_ORDER_2027,
  buildTeamPool, buildSnakeSlots, applyKeepers, availableTeams,
  nextOpenIndex, cpuPick, computeKeeperOptions, validateKeepers,
} from './draftEngine';

// ------------------------------------------------------------------ reducer
const initialState = {
  phase: 'setup',            // 'setup' | 'drafting' | 'done'
  humanPlayer: 'Karan',
  order: DEFAULT_ORDER_2027, // round-1 pick order
  useKeepers: false,
  keepers: { Chris: [], Ian: [], Karan: [] }, // human's selections in setup
  pool: [],
  slots: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SEAT':
      return { ...state, humanPlayer: action.player };

    case 'MOVE_ORDER': {
      const { index, dir } = action;
      const j = index + dir;
      if (j < 0 || j >= state.order.length) return state;
      const order = [...state.order];
      [order[index], order[j]] = [order[j], order[index]];
      return { ...state, order };
    }

    case 'TOGGLE_KEEPERS':
      return { ...state, useKeepers: !state.useKeepers };

    case 'TOGGLE_KEEPER': {
      const { team, costRound } = action;
      const mine = state.keepers[state.humanPlayer] || [];
      const exists = mine.some(k => normalize(k.team) === normalize(team));
      const nextMine = exists
        ? mine.filter(k => normalize(k.team) !== normalize(team))
        : [...mine, { team, costRound }];
      return { ...state, keepers: { ...state.keepers, [state.humanPlayer]: nextMine } };
    }

    case 'START': {
      const pool = buildTeamPool();
      const keepers = { Chris: [], Ian: [], Karan: [] };
      if (state.useKeepers) {
        keepers[state.humanPlayer] = state.keepers[state.humanPlayer] || [];
        // CPUs auto-keep their single most valuable eligible team.
        const opts = computeKeeperOptions();
        PLAYERS.filter(p => p !== state.humanPlayer).forEach(cpu => {
          const eligible = opts[cpu].filter(o => o.eligible).map(o => ({
            ...o,
            val: (pool.find(t => normalize(t.name) === normalize(o.team)) || {}).projValue || 0,
          }));
          eligible.sort((a, b) => b.val - a.val || a.costRound - b.costRound);
          if (eligible.length) keepers[cpu] = [{ team: eligible[0].team, costRound: eligible[0].costRound }];
        });
      }
      const slots = applyKeepers(buildSnakeSlots(state.order), keepers);
      return { ...state, phase: 'drafting', pool, slots, keepers };
    }

    case 'PICK': {
      const idx = nextOpenIndex(state.slots);
      if (idx === -1) return state;
      const slots = state.slots.map((s, i) =>
        i === idx ? { ...s, team: action.team, cpu: s.player !== state.humanPlayer } : s
      );
      return { ...state, slots, phase: nextOpenIndex(slots) === -1 ? 'done' : 'drafting' };
    }

    case 'UNDO': {
      // Revert to just before the human's most recent pick so they can redo it.
      let target = -1;
      for (let i = state.slots.length - 1; i >= 0; i--) {
        const s = state.slots[i];
        if (s.team && !s.keeper && s.player === state.humanPlayer) { target = i; break; }
      }
      if (target === -1) return state;
      const slots = state.slots.map((s, i) =>
        i >= target && s.team && !s.keeper ? { ...s, team: null, cpu: false } : s
      );
      return { ...state, slots, phase: 'drafting' };
    }

    case 'RESTART':
      return { ...state, phase: 'drafting', slots: applyKeepers(buildSnakeSlots(state.order), state.keepers) };

    case 'NEW':
      return { ...initialState, humanPlayer: state.humanPlayer, order: state.order };

    default:
      return state;
  }
}

// -------------------------------------------------------------------- views
function SetupScreen({ state, dispatch }) {
  const keeperOptions = useMemo(() => computeKeeperOptions(), []);
  const myKeepers = useMemo(() => state.keepers[state.humanPlayer] || [], [state.keepers, state.humanPlayer]);
  const validation = useMemo(
    () => validateKeepers({ [state.humanPlayer]: myKeepers }),
    [state.humanPlayer, myKeepers]
  );
  const eligible = keeperOptions[state.humanPlayer].filter(o => o.eligible);

  return (
    <div className="space-y-6">
      {/* Seat */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Your Seat</h4>
        <div className="grid grid-cols-3 gap-3">
          {PLAYERS.map(p => {
            const active = state.humanPlayer === p;
            return (
              <button
                key={p}
                onClick={() => dispatch({ type: 'SET_SEAT', player: p })}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <User className="w-4 h-4" /> {p}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">The other two seats are drafted by the computer (best available by projected value).</p>
      </div>

      {/* Order */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Draft Order (snake)</h4>
        <div className="space-y-2 max-w-sm">
          {state.order.map((p, i) => (
            <div key={p} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-mono text-slate-500">{i + 1}</span>
                <span className={`font-medium ${p === state.humanPlayer ? 'text-blue-300' : 'text-slate-200'}`}>
                  {p}{p === state.humanPlayer && <span className="ml-2 text-[10px] uppercase tracking-wide text-blue-400">you</span>}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => dispatch({ type: 'MOVE_ORDER', index: i, dir: -1 })} disabled={i === 0}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => dispatch({ type: 'MOVE_ORDER', index: i, dir: 1 })} disabled={i === state.order.length - 1}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Round 1 picks in this order, then it snakes each round.</p>
      </div>

      {/* Keepers */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Keepers</h4>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_KEEPERS' })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${state.useKeepers ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.useKeepers ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs text-slate-400">{state.useKeepers ? 'On' : 'Off'}</span>
        </div>
        {state.useKeepers && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">
              Pick which team(s) <span className="text-blue-300">{state.humanPlayer}</span> keeps (each consumes that pick slot). The computer keeps its best eligible team automatically.
            </p>
            {eligible.length === 0 && <p className="text-xs text-amber-500">No eligible keepers for {state.humanPlayer}.</p>}
            <div className="grid sm:grid-cols-2 gap-2">
              {eligible.map(o => {
                const checked = myKeepers.some(k => normalize(k.team) === normalize(o.team));
                return (
                  <button
                    key={o.team}
                    onClick={() => dispatch({ type: 'TOGGLE_KEEPER', team: o.team, costRound: o.costRound })}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      checked ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {checked && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                      {o.team}
                    </span>
                    <span className="text-xs text-slate-500">costs R{o.costRound}{o.keptLastYear ? ' · kept' : ''}</span>
                  </button>
                );
              })}
            </div>
            {!validation.valid && (
              <div className="text-xs text-red-400 space-y-1 pt-1">
                {validation.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: 'START' })}
        disabled={state.useKeepers && !validation.valid}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold text-sm transition-colors"
      >
        <Play className="w-4 h-4" /> Start Mock Draft
      </button>
    </div>
  );
}

function DraftBoard({ state, currentIndex }) {
  const current = state.slots[currentIndex];
  // Column c = the player who picks position c in round 1; cells are that
  // player's pick each round (the snake path zig-zags between the columns).
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[440px]">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider">
            <th className="pb-2 pr-2 w-8 text-center">R</th>
            {state.order.map(p => (
              <th key={p} className="pb-2 px-2 text-left">
                {p}{p === state.humanPlayer && <span className="ml-1 text-[10px] text-blue-400">(you)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROUNDS }, (_, r) => r + 1).map(round => (
            <tr key={round}>
              <td className="py-1 pr-2 text-center text-xs font-mono text-slate-500">{round}</td>
              {state.order.map(player => {
                const slot = state.slots.find(s => s.round === round && s.player === player);
                const isCurrent = current && slot && slot.overall === current.overall;
                return (
                  <td key={player} className="py-1 px-1">
                    <div className={`rounded-md px-2 py-1.5 border text-xs min-h-[34px] flex items-center justify-between gap-1 ${
                      isCurrent ? 'bg-blue-500/20 border-blue-500 animate-pulse'
                      : slot?.keeper ? 'bg-amber-500/10 border-amber-500/40'
                      : slot?.team ? 'bg-slate-800/60 border-slate-700'
                      : 'bg-slate-800/20 border-slate-800 border-dashed'
                    }`}>
                      <span className={slot?.team ? (slot.keeper ? 'text-amber-200' : 'text-slate-200') : 'text-slate-600'}>
                        {slot?.team || (isCurrent ? 'on the clock' : '—')}
                      </span>
                      {slot?.keeper && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DraftScreen({ state, dispatch, currentIndex }) {
  const current = state.slots[currentIndex];
  const isHumanTurn = current && current.player === state.humanPlayer;
  const avail = useMemo(
    () => availableTeams(state.pool, state.slots).sort((a, b) => b.projValue - a.projValue || b.vegasWins - a.vegasWins),
    [state.pool, state.slots]
  );
  const humanHasPicked = state.slots.some(s => s.team && !s.keeper && s.player === state.humanPlayer);

  // CPU auto-picks on its turn after a short beat.
  const timer = useRef(null);
  useEffect(() => {
    if (state.phase !== 'drafting' || !current || current.player === state.humanPlayer) return;
    timer.current = setTimeout(() => {
      const team = cpuPick(state.pool, state.slots);
      if (team) dispatch({ type: 'PICK', team });
    }, 750);
    return () => clearTimeout(timer.current);
  }, [state.phase, currentIndex, current, state.pool, state.slots, state.humanPlayer, dispatch]);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">Round {current?.round} · Pick {current?.overall}/30</span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {isHumanTurn ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-slate-400" />}
            {isHumanTurn ? "You're on the clock" : `${current?.player} is picking…`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!humanHasPicked}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg disabled:opacity-40">
            <Undo2 className="w-3 h-3" /> Undo my pick
          </button>
          <button onClick={() => dispatch({ type: 'RESTART' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
            <RotateCcw className="w-3 h-3" /> Restart
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Board */}
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
          <DraftBoard state={state} currentIndex={currentIndex} />
        </div>

        {/* Available pool */}
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available ({avail.length})</h4>
            <span className="text-[10px] text-slate-500">proj · rec · o/u</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto pr-1 space-y-1">
            {avail.map(t => (
              <button
                key={t.name}
                onClick={() => isHumanTurn && dispatch({ type: 'PICK', team: t.name })}
                disabled={!isHumanTurn}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-left transition-colors ${
                  isHumanTurn ? 'bg-slate-800/60 border-slate-700 hover:bg-blue-600/20 hover:border-blue-500 cursor-pointer'
                  : 'bg-slate-800/30 border-slate-800 cursor-default'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{t.name}</div>
                  <div className="text-[10px] text-slate-500">{t.conf} · {t.w}-{t.l} · {t.vegasWins} wins</div>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">{t.projValue}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoneScreen({ state, dispatch }) {
  const rosters = useMemo(() => {
    const byPlayer = { Chris: [], Ian: [], Karan: [] };
    [...state.slots].sort((a, b) => a.round - b.round).forEach(s => {
      if (s.team) byPlayer[s.player].push(s);
    });
    return byPlayer;
  }, [state.slots]);

  const totals = useMemo(() => {
    const t = { Chris: 0, Ian: 0, Karan: 0 };
    state.slots.forEach(s => {
      if (!s.team) return;
      const team = state.pool.find(p => normalize(p.name) === normalize(s.team));
      t[s.player] += team ? team.projValue : 0;
    });
    return t;
  }, [state.slots, state.pool]);

  const ranked = [...PLAYERS].sort((a, b) => totals[b] - totals[a]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold">Mock Draft Complete</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {ranked.map((p, idx) => (
          <div key={p} className={`rounded-lg border p-4 ${idx === 0 ? 'border-blue-500/60 bg-slate-800/60' : 'border-slate-700 bg-slate-800/40'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-100">{p}{p === state.humanPlayer && <span className="ml-2 text-[10px] uppercase text-blue-400">you</span>}</span>
              <span className="text-xs text-slate-400">proj <span className="font-bold text-slate-200">{totals[p]}</span></span>
            </div>
            <ol className="space-y-1 text-sm">
              {rosters[p].map((s, i) => (
                <li key={s.team} className="flex items-center justify-between text-slate-300">
                  <span><span className="text-slate-600 font-mono text-xs mr-2">{i + 1}</span>{s.team}{s.keeper && <Star className="inline w-3 h-3 fill-amber-400 text-amber-400 ml-1" />}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => dispatch({ type: 'RESTART' })}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm">
          <RotateCcw className="w-4 h-4" /> Redraft same setup
        </button>
        <button onClick={() => dispatch({ type: 'NEW' })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold">
          New mock draft
        </button>
      </div>
    </div>
  );
}

export default function MockDraftRoom() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentIndex = state.phase === 'drafting' ? nextOpenIndex(state.slots) : -1;

  return (
    <div>
      {state.phase === 'setup' && <SetupScreen state={state} dispatch={dispatch} />}
      {state.phase === 'drafting' && <DraftScreen state={state} dispatch={dispatch} currentIndex={currentIndex} />}
      {state.phase === 'done' && <DoneScreen state={state} dispatch={dispatch} />}
    </div>
  );
}
