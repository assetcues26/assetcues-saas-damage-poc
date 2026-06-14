import { ChevronDown } from 'lucide-react';
import { humanizeRepairField } from '../../utils/humanizeLabels';

const HIGHLIGHT_VARIANTS = {
  default: 'border-gray-200/90 bg-white',
  primary: 'border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50',
  success: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white',
  warning: 'border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white',
  muted: 'border-slate-200/90 bg-slate-50/60',
};

/**
 * Grouped report section with icon header.
 */
export function ResultPanel({ icon: Icon, title, subtitle, children, className = '' }) {
  if (!children) return null;
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-5 py-4">
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-sm"
            aria-hidden
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm leading-snug text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** KPI-style metric for the summary strip. */
export function HighlightMetric({ label, value, hint, variant = 'default', mono = false }) {
  const boxClass = HIGHLIGHT_VARIANTS[variant] || HIGHLIGHT_VARIANTS.default;
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${boxClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`mt-1.5 text-lg font-bold leading-tight text-gray-900 sm:text-xl ${
          mono ? 'font-mono text-base sm:text-lg' : ''
        }`}
      >
        {value || '—'}
      </p>
      {hint && <p className="mt-1 text-xs leading-snug text-gray-500">{hint}</p>}
    </div>
  );
}

/** Large currency highlight for valuation. */
export function MoneyHighlight({ label, sublabel, value, variant = 'primary' }) {
  const boxClass = HIGHLIGHT_VARIANTS[variant] || HIGHLIGHT_VARIANTS.primary;
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${boxClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>}
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{value}</p>
    </div>
  );
}

export function InfoGrid({ items }) {
  const visible = (items || []).filter(([, v]) => v != null && v !== '' && v !== '—');
  if (!visible.length) return null;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {visible.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
          <dd className="mt-1 text-sm font-medium leading-relaxed text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InfoRow({ label, value }) {
  if (value == null || value === '' || value === '—') return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="min-w-0 break-words text-sm leading-relaxed text-gray-800 sm:max-w-[70%] sm:text-right">
        {value}
      </span>
    </div>
  );
}

export function ProseBlock({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={`break-words text-sm leading-relaxed text-gray-700 ${className}`}>{children}</p>
  );
}

export function CollapsiblePanel({ icon: Icon, title, subtitle, children, defaultOpen = false }) {
  if (!children) return null;
  return (
    <details
      className="group overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 border-b border-transparent bg-gradient-to-r from-gray-50/90 to-white px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <ChevronDown
          size={20}
          className="mt-2 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-gray-100 p-5">{children}</div>
    </details>
  );
}

const SEVERITY_STYLES = {
  minor: 'border-l-amber-400 bg-amber-50/40',
  moderate: 'border-l-orange-500 bg-orange-50/30',
  severe: 'border-l-red-500 bg-red-50/40',
  unknown: 'border-l-gray-300 bg-gray-50/60',
};

export function DamageCard({ item, index }) {
  const sev = (item.severity || 'unknown').toLowerCase();
  const borderClass = SEVERITY_STYLES[sev] || SEVERITY_STYLES.unknown;
  return (
    <li
      className={`rounded-r-xl border border-l-4 border-gray-200/80 p-4 text-sm ${borderClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">
          {item.type || 'Damage'}
          {item.location ? ` · ${item.location}` : ''}
        </p>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-700 shadow-sm">
          {item.severity || 'unknown'}
        </span>
      </div>
      {item.detail && <p className="mt-2 text-gray-600">{item.detail}</p>}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        {item.repair_needed && (
          <span>Repair: {humanizeRepairField(item.repair_needed, 'repair_needed')}</span>
        )}
        {item.repair_urgency && (
          <span>Urgency: {humanizeRepairField(item.repair_urgency, 'repair_urgency')}</span>
        )}
        {item.affects_function != null && (
          <span>Affects function: {item.affects_function ? 'Yes' : 'No'}</span>
        )}
      </div>
    </li>
  );
}
