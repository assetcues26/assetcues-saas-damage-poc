import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

const BatchContext = createContext(null);

function createBatchItem(file) {
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    previewUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    savedAt: new Date().toISOString(),
  };
}

export function BatchProvider({ children }) {
  const [batchImages, setBatchImages] = useState([]);
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

  const addImage = useCallback(
    (file) => {
      const item = createBatchItem(file);
      trackUrl(item.previewUrl);
      setBatchImages((prev) => [...prev, item]);
      return item;
    },
    [trackUrl],
  );

  const addImages = useCallback(
    (files) => {
      const items = files.map((file) => {
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

  const batchCount = batchImages.length;

  const value = useMemo(
    () => ({
      batchImages,
      batchCount,
      addImage,
      addImages,
      removeImage,
      clearBatch,
      setBatchImages,
    }),
    [batchImages, batchCount, addImage, addImages, removeImage, clearBatch],
  );

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}

export function useBatchContext() {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error('useBatchContext must be used within BatchProvider');
  return ctx;
}
