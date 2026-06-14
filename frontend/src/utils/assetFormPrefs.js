const PREFS_KEY = 'saas_asset_form_prefs';

/**
 * @returns {{ companyid?: string, company?: string, assetclassid?: string, assetclassname?: string, categoryid?: string, categoryname?: string }}
 */
export function loadAssetFormPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, string>} values
 */
export function saveAssetFormPrefs(values) {
  const prefs = {
    companyid: values.companyid,
    company: values.company,
    assetclassid: values.assetclassid,
    assetclassname: values.assetclassname,
    categoryid: values.categoryid,
    categoryname: values.categoryname,
  };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * @param {Record<string, string>} values
 */
export function applyAssetFormPrefs(values) {
  const prefs = loadAssetFormPrefs();
  const next = { ...values };
  if (prefs.companyid && prefs.company) {
    next.companyid = prefs.companyid;
    next.company = prefs.company;
  }
  if (prefs.assetclassid && prefs.assetclassname) {
    next.assetclassid = prefs.assetclassid;
    next.assetclassname = prefs.assetclassname;
  }
  if (prefs.categoryid && prefs.categoryname) {
    next.categoryid = prefs.categoryid;
    next.categoryname = prefs.categoryname;
  }
  return next;
}
