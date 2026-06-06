import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import type { GameTip } from '../utils/suggestions';

interface Props {
  tips: GameTip[];
}

const ICONS = {
  warning: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />,
  rotation: <RefreshCw size={14} className="text-violet-500 flex-shrink-0 mt-0.5" />,
  info: <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />,
};

const TEXT_COLOURS = {
  warning: 'text-amber-700',
  rotation: 'text-violet-700',
  info: 'text-blue-600',
};

export default function SmartSuggestions({ tips }: Props) {
  const [open, setOpen] = useState(true);

  if (tips.length === 0) return null;

  const warnings = tips.filter((t) => t.type === 'warning').length;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Smart Tips</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            warnings > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {tips.length}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-2 space-y-2 pb-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              {ICONS[tip.type]}
              <span className={`text-sm ${TEXT_COLOURS[tip.type]}`}>{tip.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
