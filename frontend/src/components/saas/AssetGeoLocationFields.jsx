import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Latitude / longitude inputs with optional GPS capture (mobile-friendly).
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (key: string, value: string) => void,
 *   onPatch?: (patch: Record<string, string>) => void,
 *   compact?: boolean,
 *   labelClass?: string,
 *   inputClass?: string,
 * }} props
 */
export function AssetGeoLocationFields({
  values,
  onChange,
  onPatch,
  compact = false,
  labelClass = 'text-sm font-medium text-gray-700',
  inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm',
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const applyCoords = (latitude, longitude) => {
    const patch = {
      latitude: String(latitude),
      longitude: String(longitude),
    };
    if (onPatch) {
      onPatch(patch);
    } else {
      onChange('latitude', patch.latitude);
      onChange('longitude', patch.longitude);
    }
    setGpsError(null);
  };

  const captureGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('GPS is not available on this device or browser');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyCoords(
          position.coords.latitude.toFixed(6),
          position.coords.longitude.toFixed(6),
        );
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message || 'Could not get GPS location — check permissions');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 sm:col-span-2'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={labelClass}>Location coordinates</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={gpsLoading}
          onClick={captureGps}
        >
          <MapPin size={14} />
          {gpsLoading ? 'Getting GPS…' : 'Use GPS location'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Latitude</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 12.971600"
            value={values.latitude || ''}
            onChange={(e) => onChange('latitude', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 77.594600"
            value={values.longitude || ''}
            onChange={(e) => onChange('longitude', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
      <p className="text-xs text-gray-500">
        Optional — tap Use GPS location on mobile to fill coordinates automatically.
      </p>
    </div>
  );
}
