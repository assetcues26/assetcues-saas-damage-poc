import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { ImageLightbox } from '../../components/result/ImageLightbox';
import { exportAssetReportPdf } from '../../services/assetReportPdf';
import { CompactHeader } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { AssetResultCard } from '../../components/result/AssetResultCard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { HeroSection } from '../../components/layout/HeroSection';
import { useV6 } from '../../hooks/useV6';
import { useApp } from '../../context/AppContext';
import { buildResultGallery } from '../../utils/blobUrls';
import { TagZoomOverlay } from '../../components/result/TagZoomOverlay';

export function V6ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSessionResultById } = useV6();
  const { showToast } = useApp();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const entry = getSessionResultById(id);

  useEffect(() => {
    if (!entry) {
      const t = setTimeout(() => {
        if (!getSessionResultById(id)) navigate('/v6', { replace: true });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [entry, id, getSessionResultById, navigate]);

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-gray-600">
        Loading report…
      </div>
    );
  }

  const galleryImages = buildResultGallery(entry);
  const tagZoomHint = entry.erp_verification?.tag_zoom_hint ?? null;
  const tagImageIndex =
    tagZoomHint?.image_index != null ? tagZoomHint.image_index - 1 : null;
  const showTagZoom =
    tagZoomHint &&
    (tagImageIndex == null || tagImageIndex === lightboxIndex);

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
          title="V6 Report"
          left={
            <BackButton label="Catalog" onClick={() => navigate('/v6')} />
          }
        />
      </div>

      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <HeroSection>
          <PageWrapper className="py-6 pb-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-blue-600">
              {entry.prompt_version ? `Analysis version: ${entry.prompt_version}` : null}
            </p>
            <AssetResultCard
              result={entry}
              images={entry.previewUrls || []}
              onImageClick={setLightboxIndex}
              activeLightboxIndex={lightboxIndex}
            />
          </PageWrapper>
        </HeroSection>
      </main>

      <footer className="shrink-0 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-md pb-safe">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/v6/asset/${entry.erpContext?.catalog_id || ''}`)}
          >
            New scan
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={exportingPdf}
            onClick={handleExportPdf}
          >
            <FileDown size={16} className="mr-2" />
            {exportingPdf ? 'Exporting…' : 'Download PDF'}
          </Button>
        </div>
      </footer>

      <ImageLightbox
        imageUrl={
          lightboxIndex != null ? galleryImages[lightboxIndex] || null : null
        }
        onClose={() => setLightboxIndex(null)}
        zIndexClass="z-[100]"
      >
        <TagZoomOverlay
          src={galleryImages[lightboxIndex]}
          alt=""
          tagZoomHint={showTagZoom ? tagZoomHint : null}
          className="max-h-[90vh] max-w-full object-contain"
        />
      </ImageLightbox>
    </div>
  );
}
