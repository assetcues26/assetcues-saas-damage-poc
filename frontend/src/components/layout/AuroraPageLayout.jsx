import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { HeroSection } from './HeroSection';

/**
 * Standard page shell: header + full-height aurora main + footer.
 */
export function AuroraPageLayout({ children, heroClassName }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-50">
      <AppHeader />
      <HeroSection fill className={cn('flex-1', heroClassName)}>
        {children}
      </HeroSection>
      <AppFooter />
    </div>
  );
}
