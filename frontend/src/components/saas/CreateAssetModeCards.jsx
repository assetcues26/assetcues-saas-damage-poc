import { Monitor, Smartphone } from 'lucide-react';

/**
 * @param {{
 *   value: 'web' | 'mobile' | null,
 *   onChange: (mode: 'web' | 'mobile') => void,
 * }} props
 */
export function CreateAssetModeCards({ value, onChange }) {
  const cardClass = (active) =>
    `touch-manipulation rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 sm:p-6 ${
      active
        ? 'border-blue-300 ring-2 ring-blue-500/25'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      <button
        type="button"
        onClick={() => onChange('web')}
        className={`${cardClass(value === 'web')} text-left`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Monitor size={28} strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Create here</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Fill the asset form on this screen. Upload photos from your computer or scan a QR code to
          add them from your phone.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`${cardClass(value === 'mobile')} text-left`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Smartphone size={28} strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Create using mobile</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Scan a QR code to open the full form on your phone with capture or upload for asset and
          barcode images.
        </p>
      </button>
    </div>
  );
}
