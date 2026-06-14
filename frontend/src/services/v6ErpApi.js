import { V6_ERP_ANALYZE_ENDPOINT } from '../config/api';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

/**
 * @param {Array<{ file?: File, name?: string }>} images
 * @param {object} erpContext ERP context payload
 * @param {{ locale?: string }} [options]
 */
export async function analyzeV6OnServer(images, erpContext, options = {}) {
  const formData = new FormData();
  const locale = options.locale ?? 'en-IN';

  for (const img of images) {
    if (!img.file) {
      throw new Error('Each image must include a file for upload');
    }
    const filename = img.name || img.file.name || 'image.jpg';
    formData.append('images', img.file, filename);
  }
  formData.append('demo_context', JSON.stringify(erpContext));
  formData.append('locale', locale);

  const response = await fetch(V6_ERP_ANALYZE_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  let body = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    const text = await response.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text || response.statusText };
    }
  }

  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }

  if (body?.status && body.status !== 'success') {
    throw new Error(body.message || `Analysis status: ${body.status}`);
  }

  return body;
}
