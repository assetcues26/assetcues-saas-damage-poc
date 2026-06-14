import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   count: number,
 *   onRetry: () => void,
 *   retrying?: boolean,
 *   className?: string,
 *   variant?: 'light' | 'dark',
 * }} props
 */
export function MobileSyncFailedBanner({
  count,
  onRetry,
  retrying = false,
  className,
  variant = 'light',
}) {
  if (!count) return null;

  const label = count === 1 ? '1 photo' : `${count} photos`;
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-left',
        isDark
          ? 'border-amber-500/40 bg-amber-950/50'
          : 'border-amber-200 bg-amber-50',
        className,
      )}
      role="alert"
    >
      <p className={cn('text-sm', isDark ? 'text-amber-100' : 'text-amber-900')}>
        {label} couldn&apos;t sync — check your connection and tap Retry.
      </p>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="mt-2"
        disabled={retrying}
        onClick={onRetry}
      >
        {retrying ? 'Retrying…' : 'Retry sync'}
      </Button>
    </div>
  );
}
