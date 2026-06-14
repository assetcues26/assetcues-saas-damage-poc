import { useNavigate, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useMobileSession } from '../../hooks/useMobileSession';

export function MobileWaitingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { imageCount } = useMobileSession(token);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <PageWrapper className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <Clock className="text-indigo-500" size={48} aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Waiting for analysis</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-600">
          On your laptop, open Batch and tap Proceed to analyze. This page updates automatically
          when analysis starts.
        </p>
        <p className="mt-4 text-xs text-gray-500">{imageCount} image{imageCount === 1 ? '' : 's'} ready</p>

        <Button
          variant="outline"
          className="mt-8"
          onClick={() => navigate(`/scan/${token}/done`)}
        >
          Done adding
        </Button>
      </PageWrapper>
    </div>
  );
}
