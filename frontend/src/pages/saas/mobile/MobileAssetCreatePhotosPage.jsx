import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';

export function MobileAssetCreatePhotosPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, loading, error, canUse } = useAssetCreateSession(token);

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
            {error || 'This photo session has expired or was already used.'}
          </p>
        </div>
      </MobileAssetPageLayout>
    );
  }

  const hasAsset = Boolean(session?.asset_image_url);
  const hasBarcode = Boolean(session?.barcode_image_url);
  const base = `/assets/create/mobile/${token}/photos`;

  return (
    <MobileAssetPageLayout title="Add photos" wrapperClassName="flex flex-1 flex-col py-8">
      <MobileBrandHeader
        title="Add asset photos"
        subtitle="Capture or upload the asset image and optional barcode. Photos sync to your computer automatically."
      />

      {(hasAsset || hasBarcode) && (
        <div className="mx-auto mt-6 grid w-full max-w-md gap-3">
          {hasAsset && (
            <img
              src={session.asset_image_url}
              alt="Asset"
              className="h-36 w-full rounded-xl border object-cover shadow-sm"
            />
          )}
          {hasBarcode && (
            <img
              src={session.barcode_image_url}
              alt="Barcode"
              className="h-24 w-full rounded-xl border object-cover shadow-sm"
            />
          )}
        </div>
      )}

      <div className="mx-auto mt-8 grid w-full max-w-md gap-4">
        <Card
          hover
          onClick={() => navigate(`${base}/capture`)}
          className="touch-manipulation p-5 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Camera size={24} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Capture photos</h2>
          <p className="mt-1 text-sm text-gray-600">Use your camera for asset and barcode images.</p>
        </Card>

        <Card
          hover
          onClick={() => navigate(`${base}/upload`)}
          className="touch-manipulation p-5 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Upload size={24} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Upload photos</h2>
          <p className="mt-1 text-sm text-gray-600">Choose images from your gallery.</p>
        </Card>

        {hasAsset && (
          <Card
            hover
            onClick={() => navigate(`${base}/done`)}
            className="touch-manipulation border-green-200 bg-green-50 p-5"
          >
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 size={20} />
              <h2 className="text-lg font-bold">Photos ready</h2>
            </div>
            <p className="mt-1 text-sm text-green-800">
              Return to your computer and click Save to create the asset.
            </p>
          </Card>
        )}
      </div>
    </MobileAssetPageLayout>
  );
}
