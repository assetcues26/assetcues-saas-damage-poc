import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { readMobileCreateSuccess } from '../../../utils/mobileCreateSuccess';

export function MobileAssetCreateDonePage() {
  const { token } = useParams();
  const location = useLocation();

  const success = useMemo(() => {
    const fromState = location.state || {};
    const stored = readMobileCreateSuccess(token);
    return {
      assetId: fromState.assetId || stored?.assetId,
      assetTag: fromState.assetTag || stored?.assetTag,
      assetName: fromState.assetName || stored?.assetName,
      aiStatus: fromState.aiStatus || stored?.aiStatus,
    };
  }, [location.state, token]);

  const analyzing = success.aiStatus === 'analyzing';
  const assetLabel = success.assetName || success.assetTag || 'Your asset';

  return (
    <MobileAssetPageLayout title="Success" wrapperClassName="flex flex-col py-8 pb-10">
      <MobileBrandHeader
        subtitle="Registration complete — your asset is saved in AssetCues."
        className="mb-8"
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
          <CheckCircle2 size={40} strokeWidth={2} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-gray-900">Asset created</h2>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{assetLabel}</span> has been registered
          successfully.
        </p>

        {success.assetTag && (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
            Asset ID: <span className="font-semibold text-gray-900">{success.assetTag}</span>
          </p>
        )}

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
          {analyzing
            ? 'AI validation is running now. Open the asset to watch status and view the report.'
            : 'No photos were added. Open the asset anytime to upload photos and run AI validation.'}
        </p>

        <div className="mt-8 grid w-full gap-3">
          {success.assetId ? (
            <Button asChild className="min-h-12 w-full text-base shadow-lg">
              <Link to={`/assets/${encodeURIComponent(success.assetId)}`}>
                Go to asset
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="min-h-12 w-full text-base shadow-lg">
              <Link to="/">
                Go to dashboard
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="min-h-12 w-full text-base">
            <Link to="/">
              <LayoutDashboard size={18} className="mr-2" />
              All assets
            </Link>
          </Button>
        </div>
      </div>
    </MobileAssetPageLayout>
  );
}
