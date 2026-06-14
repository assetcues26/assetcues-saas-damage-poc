import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { ImageLightbox } from '../components/result/ImageLightbox';
import { exportAssetReportPdf } from '../services/assetReportPdf';
import { CompactHeader } from '../components/layout/AppHeader';
import { BackButton } from '../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { AssetResultCard } from '../components/result/AssetResultCard';
import { PageWrapper } from '../components/layout/PageWrapper';
import { HeroSection } from '../components/layout/HeroSection';
import { useHistory } from '../hooks/useHistory';
import { useBatch } from '../hooks/useBatch';
import { useApp } from '../context/AppContext';
import { buildResultGallery } from '../utils/blobUrls';

export function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntryById, ensureEntry, isSaved, hydrated } = useHistory();
  const [resolvedEntry, setResolvedEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const { clearBatch } = useBatch();
  const { lastResult, showToast } = useApp();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const entry =
    resolvedEntry ||
    getEntryById(id) ||
    (lastResult?.id === id || lastResult?.request_id === id ? lastResult : null);

  useEffect(() => {
    if (!hydrated || !id) return;
    const cached = getEntryById(id);
    if (cached) {
      setResolvedEntry(cached);
      return;
    }
    if (lastResult?.id === id || lastResult?.request_id === id) {
      setResolvedEntry(lastResult);
      return;
    }

    let cancelled = false;
    setLoadingEntry(true);
    ensureEntry(id)
      .then((fetched) => {
        if (!cancelled) setResolvedEntry(fetched);
      })
      .finally(() => {
        if (!cancelled) setLoadingEntry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, id, getEntryById, ensureEntry, lastResult]);

  useEffect(() => {
    if (!hydrated || loadingEntry) return;
    if (!entry) {
      const t = setTimeout(() => {
        if (!getEntryById(id) && !lastResult) navigate('/', { replace: true });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [entry, hydrated, loadingEntry, id, getEntryById, lastResult, navigate]);

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-gray-600">
        {loadingEntry ? 'Loading report…' : 'Report not found'}
      </div>
    );
  }

  const galleryImages = buildResultGallery(entry);
  const saved = entry.saved_to_db || isSaved(entry.request_id);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportAssetReportPdf(entry);
      showToast('PDF report downloaded', 'success');
    } catch (err) {
      showToast(err?.message || 'Could not generate PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-zinc-50">
      <div className="shrink-0">
        <CompactHeader
          title="Asset Report"
          left={<BackButton label="New Scan" onClick={() => navigate('/')} />}
        />
      </div>

      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <HeroSection>
          <PageWrapper className="py-6 pb-8">
            <AssetResultCard
              result={entry}
              images={entry.previewUrls || []}
              onImageClick={setLightboxIndex}
              activeLightboxIndex={lightboxIndex}
            />
          </PageWrapper>
        </HeroSection>
      </main>

      <footer className="z-10 flex shrink-0 flex-wrap gap-3 border-t border-gray-200 bg-white/95 p-4 pb-safe backdrop-blur-md">
        <Button
          variant="outline"
          className="min-w-[7rem] flex-1"
          onClick={() => {
            clearBatch();
            navigate('/');
          }}
        >
          New Scan
        </Button>
        <Button
          variant="outline"
          className="min-w-[7rem] flex-1"
          disabled={exportingPdf}
          onClick={handleExportPdf}
        >
          <FileDown className="me-2 shrink-0" size={18} aria-hidden />
          {exportingPdf ? 'Generating…' : 'Download PDF'}
        </Button>
        <Button
          variant="primary"
          className="min-w-[7rem] flex-1"
          onClick={() => navigate('/history')}
        >
          View in History
        </Button>
      </footer>

      <ImageLightbox
        imageUrl={
          lightboxIndex != null ? galleryImages[lightboxIndex] || null : null
        }
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
