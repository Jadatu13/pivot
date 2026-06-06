interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const selectClass =
  'w-full min-w-0 border border-slate-300 rounded-xl px-3 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500';

function daysInMonth(year: number, month: number) {
  // month is 1-12; day 0 of the next month = last day of this month
  return new Date(year, month, 0).getDate();
}

export default function DateField({ value, onChange }: Props) {
  const parts = value.split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = parts[1] || 1;
  const d = parts[2] || 1;

  const thisYear = new Date().getFullYear();
  const yearSet = new Set<number>();
  for (let yr = thisYear - 1; yr <= thisYear + 2; yr++) yearSet.add(yr);
  yearSet.add(y); // always include the stored year
  const years = [...yearSet].sort((a, b) => a - b);

  const days = Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1);

  function emit(ny: number, nm: number, nd: number) {
    const clampedD = Math.min(nd, daysInMonth(ny, nm));
    onChange(
      `${ny}-${String(nm).padStart(2, '0')}-${String(clampedD).padStart(2, '0')}`
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={d} onChange={(e) => emit(y, m, Number(e.target.value))} className={selectClass}>
        {days.map((dd) => (
          <option key={dd} value={dd}>{dd}</option>
        ))}
      </select>
      <select value={m} onChange={(e) => emit(y, Number(e.target.value), d)} className={selectClass}>
        {MONTHS.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </select>
      <select value={y} onChange={(e) => emit(Number(e.target.value), m, d)} className={selectClass}>
        {years.map((yr) => (
          <option key={yr} value={yr}>{yr}</option>
        ))}
      </select>
    </div>
  );
}
