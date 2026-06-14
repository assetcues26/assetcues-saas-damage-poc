import { AnimatePresence, motion } from 'framer-motion';
import { BatchThumbnail } from './BatchThumbnail';

export function BatchTray({ images, maxImages, onRemove, showCounter = true, theme = 'light' }) {
  const isDark = theme === 'dark';
  if (!images.length && !showCounter) return null;

  return (
    <AnimatePresence>
      {(images.length > 0 || showCounter) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex items-center gap-3 px-4 py-2"
        >
          {showCounter && (
            <span
              className={`shrink-0 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {images.length} / {maxImages}
            </span>
          )}
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {images.map((img, idx) => (
              <BatchThumbnail
                key={img.id}
                image={img}
                index={idx + 1}
                onRemove={onRemove}
                size="sm"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
