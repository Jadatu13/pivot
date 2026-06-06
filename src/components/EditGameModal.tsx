import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Game } from '../types';

interface Props {
  game: Game;
  onClose: () => void;
  onSave: (date: string, opponent?: string) => void;
  onDelete: () => void;
}

export default function EditGameModal({ game, onClose, onSave, onDelete }: Props) {
  const [date, setDate] = useState(game.date);
  const [opponent, setOpponent] = useState(game.opponent ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    onSave(date, opponent.trim() || undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-2xl p-5 pb-10 space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Edit Game</h2>
          <button onClick={onClose} className="p-1 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full min-w-0 max-w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Opponent <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Herne Bay"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white font-semibold rounded-xl py-3"
          >
            Save Changes
          </button>
        </form>

        {/* Delete section */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-semibold rounded-xl py-3 text-sm"
          >
            <Trash2 size={15} />
            Delete Game
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">
              Delete this game? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold rounded-xl py-2.5 text-sm"
              >
                Cancel
          </button>
              <button
                type="button"
                onClick={() => { onDelete(); onClose(); }}
                className="flex-1 bg-red-500 text-white font-semibold rounded-xl py-2.5 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
