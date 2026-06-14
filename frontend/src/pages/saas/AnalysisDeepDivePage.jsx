import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../components/ui/Spinner';
import { AnalysisReportView } from '../../components/saas/AnalysisReportView';
import { fetchSaasAsset, fetchSaasAssetAnalysis } from '../../services/saasAssetsApi';

export function AnalysisDeepDivePage() {
  const { id, aid } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSaasAsset(id), fetchSaasAssetAnalysis(id, aid)])
      .then(([detail, item]) => {
        setAsset(detail.asset);
        setAnalysis(item);
      })
      .finally(() => setLoading(false));
  }, [id, aid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!analysis) {
    return <p className="p-6 text-gray-600">Analysis not found.</p>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/assets/${id}`)}>
          <ArrowLeft size={16} className="mr-1" />
          Asset detail
        </Button>
        <h1 className="text-xl font-bold text-gray-900">AI validation deep dive</h1>
        <Link to={`/assets/${id}`} className="ml-auto text-sm text-blue-600">
          Back to asset
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <AnalysisReportView
          analysis={analysis}
          asset={asset}
          aiStatus={analysis.ai_status}
          analyzedAt={analysis.created_at}
        />

        {(asset?.asset_image_url || asset?.barcode_image_url) && (
          <aside className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Evidence images
              </h2>
              <div className="space-y-3">
                {asset.asset_image_url && (
                  <img
                    src={asset.asset_image_url}
                    alt="Asset"
                    className="w-full rounded-lg border object-cover"
                  />
                )}
                {asset.barcode_image_url && (
                  <img
                    src={asset.barcode_image_url}
                    alt="Barcode"
                    className="w-full rounded-lg border object-cover"
                  />
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
