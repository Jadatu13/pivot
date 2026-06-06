import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Quarter } from '../types';
import { QUARTERS } from '../types';

interface Props {
  playerName: string;
  currentQuarter: Quarter;
  existingInjury?: { quarter: Quarter; description: string };
  onSave: (quarter: Quarter, description: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function InjuryModal({
  playerName,
  currentQuarter,
  existingInjury,
  onSave,
  onRemove,
  onClose,
}: Props) {
  const [quarter, setQuarter] = useState<Quarter>(existingInjury?.quarter ?? currentQuarter);
  const [description, setDescription] = useState(existingInjury?.description ?? '');

  function handleSave() {
    if (!description.trim()) return;
    onSave(quarter, description.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Log Injury</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Recording a mid-game injury for <span className="font-semibold">{playerName}</span>.
          They will be excluded from the player picker for subsequent quarters.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Quarter injured</label>
          <div className="flex gap-2">
            {QUARTERS.map((q) => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  quarter === q
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-slate-200 text-slate-600 bg-white'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. ankle, knee, shoulder..."
            autoFocus
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex gap-3">
          {existingInjury && onRemove && (
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="flex-1 border border-red-200 text-red-600 font-semibold rounded-xl py-3 transition-colors"
            >
              Remove
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!description.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            Save Injury
          </button>
        </div>
      </div>
    </div>
  );
}
