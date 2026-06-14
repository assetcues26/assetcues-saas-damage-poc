import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

const STATUS_VARIANT = {
  pending: 'default',
  analyzing: 'info',
  pass: 'success',
  fail: 'danger',
  error: 'warning',
  ai_disabled: 'warning',
};

const STATUS_LABEL = {
  ai_disabled: 'AI OFF',
};

/**
 * @param {{ status: string, onClick?: () => void }} props
 */
export function AiStatusBadge({ status, onClick }) {
  const normalized = status || 'pending';
  const variant = STATUS_VARIANT[normalized] || 'default';
  const clickable = Boolean(onClick);
  const Tag = clickable ? 'button' : 'span';

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      className={
        clickable
          ? 'cursor-pointer rounded-md transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400'
          : 'inline-block'
      }
      title={clickable ? 'View validation details' : undefined}
    >
      <Badge variant={variant} className="inline-flex items-center gap-1 whitespace-nowrap">
        {normalized === 'analyzing' && <Spinner className="h-3 w-3" />}
        {STATUS_LABEL[normalized] || normalized.toUpperCase()}
      </Badge>
    </Tag>
  );
}

/**
 * @param {{ label?: string, value: 'Y'|'N'|null|undefined }} props
 */
export function MatchBadge({ label, value }) {
  if (!value) {
    if (label) {
      return (
        <span className="text-xs text-gray-400" title={`${label} check pending`}>
          {label}: —
        </span>
      );
    }
    return <span className="text-gray-400">—</span>;
  }
  const pass = value === 'Y';
  const text = label ? `${label}: ${pass ? '✓' : '✗'}` : pass ? 'Pass' : 'Fail';
  return (
    <Badge variant={pass ? 'success' : 'danger'} className="text-xs whitespace-nowrap">
      {text}
    </Badge>
  );
}
