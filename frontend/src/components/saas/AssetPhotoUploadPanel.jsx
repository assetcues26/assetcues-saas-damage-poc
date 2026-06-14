import { useCallback } from 'react';
import { FileImage, ImagePlus } from 'lucide-react';
import { DropZone } from '../upload/DropZone';
import { useApp } from '../../context/AppContext';

/**
 * @param {{
 *   assetPreview: string | null,
 *   barcodePreview: string | null,
 *   onAssetFile: (file: File) => void,
 *   onBarcodeFile: (file: File) => void,
 * }} props
 */
export function AssetPhotoUploadPanel({
  assetPreview,
  barcodePreview,
  onAssetFile,
  onBarcodeFile,
}) {
  const { showToast } = useApp();

  const handleAsset = useCallback(
    (files) => {
      const file = files[0];
      if (file) onAssetFile(file);
    },
    [onAssetFile],
  );

  const handleBarcode = useCallback(
    (files) => {
      const file = files[0];
      if (file) onBarcodeFile(file);
    },
    [onBarcodeFile],
  );

  const onRejected = useCallback(
    (count) => {
      showToast(
        `${count} file${count === 1 ? '' : 's'} skipped — use JPEG, PNG, or WebP only`,
        'warning',
      );
    },
    [showToast],
  );

  return (
    <section className="flex min-h-[320px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm sm:min-h-[360px]">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <FileImage size={18} className="text-gray-600" aria-hidden />
        <h3 className="text-sm font-semibold text-gray-900">Upload from computer</h3>
      </div>

      <div className="flex flex-1 flex-col">
        <DropZone
          embedded
          inputId="saas-asset-image-upload"
          title={assetPreview ? 'Asset image added' : 'Click to upload or drag and drop'}
          subtitle="Main asset photo — JPEG, PNG, or WebP"
          browseLabel="Browse asset photo"
          onFilesSelected={handleAsset}
          onRejectedFiles={onRejected}
        />

        {assetPreview && (
          <div className="border-t border-gray-100 px-5 pb-4">
            <img
              src={assetPreview}
              alt="Asset preview"
              className="h-32 w-full rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <ImagePlus size={16} className="text-gray-500" aria-hidden />
            <p className="text-xs font-semibold text-gray-700">Barcode image (optional)</p>
          </div>
          <DropZone
            embedded
            inputId="saas-barcode-image-upload"
            title={barcodePreview ? 'Barcode image added' : 'Add barcode / tag photo'}
            subtitle="Optional — JPEG, PNG, or WebP"
            browseLabel="Browse barcode"
            onFilesSelected={handleBarcode}
            onRejectedFiles={onRejected}
          />
          {barcodePreview && (
            <img
              src={barcodePreview}
              alt="Barcode preview"
              className="mt-3 h-24 w-full rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          )}
        </div>
      </div>
    </section>
  );
}
