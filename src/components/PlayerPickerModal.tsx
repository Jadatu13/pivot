import { X, Star, AlertTriangle } from 'lucide-react';
import type { Game, Player, Quarter, SlotKey } from '../types';
import { POSITION_LABELS, POSITIONS } from '../types';
import { scorePlayers } from '../utils/suggestions';

interface Props {
  players: Player[];
  game: Game;
  quarter: Quarter;
  slot: SlotKey;
  currentPlayerId?: string;
  onSelect: (playerId: string | undefined) => void;
  onClose: () => void;
}

const TAG_COLOURS: Record<string, string> = {
  Preferred: 'bg-emerald-100 text-emerald-700',
  "Hasn't played": 'bg-blue-100 text-blue-700',
  'Was sub': 'bg-violet-100 text-violet-700',
  'Sat out last Q': 'bg-indigo-100 text-indigo-700',
  'Pre-game injury': 'bg-amber-100 text-amber-700',
};

function CourtTimePips({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((q) => (
        <div
          key={q}
          className={`w-2 h-2 rounded-full ${q <= count ? 'bg-emerald-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function PlayerPickerModal({
  players,
  game,
  quarter,
  slot,
  currentPlayerId,
  onSelect,
  onClose,
}: Props) {
  const scored = scorePlayers(players, game, quarter, slot);
  const available = scored.filter((s) => !s.excluded);
  const unavailable = scored.filter((s) => s.excluded);

  const slotLabel = slot === 'Sub' ? 'Sub' : `${slot} — ${POSITION_LABELS[slot as typeof POSITIONS[number]]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-2 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Q{quarter} · Assign to</p>
            <h2 className="text-lg font-bold text-slate-900">{slotLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Clear option */}
        {currentPlayerId && (
          <button
            onClick={() => { onSelect(undefined); onClose(); }}
            className="mx-4 mt-3 flex-shrink-0 text-sm text-red-500 font-medium py-2 border border-red-100 rounded-xl bg-red-50"
          >
            Clear assignment
          </button>
        )}

        {/* Player list */}
        <div className="overflow-y-auto flex-1 px-4 py-2 space-y-1.5">
          {available.map(({ player, tags, courtTime }) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isPreferred = slot !== 'Sub' && player.preferredPositions.includes(slot as typeof POSITIONS[number]);
            return (
              <button
                key={player.id}
                onClick={() => { onSelect(player.id); onClose(); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  isCurrentPlayer
                    ? 'bg-emerald-50 border-2 border-emerald-400'
                    : 'bg-slate-50 border border-slate-100 active:bg-slate-100'
                }`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {player.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 truncate">{player.name}</span>
                    {isPreferred && <Star size={13} className="text-emerald-500 flex-shrink-0" fill="currentColor" />}
                    {player.activeInjury && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            TAG_COLOURS[tag] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Court time */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <CourtTimePips count={courtTime} />
                  <span className="text-xs text-slate-400">{courtTime}Q</span>
                </div>
              </button>
            );
          })}

          {/* Unavailable players */}
          {unavailable.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide pt-2 pb-1">
                Unavailable
              </p>
              {unavailable.map(({ player, excludeReason }) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 opacity-40"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {player.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{player.name}</p>
                    <p className="text-xs text-slate-500">{excludeReason}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
