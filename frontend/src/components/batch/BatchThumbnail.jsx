import { X } from 'lucide-react';

export function BatchThumbnail({ image, index, onRemove, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-16 w-16' : 'aspect-square w-full';

  return (
    <div className={`group relative shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white ${sizeClass}`}>
      {index != null && (
        <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-gray-900/75 px-1.5 py-0.5 text-xs font-bold text-white">
          {index}
        </span>
      )}
      <img
        src={image.previewUrl}
        alt={image.name || `Batch image ${index}`}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white opacity-90 transition-opacity hover:bg-red-500"
        aria-label={`Remove image ${index ?? ''}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
