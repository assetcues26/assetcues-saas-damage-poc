import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Fullscreen image viewer with open/close animation.
 * @param {{ imageUrl?: string | null, onClose: () => void, alt?: string, children?: import('react').ReactNode, zIndexClass?: string }} props
 */
export function ImageLightbox({
  imageUrl,
  onClose,
  alt = 'Fullscreen asset',
  children,
  zIndexClass = 'z-50',
}) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/90 p-4`}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-900 shadow-md transition-transform active:scale-95"
            onClick={onClose}
            aria-label="Close image preview"
          >
            <X size={24} />
          </button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {children || (
              <img
                src={imageUrl}
                alt={alt}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
