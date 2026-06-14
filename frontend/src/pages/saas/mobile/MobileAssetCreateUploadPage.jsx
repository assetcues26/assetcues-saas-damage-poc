import { useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';

export function MobileAssetCreateUploadPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isPhotosFlow = location.pathname.includes('/photos/');
  const { session, uploadImage, uploading, error } = useAssetCreateSession(token);
  const assetRef = useRef(null);
  const barcodeRef = useRef(null);

  const hasAsset = Boolean(session?.asset_image_url);
  const backPath = isPhotosFlow
    ? `/assets/create/mobile/${token}/photos`
    : `/assets/create/mobile/${token}`;
  const donePath = isPhotosFlow
    ? `/assets/create/mobile/${token}/photos/done`
    : `/assets/create/mobile/${token}`;

  return (
    <MobileAssetPageLayout
      title="Upload"
      onBack={() => navigate(backPath)}
      wrapperClassName="flex flex-1 flex-col gap-4 py-6"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">Asset image</p>
        <Button className="mt-2 w-full" onClick={() => assetRef.current?.click()} disabled={uploading}>
          Choose asset photo
        </Button>
        <input
          ref={assetRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => uploadImage('assetimage', e.target.files?.[0])}
        />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">Barcode image (optional)</p>
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => barcodeRef.current?.click()}
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
      {session?.asset_image_url && (
        <img src={session.asset_image_url} alt="Asset" className="h-36 rounded-xl border object-cover" />
      )}
      {session?.barcode_image_url && (
        <img src={session.barcode_image_url} alt="Barcode" className="h-24 rounded-xl border object-cover" />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hasAsset && (
        <Button onClick={() => navigate(donePath)} className="mt-auto">
          {isPhotosFlow ? 'Done — sync to computer' : 'Back to form'}
        </Button>
      )}
    </MobileAssetPageLayout>
  );
}
