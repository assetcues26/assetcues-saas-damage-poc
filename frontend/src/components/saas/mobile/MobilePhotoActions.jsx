import { Camera, ImagePlus } from 'lucide-react';
import { Card } from '../../ui/Card';

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   icon: 'camera' | 'upload',
 *   onClick: () => void,
 *   disabled?: boolean,
 * }} props
 */
export function MobilePhotoActionCard({ title, description, icon, onClick, disabled }) {
  const Icon = icon === 'camera' ? Camera : ImagePlus;
  const iconWrap =
    icon === 'camera'
      ? 'bg-blue-50 text-blue-600'
      : 'bg-indigo-50 text-indigo-600';

  return (
    <Card
      hover={!disabled}
      onClick={disabled ? undefined : onClick}
      className={`touch-manipulation p-5 transition-transform active:scale-[0.99] ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
          <Icon size={28} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * @param {{ assetUrl?: string | null, barcodeUrl?: string | null }} props
 */
export function MobilePhotoPreviewGrid({ assetUrl, barcodeUrl }) {
  if (!assetUrl && !barcodeUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-700">No photos yet</p>
        <p className="mt-1 text-xs text-gray-500">Capture or upload below — both are optional</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {assetUrl && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Asset photo</p>
          <img
            src={assetUrl}
            alt="Asset"
            className="h-40 w-full rounded-2xl border border-gray-200 object-cover shadow-sm"
          />
        </div>
      )}
      {barcodeUrl && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Barcode photo</p>
          <img
            src={barcodeUrl}
            alt="Barcode"
            className="h-28 w-full rounded-2xl border border-gray-200 object-cover shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
