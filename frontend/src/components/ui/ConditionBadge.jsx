import { AlertTriangle, CheckCircle2, MinusCircle, Star } from 'lucide-react';
import { resolveConditionLabel } from '../../utils/formatters';

const config = {
  Excellent: {
    icon: Star,
    className: 'bg-green-500/15 text-green-600 border-green-500/40',
  },
  Good: {
    icon: CheckCircle2,
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  },
  Fair: {
    icon: MinusCircle,
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  },
  Poor: {
    icon: AlertTriangle,
    className: 'bg-red-500/15 text-red-400 border-red-500/40',
  },
};

export function ConditionBadge({ condition, overallScore }) {
  const normalized = resolveConditionLabel(condition, overallScore);
  if (!normalized) return null;
  const { icon: Icon, className } = config[normalized];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      <Icon size={14} aria-hidden />
      {normalized}
    </span>
  );
}
