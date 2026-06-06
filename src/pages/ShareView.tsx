import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Quarter, SlotKey } from '../types';
import { ALL_SLOTS, QUARTERS, POSITION_ZONE, POSITIONS } from '../types';
import { decodeShare } from '../utils/sharing';
import type { ShareData } from '../utils/sharing';

type ViewMode = 'all' | 'quarter';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ZONE_BADGE: Record<string, string> = {
  attack:  'bg-rose-50 text-rose-700 border-rose-200',
  mid:     'bg-violet-50 text-violet-700 border-violet-200',
  defence: 'bg-blue-50 text-blue-700 border-blue-200',
  sub:     'bg-slate-50 text-slate-500 border-slate-200',
};

interface PlayerDetail {
  playerName: string;
  slot: SlotKey;
  quarter: Quarter;
  note?: string;
  injury?: { quarter: Quarter; description: string };
  preGameInjury?: string;
}

function PlayerDetailSheet({ detail, onClose }: { detail: PlayerDetail; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl pb-10">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-start justify-between px-4 pb-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-medium">Q{detail.quarter} · {detail.slot}</p>
            <p className="text-lg font-bold text-slate-900">{detail.playerName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 mt-1"><X size={20} /></button>
        </div>
        <div className="px-4 pt-3 space-y-3">
          {detail.note && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-600 mb-0.5">Note</p>
              <p className="text-sm text-violet-900">{detail.note}</p>
            </div>
          )}
          {detail.injury && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Mid-game injury (Q{detail.injury.quarter})</p>
              <p className="text-sm text-amber-900">{detail.injury.description}</p>
            </div>
          )}
          {detail.preGameInjury && !detail.injury && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Pre-game injury note</p>
              <p className="text-sm text-amber-900">{detail.preGameInjury}</p>
            </div>
          )}
          {!detail.note && !detail.injury && !detail.preGameInjury && (
            <p className="text-sm text-slate-400 text-center py-2">No notes or injuries recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyGrid({ data }: { data: ShareData }) {
  const { game, players } = data;
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const injuredIds = new Set(game.midGameInjuries.map((i) => i.playerId));
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  // Per-quarter injury sets
  const injuredByQ: Record<number, Set<string>> = {};
  for (const q of QUARTERS) {
    injuredByQ[q] = new Set(
      game.midGameInjuries.filter((i) => i.quarter <= q).map((i) => i.playerId)
    );
  }

  function openDetail(player: (typeof byId)[string], slot: SlotKey, q: Quarter) {
    if (!player) return;
    const note = game.quarterNotes?.[q]?.[slot];
    const injury = game.midGameInjuries.find((i) => i.playerId === player.id);
    if (!note && !injury && !player.activeInjury) return; // nothing to show
    setDetail({
      playerName: player.name,
      slot,
      quarter: q,
      note,
      injury: injury ? { quarter: injury.quarter, description: injury.description } : undefined,
      preGameInjury: player.activeInjury,
    });
  }

  return (
    <div className="px-4 py-3">
      <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '38px repeat(4, 1fr)' }}>
        <div />
        {QUARTERS.map((q) => (
          <div key={q} className="text-center text-xs font-bold text-slate-500">Q{q}</div>
        ))}
      </div>

      {ALL_SLOTS.map((slot) => {
        const zone = slot !== 'Sub' ? POSITION_ZONE[slot as typeof POSITIONS[number]] : 'sub';
        return (
          <div key={slot} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '38px repeat(4, 1fr)' }}>
            <div className={`flex items-center justify-center rounded-lg border text-xs font-bold py-2 ${ZONE_BADGE[zone]}`}>
              {slot}
            </div>
            {QUARTERS.map((q) => {
              const pid = game.quarters[q][slot];
              const player = pid ? byId[pid] : null;
              const isInjured = player ? injuredByQ[q].has(player.id) : false;
              const note = game.quarterNotes?.[q]?.[slot];
              const hasDetail = player && (note || isInjured || player.activeInjury);
              const Cell = hasDetail ? 'button' : 'div';
              return (
                <Cell
                  key={q}
                  onClick={hasDetail ? () => openDetail(player, slot, q) : undefined}
                  className={`rounded-lg border text-center py-2 px-1 text-xs leading-tight relative ${
                    isInjured
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : player
                      ? 'bg-white border-slate-200 text-slate-800 font-medium'
                      : 'bg-slate-50 border-slate-100 text-slate-300'
                  } ${hasDetail ? 'active:opacity-70' : ''}`}
                >
                  {player ? (
                    <span className="block truncate">
                      {isInjured ? '🩹 ' : ''}{player.name.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-slate-200">—</span>
                  )}
                  {(note || isInjured) && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </Cell>
              );
            })}
          </div>
        );
      })}

      <div className="mt-4 mb-2 bg-white border border-slate-200 rounded-xl p-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">Court time</p>
        <div className="space-y-1.5">
          {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => {
            const qts = QUARTERS.reduce((acc, q) => {
              const inCourt = Object.entries(game.quarters[q]).some(
                ([slot, pid]) => pid === player.id && slot !== 'Sub'
              );
              return acc + (inCourt ? 1 : 0);
            }, 0);
            const isEverInjured = injuredIds.has(player.id);
            return (
              <div key={player.id} className="flex items-center gap-2">
                <span className={`text-xs font-medium w-20 truncate ${isEverInjured ? 'text-amber-500' : 'text-slate-700'}`}>
                  {isEverInjured ? '🩹 ' : ''}{player.name}
                </span>
                <div className="flex gap-0.5 flex-1">
                  {QUARTERS.map((q) => {
                    const lineup = game.quarters[q];
                    const inCourt = Object.entries(lineup).some(([slot, pid]) => pid === player.id && slot !== 'Sub');
                    const isSub = lineup['Sub'] === player.id;
                    return (
                      <div
                        key={q}
                        className={`flex-1 h-4 rounded text-center text-xs leading-4 font-bold ${
                          inCourt ? 'bg-violet-500 text-white' : isSub ? 'bg-slate-200 text-slate-500' : 'bg-slate-100'
                        }`}
                      >
                        {inCourt ? q : isSub ? '—' : ''}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{qts}Q</span>
              </div>
            );
          })}
        </div>
      </div>

      {game.midGameInjuries.length > 0 && (
        <div className="mt-3 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
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

      {detail && <PlayerDetailSheet detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function SingleQuarterView({ data, activeQ, setActiveQ }: {
  data: ShareData;
  activeQ: Quarter;
  setActiveQ: (q: Quarter) => void;
}) {
  const { game, players } = data;
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const lineup = game.quarters[activeQ];
  const injuredIds = new Set(
    game.midGameInjuries.filter((i) => i.quarter <= activeQ).map((i) => i.playerId)
  );
  const [detail, setDetail] = useState<PlayerDetail | null>(null);

  return (
    <>
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {QUARTERS.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQ(q)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeQ === q
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Q{q}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-1.5 pb-4">
        {ALL_SLOTS.map((slot) => {
          const pid = lineup[slot];
          const player = pid ? byId[pid] : null;
          const injury = player ? game.midGameInjuries.find((i) => i.playerId === player.id) : null;
          const isInjured = player ? injuredIds.has(player.id) : false;
          const zone = slot !== 'Sub' ? POSITION_ZONE[slot as typeof POSITIONS[number]] : 'sub';
          const note = game.quarterNotes?.[activeQ]?.[slot];
          const hasDetail = player && (note || isInjured || player.activeInjury);
          return (
            <button
              key={slot}
              disabled={!hasDetail}
              onClick={() => {
                if (!player || !hasDetail) return;
                setDetail({
                  playerName: player.name,
                  slot,
                  quarter: activeQ,
                  note,
                  injury: injury ? { quarter: injury.quarter, description: injury.description } : undefined,
                  preGameInjury: player.activeInjury,
                });
              }}
              className={`w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-3.5 text-left ${hasDetail ? 'active:bg-slate-50' : ''}`}
            >
              <div className={`w-11 text-center text-xs font-bold py-1.5 rounded-lg border flex-shrink-0 ${ZONE_BADGE[zone]}`}>
                {slot}
              </div>
              <div className="flex-1 min-w-0">
                {player ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{player.name}</span>
                      {isInjured && injury && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertTriangle size={10} />
                          Injured Q{injury.quarter}
                        </span>
                      )}
                      {note && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                    </div>
                    {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic">Not assigned</span>
                )}
              </div>
              {hasDetail && <span className="text-slate-300 text-xs flex-shrink-0">›</span>}
            </button>
          );
        })}

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

      {detail && <PlayerDetailSheet detail={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

const POLL_MS = 10_000;

export default function ShareView() {
  const { data: param } = useParams<{ data: string }>();
  const [activeQ, setActiveQ] = useState<Quarter>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);
  const isLive = !!param && UUID_RE.test(param);

  // Initial load
  useEffect(() => {
    if (!param) { setError('Invalid share link.'); setLoading(false); return; }

    if (UUID_RE.test(param)) {
      fetch(`/api/game/${param}`)
        .then((r) => { if (!r.ok) throw new Error('not_found'); return r.json(); })
        .then((d) => { setShareData(d); setLastUpdated(new Date()); setLoading(false); })
        .catch(() => { setError('Lineup not found — it may not have been synced yet.'); setLoading(false); });
    } else {
      const decoded = decodeShare(param);
      if (decoded) { setShareData(decoded); } else { setError('Could not load lineup — link may be corrupted.'); }
      setLoading(false);
    }
  }, [param]);

  // Live polling for UUID links
  useEffect(() => {
    if (!isLive || loading) return;
    const interval = setInterval(() => {
      fetch(`/api/game/${param}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (!d) return;
          setShareData((prev) => {
            const changed = JSON.stringify(d) !== JSON.stringify(prev);
            if (changed) {
              setLastUpdated(new Date());
              setPulse(true);
              setTimeout(() => setPulse(false), 1000);
            }
            return changed ? d : prev;
          });
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [isLive, loading, param]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <p className="text-slate-500">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const { game } = shareData;
  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-violet-600 px-4 pt-safe pb-5">
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest">Pivot Playbook</p>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-100">
                <span className={`w-2 h-2 rounded-full ${pulse ? 'bg-white' : 'bg-green-400'} transition-colors duration-300`} />
                Live
              </span>
            )}
          </div>
          <h1 className="text-white font-bold text-2xl mt-0.5">
            {game.opponent ? `vs ${game.opponent}` : 'Lineup'}
          </h1>
          <p className="text-violet-100 text-sm mt-0.5">
            {formatDate(game.date)}
            {lastUpdated && (
              <span className="ml-2 opacity-60">
                · updated {lastUpdated.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mx-4 mt-4 flex gap-0.5 p-1 bg-slate-100 rounded-xl">
        {(['all', 'quarter'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {mode === 'all' ? 'All quarters' : 'Single quarter'}
          </button>
        ))}
      </div>

      {viewMode === 'all' ? (
        <ReadOnlyGrid data={shareData} />
      ) : (
        <SingleQuarterView data={shareData} activeQ={activeQ} setActiveQ={setActiveQ} />
      )}

      <div
        className="text-center pt-6 text-xs text-slate-400"
        style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
      >
        Shared via Pivot Playbook
      </div>
    </div>
  );
}
