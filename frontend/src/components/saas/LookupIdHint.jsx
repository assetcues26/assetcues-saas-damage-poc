/**
 * Read-only hint showing auto-selected lookup ID.
 */
export function LookupIdHint({ id, label = 'ID' }) {
  if (!id) return null;
  return (
    <p className="mt-1 text-xs text-gray-500">
      {label}: <span className="font-mono text-gray-700">{id}</span>
    </p>
  );
}
