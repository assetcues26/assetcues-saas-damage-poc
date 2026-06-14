const STORAGE_KEY = 'saas_activity_toast_seen_v1';
const MAX_SEEN = 200;

/** Event types that trigger a desktop toast (skip noisy intermediate events). */
export const TOASTABLE_ACTIVITY_EVENTS = new Set(['analysis_complete', 'asset_created']);

export function loadSeenActivityToastIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

export function saveSeenActivityToastIds(ids) {
  try {
    const list = [...ids].slice(-MAX_SEEN);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

export function shouldToastActivityEvent(event) {
  if (!event?.id) return false;
  return TOASTABLE_ACTIVITY_EVENTS.has(event.event_type);
}
