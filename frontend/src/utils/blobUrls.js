/**
 * Clone a blob: URL so it survives batch cleanup (revokeObjectURL).
 */
export async function forkBlobUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to copy image for report');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** Merged panorama first, then uploaded frames (no duplicates). */
export function buildResultGallery(entry) {
  const uploads = [...(entry?.previewUrls || [])];
  const merged = entry?.mergedImageUrl;
  if (!merged) return uploads;
  return [merged, ...uploads.filter((url) => url !== merged)];
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Convert blob/http image URLs to a compact JPEG data URL for localStorage.
 */
export async function blobUrlToDataUrl(url, { maxWidth = 960, quality = 0.72 } = {}) {
  if (!url) return url;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http') && !url.startsWith('blob:')) return url;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to read image');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxWidth / (img.naturalWidth || img.width || maxWidth));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Persist scan images so history survives page reload. */
export async function persistEntryImages(entry) {
  const mergedImageUrl = entry.mergedImageUrl
    ? await blobUrlToDataUrl(entry.mergedImageUrl)
    : entry.mergedImageUrl;

  const previewUrls = entry.previewUrls?.length
    ? await Promise.all(entry.previewUrls.map((url) => blobUrlToDataUrl(url)))
    : entry.previewUrls || [];

  return { ...entry, mergedImageUrl, previewUrls };
}
