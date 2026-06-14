import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAssetCreateSession, fetchAssetCreateSession } from '../../services/saasAssetsApi';
import { buildAssetCreateScanUrl } from '../../utils/assetCreateScanUrl';
import { useApp } from '../../context/AppContext';
import { QrCodePlaceholder } from '../session/QrCodePlaceholder';
import { SESSION_MODE_FULL_MOBILE, SESSION_MODE_IMAGES_ONLY } from './assetFormConfig';
import { SessionExpiryCountdown } from './SessionExpiryCountdown';

function notifyDesktop(title, body) {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
      return;
    }
  }
}

/**
 * @param {{
 *   mode: 'images_only' | 'full_mobile',
 *   draftJson: Record<string, unknown>,
 *   onSessionImages?: (session: object) => void,
 *   onSessionCompleted?: (session: object) => void,
 *   onSessionStarted?: (token: string) => void,
 *   onQrReady?: () => void,
 *   autoStart?: boolean,
 *   title?: string,
 *   description?: string,
 * }} props
 */
export function AssetCreateQrPanel({
  mode,
  draftJson,
  onSessionImages,
  onSessionCompleted,
  onSessionStarted,
  onQrReady,
  autoStart = false,
  title,
  description,
}) {
  const { showToast } = useApp();
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [startAttempted, setStartAttempted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const lastAssetUrlRef = useRef(null);
  const lastBarcodeUrlRef = useRef(null);

  const sessionMode = mode === 'images_only' ? SESSION_MODE_IMAGES_ONLY : SESSION_MODE_FULL_MOBILE;
  const scanUrl = token ? buildAssetCreateScanUrl(token, sessionMode) : null;
  const isActive = Boolean(scanUrl);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const body = await createAssetCreateSession({
        ...draftJson,
        _session_mode: sessionMode,
      });
      setToken(body.session_token);
      setExpiresAt(body.expires_at);
      setSynced(false);
      lastAssetUrlRef.current = null;
      lastBarcodeUrlRef.current = null;
      onSessionStarted?.(body.session_token);
      showToast('Scan the QR code with your phone', 'success');
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create QR session', 'error');
    } finally {
      setLoading(false);
    }
  }, [draftJson, sessionMode, showToast, onSessionStarted]);

  useEffect(() => {
    if (!autoStart || token || loading || startAttempted) return;
    setStartAttempted(true);
    startSession();
  }, [autoStart, token, loading, startAttempted, startSession]);

  useEffect(() => {
    if (!scanUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(scanUrl, { width: 180, margin: 2 })
      .then((url) => {
        setQrDataUrl(url);
        onQrReady?.();
      })
      .catch(() => setQrDataUrl(null));
  }, [scanUrl, onQrReady]);

  useEffect(() => {
    if (!token) return undefined;
    const poll = async () => {
      try {
        const session = await fetchAssetCreateSession(token);
        if (session.expires_at) setExpiresAt(session.expires_at);

        const newAsset =
          session.asset_image_url &&
          session.asset_image_url !== lastAssetUrlRef.current;
        const newBarcode =
          session.barcode_image_url &&
          session.barcode_image_url !== lastBarcodeUrlRef.current;

        if (newAsset || newBarcode) {
          if (newAsset) lastAssetUrlRef.current = session.asset_image_url;
          if (newBarcode) lastBarcodeUrlRef.current = session.barcode_image_url;
          onSessionImages?.({
            ...session,
            session_token: token,
            newAsset: Boolean(newAsset),
            newBarcode: Boolean(newBarcode),
          });
          setSynced(true);
          setPulse(true);
          window.setTimeout(() => setPulse(false), 1200);
          if (newAsset) {
            notifyDesktop('Asset photo synced', 'Asset image arrived from your phone');
          }
          if (newBarcode) {
            notifyDesktop('Barcode photo synced', 'Barcode image arrived from your phone');
          }
        }
        if (session.status === 'completed') {
          notifyDesktop('Asset created', 'Mobile session completed');
          onSessionCompleted?.(session);
        }
      } catch {
        /* ignore poll errors */
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [token, onSessionImages, onSessionCompleted]);

  const copyUrl = async () => {
    if (!scanUrl) return;
    try {
      await navigator.clipboard.writeText(scanUrl);
      showToast('Link copied', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const defaultTitle = mode === 'images_only' ? 'Upload from Mobile' : 'Create on Mobile';
  const defaultDescription =
    mode === 'images_only'
      ? 'Scan the QR code to capture and sync asset and barcode photos from your phone.'
      : 'Scan the QR code to open the full asset form on your phone with capture or upload.';

  return (
    <section
      className={`flex h-full min-h-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors sm:min-h-[360px] sm:p-6 ${
        pulse ? 'ring-2 ring-green-300' : ''
      }`}
    >
      <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-3 flex items-center gap-2">
            <QrCode size={18} className="text-gray-700" aria-hidden />
            <h3 className="text-base font-semibold text-gray-900">{title || defaultTitle}</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            {description || defaultDescription}
          </p>
          <p className="mt-2 text-xs text-gray-500">Asset image required · barcode optional</p>
          <SessionExpiryCountdown expiresAt={expiresAt} />

          {mode === 'images_only' && synced && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle2 size={16} className="shrink-0" />
              Photos synced from phone
            </div>
          )}

          {isActive && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                <Copy size={14} className="mr-1" />
                Copy mobile link
              </button>
              <button
                type="button"
                onClick={startSession}
                disabled={loading}
                className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800"
              >
                <RefreshCw size={14} className="mr-1" />
                Regenerate QR
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code for mobile asset create"
              className="h-[180px] w-[180px] rounded-xl border border-gray-100 bg-white p-3 shadow-md"
            />
          ) : (
            <>
              <QrCodePlaceholder size={180} />
              <Button
                type="button"
                variant="primary"
                disabled={loading}
                onClick={startSession}
                className="min-w-[200px]"
              >
                <Smartphone size={18} aria-hidden />
                {loading ? 'Generating QR…' : 'Generate QR code'}
              </Button>
              <p className="max-w-[200px] text-center text-xs text-gray-500">
                Scan with your phone to add photos
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
