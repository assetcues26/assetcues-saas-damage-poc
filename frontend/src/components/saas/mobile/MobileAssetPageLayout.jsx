import { CompactHeader } from '../../layout/AppHeader';
import { HeroSection } from '../../layout/HeroSection';
import { PageWrapper } from '../../layout/PageWrapper';
import { BackButton } from '../../ui/BackButton';
import { SaasBrandWatermark } from '../SaasBrandWatermark';

/**
 * Mobile asset-create screen shell with optional back navigation.
 * @param {{
 *   title: string,
 *   onBack?: () => void,
 *   backLabel?: string,
 *   variant?: 'light' | 'dark',
 *   children: import('react').ReactNode,
 *   wrapperClassName?: string,
 * }} props
 */
export function MobileAssetPageLayout({
  title,
  onBack,
  backLabel = 'Back',
  variant = 'light',
  children,
  wrapperClassName = 'py-6 pb-8',
}) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`relative flex min-h-[100dvh] flex-col overflow-x-hidden ${
        isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50'
      }`}
    >
      {!isDark && <SaasBrandWatermark />}
      <CompactHeader
        title={title}
        variant={variant}
        left={onBack ? <BackButton label={backLabel} onClick={onBack} variant={variant} /> : undefined}
      />
      <HeroSection fill className="flex-1">
        <PageWrapper className={`relative z-[1] ${wrapperClassName}`}>{children}</PageWrapper>
      </HeroSection>
    </div>
  );
}
