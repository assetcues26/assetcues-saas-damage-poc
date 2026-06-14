import { cn } from '@/lib/utils';
import { AuroraBackground } from '../ui/aurora-background';

/**
 * Hero-only aurora backdrop. Header/footer stay outside this wrapper.
 */
export function HeroSection({ children, className, fill = false }) {
  return (
    <AuroraBackground
      contained
      className={cn(
        'min-h-0 h-auto w-full shrink-0 items-stretch justify-start overflow-hidden',
        fill && 'flex-1',
        className,
      )}
    >
      <div className="relative z-[1] w-full">{children}</div>
    </AuroraBackground>
  );
}
