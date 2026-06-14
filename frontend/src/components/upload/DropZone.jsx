import { useCallback, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Upload } from 'lucide-react';
import { Button } from '../ui/button';

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function DropZone({
  onFilesSelected,
  disabled,
  onRejectedFiles,
  inputId,
  title = 'Click to upload or drag and drop',
  subtitle = 'JPEG, PNG, or WebP. Select one file to preview first, or multiple files to add directly to your batch.',
  browseLabel = 'Browse Files',
  embedded = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const autoId = useId();
  const resolvedInputId = inputId || `file-upload-${autoId}`;

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList?.length || disabled) return;
      const all = Array.from(fileList);
      const files = all.filter((f) =>
        ACCEPT.split(',').some((t) => f.type === t.trim()),
      );
      const skipped = all.length - files.length;
      if (skipped > 0 && onRejectedFiles) {
        onRejectedFiles(skipped);
      }
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected, disabled, onRejectedFiles],
  );

  const zoneClass = embedded
    ? `flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:gap-5 sm:p-6 ${
        dragOver ? 'bg-blue-50/50' : ''
      }`
    : `flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 transition-colors duration-200 sm:gap-5 sm:p-10 ${
        dragOver
          ? 'border-blue-400 bg-blue-50/80'
          : 'border-gray-200 bg-white/80 backdrop-blur-sm'
      }`;

  return (
    <motion.div
      data-testid="drop-zone"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => {
        if (!disabled) document.getElementById(resolvedInputId)?.click();
      }}
      className={`${zoneClass} ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:h-16 sm:w-16">
        <Upload size={28} strokeWidth={1.75} className="sm:hidden" />
        <Upload size={32} strokeWidth={1.75} className="hidden sm:block" />
      </div>
      <div className="max-w-md text-center">
        <p className="text-base font-semibold text-gray-900 sm:text-lg">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{subtitle}</p>
      </div>
      <label htmlFor={resolvedInputId} onClick={(e) => e.stopPropagation()}>
        <Button
          variant="default"
          onClick={() => document.getElementById(resolvedInputId)?.click()}
          ariaLabel={browseLabel}
        >
          <ImagePlus size={18} strokeWidth={2} aria-hidden />
          {browseLabel}
        </Button>
      </label>
      <input
        id={resolvedInputId}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}
