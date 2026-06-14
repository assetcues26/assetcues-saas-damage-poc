export const UPLOAD_AUTO_RETRY_ATTEMPTS = 3;
export const UPLOAD_RETRY_DELAYS_MS = [1000, 2000, 4000];

/**
 * @param {unknown} err
 */
export function isRetryableUploadError(err) {
  if (!err || typeof err !== 'object') return false;
  if (err.name === 'TypeError' || err.name === 'AbortError') return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('network error') ||
    msg.includes('timed out') ||
    msg.includes('failed to fetch') ||
    msg.includes('cannot reach the api') ||
    msg.includes('load failed')
  );
}

/**
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @param {{ maxAttempts?: number, delays?: number[] }} [options]
 * @returns {Promise<T>}
 */
export async function withUploadRetries(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? UPLOAD_AUTO_RETRY_ATTEMPTS;
  const delays = options.delays ?? UPLOAD_RETRY_DELAYS_MS;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isRetryableUploadError(err) || attempt >= maxAttempts - 1) {
        throw err;
      }
      await sleep(delays[attempt] ?? delays[delays.length - 1]);
    }
  }

  throw lastError;
}
