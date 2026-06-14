import { CompactHeader } from '../layout/AppHeader';
import { HeroSection } from '../layout/HeroSection';
import { BackButton } from '../ui/BackButton';
import { SaasBrandWatermark } from './SaasBrandWatermark';

/**
 * Full-page SaaS flow shell — matches POC upload/capture layout (header + aurora hero).
 * @param {{
 *   title: string,
 *   onBack?: () => void,
 *   backLabel?: string,
 *   children: import('react').ReactNode,
 *   footer?: import('react').ReactNode,
 * }} props
 */
export function SaasFlowPageLayout({ title, onBack, backLabel = 'Back', children, footer }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-zinc-50">
      <SaasBrandWatermark />
      <CompactHeader
        title={title}
        left={onBack ? <BackButton label={backLabel} onClick={onBack} /> : undefined}
      />
      <HeroSection fill className="flex-1">
        <div className="relative z-[1]">{children}</div>
      </HeroSection>
      {footer}
    </div>
  );
}
