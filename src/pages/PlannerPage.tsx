import { useState, useEffect } from 'react';
import { Plus, ChevronDown, Copy, Share2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Quarter, SlotKey } from '../types';
import { QUARTERS } from '../types';
import QuarterBoard from '../components/QuarterBoard';
import AllQuartersGrid from '../components/AllQuartersGrid';
import SmartSuggestions from '../components/SmartSuggestions';
import NewGameModal from '../components/NewGameModal';
import { getGameTips } from '../utils/suggestions';
import { buildShareUrl, buildShareText, syncGameToServer } from '../utils/sharing';

type ViewMode = 'all' | 'quarter';

export default function PlannerPage() {
  const players = useAppStore((s) => s.players);
  const games = useAppStore((s) => s.games);
  const activeGameId = useAppStore((s) => s.activeGameId);
  const createGame = useAppStore((s) => s.createGame);
  const setActiveGame = useAppStore((s) => s.setActiveGame);
  const assignPlayer = useAppStore((s) => s.assignPlayer);
  const copyQuarter = useAppStore((s) => s.copyQuarter);
  const setSlotNote = useAppStore((s) => s.setSlotNote);
  const addMidGameInjury = useAppStore((s) => s.addMidGameInjury);
  const removeMidGameInjury = useAppStore((s) => s.removeMidGameInjury);

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [quarter, setQuarter] = useState<Quarter>(1);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [shareToast, setShareToast] = useState('');

  const activeGame = games.find((g) => g.id === activeGameId) ?? games[0] ?? null;

  function handleAssign(slot: SlotKey, playerId: string | undefined) {
    if (!activeGame) return;
    assignPlayer(activeGame.id, quarter, slot, playerId);
  }

  function handleAssignAll(q: Quarter, slot: SlotKey, playerId: string | undefined) {
    if (!activeGame) return;
    assignPlayer(activeGame.id, q, slot, playerId);
  }

  function handleCopyFrom(from: Quarter) {
    if (!activeGame) return;
    copyQuarter(activeGame.id, from, quarter);
    setShowCopyMenu(false);
  }

  async function handleShare(mode: 'link' | 'text') {
    if (!activeGame) return;
    if (mode === 'link') {
      const url = buildShareUrl(activeGame.id);
      // Use native share sheet on iOS/Android, fall back to clipboard on desktop
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Pivot Playbook${activeGame.opponent ? ` — vs ${activeGame.opponent}` : ''}`,
            url,
          });
          return;
        } catch {
          // user cancelled or share failed — fall through to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShareToast('Link copied!');
      setTimeout(() => setShareToast(''), 2500);
    } else {
      const text = buildShareText({ game: activeGame, players });
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShareToast('Copied for WhatsApp!');
      setTimeout(() => setShareToast(''), 2500);
    }
  }

  // Sync active game to server whenever it changes (powers live share links)
  useEffect(() => {
    if (activeGame) syncGameToServer({ game: activeGame, players });
  }, [activeGame, players]);

  const tips = activeGame ? getGameTips(players, activeGame, quarter) : [];

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', {
      weekday: 'short', day: 'numeric', month: 'short',
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-violet-600 pt-safe px-4 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between pt-3">
          <h1 className="text-white font-bold text-xl tracking-tight">Pivot Playbook</h1>
          <button
            onClick={() => setShowNewGame(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={15} />
            New game
          </button>
        </div>

        {/* Game selector */}
        {activeGame ? (
          <button
            onClick={() => setShowGamePicker((o) => !o)}
            className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 w-full text-left"
          >
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {activeGame.opponent ? `vs ${activeGame.opponent}` : 'Game'}
              </p>
              <p className="text-violet-100 text-xs">{formatDate(activeGame.date)}</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-white/70 transition-transform ${showGamePicker ? 'rotate-180' : ''}`}
            />
          </button>
        ) : (
          <div className="mt-3 text-violet-100 text-sm">Tap + New game to get started</div>
        )}

        {/* Game picker dropdown */}
        {showGamePicker && games.length > 0 && (
          <div className="mt-1 bg-white rounded-xl shadow-lg overflow-hidden">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGame(g.id); setShowGamePicker(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-50 last:border-0 ${
                  g.id === activeGame?.id ? 'bg-violet-50' : ''
                }`}
              >
                <div>
                  <p className={`font-medium text-sm ${g.id === activeGame?.id ? 'text-violet-700' : 'text-slate-800'}`}>
                    {g.opponent ? `vs ${g.opponent}` : 'Game'}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(g.date)}</p>
                </div>
                {g.id === activeGame?.id && <div className="w-2 h-2 rounded-full bg-violet-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      {activeGame ? (
        <div className="flex-1 overflow-y-auto pb-24">

          {/* View mode toggle */}
          <div className="mx-4 mt-4 flex gap-0.5 p-1 bg-slate-100 rounded-xl">
            {(['all', 'quarter'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {mode === 'all' ? 'All quarters' : 'Single quarter'}
              </button>
            ))}
          </div>

          {viewMode === 'quarter' ? (
            <>
              {/* Quarter tabs */}
              <div className="flex gap-2 px-4 pt-3 pb-1">
                {QUARTERS.map((q) => {
                  const assigned = Object.keys(activeGame.quarters[q]).length;
                  return (
                    <button
                      key={q}
                      onClick={() => setQuarter(q)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors relative ${
                        quarter === q
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Q{q}
                      {assigned > 0 && (
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                          quarter === q ? 'bg-white text-violet-600' : 'bg-violet-500 text-white'
                        }`}>
                          {assigned}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Controls row */}
              <div className="flex gap-2 px-4 pt-2 pb-1">
                {quarter > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCopyMenu((o) => !o)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl"
                    >
                      <Copy size={13} />
                      Copy from…
                    </button>
                    {showCopyMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                        {QUARTERS.filter((q) => q < quarter).map((q) => (
                          <button
                            key={q}
                            onClick={() => handleCopyFrom(q)}
                            className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            Quarter {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleShare('link')}
                    className="flex items-center gap-1.5 text-xs font-medium text-violet-700 border border-violet-200 bg-violet-50 px-3 py-2 rounded-xl"
                  >
                    <Share2 size={13} />
                    Share
                  </button>
                  <button
                    onClick={() => handleShare('text')}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              <QuarterBoard
                game={activeGame}
                quarter={quarter}
                players={players}
                onAssign={handleAssign}
                onAddInjury={(q, playerId, description) =>
                  addMidGameInjury(activeGame.id, { playerId, quarter: q, description })
                }
                onRemoveInjury={(playerId) => removeMidGameInjury(activeGame.id, playerId)}
                onSetNote={(slot, note) => setSlotNote(activeGame.id, quarter, slot, note)}
              />

              <SmartSuggestions tips={tips} />
            </>
          ) : (
            <>
              {/* Share controls for all-quarters view */}
              <div className="flex gap-2 px-4 pt-3 pb-1 justify-end">
                <button
                  onClick={() => handleShare('link')}
                  className="flex items-center gap-1.5 text-xs font-medium text-violet-700 border border-violet-200 bg-violet-50 px-3 py-2 rounded-xl"
                >
                  <Share2 size={13} />
                  Share
                </button>
                <button
                  onClick={() => handleShare('text')}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl"
                >
                  WhatsApp
                </button>
              </div>

              <AllQuartersGrid
                game={activeGame}
                players={players}
                onAssign={handleAssignAll}
                onAddInjury={(q, playerId, description) =>
                  addMidGameInjury(activeGame.id, { playerId, quarter: q, description })
                }
                onRemoveInjury={(playerId) => removeMidGameInjury(activeGame.id, playerId)}
                onSetNote={(q, slot, note) => setSlotNote(activeGame.id, q, slot, note)}
              />
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 pb-24">
          <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-4">
            <Plus size={36} className="text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No games yet</h2>
          <p className="text-slate-500 text-sm mb-6">
            Create your first game to start planning your lineup
          </p>
          <button
            onClick={() => setShowNewGame(true)}
            className="bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Create first game
          </button>
        </div>
      )}

      {/* Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg z-50">
          {shareToast}
        </div>
      )}

      {showNewGame && (
        <NewGameModal onClose={() => setShowNewGame(false)} onCreate={createGame} />
      )}
    </div>
  );
}
