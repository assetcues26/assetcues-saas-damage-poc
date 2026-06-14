import { ASSET_FORM_FIELDS, isRequiredFieldSatisfied } from '../assetFormConfig';

const REQUIRED_KEYS = ASSET_FORM_FIELDS.filter((f) => f.required).map((f) => f.key);

/**
 * @param {{ values: Record<string, string> }} props
 */
export function MobileFormProgress({ values }) {
  const filled = REQUIRED_KEYS.filter((k) => isRequiredFieldSatisfied(values, k)).length;
  const total = REQUIRED_KEYS.length;
  const pct = total ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>{filled} of {total} required fields</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
