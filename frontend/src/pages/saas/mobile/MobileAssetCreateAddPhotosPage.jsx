import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileCreateStepHeader } from '../../../components/saas/mobile/MobileCreateStepHeader';
import {
  MobilePhotoActionCard,
  MobilePhotoPreviewGrid,
} from '../../../components/saas/mobile/MobilePhotoActions';
import { SessionExpiryCountdown } from '../../../components/saas/SessionExpiryCountdown';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import { MOBILE_STEP_PHOTOS, SESSION_MODE_FULL_MOBILE } from '../../../components/saas/assetFormConfig';
import { mobileCreateRoutes } from '../../../utils/mobileCreateRoutes';

export function MobileAssetCreateAddPhotosPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const routes = mobileCreateRoutes(token, SESSION_MODE_FULL_MOBILE);
  const { session, loading, error, canUse, complete, uploading, expiresAt } =
    useAssetCreateSession(token);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const assetName = session?.draft_json?.assetname;
  const detailsSaved = session?.draft_json?._mobile_step === MOBILE_STEP_PHOTOS;
  const hasPhotos = Boolean(session?.asset_image_url || session?.barcode_image_url);

  const createAsset = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      await complete({});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileAssetPageLayout title="Add photos">
        <div className="flex flex-1 items-center justify-center py-24 text-gray-600">Loading…</div>
      </MobileAssetPageLayout>
    );
  }

  if (error || !canUse) {
    return (
      <MobileAssetPageLayout title="Add photos">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">Link unavailable</p>
          <p className="max-w-sm text-sm text-gray-600">
            {error || 'This create-asset link has expired or was already used.'}
          </p>
        </div>
      </MobileAssetPageLayout>
    );
  }

  if (!detailsSaved) {
    navigate(routes.details, { replace: true });
    return null;
  }

  const busy = submitting || uploading;

  return (
    <MobileAssetPageLayout
      title="Add photos"
      onBack={() => navigate(routes.details)}
      backLabel="Edit details"
      wrapperClassName="flex flex-1 flex-col gap-6 py-6 pb-10"
    >
      <MobileBrandHeader
        title="Add photos"
        subtitle={
          assetName
            ? `Details saved for ${assetName}. Photos are optional.`
            : 'Your details are saved. Photos are optional.'
        }
      />

      <MobileCreateStepHeader step={2} label="Capture or upload photos (optional)" />
      <SessionExpiryCountdown expiresAt={expiresAt} />

      <MobilePhotoPreviewGrid
        assetUrl={session?.asset_image_url}
        barcodeUrl={session?.barcode_image_url}
      />

      <div className="grid gap-4">
        <MobilePhotoActionCard
          icon="camera"
          title="Capture with camera"
          description="Take a photo of the asset and optional barcode tag."
          onClick={() => navigate(routes.capture)}
          disabled={busy}
        />
        <MobilePhotoActionCard
          icon="upload"
          title="Upload from gallery"
          description="Choose existing photos from your phone."
          onClick={() => navigate(routes.upload)}
          disabled={busy}
        />
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="mt-auto grid gap-3">
        <Button className="w-full shadow-lg" disabled={busy} onClick={createAsset}>
          {busy ? 'Creating…' : hasPhotos ? 'Create asset' : 'Skip photos & create asset'}
        </Button>
        {hasPhotos && (
          <p className="text-center text-xs text-gray-500">
            AI validation starts automatically when photos are included.
          </p>
        )}
      </div>
    </MobileAssetPageLayout>
  );
}
