import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  bulkDeleteSaasAssets,
  exportAssetsCsv,
  fetchActivity,
  fetchDashboardStats,
  fetchSaasAsset,
  fetchSaasAssetsList,
} from '../services/saasAssetsApi';
import { isAssetAnalyzing, withAnalyzingState } from '../utils/saasAssetState';
import { mergePreservingImageUrls } from '../utils/mergeAssetList';
import {
  enqueueAssetAnalysis,
  enqueueAssetAnalysesSequential,
  isAnalysisQueueBusy,
} from '../utils/analysisQueue';

const SaasAssetsContext = createContext(null);

const POLL_MS = 3000;
const POLL_MS_ANALYZING = 1500;
const STATS_POLL_MS = 10000;
const STATS_POLL_MS_ANALYZING = 5000;
const ACTIVITY_POLL_MS = 20000;
const ACTIVITY_POLL_MS_ANALYZING = 10000;
const PAGE_SIZE = 25;

function computeStatsFromAssets(items, total) {
  const stats = {
    total: total ?? items.length,
    pass_count: 0,
    fail_count: 0,
    pending: 0,
    error: 0,
    analyzing: 0,
  };
  for (const asset of items) {
    const status = asset.ai_status || 'pending';
    if (status === 'pass') stats.pass_count += 1;
    else if (status === 'fail') stats.fail_count += 1;
    else if (status === 'error') stats.error += 1;
    else if (status === 'analyzing') stats.analyzing += 1;
    else if (status === 'ai_disabled') stats.pending += 1;
    else stats.pending += 1;
  }
  return stats;
}

function isNetworkError(err) {
  return err instanceof TypeError && /failed to fetch/i.test(err.message);
}

export function SaasAssetsProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [aiStatusFilter, setAiStatusFilter] = useState(null);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityReady, setActivityReady] = useState(false);
  const pollRef = useRef(null);
  const statsPollRef = useRef(null);
  const activityRef = useRef(null);

  const markAssetAnalyzing = useCallback((assetId) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === assetId ? withAnalyzingState(asset) : asset)),
    );
  }, []);

  const applyAssetSummary = useCallback((summary) => {
    if (!summary?.id) return;
    setAssets((prev) =>
      prev.map((asset) => (asset.id === summary.id ? { ...asset, ...summary } : asset)),
    );
  }, []);

  const refreshAssetAfterAnalysis = useCallback(
    async (assetId, status, assetSummary = null) => {
      if (assetSummary) {
        applyAssetSummary(assetSummary);
        return;
      }
      try {
        const detail = await fetchSaasAsset(assetId);
        if (detail?.asset) {
          applyAssetSummary(detail.asset);
          return;
        }
      } catch {
        /* fall back to status only */
      }
      if (status && status !== 'analyzing' && status !== 'timeout') {
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === assetId ? { ...asset, ai_status: status } : asset,
          ),
        );
      }
    },
    [applyAssetSummary],
  );

  const analysisHooks = useMemo(
    () => ({
      onStart: (id) => markAssetAnalyzing(id),
      onDone: (id, status, assetSummary) => {
        refreshAssetAfterAnalysis(id, status, assetSummary);
      },
    }),
    [markAssetAnalyzing, refreshAssetAfterAnalysis],
  );

  const load = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const body = await fetchSaasAssetsList({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        q: search || undefined,
        ai_status: aiStatusFilter || undefined,
        sort,
        order,
      });
      setAssets((prev) => {
        const items = body.items || [];
        if (silent && prev.length) {
          return mergePreservingImageUrls(prev, items);
        }
        return items;
      });
      setTotal(body.total ?? 0);
      setError(null);
      setStats((prev) => {
        if (prev != null) return prev;
        return computeStatsFromAssets(body.items || [], body.total);
      });
    } catch (err) {
      if (!silent || assets.length === 0) {
        const message =
          isNetworkError(err) && assets.length > 0
            ? 'Connection lost — showing last loaded data'
            : err instanceof Error
              ? err.message
              : 'Failed to load assets';
        setError(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, aiStatusFilter, sort, order, page, assets.length]);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchDashboardStats();
      setStats(s);
    } catch {
      try {
        const body = await fetchSaasAssetsList({ limit: 200 });
        setStats(computeStatsFromAssets(body.items || [], body.total));
      } catch {
        /* keep previous stats */
      }
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const body = await fetchActivity(20);
      setActivity(body.items || []);
      setActivityReady(true);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(
    async (opts = {}) => {
      await Promise.all([
        load(opts),
        loadStats(),
        loadActivity(),
      ]);
    },
    [load, loadStats, loadActivity],
  );

  useEffect(() => {
    load();
    loadStats();
    loadActivity();
  }, [load, loadStats, loadActivity]);

  useEffect(() => {
    if (stats == null && !loading && total > 0) {
      setStats(computeStatsFromAssets(assets, total));
    }
  }, [stats, loading, total, assets]);

  const hasAnalyzing = assets.some(isAssetAnalyzing);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      load({ silent: true });
    }, hasAnalyzing ? POLL_MS_ANALYZING : POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, hasAnalyzing]);

  useEffect(() => {
    if (statsPollRef.current) clearInterval(statsPollRef.current);
    statsPollRef.current = setInterval(
      loadStats,
      hasAnalyzing ? STATS_POLL_MS_ANALYZING : STATS_POLL_MS,
    );
    return () => {
      if (statsPollRef.current) clearInterval(statsPollRef.current);
    };
  }, [loadStats, hasAnalyzing]);

  useEffect(() => {
    if (activityRef.current) clearInterval(activityRef.current);
    activityRef.current = setInterval(
      loadActivity,
      hasAnalyzing ? ACTIVITY_POLL_MS_ANALYZING : ACTIVITY_POLL_MS,
    );
    return () => {
      if (activityRef.current) clearInterval(activityRef.current);
    };
  }, [loadActivity, hasAnalyzing]);

  const runAnalysis = useCallback(
    async (assetId) => {
      markAssetAnalyzing(assetId);
      try {
        await enqueueAssetAnalysis(assetId, analysisHooks);
        await load({ silent: true });
        await loadStats();
      } catch (err) {
        await load({ silent: true });
        throw err;
      }
    },
    [load, loadStats, markAssetAnalyzing, analysisHooks],
  );

  const queueNewAssetAnalysis = useCallback(
    async (assetId) => {
      markAssetAnalyzing(assetId);
      enqueueAssetAnalysis(assetId, {
        ...analysisHooks,
        onDone: async (id, status) => {
          analysisHooks.onDone?.(id, status);
          await load({ silent: true });
          await loadStats();
        },
      }).catch(() => {
        load({ silent: true });
      });
    },
    [load, loadStats, markAssetAnalyzing, analysisHooks],
  );

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback((ids) => {
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
  }, []);

  const bulkAnalyze = useCallback(async () => {
    if (!selectedIds.length) return;
    const ids = [...selectedIds];
    try {
      await enqueueAssetAnalysesSequential(ids, analysisHooks);
      setSelectedIds([]);
      await load({ silent: true });
      await loadStats();
    } catch (err) {
      await load({ silent: true });
      throw err;
    }
  }, [selectedIds, load, loadStats, analysisHooks]);

  const bulkAnalyzeIds = useCallback(
    async (assetIds) => {
      if (!assetIds.length) return;
      await enqueueAssetAnalysesSequential(assetIds, analysisHooks);
      await load({ silent: true });
      await loadStats();
    },
    [load, loadStats, analysisHooks],
  );

  const bulkDelete = useCallback(async () => {
    if (!selectedIds.length) return;
    await bulkDeleteSaasAssets(selectedIds);
    setSelectedIds([]);
    await load({ silent: true });
    await loadStats();
  }, [selectedIds, load, loadStats]);

  const exportCsv = useCallback(async () => {
    const blob = await exportAssetsCsv({
      q: search || undefined,
      ai_status: aiStatusFilter || undefined,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assetcues-assets.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [search, aiStatusFilter]);

  const value = useMemo(
    () => ({
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
      pageSize: PAGE_SIZE,
      selectedIds,
      setSelectedIds,
      toggleSelected,
      toggleSelectAll,
      stats,
      activity,
      activityReady,
      refresh: load,
      refreshAll,
      runAnalysis,
      queueNewAssetAnalysis,
      markAssetAnalyzing,
      bulkAnalyze,
      bulkAnalyzeIds,
      bulkDelete,
      exportCsv,
    }),
    [
      assets,
      total,
      loading,
      error,
      search,
      aiStatusFilter,
      sort,
      order,
      page,
      selectedIds,
      stats,
      activity,
      activityReady,
      load,
      refreshAll,
      runAnalysis,
      queueNewAssetAnalysis,
      markAssetAnalyzing,
      bulkAnalyze,
      bulkAnalyzeIds,
      bulkDelete,
      exportCsv,
      toggleSelected,
      toggleSelectAll,
    ],
  );

  return <SaasAssetsContext.Provider value={value}>{children}</SaasAssetsContext.Provider>;
}

export function useSaasAssets() {
  const ctx = useContext(SaasAssetsContext);
  if (!ctx) {
    throw new Error('useSaasAssets must be used within SaasAssetsProvider');
  }
  return ctx;
}
