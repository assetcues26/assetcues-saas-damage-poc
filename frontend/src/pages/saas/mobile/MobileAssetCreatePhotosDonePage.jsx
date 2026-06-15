import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Monitor, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import { uploadSaasAssetImages } from '../../../services/saasAssetsApi';
import { enqueueAssetAnalysis } from '../../../utils/analysisQueue';
import { isAiAnalysisEnabled } from '../../../utils/saasAiSettings';
import { useSaasAssets } from '../../../context/SaasAssetsContext';

export function MobileAssetCreatePhotosDonePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session } = useAssetCreateSession(token);
  const { markAssetAnalyzing, refreshAll } = useSaasAssets();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const existingAssetId = session?.draft_json?._existing_asset_id;
  const isExistingAsset = Boolean(existingAssetId);
  const hasAssetPhoto = Boolean(session?.asset_image_url);

  const handleSaveAndAnalyze = async () => {
    if (!existingAssetId || !token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await uploadSaasAssetImages(
        String(existingAssetId),
        {},
        { sessionToken: token, reanalyze: false },
      );
      if (isAiAnalysisEnabled()) {
        markAssetAnalyzing(String(existingAssetId));
        await enqueueAssetAnalysis(String(existingAssetId));
      }
      await refreshAll({ silent: true });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <MobileAssetPageLayout
        title="Analysis started"
        wrapperClassName="flex flex-col items-center py-12 text-center"
      >
        <MobileBrandHeader className="mb-6" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Saved &amp; analyzing</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
          Photos are saved and AI validation is running. Open the asset to see results.
        </p>
        <Button
          className="mt-6 min-h-12 w-full max-w-sm"
          onClick={() => navigate(`/assets/${existingAssetId}`)}
        >
          View asset
        </Button>
      </MobileAssetPageLayout>
    );
  }

  return (
    <MobileAssetPageLayout
      title="Photos sent"
      onBack={() => navigate(`/assets/create/mobile/${token}/photos`)}
      wrapperClassName="flex flex-col items-center py-12 text-center"
    >
      <MobileBrandHeader className="mb-6" />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Photos ready</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
        {isExistingAsset
          ? 'Your photos are synced. Save from your phone to attach them and start AI validation.'
          : 'Your asset and barcode images are synced to the create form on your computer.'}
      </p>

      {isExistingAsset && hasAssetPhoto ? (
        <div className="mt-6 w-full max-w-sm space-y-3">
          <Button
            className="min-h-12 w-full gap-2 text-base"
            disabled={saving}
            onClick={handleSaveAndAnalyze}
          >
            <Sparkles size={18} />
            {saving
              ? 'Saving…'
              : isAiAnalysisEnabled()
                ? 'Save & run AI'
                : 'Save photos'}
          </Button>
          {saveError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Monitor size={18} className="shrink-0" />
            <span>
              Or go to your computer and click <strong>Upload &amp; run AI</strong>.
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Monitor size={18} />
          <span>
            {isExistingAsset ? (
              <>
                Add an asset photo, then tap <strong>Save &amp; run AI</strong> or finish on your
                computer.
              </>
            ) : (
              <>
                Go back to your computer and click <strong>Create Asset</strong>.
              </>
            )}
          </span>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">Session {token?.slice(0, 8)}…</p>
    </MobileAssetPageLayout>
  );
}
