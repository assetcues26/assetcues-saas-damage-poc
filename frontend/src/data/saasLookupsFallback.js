import raw from './saas_lookups.json';

const PARENT_KEY = {
  category: 'assetclassid',
  subcategory: 'categoryid',
  makemodel: 'subcategoryid',
};

function withLabels(items) {
  return (items || []).map((item) => ({
    ...item,
    label: item.label || item.name || '',
  }));
}

export const SAAS_LOOKUPS = Object.fromEntries(
  Object.entries(raw).map(([key, items]) => [key, withLabels(items)]),
);

/**
 * @param {string} type
 * @param {string} [parentId]
 */
export function getFallbackLookups(type, parentId) {
  let items = SAAS_LOOKUPS[type] || [];
  const parentKey = PARENT_KEY[type];
  if (parentId && parentKey) {
    items = items.filter((i) => i[parentKey] === parentId);
  }
  return items;
}
