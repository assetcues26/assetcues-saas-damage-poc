import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const CameraContext = createContext(null);

function isPermissionDeniedError(err) {
  if (!err) return false;
  const name = err.name || '';
  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    name === 'SecurityError'
  );
}

export function CameraProvider({ children }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const retainStreamRef = useRef(false);
  const permissionBlockedRef = useRef(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [flashMode, setFlashMode] = useState('off');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [zoomLevel, setZoomLevelState] = useState(1);
  const [usesNativeZoom, setUsesNativeZoom] = useState(false);

  const attachStreamToVideo = useCallback(async () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return false;
    video.srcObject = stream;
    try {
      await video.play();
      setStatus('active');
      setIsReady(true);
      setError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
    setStatus('idle');
    setUsesNativeZoom(false);
  }, []);

  const clearPermissionBlock = useCallback(() => {
    permissionBlockedRef.current = false;
  }, []);

  const applyTorch = useCallback(async (enabled) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track?.getCapabilities) return false;
    const caps = track.getCapabilities();
    if (!caps.torch) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled }] });
      return true;
    } catch {
      return false;
    }
  }, []);

  const applyZoomToTrack = useCallback(async (level) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track?.getCapabilities) {
      setUsesNativeZoom(false);
      return;
    }
    const cap = track.getCapabilities().zoom;
    if (!cap) {
      setUsesNativeZoom(false);
      return;
    }
    try {
      const min = cap.min ?? 1;
      const max = cap.max ?? min;
      const step = cap.step ?? 0.1;
      const t = (level - 1) / 4;
      let target = min + t * (max - min);
      if (step > 0) {
        target = Math.round(target / step) * step;
      }
      target = Math.min(max, Math.max(min, target));
      await track.applyConstraints({ advanced: [{ zoom: target }] });
      setUsesNativeZoom(true);
    } catch {
      setUsesNativeZoom(false);
    }
  }, []);

  const setZoomLevel = useCallback(
    (level) => {
      const clamped = Math.min(5, Math.max(1, Math.round(level)));
      setZoomLevelState(clamped);
      applyZoomToTrack(clamped);
    },
    [applyZoomToTrack],
  );

  const startCamera = useCallback(async ({ forceRetry = false } = {}) => {
    if (permissionBlockedRef.current && !forceRetry) {
      setStatus('denied');
      return;
    }

    setStatus('loading');
    setError(null);

    if (streamRef.current?.active) {
      const attached = await attachStreamToVideo();
      if (attached) return;
      stopStream();
    } else {
      stopStream();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      await attachStreamToVideo();
      await applyZoomToTrack(zoomLevel);
      permissionBlockedRef.current = false;
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        permissionBlockedRef.current = true;
      }
      setError(err);
      setStatus('denied');
      setIsReady(false);
    }
  }, [facingMode, stopStream, attachStreamToVideo, zoomLevel, applyZoomToTrack]);

  const markRetainStream = useCallback(() => {
    retainStreamRef.current = true;
  }, []);

  const releaseStream = useCallback(() => {
    retainStreamRef.current = false;
    clearPermissionBlock();
    stopStream();
  }, [stopStream, clearPermissionBlock]);

  const ensureActive = useCallback(async () => {
    retainStreamRef.current = false;
    await startCamera();
  }, [startCamera]);

  const retryCamera = useCallback(async () => {
    clearPermissionBlock();
    await startCamera({ forceRetry: true });
  }, [clearPermissionBlock, startCamera]);

  const handleUnmount = useCallback(() => {
    if (retainStreamRef.current) return;
    stopStream();
  }, [stopStream]);

  const facingInitializedRef = useRef(false);
  useEffect(() => {
    if (!facingInitializedRef.current) {
      facingInitializedRef.current = true;
      return;
    }
    if (permissionBlockedRef.current) return;
    startCamera();
  }, [facingMode, startCamera]);

  const flipCamera = useCallback(() => {
    retainStreamRef.current = false;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const cycleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  useEffect(() => {
    if (!isReady || facingMode !== 'environment') {
      applyTorch(false);
      return;
    }
    if (flashMode === 'on') {
      applyTorch(true);
      return;
    }
    applyTorch(false);
  }, [flashMode, facingMode, isReady, applyTorch]);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isReady) return null;

    const shouldPulseTorch =
      facingMode === 'environment' && (flashMode === 'on' || flashMode === 'auto');
    if (shouldPulseTorch) {
      await applyTorch(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 120);
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const useDigitalZoom = !usesNativeZoom && zoomLevel > 1;
    if (useDigitalZoom) {
      const vw = video.videoWidth || canvas.width;
      const vh = video.videoHeight || canvas.height;
      const z = zoomLevel;
      const sw = vw / z;
      const sh = vh / z;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const file = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(
            new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }),
          );
        },
        'image/jpeg',
        0.92,
      );
    });

    if (shouldPulseTorch && flashMode !== 'on') {
      await applyTorch(false);
    }

    return file;
  }, [facingMode, flashMode, isReady, zoomLevel, usesNativeZoom, applyTorch]);

  const previewZoom = usesNativeZoom ? 1 : zoomLevel;

  const value = useMemo(
    () => ({
      videoRef,
      facingMode,
      flashMode,
      status,
      error,
      isReady,
      zoomLevel,
      previewZoom,
      setZoomLevel,
      flipCamera,
      cycleFlash,
      captureFrame,
      retry: retryCamera,
      ensureActive,
      markRetainStream,
      releaseStream,
      handleUnmount,
    }),
    [
      facingMode,
      flashMode,
      status,
      error,
      isReady,
      zoomLevel,
      previewZoom,
      setZoomLevel,
      flipCamera,
      cycleFlash,
      captureFrame,
      retryCamera,
      ensureActive,
      markRetainStream,
      releaseStream,
      handleUnmount,
    ],
  );

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) {
    throw new Error('useCamera must be used within CameraProvider');
  }
  return ctx;
}
