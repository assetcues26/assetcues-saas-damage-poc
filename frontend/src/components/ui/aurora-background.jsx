import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
/**
 * Animated aurora backdrop. Use `contained` inside hero sections (not full viewport).
 */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  contained = false,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col bg-zinc-50 text-slate-950',
        contained
          ? 'min-h-0 h-auto items-stretch justify-start overflow-hidden'
          : 'min-h-screen h-[100vh] items-center justify-center isolate',
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          data-aurora-layer
          className={cn(
            'aurora-backdrop-layer',
            contained ? 'aurora-backdrop-layer--contained' : 'aurora-backdrop-layer--viewport',
            showRadialGradient && 'aurora-backdrop-layer--masked',
          )}
        />
      </div>
      {children}
    </div>
  );
}