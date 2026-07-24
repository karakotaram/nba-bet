import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { User, Clock, Undo2, RotateCcw, Play, ChevronUp, ChevronDown, Star, Wifi, WifiOff, Trophy, LogOut } from 'lucide-react';
import { normalize } from './data';
import { DRAFT_SERVER_URL, DRAFT_SERVER_CONFIGURED } from './draftServer';
import {
  PLAYERS, ROUNDS, DEFAULT_ORDER_2027,
  buildTeamPool, buildSnakeSlots, applyKeepers, computeKeeperOptions, validateKeepers,
} from './draftEngine';

const canConnect = DRAFT_SERVER_CONFIGURED || process.env.NODE_ENV === 'development';

export default function LiveDraftRoom() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);

  // Local lobby setup (whoever starts sends their config to the server).
  const [order, setOrder] = useState(DEFAULT_ORDER_2027);
  const [keepers, setKeepers] = useState({ Chris: [], Ian: [], Karan: [] });
  const [pickSeconds, setPickSeconds] = useState(90);

  useEffect(() => {
    if (!canConnect) return;
    const socket = io(DRAFT_SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('state', s => setState(s));
    return () => socket.disconnect();
  }, []);

  // Tick for the countdown clock.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const emit = (ev, payload) => socketRef.current && socketRef.current.emit(ev, payload);

  const keeperOptions = useMemo(() => computeKeeperOptions(), []);
  const validation = useMemo(() => validateKeepers(keepers), [keepers]);

  if (!canConnect) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 text-sm text-slate-300 space-y-2">
        <p className="font-medium text-slate-200">Live server not configured yet.</p>
        <p className="text-slate-400">
          Set <code className="text-slate-300">REACT_APP_DRAFT_SERVER_URL</code> to the Railway server URL and redeploy.
          Until then, use <span className="text-blue-300">Mock Draft</span> to practice.
        </p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <WifiOff className="w-4 h-4" /> Connecting to draft server…
      </div>
    );
  }

  const iOwnMySeat = mySeat && state.seats[mySeat] != null;

  // --- LOBBY ---------------------------------------------------------------
  if (state.phase === 'lobby') {
    const claim = player => { emit('claimSeat', { player }); setMySeat(player); };
    const leave = () => { emit('releaseSeat'); setMySeat(null); };
    const move = (i, dir) => {
      const j = i + dir;
      if (j < 0 || j >= order.length) return;
      const next = [...order];
      [next[i], next[j]] = [next[j], next[i]];
      setOrder(next);
    };
    const toggleKeeper = (player, team, costRound) => {
      setKeepers(prev => {
        const mine = prev[player] || [];
        const exists = mine.some(k => normalize(k.team) === normalize(team));
        return {
          ...prev,
          [player]: exists ? mine.filter(k => normalize(k.team) !== normalize(team)) : [...mine, { team, costRound }],
        };
      });
    };
    const start = () => {
      const pool = buildTeamPool();
      const slots = applyKeepers(buildSnakeSlots(order), keepers);
      emit('startDraft', { order, pool, slots, pickSeconds });
    };

    return (
      <div className="space-y-6">
        <ConnBadge connected={connected} />

        {/* Seats */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Claim your seat</h4>
          <div className="grid grid-cols-3 gap-3">
            {PLAYERS.map(p => {
              const taken = state.seats[p] != null;
              const isMine = mySeat === p && taken;
              return (
                <button
                  key={p}
                  onClick={() => claim(p)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                    isMine ? 'bg-blue-600 border-blue-500 text-white'
                    : taken ? 'bg-slate-800/40 border-slate-700 text-slate-500'
                    : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  <span className="flex items-center gap-2"><User className="w-4 h-4" /> {p}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {isMine ? 'you' : taken ? 'taken' : 'open'}
                  </span>
                </button>
              );
            })}
          </div>
          {iOwnMySeat && (
            <button onClick={leave} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
              <LogOut className="w-3 h-3" /> Leave seat
            </button>
          )}
        </div>

        {/* Order */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Draft order (snake)</h4>
          <div className="space-y-2 max-w-sm">
            {order.map((p, i) => (
              <div key={p} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-mono text-slate-500">{i + 1}</span>
                  <span className={`font-medium ${p === mySeat ? 'text-blue-300' : 'text-slate-200'}`}>{p}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keepers (all managers) */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Keepers</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {PLAYERS.map(player => (
              <div key={player} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <div className="text-sm font-semibold text-slate-200 mb-2">{player}</div>
                <div className="space-y-1.5">
                  {keeperOptions[player].filter(o => o.eligible).map(o => {
                    const checked = (keepers[player] || []).some(k => normalize(k.team) === normalize(o.team));
                    return (
                      <button
                        key={o.team}
                        onClick={() => toggleKeeper(player, o.team, o.costRound)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                          checked ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700/40'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {checked && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}{o.team}
                        </span>
                        <span className="text-slate-500">R{o.costRound}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {!validation.valid && (
            <div className="text-xs text-red-400 space-y-1 pt-2">
              {validation.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>

        {/* Timer + Start */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" /> Pick clock
            <select value={pickSeconds} onChange={e => setPickSeconds(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-sm">
              <option value={60}>60s</option>
              <option value={90}>90s</option>
              <option value={120}>120s</option>
              <option value={180}>3m</option>
            </select>
          </label>
          <button
            onClick={start}
            disabled={!validation.valid}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-semibold text-sm transition-colors"
          >
            <Play className="w-4 h-4" /> Start Draft
          </button>
          <span className="text-xs text-slate-500">Any manager can set this up and start. All connected devices update live.</span>
        </div>
      </div>
    );
  }

  // --- DRAFTING / DONE -----------------------------------------------------
  const current = state.slots[state.currentIndex];
  const isMyTurn = state.phase === 'drafting' && current && current.player === mySeat && iOwnMySeat;
  const takenSet = new Set(state.slots.filter(s => s.team).map(s => normalize(s.team)));
  const avail = state.pool
    .filter(t => !takenSet.has(normalize(t.name)))
    .sort((a, b) => b.projValue - a.projValue || b.vegasWins - a.vegasWins);
  const remaining = state.deadline ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : null;

  if (state.phase === 'done') {
    const rosters = { Chris: [], Ian: [], Karan: [] };
    [...state.slots].sort((a, b) => a.round - b.round).forEach(s => { if (s.team) rosters[s.player].push(s); });
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /><h3 className="text-lg font-semibold">Draft Complete</h3></div>
          <button onClick={() => emit('resetRoom')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
            <RotateCcw className="w-3 h-3" /> New draft
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {state.order.map(p => (
            <div key={p} className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
              <div className="font-semibold text-slate-100 mb-3">{p}{p === mySeat && <span className="ml-2 text-[10px] uppercase text-blue-400">you</span>}</div>
              <ol className="space-y-1 text-sm">
                {rosters[p].map((s, i) => (
                  <li key={s.team} className="text-slate-300">
                    <span className="text-slate-600 font-mono text-xs mr-2">{i + 1}</span>{s.team}
                    {s.keeper && <Star className="inline w-3 h-3 fill-amber-400 text-amber-400 ml-1" />}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConnBadge connected={connected} />

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">Round {current?.round} · Pick {current?.overall}/30</span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <User className={`w-4 h-4 ${isMyTurn ? 'text-emerald-400' : 'text-slate-400'}`} />
            {isMyTurn ? "You're on the clock" : `${current?.player} is on the clock`}
          </span>
          {remaining != null && (
            <span className={`flex items-center gap-1 text-sm font-mono ${remaining <= 10 ? 'text-red-400' : 'text-slate-300'}`}>
              <Clock className="w-3.5 h-3.5" /> {remaining}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => emit('undo')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
            <Undo2 className="w-3 h-3" /> Undo
          </button>
          <button onClick={() => emit('resetRoom')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Board */}
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/50 overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[440px]">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-2 pr-2 w-8 text-center">R</th>
                {state.order.map(p => (
                  <th key={p} className="pb-2 px-2 text-left">{p}{p === mySeat && <span className="ml-1 text-[10px] text-blue-400">(you)</span>}</th>
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
                          isCurrent ? 'bg-emerald-500/20 border-emerald-500 animate-pulse'
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
                onClick={() => isMyTurn && emit('makePick', { player: mySeat, team: t.name })}
                disabled={!isMyTurn}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-left transition-colors ${
                  isMyTurn ? 'bg-slate-800/60 border-slate-700 hover:bg-emerald-600/20 hover:border-emerald-500 cursor-pointer'
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
          {!isMyTurn && <p className="mt-2 text-[10px] text-slate-500 text-center">Waiting for {current?.player} to pick…</p>}
        </div>
      </div>
    </div>
  );
}

function ConnBadge({ connected }) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${
      connected ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : 'text-slate-400 border-slate-700 bg-slate-800/50'
    }`}>
      {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {connected ? 'Connected' : 'Reconnecting…'}
    </div>
  );
}
