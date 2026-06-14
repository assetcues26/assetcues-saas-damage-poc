import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Monitor } from 'lucide-react';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';

export function MobileAssetCreatePhotosDonePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session } = useAssetCreateSession(token);
  const isExistingAsset = Boolean(session?.draft_json?._existing_asset_id);

  return (
    <MobileAssetPageLayout
      title="Photos sent"
      onBack={() => navigate(`/assets/create/mobile/${token}/photos`)}
      wrapperClassName="flex flex-col items-center py-12 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Photos sent</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
        {isExistingAsset
          ? 'Your asset and barcode images are synced to the asset page on your computer.'
          : 'Your asset and barcode images are synced to the create form on your computer.'}
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Monitor size={18} />
        <span>
          {isExistingAsset ? (
            <>
              Go back to your computer and click <strong>Upload &amp; run AI</strong>.
            </>
          ) : (
            <>
              Go back to your computer and click <strong>Create Asset</strong>.
            </>
          )}
        </span>
      </div>
      <p className="mt-6 text-xs text-gray-400">Session {token?.slice(0, 8)}…</p>
    </MobileAssetPageLayout>
  );
}
