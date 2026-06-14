import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { catalogToContext } from '../v6/erpCatalog';
import { compressImage } from '../utils/imageCompression';

const V6SessionContext = createContext(null);
const MAX_IMAGES = 10;

function createBatchItem(file) {
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `v6-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    previewUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export function V6Provider({ children }) {
  const [selectedCatalogAsset, setSelectedCatalogAsset] = useState(null);
  const [editedContext, setEditedContext] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const urlsRef = useRef(new Set());

  const trackUrl = useCallback((url) => {
    urlsRef.current.add(url);
  }, []);

  const revokeUrl = useCallback((url) => {
    if (url && urlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  }, []);

  const selectCatalogAsset = useCallback((asset) => {
    setSelectedCatalogAsset(asset);
    setEditedContext(catalogToContext(asset));
    setBatchImages((prev) => {
      prev.forEach((img) => revokeUrl(img.previewUrl));
      return [];
    });
    setAnalysisError(null);
  }, [revokeUrl]);

  const updateEditedContext = useCallback((patch) => {
    setEditedContext((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const addImage = useCallback(
    async (file) => {
      const compressed = await compressImage(file);
      const item = createBatchItem(compressed);
      trackUrl(item.previewUrl);
      setBatchImages((prev) => [...prev, item]);
      return item;
    },
    [trackUrl],
  );

  const addImages = useCallback(
    async (files) => {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      const items = compressed.map((file) => {
        const item = createBatchItem(file);
        trackUrl(item.previewUrl);
        return item;
      });
      setBatchImages((prev) => [...prev, ...items]);
      return items;
    },
    [trackUrl],
  );

  const removeImage = useCallback(
    (id) => {
      setBatchImages((prev) => {
        const target = prev.find((img) => img.id === id);
        if (target) revokeUrl(target.previewUrl);
        return prev.filter((img) => img.id !== id);
      });
    },
    [revokeUrl],
  );

  const clearBatch = useCallback(() => {
    setBatchImages((prev) => {
      prev.forEach((img) => revokeUrl(img.previewUrl));
      return [];
    });
  }, [revokeUrl]);

  const tryAddImages = useCallback(
    async (files) => {
      const list = Array.from(files);
      const remaining = MAX_IMAGES - batchImages.length;
      if (remaining <= 0) return { added: 0, skipped: list.length };
      const toAdd = list.slice(0, remaining);
      await addImages(toAdd);
      return { added: toAdd.length, skipped: list.length - toAdd.length };
    },
    [batchImages.length, addImages],
  );

  const addSessionResult = useCallback((entry) => {
    const id = entry.id || `v6-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processedAt = entry.processedAt || new Date().toISOString();
    const newEntry = { ...entry, id, processedAt, erpContext: editedContext };
    setSessionResults((prev) => [newEntry, ...prev]);
    setLastResult(newEntry);
    return newEntry;
  }, [editedContext]);

  const getSessionResultById = useCallback(
    (id) =>
      sessionResults.find((e) => e.id === id || e.request_id === id) ||
      (lastResult && (lastResult.id === id || lastResult.request_id === id)
        ? lastResult
        : null),
    [sessionResults, lastResult],
  );

  const value = useMemo(
    () => ({
      maxImages: MAX_IMAGES,
      selectedCatalogAsset,
      editedContext,
      batchImages,
      batchCount: batchImages.length,
      canAddMore: batchImages.length < MAX_IMAGES,
      sessionResults,
      lastResult,
      analysisError,
      setAnalysisError,
      selectCatalogAsset,
      updateEditedContext,
      addImage,
      addImages,
      removeImage,
      clearBatch,
      tryAddImages,
      addSessionResult,
      getSessionResultById,
    }),
    [
      selectedCatalogAsset,
      editedContext,
      batchImages,
      sessionResults,
      lastResult,
      analysisError,
      selectCatalogAsset,
      updateEditedContext,
      addImage,
      addImages,
      removeImage,
      clearBatch,
      tryAddImages,
      addSessionResult,
      getSessionResultById,
    ],
  );

  return (
    <V6SessionContext.Provider value={value}>{children}</V6SessionContext.Provider>
  );
}

export function useV6Context() {
  const ctx = useContext(V6SessionContext);
  if (!ctx) {
    throw new Error('useV6Context must be used within V6Provider');
  }
  return ctx;
}
