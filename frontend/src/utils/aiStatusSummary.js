import { CHECK_LABELS, PERCENT_KEYS } from './aiValidationLabels';

export function getFailedChecks(summary) {
  if (!summary?.checks) return [];
  return Object.entries(summary.checks).filter(([, passed]) => !passed);
}

export function getCheckReason(key, summary) {
  const comp = summary?.field_comparison?.[key];
  if (comp && (comp.registered != null || comp.detected != null)) {
    const registered = comp.registered ?? '—';
    const detected = comp.detected ?? '—';
    return `Registered: ${registered} · Detected: ${detected}`;
  }
  if (key === 'costmatch') {
    return summary?.costvalidation?.reasoning || null;
  }
  if (key === 'datematch') {
    return summary?.acquisitiondatevalidation?.reasoning || null;
  }
  return null;
}

/**
 * Build inline AI status lines for dashboard / detail views.
 * @param {object | null | undefined} summary
 * @param {string} status
 */
export function buildAiStatusLines(summary, status) {
  if (!summary) return [];

  const lines = [];
  const normalized = status || 'pending';

  if (normalized === 'fail') {
    for (const [key] of getFailedChecks(summary)) {
      lines.push({
        type: 'check',
        key,
        label: CHECK_LABELS[key] || key,
        reason: getCheckReason(key, summary),
        confidence: summary[PERCENT_KEYS[key]],
      });
    }
    if (summary.reasoning) {
      lines.push({
        type: 'reasoning',
        label: 'Overall reasoning',
        reason: summary.reasoning,
      });
    }
    return lines;
  }

  if (normalized === 'pass') {
    if (summary.reasoning) {
      lines.push({
        type: 'reasoning',
        label: 'Reasoning',
        reason: summary.reasoning,
      });
    }
    const passedChecks = Object.entries(summary.checks || {}).filter(([, ok]) => ok);
    for (const [key] of passedChecks) {
      const reason = getCheckReason(key, summary);
      if (reason) {
        lines.push({
          type: 'check',
          key,
          label: CHECK_LABELS[key] || key,
          reason,
          confidence: summary[PERCENT_KEYS[key]],
          passed: true,
        });
      }
    }
  }

  if (normalized === 'error' && summary.error) {
    lines.push({ type: 'error', label: 'Error', reason: String(summary.error) });
  }

  return lines;
}
