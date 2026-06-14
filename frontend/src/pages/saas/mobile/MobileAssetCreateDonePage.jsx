import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';

export function MobileAssetCreateDonePage() {
  const { token } = useParams();

  return (
    <MobileAssetPageLayout title="Asset created" wrapperClassName="flex flex-col items-center py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-600" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Asset created</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Your asset was saved and AI analysis has started. Check the dashboard on your computer for
        pass/fail status.
      </p>
      <p className="mt-6 text-xs text-gray-400">Session {token?.slice(0, 8)}… completed</p>
    </MobileAssetPageLayout>
  );
}
