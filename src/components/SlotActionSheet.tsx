import { useState } from 'react';
import { UserX, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';

interface Props {
  playerName: string;
  slot: string;
  hasInjury: boolean;
  note?: string;
  onChangePlayer: () => void;
  onMarkInjury: () => void;
  onClear: () => void;
  onClose: () => void;
  onNoteChange: (note: string) => void;
}

export default function SlotActionSheet({
  playerName,
  slot,
  hasInjury,
  note,
  onChangePlayer,
  onMarkInjury,
  onClear,
  onClose,
  onNoteChange,
}: Props) {
  const [localNote, setLocalNote] = useState(note ?? '');
  const [showNote, setShowNote] = useState(!!note);

  function handleClose() {
    onNoteChange(localNote.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full bg-white rounded-t-2xl pb-8">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="px-4 pb-2 border-b border-slate-100">
          <p className="text-xs text-slate-500">{slot}</p>
          <p className="font-bold text-slate-900">{playerName}</p>
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={() => { onChangePlayer(); handleClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-slate-800 font-medium active:bg-slate-50"
          >
            <UserX size={18} className="text-slate-500" />
            Change player
          </button>

          <button
            onClick={() => { onMarkInjury(); handleClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-amber-700 font-medium active:bg-amber-50"
          >
            <AlertTriangle size={18} className="text-amber-500" />
            {hasInjury ? 'Edit injury' : 'Mark as injured'}
          </button>

          <button
            onClick={() => setShowNote((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-violet-700 font-medium active:bg-violet-50"
          >
            <MessageSquare size={18} className="text-violet-500" />
            {localNote ? 'Edit note' : 'Add note'}
            {localNote && (
              <span className="ml-auto text-xs text-slate-400 truncate max-w-[140px]">{localNote}</span>
            )}
          </button>

          {showNote && (
            <div className="px-3 pb-1">
              <input
                type="text"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                onBlur={() => onNoteChange(localNote.trim())}
                placeholder="e.g. subbed for fatigue, captain's choice…"
                autoFocus
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              {localNote && (
                <button
                  onClick={() => { setLocalNote(''); onNoteChange(''); }}
                  className="mt-1 text-xs text-slate-400 underline"
                >
                  Clear note
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => { onClear(); handleClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-red-600 font-medium active:bg-red-50"
          >
            <Trash2 size={18} className="text-red-500" />
            Remove from slot
          </button>
        </div>
      </div>
    </div>
  );
}
