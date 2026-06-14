const STITCH_DELAY_MS = 800;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for stitching'));
    img.src = url;
  });
}

/**
 * Mock OpenCV-style panorama stitch: merges batch images into one horizontal composite.
 * Swap this file for a real image-model / OpenCV endpoint.
 * @param {Array<{ previewUrl: string }>} images
 * @returns {Promise<string>} object URL of merged panorama image
 */
export async function stitchBatchImages(images) {
  if (!images?.length) {
    throw new Error('No images provided for stitching');
  }

  await delay(STITCH_DELAY_MS);

  if (images.length === 1) {
    return images[0].previewUrl;
  }

  try {
    const elements = await Promise.all(images.map((img) => loadImageElement(img.previewUrl)));
    const targetHeight = Math.max(...elements.map((el) => el.naturalHeight || el.height || 240));
    const scaledWidths = elements.map((el) => {
      const h = el.naturalHeight || el.height || 1;
      const w = el.naturalWidth || el.width || 1;
      return Math.round((w / h) * targetHeight);
    });
    const totalWidth = scaledWidths.reduce((sum, w) => sum + w, 0);

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return images[0].previewUrl;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, totalWidth, targetHeight);

    let offsetX = 0;
    elements.forEach((el, index) => {
      const drawWidth = scaledWidths[index];
      ctx.drawImage(el, offsetX, 0, drawWidth, targetHeight);
      offsetX += drawWidth;
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(images[0].previewUrl);
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        'image/jpeg',
        0.92,
      );
    });
  } catch {
    return images[0].previewUrl;
  }
}
