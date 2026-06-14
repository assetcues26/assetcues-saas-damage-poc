const STORAGE_KEY = 'saas_ai_settings';

const DEFAULTS = {
  aiAnalysisEnabled: true,
};

/**
 * @returns {{ aiAnalysisEnabled: boolean }}
 */
export function loadSaasAiSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * @param {{ aiAnalysisEnabled?: boolean }} patch
 */
export function saveSaasAiSettings(patch) {
  const next = { ...loadSaasAiSettings(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function isAiAnalysisEnabled() {
  return loadSaasAiSettings().aiAnalysisEnabled !== false;
}
