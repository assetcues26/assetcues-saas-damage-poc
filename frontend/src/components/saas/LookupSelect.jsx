import { useEffect, useMemo, useState } from 'react';
import { fetchLookups } from '../../services/saasAssetsApi';
import { getFallbackLookups } from '../../data/saasLookupsFallback';
import {
  buildCustomLookupId,
  CUSTOM_LOOKUP_VALUE,
  isCustomLookupId,
} from '../../utils/lookupCustom';

function normalizeItem(item) {
  return {
    id: String(item.id ?? ''),
    label: String(item.label || item.name || ''),
  };
}

/**
 * Native &lt;select&gt; for master-data lookups with create-custom support.
 *
 * @param {{
 *   type: string,
 *   parentId?: string,
 *   value: string,
 *   selectedLabel?: string,
 *   onChange: (id: string, label: string) => void,
 *   placeholder?: string,
 *   required?: boolean,
 *   disabled?: boolean,
 * }} props
 */
export function LookupSelect({
  type,
  parentId,
  value,
  selectedLabel = '',
  label,
  onChange,
  placeholder = 'Select…',
  required = false,
  disabled = false,
}) {
  const resolvedLabel = selectedLabel || label || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLookups(type, parentId)
      .then((body) => {
        if (cancelled) return;
        const list = (body.items || []).map(normalizeItem).filter((i) => i.id && i.label);
        setItems(list.length > 0 ? list : getFallbackLookups(type, parentId));
      })
      .catch(() => {
        if (!cancelled) setItems(getFallbackLookups(type, parentId));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, parentId]);

  const displayItems = useMemo(() => {
    const list = [...items];
    if (value && isCustomLookupId(value) && !list.some((i) => i.id === value)) {
      list.push({ id: value, label: resolvedLabel || 'Custom value' });
    }
    return list;
  }, [items, value, resolvedLabel]);

  const handleChange = (e) => {
    const id = e.target.value;
    if (id === CUSTOM_LOOKUP_VALUE) {
      setShowCustom(true);
      setCustomText(resolvedLabel || '');
      return;
    }
    setShowCustom(false);
    setCustomText('');
    if (!id) {
      onChange('', '');
      return;
    }
    const match = displayItems.find((i) => i.id === id);
    onChange(id, match?.label || '');
  };

  const applyCustom = () => {
    const label = customText.trim();
    if (!label) return;
    const id = buildCustomLookupId(label);
    onChange(id, label);
    setShowCustom(false);
    setCustomText('');
  };

  const needsParent = ['category', 'subcategory', 'makemodel'].includes(type);
  const blocked = needsParent && !parentId;

  return (
    <div className="space-y-2">
      <select
        value={showCustom ? CUSTOM_LOOKUP_VALUE : value || ''}
        onChange={handleChange}
        disabled={disabled || loading || blocked}
        required={required && !showCustom}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        aria-label={placeholder}
      >
        <option value="">
          {loading ? 'Loading…' : blocked ? 'Select previous field first' : placeholder}
        </option>
        {displayItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
        {!blocked && (
          <option value={CUSTOM_LOOKUP_VALUE}>+ Create custom…</option>
        )}
      </select>

      {showCustom && (
        <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom name"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCustom();
              }
            }}
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customText.trim()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add custom
          </button>
        </div>
      )}
    </div>
  );
}
