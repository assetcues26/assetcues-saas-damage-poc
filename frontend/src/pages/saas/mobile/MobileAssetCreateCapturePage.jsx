import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CompactHeader } from '../../../components/layout/AppHeader';
import { BackButton } from '../../../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import { mobileCreateRoutes, resolveMobileCreateMode } from '../../../utils/mobileCreateRoutes';

const darkTabClass =
  'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white';

export function MobileAssetCreateCapturePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, uploadImage, uploading, error } = useAssetCreateSession(token);
  const [slot, setSlot] = useState('assetimage');
  const inputRef = useRef(null);

  const mode = resolveMobileCreateMode(session?.draft_json);
  const routes = mobileCreateRoutes(token, mode);

  const hasAsset = Boolean(session?.asset_image_url);
  const hasBarcode = Boolean(session?.barcode_image_url);

  const capture = () => inputRef.current?.click();

  const onFile = async (file) => {
    if (!file) return;
    try {
      await uploadImage(slot, file);
      if (slot === 'assetimage' && !hasBarcode) {
        setSlot('barcodeimage');
      }
    } catch {
      /* error shown below */
    }
  };

  const previewUrl =
    slot === 'assetimage' ? session?.asset_image_url : session?.barcode_image_url;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      <CompactHeader
        title="Capture"
        variant="dark"
        left={<BackButton label="Back" onClick={() => navigate(routes.photos)} variant="dark" />}
      />
      <main className="flex flex-1 flex-col gap-5 p-5 pb-8">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={slot === 'assetimage' ? 'Asset preview' : 'Barcode preview'}
            className="max-h-[38dvh] w-full rounded-2xl border border-white/20 object-contain"
          />
        ) : (
          <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 px-6 text-center text-sm text-white/60">
            No photo yet — open the camera below
          </div>
        )}

        <p className="text-center text-sm text-white/80">
          {slot === 'assetimage'
            ? 'Main asset photo (optional)'
            : 'Barcode / tag photo (optional)'}
        </p>

        <div className="flex justify-center gap-2">
          <Button
            variant={slot === 'assetimage' ? 'primary' : 'outline'}
            size="sm"
            className={cn(slot !== 'assetimage' && darkTabClass)}
            onClick={() => setSlot('assetimage')}
          >
            Asset {hasAsset ? '✓' : ''}
          </Button>
          <Button
            variant={slot === 'barcodeimage' ? 'primary' : 'outline'}
            size="sm"
            className={cn(slot !== 'barcodeimage' && darkTabClass)}
            onClick={() => setSlot('barcodeimage')}
          >
            Barcode {hasBarcode ? '✓' : ''}
          </Button>
        </div>

        <Button onClick={capture} disabled={uploading} className="min-h-12 w-full text-base">
          {uploading ? 'Uploading…' : 'Open camera'}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {error && <p className="text-center text-sm text-red-300">{error}</p>}

        <Button
          variant="outline"
          className={cn('mt-auto min-h-12 w-full', darkTabClass)}
          onClick={() => navigate(routes.photos)}
        >
          Done — back to photos
        </Button>
      </main>
    </div>
  );
}
