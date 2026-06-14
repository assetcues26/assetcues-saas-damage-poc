import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssetPhotoUploadPanel } from './AssetPhotoUploadPanel';
import { AssetCreateQrPanel } from './AssetCreateQrPanel';
import { uploadSaasAssetImages } from '../../services/saasAssetsApi';
import { useApp } from '../../context/AppContext';
import { SESSION_MODE_IMAGES_ONLY } from './assetFormConfig';

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
  const [sessionAssetUrl, setSessionAssetUrl] = useState(null);
  const [sessionBarcodeUrl, setSessionBarcodeUrl] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const sessionDraft = useMemo(
    () => ({
      _session_mode: SESSION_MODE_IMAGES_ONLY,
      _existing_asset_id: assetId,
    }),
    [assetId],
  );

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

  const handleAssetFile = (file) => {
    setAssetFile(file);
    setSessionAssetUrl(null);
  };

  const handleBarcodeFile = (file) => {
    setBarcodeFile(file);
    setSessionBarcodeUrl(null);
  };

  const onSessionImages = useCallback(
    (session) => {
      if (session.session_token) {
        setSessionToken(session.session_token);
      }
      if (session.asset_image_url) {
        setSessionAssetUrl(session.asset_image_url);
        setAssetFile(null);
        setAssetPreview(null);
      }
      if (session.barcode_image_url) {
        setSessionBarcodeUrl(session.barcode_image_url);
        setBarcodeFile(null);
        setBarcodePreview(null);
      }
    },
    [],
  );

  const hasAssetImage = Boolean(assetFile || sessionAssetUrl);
  const useSessionUpload = Boolean(sessionToken && sessionAssetUrl && !assetFile);
  const displayAssetPreview = assetPreview || sessionAssetUrl;
  const displayBarcodePreview = barcodePreview || sessionBarcodeUrl;

  const handleUpload = async () => {
    if (!hasAssetImage) {
      setError('Asset photo is required — upload from computer or scan the QR code on your phone');
      return;
    }
    setUploading(true);
    setError(null);
    onAnalyzing?.();
    try {
      if (useSessionUpload) {
        await uploadSaasAssetImages(
          assetId,
          {},
          { sessionToken },
        );
      } else {
        await uploadSaasAssetImages(assetId, {
          assetImage: assetFile || undefined,
          barcodeImage: barcodeFile || undefined,
        });
      }
      showToast(
        `Photos saved for ${assetName || 'asset'} — AI analysis started`,
        'success',
      );
      setAssetFile(null);
      setBarcodeFile(null);
      setSessionAssetUrl(null);
      setSessionBarcodeUrl(null);
      setSessionToken(null);
      await onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase text-amber-800">Add photos</h2>
      <p className="mt-1 text-sm text-amber-900/80">
        This asset was registered without images. Upload from your computer or scan the QR code
        with your phone, then run AI validation.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <AssetPhotoUploadPanel
          assetPreview={displayAssetPreview}
          barcodePreview={displayBarcodePreview}
          onAssetFile={handleAssetFile}
          onBarcodeFile={handleBarcodeFile}
        />
        <AssetCreateQrPanel
          mode="images_only"
          draftJson={sessionDraft}
          autoStart
          onSessionImages={onSessionImages}
          onSessionStarted={setSessionToken}
          title="Upload from mobile"
          description="Scan the QR code to capture or upload asset and barcode photos from your phone. Images sync here automatically."
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={uploading || !hasAssetImage} onClick={handleUpload}>
          {uploading ? 'Uploading…' : 'Upload & run AI'}
        </Button>
        <p className="text-xs text-amber-800/70">
          Asset photo required · barcode optional · computer or mobile
        </p>
      </div>
    </section>
  );
}
