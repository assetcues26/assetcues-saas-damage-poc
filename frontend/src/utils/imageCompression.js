import imageCompression from 'browser-image-compression';

export const UPLOAD_MAX_TOTAL_MB = 15;
export const UPLOAD_MAX_IMAGES = 10;
/** Mobile session uploads: compress each image to this size before upload. */
export const MOBILE_MAX_FILE_KB = 500;
export const MOBILE_MAX_FILE_BYTES = MOBILE_MAX_FILE_KB * 1024;

const BYTES_PER_MB = 1024 * 1024;

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * @param {number} bytes
 */
export function bytesToMb(bytes) {
  return bytes / BYTES_PER_MB;
}

/**
 * Compresses a single image file in the browser.
 *
 * @param {File} file
 * @param {{ maxSizeMB?: number, maxWidthOrHeight?: number, useWebWorker?: boolean }} [overrides]
 * @returns {Promise<File>}
 */
export async function compressImage(file, overrides = {}) {
  const options = {
    maxSizeMB: overrides.maxSizeMB ?? 0.4,
    maxWidthOrHeight: overrides.maxWidthOrHeight ?? 1920,
    useWebWorker: overrides.useWebWorker ?? true,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    if (options.useWebWorker) {
      try {
        const compressedBlob = await imageCompression(file, {
          ...options,
          useWebWorker: false,
        });
        return new File([compressedBlob], file.name, {
          type: compressedBlob.type,
          lastModified: Date.now(),
        });
      } catch (retryError) {
        console.error('Image compression failed (no worker):', retryError);
      }
    } else {
      console.error('Image compression failed:', error);
    }

    const perFileCap = overrides.maxSizeMB ?? 0.4;
    if (file.size > perFileCap * BYTES_PER_MB) {
      throw new Error(
        `Could not compress "${file.name}". Try a smaller image or fewer photos.`,
      );
    }
    return file;
  }
}

/**
 * Mobile-only: compress each file to ≤500KB before session upload.
 * @param {File} file
 * @returns {Promise<File>}
 */
async function compressToMobileCap(file) {
  if (file.size <= MOBILE_MAX_FILE_BYTES) {
    return file;
  }

  let maxEdge = 1600;
  let maxSizeMB = MOBILE_MAX_FILE_BYTES / BYTES_PER_MB;

  for (let round = 0; round < 5; round += 1) {
    const compressed = await compressImage(file, {
      maxSizeMB,
      maxWidthOrHeight: maxEdge,
      useWebWorker: false,
    });
    if (compressed.size <= MOBILE_MAX_FILE_BYTES) {
      return compressed;
    }
    maxEdge = Math.round(maxEdge * 0.75);
    maxSizeMB = Math.max(0.08, maxSizeMB * 0.7);
  }

  throw new Error(
    `Could not compress "${file.name}" under ${MOBILE_MAX_FILE_KB}KB. Try a smaller photo.`,
  );
}

/**
 * @param {File[]} files
 * @param {number} maxTotalBytes
 * @param {number} existingBytes
 */
async function compressMobileBatch(files, maxTotalBytes, existingBytes) {
  const compressed = [];
  for (const file of files) {
    compressed.push(await compressToMobileCap(file));
  }
  const total = compressed.reduce((sum, f) => sum + f.size, 0);
  if (total + existingBytes > maxTotalBytes) {
    throw new Error(
      `Images are too large — keep total upload under ${UPLOAD_MAX_TOTAL_MB} MB (max ${UPLOAD_MAX_IMAGES} images).`,
    );
  }
  return compressed;
}

/**
 * @param {File[]} files
 * @param {number} maxTotalBytes
 * @param {number} existingBytes
 */
async function compressWithBudget(files, maxTotalBytes, existingBytes, options = {}) {
  const budget = Math.max(0, maxTotalBytes - existingBytes);
  if (budget <= 0) {
    throw new Error(
      `Total upload size cannot exceed ${UPLOAD_MAX_TOTAL_MB} MB. Remove some images first.`,
    );
  }

  const fast = options.fast ?? false;
  const perFileMb = Math.min(fast ? 1.2 : 1.5, budget / BYTES_PER_MB / Math.max(files.length, 1));
  let maxEdge = fast ? 1600 : 1920;
  const maxRounds = fast ? 2 : 6;
  const useWebWorker = !fast;

  for (let round = 0; round < maxRounds; round += 1) {
    const compressed = [];
    for (const file of files) {
      const perFileCap = Math.max(0.05, perFileMb) * BYTES_PER_MB;
      const mobileSkipBytes = 700_000;
      if (fast && file.size <= Math.min(perFileCap, mobileSkipBytes)) {
        compressed.push(file);
        continue;
      }
      compressed.push(
        await compressImage(file, {
          maxSizeMB: Math.max(0.05, perFileMb),
          maxWidthOrHeight: maxEdge,
          useWebWorker,
        }),
      );
    }

    const total = compressed.reduce((sum, f) => sum + f.size, 0);
    if (total + existingBytes <= maxTotalBytes) {
      return compressed;
    }

    maxEdge = Math.round(maxEdge * 0.75);
  }

  throw new Error(
    `Images are too large — keep total upload under ${UPLOAD_MAX_TOTAL_MB} MB (max ${UPLOAD_MAX_IMAGES} images).`,
  );
}

/**
 * Prepare files for session/API upload with per-batch size budget.
 *
 * @param {File | File[]} input
 * @param {{ maxTotalMB?: number, existingBytes?: number, mobile?: boolean }} [options]
 * @returns {Promise<File[]>}
 */
export async function prepareImagesForUpload(input, options = {}) {
  const maxTotalMB = options.maxTotalMB ?? UPLOAD_MAX_TOTAL_MB;
  const existingBytes = options.existingBytes ?? 0;
  const maxTotalBytes = maxTotalMB * BYTES_PER_MB;
  const files = Array.isArray(input) ? input : [input];

  if (!files.length) {
    throw new Error('No images provided');
  }
  if (files.length > UPLOAD_MAX_IMAGES) {
    throw new Error(`Maximum ${UPLOAD_MAX_IMAGES} images per batch`);
  }

  if (options.mobile) {
    return compressMobileBatch(files, maxTotalBytes, existingBytes);
  }

  const fast = options.fast ?? isMobileDevice();
  return compressWithBudget(files, maxTotalBytes, existingBytes, { fast });
}

/**
 * Compress a single file for mobile session upload (≤500KB).
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function prepareMobileImageForUpload(file) {
  const [prepared] = await compressMobileBatch([file], UPLOAD_MAX_TOTAL_MB * BYTES_PER_MB, 0);
  return prepared;
}

/**
 * Sum byte_size from session image list.
 * @param {Array<{ byte_size?: number | null }>} images
 */
export function sumSessionImageBytes(images) {
  return (images || []).reduce((sum, img) => sum + (img.byte_size || 0), 0);
}
