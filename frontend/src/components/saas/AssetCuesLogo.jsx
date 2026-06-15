import { BrandLogo } from '../layout/BrandLogo';

/**
 * AssetCues brand mark — uses the same logo asset as the asset analysis app (BrandLogo).
 * @param {{
 *   className?: string,
 *   variant?: 'sidebar' | 'default' | 'watermark' | 'mobile',
 * }} props
 */
export function AssetCuesLogo({ className = '', variant = 'default' }) {
  const sizeClass =
    variant === 'sidebar'
      ? 'h-7 w-auto max-w-[130px] sm:h-9 sm:max-w-[160px]'
      : variant === 'watermark'
        ? 'h-24 w-auto max-w-[280px] sm:h-40 sm:max-w-[480px] md:h-56 md:max-w-[560px]'
        : variant === 'mobile'
          ? 'h-6 w-auto max-w-[120px] sm:h-8 sm:max-w-[160px]'
          : 'h-7 w-auto max-w-[150px] sm:h-8 sm:max-w-[180px]';

  return (
    <BrandLogo
      className={`select-none object-contain object-left ${sizeClass} ${className}`}
    />
  );
}
