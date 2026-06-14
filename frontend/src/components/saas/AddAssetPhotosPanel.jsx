import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssetPhotoUploadPanel } from './AssetPhotoUploadPanel';
import { uploadSaasAssetImages } from '../../services/saasAssetsApi';
import { useApp } from '../../context/AppContext';

/**
 * Upload photos to an existing asset (e.g. metadata-only / pending registration).
 *
 * @param {{
 *   assetId: string,
 *   assetName?: string,
 *   onComplete?: () => void | Promise<void>,
 *   onAnalyzing?: () => void,
 * }} props
 */
export function AddAssetPhotosPanel({ assetId, assetName, onComplete, onAnalyzing }) {
  const { showToast } = useApp();
  const [assetFile, setAssetFile] = useState(null);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [assetPreview, setAssetPreview] = useState(null);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetFile) {
      setAssetPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(assetFile);
    setAssetPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [assetFile]);

  useEffect(() => {
    if (!barcodeFile) {
      setBarcodePreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(barcodeFile);
    setBarcodePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [barcodeFile]);

  const handleUpload = async () => {
    if (!assetFile) {
      setError('Asset photo is required');
      return;
    }
    setUploading(true);
    setError(null);
    onAnalyzing?.();
    try {
      await uploadSaasAssetImages(assetId, {
        assetImage: assetFile,
        barcodeImage: barcodeFile || undefined,
      });
      showToast(
        `Photos saved for ${assetName || 'asset'} — AI analysis started`,
        'success',
      );
      setAssetFile(null);
      setBarcodeFile(null);
      await onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      await onComplete?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase text-amber-800">Add photos</h2>
      <p className="mt-1 text-sm text-amber-900/80">
        This asset was registered without images. Upload a main asset photo to run AI validation.
      </p>

      <div className="mt-4">
        <AssetPhotoUploadPanel
          assetPreview={assetPreview}
          barcodePreview={barcodePreview}
          onAssetFile={setAssetFile}
          onBarcodeFile={setBarcodeFile}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={uploading || !assetFile} onClick={handleUpload}>
          {uploading ? 'Uploading…' : 'Upload & run AI'}
        </Button>
        <p className="text-xs text-amber-800/70">Barcode photo is optional.</p>
      </div>
    </section>
  );
}
