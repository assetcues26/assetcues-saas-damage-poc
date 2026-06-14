import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';
import { LogoElementVideo } from '../../components/layout/LogoElementVideo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useMobileSession } from '../../hooks/useMobileSession';

export function MobileScanLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { error, loading, imageCount, maxImages, canAdd } = useMobileSession(token);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 text-gray-600">
        Loading…
      </div>
    );
  }

  if (error || !canAdd) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center">
        <p className="text-lg font-semibold text-gray-900">Link unavailable</p>
        <p className="max-w-sm text-sm text-gray-600">
          {error || 'This session is no longer accepting images.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <PageWrapper className="flex flex-1 flex-col py-8">
        <div className="flex flex-col items-center text-center">
          <LogoElementVideo className="h-24 w-24 sm:h-28 sm:w-28" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Add asset photos</h1>
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            Capture or upload images here — they sync to your laptop batch automatically. Analyze
            from your computer when ready.
          </p>
          <Badge variant="count" className="mt-4">
            {imageCount} / {maxImages} images
          </Badge>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-md gap-4">
          <Card
            hover
            onClick={() => navigate(`/scan/${token}/capture`)}
            className="touch-manipulation p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Camera size={24} />
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900">Take photo</h2>
            <p className="mt-1 text-sm text-gray-600">
              Snap one photo at a time — each adds to the batch on your laptop automatically.
            </p>
          </Card>

          <Card
            hover
            onClick={() => navigate(`/scan/${token}/upload`)}
            className="touch-manipulation p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Upload size={24} />
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900">Upload photos</h2>
            <p className="mt-1 text-sm text-gray-600">Select multiple images from your gallery.</p>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}
