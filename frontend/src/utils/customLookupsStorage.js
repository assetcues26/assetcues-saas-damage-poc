const STORAGE_KEY = 'saas_custom_lookups';

/**
 * @returns {Record<string, Array<{ id: string, name: string, label?: string }>>}
 */
export function loadAllCustomLookups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} type
 */
export function loadCustomLookups(type) {
  return (loadAllCustomLookups()[type] || []).map((item) => ({
    id: String(item.id),
    name: item.name || item.label || '',
    label: item.label || item.name || '',
  }));
}

/**
 * @param {string} type
 * @param {{ id: string, label: string }} item
 */
export function saveCustomLookup(type, item) {
  if (!type || !item?.id || !item?.label) return;
  const all = loadAllCustomLookups();
  const list = all[type] || [];
  const exists = list.some((entry) => entry.id === item.id);
  if (!exists) {
    list.push({ id: item.id, name: item.label, label: item.label });
  }
  all[type] = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
}
