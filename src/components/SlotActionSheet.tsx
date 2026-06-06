import { UserX, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  playerName: string;
  slot: string;
  hasInjury: boolean;
  onChangePlayer: () => void;
  onMarkInjury: () => void;
  onClear: () => void;
  onClose: () => void;
}

export default function SlotActionSheet({
  playerName,
  slot,
  hasInjury,
  onChangePlayer,
  onMarkInjury,
  onClear,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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
            onClick={() => { onChangePlayer(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-slate-800 font-medium active:bg-slate-50"
          >
            <UserX size={18} className="text-slate-500" />
            Change player
          </button>

          <button
            onClick={() => { onMarkInjury(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-amber-700 font-medium active:bg-amber-50"
          >
            <AlertTriangle size={18} className="text-amber-500" />
            {hasInjury ? 'Edit injury' : 'Mark as injured'}
          </button>

          <button
            onClick={() => { onClear(); onClose(); }}
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
