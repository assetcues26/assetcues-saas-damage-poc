const DRAFT_KEY = 'saas_create_wizard_draft';

/**
 * @returns {{ values: Record<string, string>, step: number, updatedAt: string } | null}
 */
export function loadWizardDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.values) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, string>} values
 * @param {number} step
 */
export function saveWizardDraft(values, step) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        values,
        step,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function clearWizardDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
