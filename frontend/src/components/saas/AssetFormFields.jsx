import { ASSET_FORM_FIELDS } from './assetFormConfig';

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (key: string, value: string) => void,
 *   compact?: boolean,
 *   fieldKeys?: string[],
 * }} props
 */
export function AssetFormFields({ values, onChange, compact = false, fieldKeys }) {
  const labelClass = compact ? 'text-xs font-medium text-gray-700' : 'text-sm font-medium text-gray-700';
  const inputClass =
    'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  const fields = fieldKeys
    ? ASSET_FORM_FIELDS.filter((f) => fieldKeys.includes(f.key))
    : ASSET_FORM_FIELDS;

  return (
    <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {fields.map((field) => (
        <div key={field.key} className={field.type === 'textarea' && !compact ? 'sm:col-span-2' : ''}>
          <label className={labelClass}>
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
            {field.optional && (
              <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
            )}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              rows={compact ? 2 : 3}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={inputClass}
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={values[field.key]}
              placeholder={field.placeholder || field.hint}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={inputClass}
            />
          )}
        </div>
      ))}
    </div>
  );
}
