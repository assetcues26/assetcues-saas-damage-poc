import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../components/ui/Spinner';
import { useSaasAssets } from '../../context/SaasAssetsContext';
import {
  deleteSaasAsset,
  fetchSaasAssetAnalysis,
} from '../../services/saasAssetsApi';
import { exportSaasAssetReportPdf } from '../../services/exportSaasAssetReportPdf';
import { AiStatusBadge, MatchBadge } from '../../components/saas/AiStatusBadge';
import { AssetThumbnail } from '../../components/saas/AssetThumbnail';
import { FailureDetailModal } from '../../components/saas/FailureDetailModal';
import { AnalysisDetailModal } from '../../components/saas/AnalysisDetailModal';
import { useApp } from '../../context/AppContext';

const STAT_CARDS = [
  { key: null, label: 'Total', field: 'total' },
  { key: 'pass', label: 'Pass', field: 'pass_count' },
  { key: 'fail', label: 'Fail', field: 'fail_count' },
  { key: 'pending', label: 'Pending', field: 'pending' },
  { key: 'error', label: 'Error', field: 'error' },
  { key: 'analyzing', label: 'Analyzing', field: 'analyzing' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created' },
  { value: 'assetname', label: 'Name' },
  { value: 'cost', label: 'Cost' },
  { value: 'ai_status', label: 'AI status' },
  { value: 'company', label: 'Company' },
];

export function AssetsDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const {
    assets,
    total,
    loading,
    error,
    search,
    setSearch,
    aiStatusFilter,
    setAiStatusFilter,
    sort,
    setSort,
    order,
    setOrder,
    page,
    setPage,
    pageSize,
    selectedIds,
    toggleSelected,
    toggleSelectAll,
    stats,
    refresh,
    runAnalysis,
    markAssetAnalyzing,
    bulkAnalyze,
    bulkDelete,
    exportCsv,
  } = useSaasAssets();

  const [rerunningId, setRerunningId] = useState(null);
  const [failureModal, setFailureModal] = useState({ open: false, asset: null, summary: null });
  const [analysisModal, setAnalysisModal] = useState({
    open: false,
    analysis: null,
    asset: null,
    assetId: null,
    analyses: [],
  });
  const [bulkBusy, setBulkBusy] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = assets.length > 0 && selectedIds.length === assets.length;

  const handleRerun = async (assetId) => {
    setRerunningId(assetId);
    try {
      await runAnalysis(assetId);
      showToast('AI analysis started', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to start analysis', 'error');
    } finally {
      setRerunningId(null);
    }
  };

  const openFailure = async (asset) => {
    if (!asset.latest_analysis_id) {
      if (asset.failure_summary) {
        setFailureModal({ open: true, asset, summary: asset.failure_summary });
      }
      return;
    }
    try {
      const analysis = await fetchSaasAssetAnalysis(asset.id, asset.latest_analysis_id);
      setAnalysisModal({
        open: true,
        analysis,
        asset,
        assetId: asset.id,
        analyses: [],
      });
    } catch {
      if (asset.failure_summary) {
        setFailureModal({ open: true, asset, summary: asset.failure_summary });
      }
    }
  };

  const openFullAnalysis = async (asset) => {
    if (!asset.latest_analysis_id) return;
    try {
      const analysis = await fetchSaasAssetAnalysis(asset.id, asset.latest_analysis_id);
      const { fetchSaasAssetAnalyses } = await import('../../services/saasAssetsApi');
      const list = await fetchSaasAssetAnalyses(asset.id);
      setAnalysisModal({
        open: true,
        analysis,
        asset,
        assetId: asset.id,
        analyses: list.items || [],
      });
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete ${asset.assetname || asset.assetid}?`)) return;
    await deleteSaasAsset(asset.id);
    showToast('Asset deleted', 'success');
    refresh({ silent: true });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected assets?`)) return;
    setBulkBusy(true);
    try {
      await bulkDelete();
      showToast('Selected assets deleted', 'success');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkAnalyze = async () => {
    setBulkBusy(true);
    try {
      await bulkAnalyze();
      showToast('AI analysis queued for selected assets', 'success');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExportPdf = async (asset) => {
    if (!asset.latest_analysis_id) {
      showToast('No analysis available for PDF', 'error');
      return;
    }
    const analysis = await fetchSaasAssetAnalysis(asset.id, asset.latest_analysis_id);
    await exportSaasAssetReportPdf({ asset, analysis });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assets Dashboard</h1>
          <p className="text-sm text-gray-600">{total} registered assets</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STAT_CARDS.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => {
                  setAiStatusFilter(card.key);
                  setPage(0);
                }}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  aiStatusFilter === card.key
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.[card.field] ?? '—'}
                </p>
              </button>
            ))}
          </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search assets…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          >
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </Button>
        </div>
        <Link to="/assets/create">
          <Button variant="primary" size="sm">Create asset</Button>
        </Link>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-900">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" disabled={bulkBusy} onClick={handleBulkAnalyze}>
            Run AI analysis
          </Button>
          <Button variant="outline" size="sm" disabled={bulkBusy} onClick={() => exportCsv()}>
            <Download size={14} className="mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" disabled={bulkBusy} onClick={handleBulkDelete}>
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-600">
          <Spinner className="mr-2 h-5 w-5" />
          Loading assets…
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-600">No assets yet. Create your first asset to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-auto text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleSelectAll(assets.map((a) => a.id))}
                      aria-label="Select all assets"
                    />
                  </th>
                  <th className="w-14 px-3 py-3">Photo</th>
                  <th className="px-3 py-3">Asset ID</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="hidden px-3 py-3 md:table-cell">Company</th>
                  <th className="px-3 py-3">Cost</th>
                  <th className="px-3 py-3">Acquired</th>
                  <th className="px-3 py-3">Checks</th>
                  <th className="px-3 py-3">AI status</th>
                  <th className="min-w-[220px] px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="align-top hover:bg-gray-50/80">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(asset.id)}
                        onChange={() => toggleSelected(asset.id)}
                        aria-label={`Select ${asset.assetname || asset.assetid}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <AssetThumbnail
                        src={asset.asset_image_url}
                        alt={asset.assetname || asset.assetid}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                      <Link to={`/assets/${asset.id}`} className="hover:text-blue-600">
                        {asset.assetid}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">{asset.assetname}</td>
                    <td className="hidden px-3 py-3 text-gray-600 md:table-cell">{asset.company}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {asset.cost != null ? `₹${Number(asset.cost).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">{asset.acquisitiondate}</td>
                    <td className="px-3 py-3">
                      {asset.ai_status === 'analyzing' ? (
                        <span className="text-xs font-medium text-blue-600">Updating…</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <MatchBadge label="Name" value={asset.namedescriptionmatch} />
                          <MatchBadge label="Cost" value={asset.costmatch} />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <AiStatusBadge
                        status={asset.ai_status}
                        onClick={
                          asset.ai_status === 'fail'
                            ? () => openFailure(asset)
                            : asset.latest_analysis_id
                              ? () => openFullAnalysis(asset)
                              : undefined
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <RowAction
                          icon={Eye}
                          label="View"
                          onClick={() => navigate(`/assets/${asset.id}`)}
                        />
                        <RowAction
                          icon={Pencil}
                          label="Edit"
                          onClick={() => navigate(`/assets/${asset.id}/edit`)}
                        />
                        {!asset.asset_image_url && (
                          <RowAction
                            icon={ImagePlus}
                            label="Add photos"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                          />
                        )}
                        <RowAction
                          icon={RefreshCw}
                          label="Run AI"
                          disabled={rerunningId === asset.id || !asset.asset_image_url}
                          onClick={() => handleRerun(asset.id)}
                        />
                        <RowAction
                          icon={Download}
                          label="PDF"
                          onClick={() => handleExportPdf(asset)}
                        />
                        <RowAction
                          icon={Trash2}
                          label="Delete"
                          variant="danger"
                          onClick={() => handleDelete(asset)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <FailureDetailModal
        open={failureModal.open}
        onClose={() => setFailureModal({ open: false, asset: null, summary: null })}
        failureSummary={failureModal.summary}
        asset={failureModal.asset}
        onAnalysisStarted={() => {
          if (failureModal.asset?.id) markAssetAnalyzing(failureModal.asset.id);
        }}
        onFixed={() => refresh({ silent: true })}
      />
      <AnalysisDetailModal
        open={analysisModal.open}
        onClose={() =>
          setAnalysisModal({ open: false, analysis: null, asset: null, assetId: null, analyses: [] })
        }
        analysis={analysisModal.analysis}
        asset={analysisModal.asset}
        assetId={analysisModal.assetId}
        analyses={analysisModal.analyses}
      />
    </div>
  );
}

function RowAction({ icon: Icon, label, onClick, disabled, variant }) {
  const danger = variant === 'danger';
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={12} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
