import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../components/ui/Spinner';
import { AiStatusBadge, MatchBadge } from '../../components/saas/AiStatusBadge';
import {
  deleteSaasAssetImage,
  fetchSaasAsset,
  fetchSaasAssetAnalyses,
} from '../../services/saasAssetsApi';
import { exportSaasAssetReportPdf } from '../../services/exportSaasAssetReportPdf';
import { AnalysisDetailModal } from '../../components/saas/AnalysisDetailModal';
import { AddAssetPhotosPanel } from '../../components/saas/AddAssetPhotosPanel';
import { AnalysisReportView } from '../../components/saas/AnalysisReportView';
import { AiDisabledBanner } from '../../components/saas/AiDisabledBanner';
import { withAnalyzingState } from '../../utils/saasAssetState';
import { useApp } from '../../context/AppContext';
import { useSaasAssets } from '../../context/SaasAssetsContext';

export function SaasAssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { refresh, refreshAll, markAssetAnalyzing, runAnalysis } = useSaasAssets();
  const [detail, setDetail] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);
  const [analysisModal, setAnalysisModal] = useState({ open: false, analysis: null });

  const load = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const [d, a] = await Promise.all([
        fetchSaasAsset(id),
        fetchSaasAssetAnalyses(id),
      ]);
      setDetail(d);
      setAnalyses(a.items || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (detail?.asset?.ai_status !== 'analyzing') return undefined;
    const timer = setInterval(() => load({ silent: true }), 1500);
    return () => clearInterval(timer);
  }, [detail?.asset?.ai_status, load]);

  const handleRerun = async () => {
    setRerunning(true);
    try {
      await runAnalysis(id);
      showToast('AI analysis complete', 'success');
      await load({ silent: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to run analysis', 'error');
      await load({ silent: true });
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!detail?.asset) {
    return <p className="p-6 text-gray-600">Asset not found.</p>;
  }

  const asset = detail.asset;
  const needsPhotos = !asset.asset_image_url;

  const handlePhotosComplete = async () => {
    await Promise.all([load({ silent: true }), refreshAll({ silent: true })]);
  };

  const handlePhotosAnalyzing = () => {
    markAssetAnalyzing(id);
    setDetail((prev) =>
      prev?.asset ? { ...prev, asset: withAnalyzingState(prev.asset) } : prev,
    );
  };

  const handleDeleteImage = async (kind) => {
    setDeletingImage(kind);
    try {
      const result = await deleteSaasAssetImage(id, kind);
      setDetail((prev) => (prev ? { ...prev, asset: result.asset } : prev));
      showToast(
        `${kind === 'asset' ? 'Asset' : 'Barcode'} photo removed — upload a new one below`,
        'success',
      );
      await refreshAll({ silent: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove photo', 'error');
    } finally {
      setDeletingImage(null);
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-1" />
          Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{asset.assetname}</h1>
        <AiStatusBadge
          status={asset.ai_status}
          onClick={
            detail.latest_analysis?.response_json
              ? () => document.getElementById('ai-validation-report')?.scrollIntoView({ behavior: 'smooth' })
              : undefined
          }
        />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/assets/${id}/edit`)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportSaasAssetReportPdf({ asset, analysis: detail.latest_analysis })
            }
          >
            Export PDF
          </Button>
          <Button variant="outline" size="sm" disabled={rerunning} onClick={handleRerun}>
            <RefreshCw size={14} className="mr-1" />
            {rerunning ? 'Starting…' : 'Run AI analysis'}
          </Button>
        </div>
      </div>

      {needsPhotos && (
        <div className="mb-6 lg:hidden">
          <Button className="mb-4 w-full" onClick={() => navigate(`/assets/${id}/tag`)}>
            Tag asset on mobile
          </Button>
        </div>
      )}

      {needsPhotos && (
        <div className="mb-6 hidden lg:block">
          <AddAssetPhotosPanel
            assetId={id}
            assetName={asset.assetname || asset.assetid}
            onAnalyzing={handlePhotosAnalyzing}
            onComplete={handlePhotosComplete}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Asset record</h2>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ['Asset number', asset.assetnumber],
              ['Asset name', asset.assetname],
              ['Acquisition date', asset.acquisitiondate],
              ['Cost', asset.cost != null ? `₹${Number(asset.cost).toLocaleString('en-IN')}` : '—'],
              ['Class', asset.assetclassname],
              ['Category', asset.categoryname],
              ['Tag number', asset.tagnumber],
              ['Serial number', asset.serialnumber],
              ['Sub location', asset.sublocation],
              ['Sub category', asset.subcategoryname],
              ['Make/model', asset.makemodelname],
              ['Department', asset.company],
              ['Latitude', asset.latitude],
              ['Longitude', asset.longitude],
              ['Asset ID', asset.assetid],
              ['Company ID', asset.companyid],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-gray-900">{val || '—'}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {asset.asset_image_url && (
              <AssetPhotoCard
                label="Asset photo"
                src={asset.asset_image_url}
                alt="Asset"
                deleting={deletingImage === 'asset'}
                onDelete={() => handleDeleteImage('asset')}
              />
            )}
            {asset.barcode_image_url && (
              <AssetPhotoCard
                label="Barcode photo"
                src={asset.barcode_image_url}
                alt="Barcode"
                deleting={deletingImage === 'barcode'}
                onDelete={() => handleDeleteImage('barcode')}
              />
            )}
          </div>
          {(asset.asset_image_url || asset.barcode_image_url) && (
            <p className="mt-3 text-xs text-gray-500">
              Remove a photo to upload a replacement from your computer or phone.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Latest AI checks</h2>
          {asset.ai_status === 'ai_disabled' && !detail.latest_analysis?.response_json ? (
            <AiDisabledBanner />
          ) : asset.ai_status === 'analyzing' ? (
            <p className="text-sm text-blue-600">AI validation in progress…</p>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Name match" value={asset.namedescriptionmatch} />
              <Row label="Class match" value={asset.subcatmodelmatch} />
              <Row label="Tag match" value={asset.detectedtagnumbermatch} />
              <Row label="Cost match" value={asset.costmatch} />
              <Row label="Date match" value={asset.datematch} />
            </div>
          )}
        </section>
      </div>

      {detail.latest_analysis?.response_json && asset.ai_status !== 'analyzing' && (
        <section id="ai-validation-report" className="mb-6">
          <AnalysisReportView
            analysis={detail.latest_analysis}
            asset={asset}
            aiStatus={asset.ai_status}
            analyzedAt={detail.latest_analysis.created_at}
          />
        </section>
      )}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Analysis history</h2>
        {analyses.length === 0 && asset.ai_status === 'ai_disabled' ? (
          <AiDisabledBanner />
        ) : (
          <ul className="divide-y divide-gray-100">
            {analyses.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <AiStatusBadge status={a.ai_status} />
                <span className="text-gray-600">{new Date(a.created_at).toLocaleString()}</span>
                <span className="text-gray-400">{a.request_id || '—'}</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalysisModal({ open: true, analysis: a })}
                  >
                    View
                  </Button>
                  <Link
                    to={`/assets/${id}/analysis/${a.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Deep dive
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AnalysisDetailModal
        open={analysisModal.open}
        onClose={() => setAnalysisModal({ open: false, analysis: null })}
        analysis={analysisModal.analysis}
        asset={asset}
        assetId={id}
        analyses={analyses}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <p className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <MatchBadge value={value} />
    </p>
  );
}

function AssetPhotoCard({ label, src, alt, deleting, onDelete }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <img src={src} alt={alt} className="h-48 w-full object-cover" />
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={14} className="mr-1" />
          {deleting ? 'Removing…' : 'Remove'}
        </Button>
      </div>
    </div>
  );
}
