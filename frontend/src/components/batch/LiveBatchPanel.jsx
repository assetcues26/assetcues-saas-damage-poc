import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone, X } from 'lucide-react';
import { BatchThumbnail } from './BatchThumbnail';
import { ProceedButton } from '../ui/ProceedButton';

/**
 * Live-updating batch panel for phone-synced images on laptop upload/capture screens.
 */
export function LiveBatchPanel({
  open,
  onClose,
  images,
  maxImages,
  onRemove,
  onProceed,
  sessionImageCount = 0,
}) {
  const count = images.length;
  const hasPhoneImages = sessionImageCount > 0;

  return (
    <AnimatePresence>
      {open && count > 0 && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-3 pb-safe sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-batch-panel-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close batch panel"
          />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative z-10 flex max-h-[min(85dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {hasPhoneImages && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Smartphone size={16} aria-hidden />
                    </span>
                  )}
                  <h2 id="live-batch-panel-title" className="text-base font-semibold text-gray-900">
                    {hasPhoneImages ? 'Photos from your phone' : 'Current batch'}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {hasPhoneImages
                    ? `${sessionImageCount} synced from phone — updates live as you capture`
                    : `${count} image${count === 1 ? '' : 's'} ready`}
                  {' · '}
                  {count} / {maxImages}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <BatchThumbnail
                    key={img.id}
                    image={img}
                    index={idx + 1}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <ProceedButton
                label="Proceed to Analysis"
                count={count}
                onClick={onProceed}
                className="w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
