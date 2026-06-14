/** Client-side fallback when /saas/lookups API is unavailable. Mirrors backend saas_lookups.json. */
export const SAAS_LOOKUPS = {
  assetclass: [
    { id: 'IT', label: 'IT Equipment' },
    { id: 'HVAC', label: 'HVAC' },
    { id: 'OFF', label: 'Office Equipment' },
    { id: 'VEH', label: 'Vehicles' },
  ],
  category: [
    { id: 'cat-laptop', label: 'Laptops', assetclassid: 'IT' },
    { id: 'cat-hvac', label: 'HVAC', assetclassid: 'HVAC' },
    { id: 'cat-printer', label: 'Printers', assetclassid: 'OFF' },
    { id: 'cat-ac', label: 'Air Conditioning', assetclassid: 'HVAC' },
  ],
  subcategory: [
    { id: 'sub-laptop', label: 'Business Laptop', categoryid: 'cat-laptop' },
    { id: 'sub-split-ac', label: 'Split AC', categoryid: 'cat-ac' },
    { id: 'sub-laser', label: 'Laser Printer', categoryid: 'cat-printer' },
  ],
  makemodel: [
    { id: 'mm-dell-lat', label: 'Dell Latitude', subcategoryid: 'sub-laptop' },
    { id: 'mm-hp-lj', label: 'HP LaserJet M208dw', subcategoryid: 'sub-laser' },
    { id: 'mm-mmx-ac', label: 'Micromax Split AC', subcategoryid: 'sub-split-ac' },
  ],
  company: [
    { id: '1000', label: 'Tech Co India Pvt Ltd' },
    { id: '2000', label: 'Global Manufacturing Ltd' },
    { id: '3000', label: 'AssetCues Demo Corp' },
  ],
};

const PARENT_KEY = {
  category: 'assetclassid',
  subcategory: 'categoryid',
  makemodel: 'subcategoryid',
};

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
