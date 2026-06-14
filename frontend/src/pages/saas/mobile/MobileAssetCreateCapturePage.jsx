import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CompactHeader } from '../../../components/layout/AppHeader';
import { BackButton } from '../../../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';

export function MobileAssetCreateCapturePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isPhotosFlow = location.pathname.includes('/photos/');
  const { session, uploadImage, uploading, error } = useAssetCreateSession(token);
  const [slot, setSlot] = useState('assetimage');
  const inputRef = useRef(null);

  const hasAsset = Boolean(session?.asset_image_url);
  const hasBarcode = Boolean(session?.barcode_image_url);
  const backPath = isPhotosFlow
    ? `/assets/create/mobile/${token}/photos`
    : `/assets/create/mobile/${token}`;
  const donePath = isPhotosFlow
    ? `/assets/create/mobile/${token}/photos/done`
    : `/assets/create/mobile/${token}`;

  const capture = () => inputRef.current?.click();

  const onFile = async (file) => {
    if (!file) return;
    await uploadImage(slot, file);
    if (slot === 'assetimage' && !hasBarcode) {
      setSlot('barcodeimage');
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      <CompactHeader
        title="Capture"
        variant="dark"
        left={<BackButton label="Back" onClick={() => navigate(backPath)} variant="dark" />}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-sm text-white/70">
          {slot === 'assetimage' ? 'Capture main asset photo' : 'Capture barcode / tag (optional)'}
        </p>
        <div className="flex gap-2">
          <Button
            variant={slot === 'assetimage' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSlot('assetimage')}
          >
            Asset {hasAsset ? '✓' : ''}
          </Button>
          <Button
            variant={slot === 'barcodeimage' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSlot('barcodeimage')}
          >
            Barcode {hasBarcode ? '✓' : ''}
          </Button>
        </div>
        <Button onClick={capture} disabled={uploading} className="min-w-[160px]">
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
        {error && <p className="text-sm text-red-300">{error}</p>}
        {hasAsset && (
          <Button variant="outline" onClick={() => navigate(donePath)}>
            {isPhotosFlow ? 'Done — sync to computer' : 'Back to form'}
          </Button>
        )}
      </main>
    </div>
  );
}
