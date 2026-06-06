import { useState } from 'react';
import type { Game, Player, Quarter, SlotKey } from '../types';
import { ALL_SLOTS, QUARTERS, POSITION_ZONE, POSITIONS } from '../types';
import { getMidGameInjuredIds } from '../utils/suggestions';
import PlayerPickerModal from './PlayerPickerModal';
import SlotActionSheet from './SlotActionSheet';
import InjuryModal from './InjuryModal';

interface Props {
  game: Game;
  players: Player[];
  onAssign: (quarter: Quarter, slot: SlotKey, playerId: string | undefined) => void;
  onAddInjury: (quarter: Quarter, playerId: string, description: string) => void;
  onRemoveInjury: (playerId: string) => void;
  onSetNote: (quarter: Quarter, slot: SlotKey, note: string) => void;
  onSetCaptainNote: (quarter: Quarter, slot: SlotKey, note: string) => void;
}

type CellTarget = { quarter: Quarter; slot: SlotKey };

const ZONE_STYLES: Record<string, { badge: string }> = {
  attack:  { badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  mid:     { badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  defence: { badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  sub:     { badge: 'bg-slate-50 text-slate-500 border-slate-200' },
};

export default function AllQuartersGrid({ game, players, onAssign, onAddInjury, onRemoveInjury, onSetNote, onSetCaptainNote }: Props) {
  const [pickerTarget, setPickerTarget] = useState<CellTarget | null>(null);
  const [actionTarget, setActionTarget] = useState<CellTarget | null>(null);
  const [injuryTarget, setInjuryTarget] = useState<{ playerId: string; name: string; quarter: Quarter } | null>(null);

  const playerById = Object.fromEntries(players.map((p) => [p.id, p]));
  // Per-quarter injury sets so a Q3 injury doesn't affect Q1/Q2 display
  const injuredByQ = Object.fromEntries(
    QUARTERS.map((q) => [q, getMidGameInjuredIds(game, q)])
  ) as Record<number, Set<string>>;
  // Still need all-time set for court time section
  const everInjuredIds = new Set(game.midGameInjuries.map((i) => i.playerId));

  function handleCellTap(quarter: Quarter, slot: SlotKey) {
    const pid = game.quarters[quarter][slot];
    if (pid) {
      setActionTarget({ quarter, slot });
    } else {
      setPickerTarget({ quarter, slot });
    }
  }

  const actionPlayer = actionTarget
    ? playerById[game.quarters[actionTarget.quarter][actionTarget.slot] ?? '']
    : null;

  return (
    <>
      <div className="px-4 py-3">
        {/* Column headers */}
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '38px repeat(4, 1fr)' }}>
          <div />
          {QUARTERS.map((q) => {
            const filled = Object.keys(game.quarters[q]).length;
            return (
              <div key={q} className="text-center">
                <span className="text-xs font-bold text-slate-500">Q{q}</span>
                {filled > 0 && (
                  <span className="ml-1 text-xs text-violet-500 font-semibold">{filled}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {ALL_SLOTS.map((slot) => {
          const zone = slot !== 'Sub' ? POSITION_ZONE[slot as typeof POSITIONS[number]] : 'sub';
          const { badge } = ZONE_STYLES[zone];

          return (
            <div key={slot} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '38px repeat(4, 1fr)' }}>
              {/* Position label */}
              <div className={`flex items-center justify-center rounded-lg border text-xs font-bold py-2 ${badge}`}>
                {slot}
              </div>

              {/* Quarter cells */}
              {QUARTERS.map((q) => {
                const pid = game.quarters[q][slot];
                const player = pid ? playerById[pid] : null;
                const isInjured = player ? injuredByQ[q].has(player.id) : false;
                const injury = player ? game.midGameInjuries.find((i) => i.playerId === player.id) : null;
                const note = game.quarterNotes?.[q]?.[slot];
                const captainNote = game.captainNotes?.[q]?.[slot];

                return (
                  <button
                    key={q}
                    onClick={() => handleCellTap(q, slot)}
                    className={`rounded-lg border text-center py-2 px-1 transition-colors text-xs leading-tight relative ${
                      isInjured
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : player
                        ? 'bg-white border-slate-200 text-slate-800 font-medium active:bg-slate-50'
                        : 'bg-slate-50 border-slate-100 text-slate-300 active:bg-slate-100'
                    }`}
                  >
                    {player ? (
                      <span className="block truncate">
                        {isInjured && injury ? `🩹` : ''}{player.name.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-slate-200 font-light text-base leading-none">+</span>
                    )}
                    {note && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
                    )}
                    {captainNote && (
                      <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Court time summary row */}
        {players.length > 0 && (
          <div className="mt-4 mb-2 bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">Court time per player</p>
            <div className="space-y-1.5">
              {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => {
                const qts = QUARTERS.reduce((acc, q) => {
                  const inCourt = Object.entries(game.quarters[q]).some(
                    ([slot, pid]) => pid === player.id && slot !== 'Sub'
                  );
                  return acc + (inCourt ? 1 : 0);
                }, 0);
                const onSub = QUARTERS.filter((q) => game.quarters[q]['Sub'] === player.id).length;
                const isEverInjured = everInjuredIds.has(player.id);

                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 truncate ${isEverInjured ? 'text-amber-500' : 'text-slate-700'}`}>
                      {isEverInjured ? '🩹 ' : ''}{player.name}
                    </span>
                    <div className="flex gap-0.5 flex-1">
                      {QUARTERS.map((q) => {
                        const lineup = game.quarters[q];
                        const inCourt = Object.entries(lineup).some(
                          ([slot, pid]) => pid === player.id && slot !== 'Sub'
                        );
                        const isSub = lineup['Sub'] === player.id;
                        return (
                          <div
                            key={q}
                            className={`flex-1 h-4 rounded text-center text-xs leading-4 font-bold ${
                              inCourt
                                ? 'bg-violet-500 text-white'
                                : isSub
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-slate-100 text-transparent'
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
            <p className="text-xs text-slate-400 mt-2">■ on court &nbsp; — sub &nbsp; □ off</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {pickerTarget && (
        <PlayerPickerModal
          players={players}
          game={game}
          quarter={pickerTarget.quarter}
          slot={pickerTarget.slot}
          currentPlayerId={game.quarters[pickerTarget.quarter][pickerTarget.slot]}
          onSelect={(pid) => onAssign(pickerTarget.quarter, pickerTarget.slot, pid)}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {actionTarget && actionPlayer && (
        <SlotActionSheet
          playerName={actionPlayer.name}
          slot={actionTarget.slot}
          hasInjury={injuredByQ[actionTarget.quarter].has(actionPlayer.id)}
          note={game.quarterNotes?.[actionTarget.quarter]?.[actionTarget.slot]}
          captainNote={game.captainNotes?.[actionTarget.quarter]?.[actionTarget.slot]}
          onChangePlayer={() => setPickerTarget(actionTarget)}
          onMarkInjury={() =>
            setInjuryTarget({ playerId: actionPlayer.id, name: actionPlayer.name, quarter: actionTarget.quarter })
          }
          onClear={() => onAssign(actionTarget.quarter, actionTarget.slot, undefined)}
          onClose={() => setActionTarget(null)}
          onNoteChange={(note) => onSetNote(actionTarget.quarter, actionTarget.slot, note)}
          onCaptainNoteChange={(note) => onSetCaptainNote(actionTarget.quarter, actionTarget.slot, note)}
        />
      )}

      {injuryTarget && (
        <InjuryModal
          playerName={injuryTarget.name}
          currentQuarter={injuryTarget.quarter}
          existingInjury={
            game.midGameInjuries.find((i) => i.playerId === injuryTarget.playerId)
              ? {
                  quarter: game.midGameInjuries.find((i) => i.playerId === injuryTarget.playerId)!.quarter,
                  description: game.midGameInjuries.find((i) => i.playerId === injuryTarget.playerId)!.description,
                }
              : undefined
          }
          onSave={(q, desc) => onAddInjury(q, injuryTarget.playerId, desc)}
          onRemove={() => onRemoveInjury(injuryTarget.playerId)}
          onClose={() => setInjuryTarget(null)}
        />
      )}
    </>
  );
}
