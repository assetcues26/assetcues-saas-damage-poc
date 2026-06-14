import { useEffect, useState } from 'react';
import { fetchLookups } from '../../services/saasAssetsApi';
import { getFallbackLookups } from '../../data/saasLookupsFallback';

function normalizeItem(item) {
  return {
    id: String(item.id ?? ''),
    label: String(item.label || item.name || ''),
  };
}

/**
 * Native &lt;select&gt; for master-data lookups (no custom dropdown popup).
 *
 * @param {{
 *   type: string,
 *   parentId?: string,
 *   value: string,
 *   label?: string,
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
  onChange,
  placeholder = 'Select…',
  required = false,
  disabled = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const id = e.target.value;
    if (!id) {
      onChange('', '');
      return;
    }
    const match = items.find((i) => i.id === id);
    onChange(id, match?.label || '');
  };

  const needsParent = ['category', 'subcategory', 'makemodel'].includes(type);
  const blocked = needsParent && !parentId;

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || loading || blocked}
      required={required}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      aria-label={placeholder}
    >
      <option value="">
        {loading ? 'Loading…' : blocked ? 'Select previous field first' : placeholder}
      </option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
