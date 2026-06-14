import { Search } from 'lucide-react';

export function HistorySearch({ value, onChange }) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, tag, or label…"
        className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-base text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:py-3 sm:text-sm"
        aria-label="Search asset history"
      />
    </div>
  );
}
