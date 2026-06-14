import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { isLegacySeedEntry } from '../utils/mockData';
import {
  deleteHistoryEntry,
  fetchHistoryEntry,
  fetchHistoryList,
  hydrateEntry,
  hydrateListItem,
  isFullHistoryEntry,
  isHistoryUnavailableError,
} from '../services/historyApi';

const HistoryContext = createContext(null);

/** Remove legacy sample seed rows (one-time cleanup if old local data exists). */
export function stripLegacySeedEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) => !isLegacySeedEntry(entry));
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [historyApiEnabled, setHistoryApiEnabled] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [loadingEntryIds, setLoadingEntryIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchHistoryList({ limit: 100 });
        if (cancelled) return;
        const items = (data.items || []).map(hydrateListItem);
        setHistory(stripLegacySeedEntries(items));
        setHistoryApiEnabled(true);
        setHistoryError(null);
      } catch (err) {
        if (!cancelled) {
          if (isHistoryUnavailableError(err)) {
            setHistoryApiEnabled(false);
            setHistoryError(null);
          } else {
            const message = err?.message || 'Could not load saved reports';
            setHistoryError(message);
            console.warn('Could not load history from API', err);
          }
          setHistory([]);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addEntry = useCallback(async (entry) => {
    const id =
      entry.id ||
      entry.request_id ||
      `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processedAt = entry.processedAt || new Date().toISOString();
    const newEntry = { ...entry, id, processedAt };

    setHistory((prev) => {
      const withoutDuplicate = entry.request_id
        ? prev.filter((e) => e.request_id !== entry.request_id)
        : prev.filter((e) => e.id !== id);
      return [newEntry, ...withoutDuplicate];
    });

    return newEntry;
  }, []);

  const deleteEntry = useCallback(
    async (id) => {
      if (historyApiEnabled) {
        try {
          await deleteHistoryEntry(id);
        } catch (err) {
          console.warn('History delete API failed', err);
          throw err;
        }
      }
      setHistory((prev) => prev.filter((e) => e.id !== id && e.request_id !== id));
    },
    [historyApiEnabled],
  );

  const getEntryById = useCallback(
    (id) => history.find((e) => e.id === id || e.request_id === id),
    [history],
  );

  const ensureEntry = useCallback(
    async (id) => {
      const cached = getEntryById(id);
      if (isFullHistoryEntry(cached)) return cached;
      if (!historyApiEnabled || !id) return cached ?? null;

      setLoadingEntryIds((prev) => new Set(prev).add(id));
      try {
        const detail = await fetchHistoryEntry(id);
        const entry = hydrateEntry(detail);
        setHistory((prev) => {
          const matchesRequested = (e) =>
            e.id === id || e.request_id === id || e.id === entry.id || e.request_id === entry.request_id;
          const exists = prev.some(matchesRequested);
          if (exists) {
            return prev.map((e) => (matchesRequested(e) ? { ...entry, id: entry.id || e.id } : e));
          }
          return [entry, ...prev];
        });
        return entry;
      } catch (err) {
        console.warn('Could not fetch history entry', err);
        return null;
      } finally {
        setLoadingEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [getEntryById, historyApiEnabled],
  );

  const searchEntries = useCallback(
    (query) => {
      const q = query.trim().toLowerCase();
      if (!q) return history;
      return history.filter((entry) => {
        const name = (entry.asset_name || '').toLowerCase();
        const tag = (entry.detected_tag_number_raw || '').toLowerCase();
        const labels = (entry.visible_labels || []).join(' ').toLowerCase();
        return name.includes(q) || tag.includes(q) || labels.includes(q);
      });
    },
    [history],
  );

  const isSaved = useCallback(
    (requestId) => history.some((e) => e.request_id === requestId),
    [history],
  );

  const reloadHistory = useCallback(async () => {
    try {
      const data = await fetchHistoryList({ limit: 100 });
      const items = (data.items || []).map(hydrateListItem);
      setHistory(stripLegacySeedEntries(items));
      setHistoryApiEnabled(true);
      setHistoryError(null);
    } catch (err) {
      if (isHistoryUnavailableError(err)) {
        setHistoryApiEnabled(false);
        setHistoryError(null);
      } else {
        setHistoryError(err?.message || 'Could not load saved reports');
      }
      setHistory([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      history,
      hydrated,
      historyApiEnabled,
      historyError,
      loadingEntryIds,
      addEntry,
      deleteEntry,
      getEntryById,
      ensureEntry,
      searchEntries,
      isSaved,
      reloadHistory,
      historyCount: history.length,
    }),
    [
      history,
      hydrated,
      historyApiEnabled,
      historyError,
      loadingEntryIds,
      addEntry,
      deleteEntry,
      getEntryById,
      ensureEntry,
      searchEntries,
      isSaved,
      reloadHistory,
    ],
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export function useHistoryContext() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistoryContext must be used within HistoryProvider');
  return ctx;
}
