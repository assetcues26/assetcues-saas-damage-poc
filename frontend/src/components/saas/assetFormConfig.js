export const SESSION_MODE_IMAGES_ONLY = 'images_only';
export const SESSION_MODE_FULL_MOBILE = 'full_mobile';
export const MOBILE_STEP_DETAILS = 'details';
export const MOBILE_STEP_PHOTOS = 'photos';

export const WIZARD_STEPS = [
  {
    id: 'identity',
    title: 'Identity',
    fields: ['assetid', 'assetname', 'description', 'tagnumber', 'assetnumber'],
  },
  {
    id: 'classification',
    title: 'Classification',
    fields: ['assetclassid', 'categoryid', 'subcategoryid', 'makemodelid'],
  },
  {
    id: 'financial',
    title: 'Financial',
    fields: ['cost', 'acquisitiondate', 'companyid', 'customerid', 'assettaggingdetailid'],
  },
  {
    id: 'photos',
    title: 'Photos',
    fields: [],
  },
  {
    id: 'review',
    title: 'Review',
    fields: [],
  },
];

export const LOOKUP_FIELD_MAP = {
  assetclassid: { type: 'assetclass', idKey: 'assetclassid', nameKey: 'assetclassname' },
  categoryid: { type: 'category', idKey: 'categoryid', nameKey: 'categoryname', parentKey: 'assetclassid' },
  subcategoryid: { type: 'subcategory', idKey: 'subcategoryid', nameKey: 'subcategoryname', parentKey: 'categoryid' },
  makemodelid: { type: 'makemodel', idKey: 'makemodelid', nameKey: 'makemodelname', parentKey: 'subcategoryid' },
  companyid: { type: 'company', idKey: 'companyid', nameKey: 'company' },
};

export const ASSET_FORM_FIELDS = [
  { key: 'assetid', label: 'Asset ID', hint: 'Auto-assigned', autoAssign: true },
  { key: 'assetname', label: 'Asset name', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'tagnumber', label: 'Tag number', required: true },
  { key: 'assetnumber', label: 'Asset number', required: true, autoAssign: true },
  { key: 'assetclassid', label: 'Asset class ID', optional: true },
  { key: 'assetclassname', label: 'Asset class name', required: true },
  { key: 'categoryid', label: 'Category ID', optional: true },
  { key: 'categoryname', label: 'Category name', optional: true },
  { key: 'subcategoryid', label: 'Subcategory ID', optional: true },
  { key: 'subcategoryname', label: 'Subcategory name', optional: true },
  { key: 'makemodelid', label: 'Make/model ID', required: true },
  { key: 'makemodelname', label: 'Make/model name', required: true },
  { key: 'companyid', label: 'Company ID', required: true },
  { key: 'company', label: 'Company', required: true },
  { key: 'customerid', label: 'Customer ID', required: true, hint: 'Defaults to company ID' },
  { key: 'assettaggingdetailid', label: 'Asset tagging detail ID', optional: true },
  { key: 'cost', label: 'Cost (INR)', type: 'number', required: true },
  { key: 'acquisitiondate', label: 'Acquisition date (DD-MM-YYYY)', required: true, placeholder: '15-08-2023' },
];

export const EMPTY_ASSET_FORM = Object.fromEntries(
  ASSET_FORM_FIELDS.map((f) => [f.key, '']),
);

const DRAFT_INTERNAL_KEYS = new Set(['_session_mode', '_existing_asset_id', '_mobile_step']);

/**
 * Strip session metadata and keep only non-empty form fields from a QR draft.
 * @param {Record<string, unknown> | null | undefined} draft
 */
export function draftJsonToFormValues(draft) {
  if (!draft || typeof draft !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(draft)) {
    if (DRAFT_INTERNAL_KEYS.has(key)) continue;
    if (!(key in EMPTY_ASSET_FORM)) continue;
    if (value == null || String(value).trim() === '') continue;
    out[key] = String(value);
  }
  return out;
}

/**
 * Merge QR draft into form state without wiping in-progress mobile edits.
 * @param {Record<string, string>} prev
 * @param {Record<string, unknown> | null | undefined} draft
 */
export function mergeFormWithDraft(prev, draft) {
  const fromDraft = draftJsonToFormValues(draft);
  if (Object.keys(fromDraft).length === 0) return prev;
  const next = { ...prev };
  for (const [key, value] of Object.entries(fromDraft)) {
    if (!String(next[key] || '').trim()) {
      next[key] = value;
    }
  }
  return next;
}

/**
 * @param {Record<string, string>} values
 * @param {{ idKey: string, nameKey: string }} lookup
 */
export function isLookupFieldSatisfied(values, lookup) {
  return Boolean(
    String(values[lookup.idKey] || '').trim() || String(values[lookup.nameKey] || '').trim(),
  );
}

/**
 * @param {Record<string, string>} values
 * @param {string} key
 */
export function isRequiredFieldSatisfied(values, key) {
  const field = ASSET_FORM_FIELDS.find((f) => f.key === key);
  if (!field?.required) return true;

  const lookup = LOOKUP_FIELD_MAP[key];
  if (lookup) {
    const nameField = ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey);
    if (nameField?.required) return isLookupFieldSatisfied(values, lookup);
    return true;
  }

  const nameLookup = Object.values(LOOKUP_FIELD_MAP).find((item) => item.nameKey === key);
  if (nameLookup) return isLookupFieldSatisfied(values, nameLookup);

  return Boolean(String(values[key] || '').trim());
}

/**
 * @param {Record<string, string>} values
 * @param {number} stepIndex
 */
export function validateWizardStep(values, stepIndex) {
  const step = WIZARD_STEPS[stepIndex];
  if (!step || step.id === 'photos' || step.id === 'review') return null;
  for (const key of step.fields) {
    const lookup = LOOKUP_FIELD_MAP[key];
    if (lookup) {
      const nameField = ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey);
      if (nameField?.required && !isLookupFieldSatisfied(values, lookup)) {
        return `${nameField.label} is required`;
      }
      continue;
    }
    const field = ASSET_FORM_FIELDS.find((f) => f.key === key);
    if (field?.required && !String(values[field.key] || '').trim()) {
      return `${field.label} is required`;
    }
  }
  if (step.id === 'financial') {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(String(values.acquisitiondate || '').trim())) {
      return 'Acquisition date must be DD-MM-YYYY';
    }
    if (Number(values.cost) <= 0) {
      return 'Cost must be a positive number';
    }
  }
  return null;
}

/**
 * @param {Record<string, string>} values
 */
export function validateAssetForm(values) {
  for (const field of ASSET_FORM_FIELDS) {
    if (!field.required) continue;
    if (LOOKUP_FIELD_MAP[field.key]) continue;
    if (Object.values(LOOKUP_FIELD_MAP).some((lookup) => lookup.nameKey === field.key)) {
      const lookup = Object.values(LOOKUP_FIELD_MAP).find((item) => item.nameKey === field.key);
      if (lookup && !isLookupFieldSatisfied(values, lookup)) {
        return `${field.label} is required`;
      }
      continue;
    }
    if (!String(values[field.key] || '').trim()) {
      return `${field.label} is required`;
    }
  }
  if (!/^\d{2}-\d{2}-\d{4}$/.test(String(values.acquisitiondate || '').trim())) {
    return 'Acquisition date must be DD-MM-YYYY';
  }
  if (Number(values.cost) <= 0) {
    return 'Cost must be a positive number';
  }
  return null;
}

/**
 * @param {Record<string, string>} values
 */
export function assetFormToPayload(values) {
  const payload = { ...values };
  Object.keys(payload).forEach((key) => {
    if (key.startsWith('_')) delete payload[key];
  });
  if (!payload.assetid?.trim()) delete payload.assetid;
  ASSET_FORM_FIELDS.filter((f) => f.optional).forEach((f) => {
    if (!payload[f.key]?.trim()) delete payload[f.key];
  });
  return payload;
}

/**
 * @param {Record<string, string>} values
 * @param {'images_only' | 'full_mobile'} mode
 */
export function buildSessionDraft(values, mode) {
  return {
    ...assetFormToPayload(values),
    _session_mode: mode,
  };
}

/**
 * Apply lookup dropdown selection in one patch (avoids React batching dropping id/name pairs).
 * @param {string} idKey
 * @param {string} nameKey
 * @param {string} id
 * @param {string} label
 * @param {Record<string, string>} [currentValues]
 */
export function buildLookupChangePatch(idKey, nameKey, id, label, currentValues = {}) {
  const patch = { [idKey]: id, [nameKey]: label };

  if (idKey === 'companyid' && id && !String(currentValues.customerid || '').trim()) {
    patch.customerid = id;
  }

  if (idKey === 'assetclassid') {
    Object.assign(patch, {
      categoryid: '',
      categoryname: '',
      subcategoryid: '',
      subcategoryname: '',
      makemodelid: '',
      makemodelname: '',
    });
  } else if (idKey === 'categoryid') {
    Object.assign(patch, {
      subcategoryid: '',
      subcategoryname: '',
      makemodelid: '',
      makemodelname: '',
    });
  } else if (idKey === 'subcategoryid') {
    Object.assign(patch, {
      makemodelid: '',
      makemodelname: '',
    });
  }

  return patch;
}

/**
 * @param {Record<string, string>} values
 * @param {'images_only' | 'full_mobile'} mode
 * @param {string} mobileStep
 */
export function buildMobileSessionDraft(values, mode, mobileStep) {
  return {
    ...buildSessionDraft(values, mode),
    _mobile_step: mobileStep,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} draft
 */
export function getSessionMode(draft) {
  if (draft?._session_mode === SESSION_MODE_IMAGES_ONLY) return SESSION_MODE_IMAGES_ONLY;
  if (draft?._session_mode === SESSION_MODE_FULL_MOBILE) return SESSION_MODE_FULL_MOBILE;
  return SESSION_MODE_FULL_MOBILE;
}
