import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';
import { forkBlobUrl } from '../utils/blobUrls';
import {
  extractUploadedImagesFromApi,
  mapAnalysisResponse,
} from '../utils/mapAnalysisResponse';
import { analyzeAssetsOnServer, resolveAnalysisEndpoint } from './assetAnalysisApi';
import { compressImage } from '../utils/imageCompression';

/**
 * @param {Array<{ id: string, file?: File, previewUrl: string, name?: string }>} images
 * @param {{ processingMode?: import('../constants/uploadMode').UploadProcessingMode, locale?: string, marketRegion?: string }} [options]
 * @returns {Promise<object>}
 */
export async function analyzeImages(images, options = {}) {
  if (!images?.length) {
    throw new Error('No images provided for analysis');
  }

  const processingMode = options.processingMode ?? UPLOAD_PROCESSING_MODES.DIRECT;
  const apiRoute = resolveAnalysisEndpoint(processingMode);

  const withFiles = images.filter((img) => img.file instanceof File);
  if (withFiles.length !== images.length) {
    throw new Error(
      `${images.length - withFiles.length} image(s) are missing file data — re-add from capture or upload`,
    );
  }

  const compressedFiles = await Promise.all(
    withFiles.map(async (img) => ({
      ...img,
      file: await compressImage(img.file),
    }))
  );

  const apiResponse = await analyzeAssetsOnServer(compressedFiles, processingMode, {
    locale: options.locale,
    marketRegion: options.marketRegion,
  });

  let fallbackPreviewUrls = [];
  if (extractUploadedImagesFromApi(apiResponse).length === 0) {
    fallbackPreviewUrls = await Promise.all(
      images.map((img) => forkBlobUrl(img.previewUrl)),
    );
  }

  const entry = mapAnalysisResponse(apiResponse, {
    fallbackPreviewUrls,
    processingMode,
    apiRoute,
  });

  return {
    ...entry,
    id: apiResponse.entry_id || apiResponse.request_id || entry.request_id,
    saved_to_db: Boolean(apiResponse.saved_to_db),
  };
}
