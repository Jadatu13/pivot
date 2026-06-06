import { useState } from 'react';
import { Plus, Star, AlertTriangle } from 'lucide-react';
import type { Game, Player, Quarter, SlotKey } from '../types';
import { ALL_SLOTS, POSITION_LABELS, POSITIONS, POSITION_ZONE } from '../types';
import { getMidGameInjuredIds } from '../utils/suggestions';
import PlayerPickerModal from './PlayerPickerModal';
import SlotActionSheet from './SlotActionSheet';
import InjuryModal from './InjuryModal';

interface Props {
  game: Game;
  quarter: Quarter;
  players: Player[];
  onAssign: (slot: SlotKey, playerId: string | undefined) => void;
  onAddInjury: (quarter: Quarter, playerId: string, description: string) => void;
  onRemoveInjury: (playerId: string) => void;
}

const ZONE_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  attack: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  mid: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  defence: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  sub: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export default function QuarterBoard({ game, quarter, players, onAssign, onAddInjury, onRemoveInjury }: Props) {
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [actionSlot, setActionSlot] = useState<SlotKey | null>(null);
  const [injuryForPlayer, setInjuryForPlayer] = useState<{ playerId: string; name: string } | null>(null);

  const lineup = game.quarters[quarter];
  const injuredIds = getMidGameInjuredIds(game, quarter);
  const playerById = Object.fromEntries(players.map((p) => [p.id, p]));

  function handleSlotTap(slot: SlotKey) {
    const pid = lineup[slot];
    if (pid) {
      setActionSlot(slot);
    } else {
      setPickerSlot(slot);
    }
  }

  const actionPlayer = actionSlot ? playerById[lineup[actionSlot] ?? ''] : null;

  return (
    <>
      <div className="space-y-1.5 px-4 py-2">
        {ALL_SLOTS.map((slot) => {
          const pid = lineup[slot];
          const player = pid ? playerById[pid] : null;
          const isPosition = slot !== 'Sub';
          const zone = isPosition ? POSITION_ZONE[slot as typeof POSITIONS[number]] : 'sub';
          const colours = ZONE_COLOURS[zone];
          const isPreferred = player && isPosition
            ? player.preferredPositions.includes(slot as typeof POSITIONS[number])
            : false;
          const isInjured = player ? injuredIds.has(player.id) : false;
          const injury = player ? game.midGameInjuries.find((i) => i.playerId === player.id) : null;
          const hasPreGameInjury = player?.activeInjury;

          return (
            <button
              key={slot}
              onClick={() => handleSlotTap(slot)}
              className="w-full flex items-center gap-3 rounded-xl border bg-white px-3 py-3 text-left transition-colors active:bg-slate-50"
            >
              {/* Position badge */}
              <div className={`w-11 flex-shrink-0 text-center py-1 rounded-lg border text-xs font-bold ${colours.bg} ${colours.text} ${colours.border}`}>
                {slot}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                {player ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold truncate ${isInjured ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {player.name}
                    </span>
                    {isPreferred && !isInjured && (
                      <Star size={12} className="text-violet-500 flex-shrink-0" fill="currentColor" />
                    )}
                    {isInjured && injury && (
                      <span className="ml-1 text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        🩹 Q{injury.quarter}
                      </span>
                    )}
                    {!isInjured && hasPreGameInjury && (
                      <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">
                    {isPosition ? POSITION_LABELS[slot as typeof POSITIONS[number]] : 'Substitute'}
                  </span>
                )}
              </div>

              {/* Right indicator */}
              {player ? (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                </div>
              ) : (
                <Plus size={16} className="text-slate-300 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Player picker */}
      {pickerSlot && (
        <PlayerPickerModal
          players={players}
          game={game}
          quarter={quarter}
          slot={pickerSlot}
          currentPlayerId={lineup[pickerSlot]}
          onSelect={(pid) => onAssign(pickerSlot, pid)}
          onClose={() => setPickerSlot(null)}
        />
      )}

      {/* Action sheet for assigned slot */}
      {actionSlot && actionPlayer && (
        <SlotActionSheet
          playerName={actionPlayer.name}
          slot={actionSlot}
          hasInjury={injuredIds.has(actionPlayer.id)}
          onChangePlayer={() => setPickerSlot(actionSlot)}
          onMarkInjury={() => setInjuryForPlayer({ playerId: actionPlayer.id, name: actionPlayer.name })}
          onClear={() => onAssign(actionSlot, undefined)}
          onClose={() => setActionSlot(null)}
        />
      )}

      {/* Injury modal */}
      {injuryForPlayer && (
        <InjuryModal
          playerName={injuryForPlayer.name}
          currentQuarter={quarter}
          existingInjury={
            game.midGameInjuries.find((i) => i.playerId === injuryForPlayer.playerId)
              ? {
                  quarter: game.midGameInjuries.find((i) => i.playerId === injuryForPlayer.playerId)!.quarter,
                  description: game.midGameInjuries.find((i) => i.playerId === injuryForPlayer.playerId)!.description,
                }
              : undefined
          }
          onSave={(q, desc) => onAddInjury(q, injuryForPlayer.playerId, desc)}
          onRemove={() => onRemoveInjury(injuryForPlayer.playerId)}
          onClose={() => setInjuryForPlayer(null)}
        />
      )}
    </>
  );
}
