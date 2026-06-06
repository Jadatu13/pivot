import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { useAppStore, selectSortedPlayers } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Player, Position } from '../types';
import { POSITIONS, POSITION_LABELS } from '../types';

type EditingPlayer = Omit<Player, 'id'> & { id?: string };

function emptyPlayer(): EditingPlayer {
  return { name: '', preferredPositions: [], activeInjury: undefined };
}

interface PlayerFormProps {
  initial: EditingPlayer;
  onSave: (p: EditingPlayer) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function PlayerForm({ initial, onSave, onCancel, onDelete }: PlayerFormProps) {
  const [form, setForm] = useState<EditingPlayer>(initial);

  function togglePosition(pos: Position) {
    setForm((f) => ({
      ...f,
      preferredPositions: f.preferredPositions.includes(pos)
        ? f.preferredPositions.filter((p) => p !== pos)
        : [...f.preferredPositions, pos],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {initial.name ? 'Edit Player' : 'Add Player'}
          </h2>
          <button onClick={onCancel} className="p-1 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Player name"
            autoFocus
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Preferred positions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Preferred positions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {POSITIONS.map((pos) => {
              const selected = form.preferredPositions.includes(pos);
              return (
                <button
                  key={pos}
                  onClick={() => togglePosition(pos)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    selected
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
          {form.preferredPositions.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {form.preferredPositions.map((p) => POSITION_LABELS[p]).join(', ')}
            </p>
          )}
        </div>

        {/* Pre-game injury */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pre-game injury <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.activeInjury ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, activeInjury: e.target.value || undefined }))
            }
            placeholder="e.g. sore knee — cleared to play"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-3 border border-red-200 text-red-500 rounded-xl"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => form.name.trim() && onSave(form)}
            disabled={!form.name.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2"
          >
            <Check size={17} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RosterPage() {
  const players = useAppStore(useShallow(selectSortedPlayers));
  const addPlayer = useAppStore((s) => s.addPlayer);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const deletePlayer = useAppStore((s) => s.deletePlayer);

  const [editing, setEditing] = useState<EditingPlayer | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-violet-600 pt-safe px-4 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between pt-3">
          <h1 className="text-white font-bold text-xl">Roster</h1>
          <button
            onClick={() => setEditing(emptyPlayer())}
            className="flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-full"
          >
            <Plus size={15} />
            Add player
          </button>
        </div>
        <p className="text-violet-100 text-sm mt-1">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-2">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Plus size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">Add your players to get started</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-900 truncate">{player.name}</p>
                  {player.activeInjury && (
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                  )}
                </div>
                {player.preferredPositions.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {player.preferredPositions.map((pos) => (
                      <span
                        key={pos}
                        className="text-xs bg-violet-50 text-violet-700 font-semibold px-1.5 py-0.5 rounded"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">No preferred positions set</p>
                )}
                {player.activeInjury && (
                  <p className="text-xs text-amber-600 mt-0.5 truncate">⚠️ {player.activeInjury}</p>
                )}
              </div>

              {/* Edit */}
              <button
                onClick={() =>
                  setEditing({
                    id: player.id,
                    name: player.name,
                    preferredPositions: [...player.preferredPositions],
                    activeInjury: player.activeInjury,
                  })
                }
                className="p-2 text-slate-400 flex-shrink-0"
              >
                <Pencil size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit / add form */}
      {editing && (
        <PlayerForm
          initial={editing}
          onSave={(p) => {
            if (editing.id) {
              updatePlayer(editing.id, {
                name: p.name,
                preferredPositions: p.preferredPositions,
                activeInjury: p.activeInjury,
              });
            } else {
              addPlayer({
                name: p.name,
                preferredPositions: p.preferredPositions,
                activeInjury: p.activeInjury,
              });
            }
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onDelete={
            editing.id
              ? () => {
                  deletePlayer(editing.id!);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
