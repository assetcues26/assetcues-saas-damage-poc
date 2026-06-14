import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../components/ui/Spinner';
import { AssetResultCard } from '../../components/result/AssetResultCard';
import { fetchSaasAsset, fetchSaasAssetAnalysis } from '../../services/saasAssetsApi';

function mapAnalysisToResult(analysis, asset) {
  const r = analysis?.response_json || {};
  return {
    id: analysis?.id,
    assetName: asset?.assetname || r.detectedAsset,
    detectedAsset: r.detectedAsset,
    condition: r.condition,
    imageAnalysis: r.imageAnalysis,
    namedescriptionmatch: r.namedescriptionmatch,
    subcatmodelmatch: r.subcatmodelmatch,
    detectedtagnumbermatch: r.detectedtagnumbermatch,
    costvalidation: r.costvalidation,
    acquisitiondatevalidation: r.acquisitiondatevalidation,
    reasoning: r.reasoning,
    damage_assessment: r.damage_assessment,
    assetImageUrl: asset?.asset_image_url,
    barcodeImageUrl: asset?.barcode_image_url,
    ...r,
  };
}

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

  const result = mapAnalysisToResult(analysis, asset);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/assets/${id}`)}>
          <ArrowLeft size={16} className="mr-1" />
          Asset detail
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Analysis deep dive</h1>
        <Link to={`/assets/${id}`} className="ml-auto text-sm text-blue-600">
          Back to register
        </Link>
      </div>
      <AssetResultCard result={result} />
    </div>
  );
}
