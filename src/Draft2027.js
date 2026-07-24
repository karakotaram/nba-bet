import React, { useState } from 'react';
import { Users, Bot, ArrowLeft, Wifi } from 'lucide-react';
import MockDraftRoom from './MockDraftRoom';

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

// Landing screen for the 2027 draft: choose a live room or a solo mock draft.
export default function Draft2027() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'mock' | 'live'

  if (mode === 'mock') {
    return (
      <Card className="p-6 animate-in fade-in duration-300">
        <button onClick={() => setMode('landing')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Mock Draft</h3>
        </div>
        <MockDraftRoom />
      </Card>
    );
  }

  if (mode === 'live') {
    return (
      <Card className="p-6 animate-in fade-in duration-300">
        <button onClick={() => setMode('landing')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Live Draft Room</h3>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 text-sm text-slate-300 space-y-2">
          <p className="font-medium text-slate-200">Real-time online room — coming in the next phase.</p>
          <p className="text-slate-400">
            Each of you joins from your own device and drafts live (snake order, keeper enforcement,
            per-pick timer, commissioner undo). This needs the Railway server to be stood up first;
            the whole draft experience is playable now via <span className="text-blue-300">Mock Draft</span>.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">2027 Draft</h3>
        <p className="text-sm text-slate-400 mb-6">Snake draft · keeper rules enforced · three managers.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Draft Now (live) */}
          <button
            onClick={() => setMode('live')}
            className="group text-left p-5 rounded-xl border border-slate-700 bg-slate-800/40 hover:border-emerald-500/60 hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400"><Users className="w-5 h-5" /></div>
              <span className="font-semibold text-slate-100">Draft Now</span>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5">Soon</span>
            </div>
            <p className="text-sm text-slate-400">Live online room — all three managers draft together, each on their own device.</p>
          </button>

          {/* Mock Draft */}
          <button
            onClick={() => setMode('mock')}
            className="group text-left p-5 rounded-xl border border-slate-700 bg-slate-800/40 hover:border-blue-500/60 hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400"><Bot className="w-5 h-5" /></div>
              <span className="font-semibold text-slate-100">Mock Draft</span>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-green-400 bg-green-500/10 border border-green-500/30 rounded px-1.5 py-0.5">Ready</span>
            </div>
            <p className="text-sm text-slate-400">Practice solo against the computer (CPU drafts best available by projected value).</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
