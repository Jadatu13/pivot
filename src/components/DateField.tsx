interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

/** Native date picker (tap → OS calendar/wheel). The overflow that plagued
 *  Brave/Chrome is handled by the input[type=date] rules in index.css. */
export default function DateField({ value, onChange }: Props) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
    />
  );
}
