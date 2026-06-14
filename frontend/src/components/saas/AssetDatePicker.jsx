/**
 * Native date input that syncs DD-MM-YYYY string values.
 *
 * @param {{ value: string, onChange: (ddmmyyyy: string) => void, required?: boolean }} props
 */
export function AssetDatePicker({ value, onChange, required = false }) {
  const toInput = (ddmmyyyy) => {
    const m = String(ddmmyyyy || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) return '';
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const fromInput = (iso) => {
    if (!iso) return '';
    const [y, mo, d] = iso.split('-');
    if (!y || !mo || !d) return '';
    return `${d.padStart(2, '0')}-${mo.padStart(2, '0')}-${y}`;
  };

  return (
    <input
      type="date"
      required={required}
      value={toInput(value)}
      onChange={(e) => onChange(fromInput(e.target.value))}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
    />
  );
}
