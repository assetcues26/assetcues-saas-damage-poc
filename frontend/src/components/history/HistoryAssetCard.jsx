import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, FileDown, Package, Trash } from 'lucide-react';
import { exportAssetReportPdf } from '../../services/assetReportPdf';
import { isFullHistoryEntry } from '../../services/historyApi';
import { useApp } from '../../context/AppContext';
import { useHistory } from '../../hooks/useHistory';
import { Button } from '@/components/ui/button';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card-effect';
import { ConditionBadge } from '../ui/ConditionBadge';
import { ConfirmModal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { formatRelativeTime } from '../../utils/formatters';
import {
  getHistoryCardImageUrl,
  hasHistoryCardImage,
} from './historyCardImages';
import { AssetResultCard } from '../result/AssetResultCard';
import { ImageLightbox } from '../result/ImageLightbox';
import { buildResultGallery } from '../../utils/blobUrls';

export function HistoryAssetCard({ entry, onDelete, expanded, onToggleExpand, index = 0 }) {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { ensureEntry, loadingEntryIds } = useHistory();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [imgSrc, setImgSrc] = useState(() => getHistoryCardImageUrl(entry));
  const hasStoredImages = hasHistoryCardImage(entry);

  useEffect(() => {
    if (!expanded) {
      setDetailEntry(null);
      setLoadError(null);
      setLightboxIndex(null);
      return undefined;
    }

    if (isFullHistoryEntry(entry)) {
      setDetailEntry(entry);
      return undefined;
    }

    let cancelled = false;
    setLoadError(null);
    ensureEntry(entry.id)
      .then((fetched) => {
        if (cancelled) return;
        if (fetched) {
          setDetailEntry(fetched);
        } else {
          setLoadError('Could not load report details');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load report details');
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, entry, ensureEntry]);

  const loadingDetail =
    expanded && loadingEntryIds.has(entry.id) && !detailEntry && !loadError;
  const reportEntry = detailEntry || (isFullHistoryEntry(entry) ? entry : null);
  const galleryImages = reportEntry ? buildResultGallery(reportEntry) : [];

  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const toggle = () => onToggleExpand(expanded ? null : entry.id);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`w-full min-w-0 max-w-full ${expanded ? 'max-w-4xl' : ''} justify-self-stretch`}
    >
      <CardContainer
        enableTilt={!expanded}
        containerClassName="py-0"
        className="w-full"
      >
        <CardBody className="group/card relative w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xl transition-shadow hover:shadow-2xl hover:shadow-blue-500/10 sm:p-5">
          <CardItem translateZ={50} className="w-full text-neutral-800">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <ConditionBadge
                  condition={entry.conditionDetail?.grade ?? entry.condition}
                  overallScore={entry.conditionDetail?.overall_score}
                />
                <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug break-words sm:text-xl">
                  {entry.asset_name}
                </h3>
                <p className="mt-1 truncate font-mono text-xs text-neutral-500">
                  {entry.detected_tag_number_raw}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {formatRelativeTime(entry.processedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                aria-label="Delete asset"
                className="z-10 min-h-11 shrink-0 touch-manipulation border-0 bg-red-600 px-3 text-white shadow-lg hover:bg-red-700 focus-visible:bg-red-700"
              >
                <Trash className="-ms-1 me-1.5 shrink-0" size={16} strokeWidth={2} aria-hidden />
                Delete
              </Button>
            </div>
          </CardItem>

          <CardItem translateZ={80} className="relative z-10 mt-4 w-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-[16/10]">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={entry.asset_name}
                  className="h-full w-full object-cover transition-shadow group-hover/card:shadow-lg"
                  onError={() => setImgSrc(null)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                  <Package size={40} aria-hidden />
                  <span className="text-xs text-gray-500">No preview image</span>
                </div>
              )}
            </div>
          </CardItem>

          <CardItem translateZ={30} className="mt-4 w-full">
            <Button
              type="button"
              variant="destructive"
              onClick={toggle}
              aria-expanded={expanded}
              className="min-h-12 w-full touch-manipulation border-0 bg-red-600 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:bg-red-700 sm:min-h-11 sm:text-sm"
            >
              {expanded ? (
                <>
                  <ChevronUp className="me-2 shrink-0" size={18} aria-hidden />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="me-2 shrink-0" size={18} aria-hidden />
                  View details
                </>
              )}
            </Button>
          </CardItem>
        </CardBody>
      </CardContainer>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="space-y-5 p-4 sm:p-6">
              {loadingDetail && (
                <div className="flex flex-col items-center gap-3 py-10 text-gray-600">
                  <Spinner size={36} />
                  <p className="text-sm">Loading report…</p>
                </div>
              )}

              {loadError && !loadingDetail && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm text-amber-900">{loadError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => navigate(`/result/${entry.id}`)}
                  >
                    <ExternalLink className="me-2 shrink-0" size={16} aria-hidden />
                    Open full report
                  </Button>
                </div>
              )}

              {reportEntry && !loadingDetail && (
                <>
                  <AssetResultCard
                    result={reportEntry}
                    images={reportEntry.previewUrls || []}
                    onImageClick={setLightboxIndex}
                    activeLightboxIndex={lightboxIndex}
                    showExport={false}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/result/${entry.id}`)}
                    >
                      <ExternalLink className="me-2 shrink-0" size={16} aria-hidden />
                      Open full report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={exportingPdf}
                      onClick={async () => {
                        setExportingPdf(true);
                        try {
                          await exportAssetReportPdf(reportEntry);
                          showToast('PDF report downloaded', 'success');
                        } catch (err) {
                          showToast(err?.message || 'Could not generate PDF', 'error');
                        } finally {
                          setExportingPdf(false);
                        }
                      }}
                    >
                      <FileDown className="me-2 shrink-0" size={16} aria-hidden />
                      {exportingPdf ? 'Generating…' : 'Download PDF'}
                    </Button>
                  </div>
                </>
              )}

              {!reportEntry && !loadingDetail && !loadError && !hasStoredImages && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Package size={16} aria-hidden />
                  No preview image stored for this scan
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox
        imageUrl={
          lightboxIndex != null ? galleryImages[lightboxIndex] || null : null
        }
        onClose={() => setLightboxIndex(null)}
        zIndexClass="z-[80]"
      />

      <ConfirmModal
        open={confirmOpen}
        title="Delete asset?"
        description={`Remove "${entry.asset_name}" from your history? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await onDelete(entry.id);
            setConfirmOpen(false);
          } catch {
            showToast('Could not delete — try again', 'error');
          }
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </motion.article>
  );
}
