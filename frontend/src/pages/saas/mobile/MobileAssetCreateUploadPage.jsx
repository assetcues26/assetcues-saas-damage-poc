import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { MobilePhotoPreviewGrid } from '../../../components/saas/mobile/MobilePhotoActions';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import { mobileCreateRoutes, resolveMobileCreateMode } from '../../../utils/mobileCreateRoutes';

export function MobileAssetCreateUploadPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, uploadImage, uploading, error } = useAssetCreateSession(token);
  const assetRef = useRef(null);
  const barcodeRef = useRef(null);

  const mode = resolveMobileCreateMode(session?.draft_json);
  const routes = mobileCreateRoutes(token, mode);

  const pickAsset = () => assetRef.current?.click();
  const pickBarcode = () => barcodeRef.current?.click();

  return (
    <MobileAssetPageLayout
      title="Upload photos"
      onBack={() => navigate(routes.photos)}
      wrapperClassName="flex flex-1 flex-col gap-5 py-6 pb-10"
    >
      <MobileBrandHeader
        title="Upload photos"
        subtitle="Choose photos from your gallery. Asset and barcode images are both optional."
        className="mb-2"
      />

      <MobilePhotoPreviewGrid
        assetUrl={session?.asset_image_url}
        barcodeUrl={session?.barcode_image_url}
      />

      <div className="grid gap-3">
        <Button
          className="min-h-12 w-full text-base"
          onClick={pickAsset}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Choose asset photo'}
        </Button>
        <input
          ref={assetRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => uploadImage('assetimage', e.target.files?.[0])}
        />

        <Button
          variant="outline"
          className="min-h-12 w-full text-base"
          onClick={pickBarcode}
          disabled={uploading}
        >
          Choose barcode photo
        </Button>
        <input
          ref={barcodeRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => uploadImage('barcodeimage', e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button className="mt-auto min-h-12 w-full" onClick={() => navigate(routes.photos)}>
        Done — back to photos
      </Button>
    </MobileAssetPageLayout>
  );
}
