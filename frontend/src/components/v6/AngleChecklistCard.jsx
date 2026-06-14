import { useState } from 'react';
import { Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { getAngleChecklist } from '../../v6/angleChecklists';

/**
 * Soft photo-angle guidance — local ticks only, not sent to API.
 * @param {{
 *   category?: string,
 *   subcategory?: string,
 *   theme?: 'light' | 'dark',
 *   compact?: boolean,
 *   defaultCollapsed?: boolean,
 * }} props
 */
export function AngleChecklistCard({
  category,
  subcategory,
  theme = 'light',
  compact = false,
  defaultCollapsed = false,
}) {
  const angles = getAngleChecklist({ category, subcategory });
  const [checked, setChecked] = useState(() => new Set());
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDark = theme === 'dark';
  const shell = isDark
    ? 'border-gray-700 bg-gray-900/80 text-gray-100'
    : 'border-gray-200 bg-white/90 text-gray-900';
  const hint = isDark ? 'text-gray-400' : 'text-gray-500';
  const itemIdle = isDark
    ? 'border-gray-700 hover:border-gray-600'
    : 'border-gray-100 hover:border-gray-200';

  const header = (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mb-3'}`}>
      <Camera size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
      <h3 className="text-sm font-semibold">Recommended shots</h3>
      <span className={`ml-auto text-xs ${hint}`}>
        {checked.size}/{angles.length}
      </span>
      {defaultCollapsed && (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`rounded p-0.5 ${hint}`}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand recommended shots' : 'Collapse recommended shots'}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <section className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} ${shell}`}>
        <button
          type="button"
          className="flex w-full items-center gap-2 text-left"
          onClick={() => setCollapsed(false)}
        >
          {header}
        </button>
        <p className={`mt-1 text-xs ${hint}`}>Optional — tap to review shot angles</p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} ${shell}`}>
      {header}
      {!compact && (
        <p className={`mb-3 text-xs ${hint}`}>
          Optional checklist — tick angles as you capture. Analysis is not blocked if you skip any.
        </p>
      )}
      <ul
        className={
          compact
            ? 'grid grid-cols-1 gap-1.5 sm:grid-cols-2'
            : 'space-y-2'
        }
      >
        {angles.map((angle) => {
          const done = checked.has(angle.id);
          return (
            <li key={angle.id}>
              <button
                type="button"
                onClick={() => toggle(angle.id)}
                className={`flex w-full items-center gap-2 rounded-lg border text-left transition ${
                  compact ? 'px-2 py-1.5' : 'items-start gap-3 px-3 py-2'
                } ${itemIdle} ${
                  done
                    ? isDark
                      ? 'border-emerald-700/60 bg-emerald-950/40'
                      : 'border-emerald-200 bg-emerald-50/80'
                    : ''
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    compact ? 'h-4 w-4' : 'mt-0.5 h-5 w-5 text-xs'
                  } ${
                    done
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isDark
                        ? 'border-gray-600 text-transparent'
                        : 'border-gray-300 text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className={`block font-medium ${compact ? 'text-xs leading-tight' : 'text-sm'}`}>
                    {angle.label}
                  </span>
                  {!compact && (
                    <span className={`block text-xs ${hint}`}>{angle.hint}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
