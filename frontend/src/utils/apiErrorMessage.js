/**
 * Turn FastAPI / generic API error bodies into a single user-facing string.
 * @param {unknown} body
 * @param {number} [status]
 */
export function formatApiErrorMessage(body, status) {
  if (!body) {
    return status ? `Analysis request failed (${status})` : 'Analysis request failed';
  }

  if (typeof body === 'string') return body;

  const detail = body.detail ?? body.message ?? body.error;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
          const msg = item.msg || item.message || '';
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .filter(Boolean)
      .join(' ');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  if (body.message && typeof body.message === 'string') return body.message;

  return status ? `Analysis request failed (${status})` : 'Analysis request failed';
}
