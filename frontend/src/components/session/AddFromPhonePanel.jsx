import { useEffect, useState } from 'react';

import QRCode from 'qrcode';

import { Copy, QrCode, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useSession } from '../../hooks/useSession';

import { buildScanUrl } from '../../utils/scanUrl';

import { useApp } from '../../context/AppContext';

import { UPLOAD_MAX_TOTAL_MB } from '../../utils/imageCompression';

import { QrCodePlaceholder } from './QrCodePlaceholder';



/**

 * @param {{ variant?: 'full' | 'compact', autoStart?: boolean }} props

 */

export function AddFromPhonePanel({ variant = 'full', autoStart = false }) {

  const { enabled, token, startSession, loading, isSessionActive } = useSession();

  const { showToast, maxImages } = useApp();

  const [qrDataUrl, setQrDataUrl] = useState(null);

  const [startAttempted, setStartAttempted] = useState(false);



  const scanUrl = token ? buildScanUrl(token) : null;



  useEffect(() => {

    if (!autoStart || !enabled || token || loading || startAttempted) return;

    setStartAttempted(true);

    startSession();

  }, [autoStart, enabled, token, loading, startAttempted, startSession]);



  useEffect(() => {

    if (!scanUrl) {

      setQrDataUrl(null);

      return;

    }

    QRCode.toDataURL(scanUrl, { width: variant === 'full' ? 180 : 140, margin: 2 })

      .then(setQrDataUrl)

      .catch(() => setQrDataUrl(null));

  }, [scanUrl, variant]);



  if (!enabled) return null;



  const handleConnect = async () => {

    const created = await startSession();

    if (created) {

      showToast('Scan the QR code with your phone', 'success');

    }

  };



  const handleCopy = async () => {

    if (!scanUrl) return;

    try {

      await navigator.clipboard.writeText(scanUrl);

      showToast('Link copied', 'success');

    } catch {

      showToast('Could not copy link', 'error');

    }

  };



  if (variant === 'compact') {

    return (

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <Smartphone size={20} aria-hidden />

            </div>

            <div>

              <h3 className="text-sm font-semibold text-gray-900">Upload from Mobile</h3>

              <p className="text-xs text-gray-600">Scan to add more photos from your phone</p>

            </div>

          </div>

          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code to open mobile capture page"
              className="h-[100px] w-[100px] rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QrCodePlaceholder size={100} />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={handleConnect}
                className="gap-1.5"
              >
                <QrCode size={14} aria-hidden />
                {loading ? 'Generating…' : 'Generate QR'}
              </Button>
            </div>
          )}

        </div>

        {scanUrl && (

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
            onClick={handleCopy}
          >

            <Copy className="me-1.5" size={14} aria-hidden />

            Copy link

          </Button>

        )}

      </section>

    );

  }



  return (

    <section className="flex h-full min-h-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:min-h-[360px] sm:p-6">

      <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">

        <div className="flex flex-1 flex-col justify-center">

          <div className="mb-3 flex items-center gap-2">

            <QrCode size={18} className="text-gray-700" aria-hidden />

            <h3 className="text-base font-semibold text-gray-900">Upload from Mobile</h3>

          </div>

          <p className="text-sm leading-relaxed text-gray-600">

            Scan the QR code to capture and sync photos directly from your phone.

          </p>

          <p className="mt-2 text-xs text-gray-500">

            Max {maxImages} images, {UPLOAD_MAX_TOTAL_MB} MB total

          </p>

          {isSessionActive && (
            <button
              type="button"
              onClick={handleCopy}
              className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Copy mobile link →
            </button>
          )}

        </div>



        <div className="flex shrink-0 flex-col items-center justify-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code to open mobile capture page"
              className="h-[180px] w-[180px] rounded-xl border border-gray-100 bg-white p-3 shadow-md"
            />
          ) : (
            <>
              <QrCodePlaceholder size={180} />
              <Button
                type="button"
                variant="primary"
                disabled={loading}
                onClick={handleConnect}
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

