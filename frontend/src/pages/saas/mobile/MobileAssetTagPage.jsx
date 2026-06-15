import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../../components/ui/Spinner';
import { AiStatusBadge } from '../../../components/saas/AiStatusBadge';
import { AssetFormFields } from '../../../components/saas/AssetFormFields';
import { MobilePhotoPreviewGrid } from '../../../components/saas/mobile/MobilePhotoActions';
import {
  EMPTY_ASSET_FORM,
  assetFormToPayload,
  validateAssetForm,
  getAssetFormFieldKeys,
} from '../../../components/saas/assetFormConfig';
import {
  fetchSaasAsset,
  updateSaasAsset,
  uploadSaasAssetImages,
} from '../../../services/saasAssetsApi';
import { useApp } from '../../../context/AppContext';
import { useSaasAssets } from '../../../context/SaasAssetsContext';
import { enqueueAssetAnalysis } from '../../../utils/analysisQueue';
import { isAiAnalysisEnabled } from '../../../utils/saasAiSettings';

export function MobileAssetTagPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { refreshAll, markAssetAnalyzing } = useSaasAssets();
  const [asset, setAsset] = useState(null);
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [assetFile, setAssetFile] = useState(null);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [assetPreview, setAssetPreview] = useState(null);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const assetCaptureRef = useRef(null);
  const assetUploadRef = useRef(null);
  const barcodeCaptureRef = useRef(null);
  const barcodeUploadRef = useRef(null);

  useEffect(() => {
    fetchSaasAsset(id)
      .then((d) => {
        const a = d.asset || {};
        setAsset(a);
        setValues((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(prev).map((k) => [k, a[k] != null ? String(a[k]) : '']),
          ),
        }));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load asset');
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const displayAssetUrl = assetPreview || asset?.asset_image_url;
  const displayBarcodeUrl = barcodePreview || asset?.barcode_image_url;
  const hasAssetImage = Boolean(assetFile || asset?.asset_image_url);

  const pickFile = (file, kind) => {
    if (!file) return;
    if (kind === 'asset') setAssetFile(file);
    else setBarcodeFile(file);
    setError(null);
  };

  const handleSave = async () => {
    const validationError = validateAssetForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!hasAssetImage) {
      setError('Asset photo is required — capture or upload one below');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateSaasAsset(id, assetFormToPayload(values), { reanalyze: false });

      if (assetFile || barcodeFile) {
        await uploadSaasAssetImages(
          id,
          {
            assetImage: assetFile || undefined,
            barcodeImage: barcodeFile || undefined,
          },
          { reanalyze: false },
        );
      }

      const runAi = isAiAnalysisEnabled() && hasAssetImage;
      if (runAi) {
        markAssetAnalyzing(id);
        enqueueAssetAnalysis(id).catch(() => {});
        showToast('Saved — AI analysis started', 'success');
      } else {
        showToast('Asset saved', 'success');
      }

      await refreshAll({ silent: true });
      navigate(`/assets/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!asset) {
    return <p className="p-6 text-gray-600">{error || 'Asset not found.'}</p>;
  }

  return (
    <div className="p-3 pb-24 sm:p-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
        <ArrowLeft size={16} className="mr-1" />
        All assets
      </Button>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">{asset.assetname || 'Unnamed asset'}</h1>
        <AiStatusBadge status={asset.ai_status} />
      </div>
      <p className="mb-6 text-sm text-gray-500">
        {asset.assetid}
        {asset.tagnumber ? ` · Tag ${asset.tagnumber}` : ''}
      </p>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-gray-500">Photos</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add or replace photos, then save to run AI validation.
        </p>

        <div className="mt-4">
          <MobilePhotoPreviewGrid assetUrl={displayAssetUrl} barcodeUrl={displayBarcodeUrl} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <PhotoActionButton
            icon={Camera}
            label="Capture asset"
            onClick={() => assetCaptureRef.current?.click()}
            disabled={saving}
          />
          <PhotoActionButton
            icon={ImagePlus}
            label="Upload asset"
            onClick={() => assetUploadRef.current?.click()}
            disabled={saving}
          />
          <PhotoActionButton
            icon={Camera}
            label="Capture barcode"
            variant="outline"
            onClick={() => barcodeCaptureRef.current?.click()}
            disabled={saving}
          />
          <PhotoActionButton
            icon={ImagePlus}
            label="Upload barcode"
            variant="outline"
            onClick={() => barcodeUploadRef.current?.click()}
            disabled={saving}
          />
        </div>

        <input
          ref={assetCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0], 'asset')}
        />
        <input
          ref={assetUploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0], 'asset')}
        />
        <input
          ref={barcodeCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0], 'barcode')}
        />
        <input
          ref={barcodeUploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0], 'barcode')}
        />
      </section>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Asset details</h2>
        <AssetFormFields
          values={values}
          onChange={(key, val) => setValues((p) => ({ ...p, [key]: val }))}
          onPatch={(patch) => setValues((p) => ({ ...p, ...patch }))}
          compact
          hideAssetId
          fieldKeys={getAssetFormFieldKeys()}
        />
      </section>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        className="min-h-12 w-full text-base"
        disabled={saving || !hasAssetImage}
        onClick={handleSave}
      >
        {saving ? 'Saving…' : isAiAnalysisEnabled() ? 'Save & run AI' : 'Save asset'}
      </Button>
      {!hasAssetImage && (
        <p className="mt-2 text-center text-xs text-gray-500">Asset photo required before saving</p>
      )}
    </div>
  );
}

function PhotoActionButton({ icon: Icon, label, onClick, disabled, variant = 'default' }) {
  return (
    <Button
      variant={variant}
      className="min-h-11 w-full justify-start gap-2"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={18} />
      {label}
    </Button>
  );
}
