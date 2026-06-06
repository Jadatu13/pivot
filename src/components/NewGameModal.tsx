import { useState } from 'react';
import { X } from 'lucide-react';
import DateField from './DateField';

interface Props {
  onClose: () => void;
  onCreate: (date: string, opponent?: string) => void;
}

export default function NewGameModal({ onClose, onCreate }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [opponent, setOpponent] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    onCreate(date, opponent.trim() || undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">New Game</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <DateField value={date} onChange={setDate} />
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
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            Create Game
          </button>
        </form>
      </div>
    </div>
  );
}
