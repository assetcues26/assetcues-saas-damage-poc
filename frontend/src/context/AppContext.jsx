import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_MARKET_REGION } from '../constants/markets';
import {
  readStoredUploadMode,
  UPLOAD_PROCESSING_MODES,
} from '../constants/uploadMode';
import {
  readStoredMarketRegion,
  writeStoredMarketRegion,
} from '../utils/marketStorage';

const AppContext = createContext(null);

const DEFAULT_MAX_IMAGES = 10;

export function AppProvider({ children }) {
  const [maxImages, setMaxImages] = useState(DEFAULT_MAX_IMAGES);
  const [configLoading, setConfigLoading] = useState(true);
  const [appConfig, setAppConfig] = useState({
    maxImages: DEFAULT_MAX_IMAGES,
    appName: 'AssetCues',
    version: '1.0.0',
  });
  const [toasts, setToasts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [uploadProcessingMode, setUploadProcessingModeState] = useState(
    () => readStoredUploadMode(),
  );
  const [marketRegion, setMarketRegionState] = useState(() => readStoredMarketRegion());

  const setUploadProcessingMode = useCallback((mode) => {
    setUploadProcessingModeState(mode);
  }, []);

  const setMarketRegion = useCallback((region) => {
    const normalized = (region || DEFAULT_MARKET_REGION).toUpperCase();
    setMarketRegionState(normalized);
    writeStoredMarketRegion(normalized);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const fetchedMax = DEFAULT_MAX_IMAGES;
      setMaxImages(fetchedMax);
      setAppConfig((prev) => ({ ...prev, maxImages: fetchedMax }));
      setConfigLoading(false);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const showToast = useCallback((message, variant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      maxImages,
      configLoading,
      appConfig,
      toasts,
      showToast,
      dismissToast,
      previewImage,
      setPreviewImage,
      lastResult,
      setLastResult,
      analysisError,
      setAnalysisError,
      uploadProcessingMode,
      setUploadProcessingMode,
      marketRegion,
      setMarketRegion,
    }),
    [
      maxImages,
      configLoading,
      appConfig,
      toasts,
      showToast,
      dismissToast,
      previewImage,
      lastResult,
      analysisError,
      uploadProcessingMode,
      setUploadProcessingMode,
      marketRegion,
      setMarketRegion,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
