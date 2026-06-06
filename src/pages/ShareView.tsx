import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Quarter } from '../types';
import { ALL_SLOTS, QUARTERS } from '../types';
import { decodeShare } from '../utils/sharing';

export default function ShareView() {
  const { data } = useParams<{ data: string }>();
  const [activeQ, setActiveQ] = useState<Quarter>(1);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <p className="text-slate-500">Invalid share link.</p>
      </div>
    );
  }

  const shareData = decodeShare(data);

  if (!shareData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <p className="text-slate-500">Could not load lineup — link may be corrupted.</p>
      </div>
    );
  }

  const { game, players } = shareData;
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const lineup = game.quarters[activeQ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-emerald-600 px-4 pt-safe pb-5">
        <div className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest">Pivot Lineup</p>
            <h1 className="text-white font-bold text-2xl mt-0.5">
              {game.opponent ? `vs ${game.opponent}` : 'Lineup'}
            </h1>
            <p className="text-emerald-100 text-sm mt-0.5">{formatDate(game.date)}</p>
          </div>
        </div>
      </div>

      {/* Quarter tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {QUARTERS.map((q) => {
          const count = Object.keys(game.quarters[q]).length;
          return (
            <button
              key={q}
              onClick={() => setActiveQ(q)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeQ === q
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              Q{q}
              {count === 0 && <span className="ml-1 opacity-40 text-xs">—</span>}
            </button>
          );
        })}
      </div>

      {/* Lineup */}
      <div className="px-4 space-y-1.5 pb-8">
        {ALL_SLOTS.map((slot) => {
          const pid = lineup[slot];
          const player = pid ? byId[pid] : null;
          const injury = player
            ? game.midGameInjuries.find((i) => i.playerId === player.id)
            : null;

          return (
            <div
              key={slot}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-3.5"
            >
              <div className="w-11 text-center text-xs font-bold text-slate-500 bg-slate-100 py-1.5 rounded-lg flex-shrink-0">
                {slot}
              </div>
              <div className="flex-1 min-w-0">
                {player ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{player.name}</span>
                    {player.number != null && (
                      <span className="text-sm text-slate-400">#{player.number}</span>
                    )}
                    {injury && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertTriangle size={10} />
                        Injured Q{injury.quarter}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic">Not assigned</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Mid-game injury summary */}
        {game.midGameInjuries.length > 0 && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1.5">Mid-game injuries</p>
            {game.midGameInjuries.map((inj) => {
              const p = byId[inj.playerId];
              return (
                <p key={inj.playerId} className="text-sm text-amber-700">
                  <span className="font-medium">Q{inj.quarter} — {p?.name ?? 'Unknown'}</span>: {inj.description}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-slate-400">
        Shared via Pivot
      </div>
    </div>
  );
}
