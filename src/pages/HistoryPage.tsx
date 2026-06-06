import { useState } from 'react';
import { ChevronRight, Trash2, Share2, AlertTriangle } from 'lucide-react';
import { useAppStore, selectSortedPlayers } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import type { Game, Quarter } from '../types';
import { ALL_SLOTS, QUARTERS } from '../types';
import { buildShareUrl, buildShareText, syncGameToServer } from '../utils/sharing';

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function assignedCount(game: Game) {
  return Math.max(...QUARTERS.map((q) => Object.keys(game.quarters[q]).length));
}

interface GameDetailProps {
  game: Game;
  onClose: () => void;
  onDelete: () => void;
  onShare: () => void;
}

function GameDetail({ game, onClose, onDelete, onShare }: GameDetailProps) {
  const players = useAppStore((s) => s.players);
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const [activeQ, setActiveQ] = useState<Quarter>(1);

  const lineup = game.quarters[activeQ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-violet-600 pt-safe px-4 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between pt-3">
          <button onClick={onClose} className="text-white/80 text-sm font-medium">
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <Share2 size={13} />
              Share
            </button>
            <button
              onClick={onDelete}
              className="bg-white/20 text-white p-1.5 rounded-full"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <h2 className="text-white font-bold text-lg mt-2">
          {game.opponent ? `vs ${game.opponent}` : 'Game'}
        </h2>
        <p className="text-violet-100 text-sm">{formatDate(game.date)}</p>
      </div>

      {/* Quarter tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2 flex-shrink-0">
        {QUARTERS.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQ(q)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeQ === q
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Q{q}
          </button>
        ))}
      </div>

      {/* Lineup */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-1.5 pt-1">
        {ALL_SLOTS.map((slot) => {
          const pid = lineup[slot];
          const player = pid ? byId[pid] : null;
          const injury = player
            ? game.midGameInjuries.find((i) => i.playerId === player.id)
            : null;
          return (
            <div
              key={slot}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-3"
            >
              <div className="w-11 text-center text-xs font-bold text-slate-500 bg-slate-100 py-1.5 rounded-lg flex-shrink-0">
                {slot}
              </div>
              <div className="flex-1 min-w-0">
                {player ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 truncate">{player.name}</span>
                    {injury && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertTriangle size={10} />
                        Q{injury.quarter}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic">—</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Mid-game injuries */}
        {game.midGameInjuries.length > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1.5">Mid-game injuries</p>
            {game.midGameInjuries.map((inj) => {
              const p = byId[inj.playerId];
              return (
                <div key={inj.playerId} className="text-sm text-amber-700">
                  <span className="font-medium">Q{inj.quarter} — {p?.name ?? 'Unknown'}</span>
                  {': '}
                  {inj.description}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const players = useAppStore(useShallow(selectSortedPlayers));
  const games = useAppStore((s) => s.games);
  const deleteGame = useAppStore((s) => s.deleteGame);
  const setActiveGame = useAppStore((s) => s.setActiveGame);
  const navigate = useNavigate();

  const [viewingGame, setViewingGame] = useState<Game | null>(null);
  const [shareToast, setShareToast] = useState('');

  async function handleShare(game: Game) {
    await syncGameToServer({ game, players });
    const url = buildShareUrl(game.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Pivot Playbook${game.opponent ? ` — vs ${game.opponent}` : ''}`, url });
        return;
      } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast('Link copied!');
      setTimeout(() => setShareToast(''), 2500);
    } catch {
      setShareToast(buildShareText({ game, players }));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Detail view */}
      {viewingGame && (
        <GameDetail
          game={viewingGame}
          onClose={() => setViewingGame(null)}
          onDelete={() => {
            deleteGame(viewingGame.id);
            setViewingGame(null);
          }}
          onShare={() => handleShare(viewingGame)}
        />
      )}

      {/* Header */}
      <div className="bg-violet-600 pt-safe px-4 pb-5 flex-shrink-0">
        <div className="pt-3">
          <h1 className="text-white font-bold text-xl">History</h1>
          <p className="text-violet-100 text-sm mt-0.5">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Games list */}
      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-2">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <p className="text-slate-400 text-sm">No games yet. Create one in the Plan tab.</p>
          </div>
        ) : (
          games.map((game) => {
            const count = assignedCount(game);
            return (
              <button
                key={game.id}
                onClick={() => setViewingGame(game)}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">
                    {game.opponent ? `vs ${game.opponent}` : 'Game'}
                  </p>
                  <p className="text-sm text-slate-500">{formatDate(game.date)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1">
                      {QUARTERS.map((q) => {
                        const qCount = Object.keys(game.quarters[q]).length;
                        return (
                          <div
                            key={q}
                            className={`w-2 h-2 rounded-full ${qCount > 0 ? 'bg-violet-500' : 'bg-slate-200'}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs text-slate-400">
                      {count}/8 positions filled
                    </span>
                    {game.midGameInjuries.length > 0 && (
                      <span className="text-xs text-amber-600 flex items-center gap-0.5">
                        <AlertTriangle size={11} />
                        {game.midGameInjuries.length} injury
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg z-50">
          {shareToast}
        </div>
      )}
    </div>
  );
}
