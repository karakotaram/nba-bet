import React from 'react';
import { ClipboardList, Star, Lock } from 'lucide-react';
import { KEEPER_RULES, normalize } from './data';

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

// Overall pick number in a snake draft (round is 0-based; order = round-1 order).
const snakePick = (order, player, round) => {
  const seat = order.indexOf(player);
  const pos = round % 2 === 0 ? seat : order.length - 1 - seat;
  return round * order.length + pos + 1;
};

// Round-by-round board of a completed draft. Pass `order` (round-1 pick order)
// to label each cell with its overall snake pick; columns then follow that
// order. Without it, columns follow `players`.
export function DraftBoard({ title, draft, keptTeams, order, players = order }) {
  const keptSet = new Set(keptTeams.map(normalize));
  const rounds = Math.max(...players.map(p => draft[p].length));

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            {title}
          </h3>
          {order && (
            <p className="text-xs text-slate-400 mt-1">
              Snake draft · {order.join(' → ')} in round 1, reversing each round
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Kept from last year
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[520px]">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <th className="pb-3 w-12 text-center">Rd</th>
              {players.map(player => (
                <th key={player} className="pb-3 px-3">{player}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {Array.from({ length: rounds }, (_, i) => i).map(round => (
              <tr key={round} className="border-b border-slate-700/40 last:border-0">
                <td className="py-1.5 text-center align-middle">
                  <span className="text-xs font-mono text-slate-500">{round + 1}</span>
                </td>
                {players.map(player => {
                  const team = draft[player][round];
                  const kept = keptSet.has(normalize(team));
                  return (
                    <td key={player} className="py-1.5 px-3">
                      <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 border transition-colors ${kept ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800/40 border-slate-700/50'}`}>
                        <span className="flex items-baseline gap-2 min-w-0">
                          {order && (
                            <span className="text-[10px] font-mono text-slate-500 w-6 shrink-0">#{snakePick(order, player, round)}</span>
                          )}
                          <span className={`font-medium ${kept ? 'text-amber-200' : 'text-slate-200'}`}>{team}</span>
                        </span>
                        {kept && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400" /> Kept
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function KeeperRules() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-purple-400" />
        Keeper Rules
      </h3>
      <ul className="space-y-3">
        {KEEPER_RULES.map((rule, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
              {idx + 1}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
