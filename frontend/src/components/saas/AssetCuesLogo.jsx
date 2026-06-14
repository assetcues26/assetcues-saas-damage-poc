import { BrandLogo } from '../layout/BrandLogo';

/**
 * AssetCues brand mark — uses the same logo asset as the asset analysis app (BrandLogo).
 * @param {{
 *   className?: string,
 *   variant?: 'sidebar' | 'default' | 'watermark',
 * }} props
 */
export function AssetCuesLogo({ className = '', variant = 'default' }) {
  const sizeClass =
    variant === 'sidebar'
      ? 'h-8 w-auto max-w-[160px] sm:h-9'
      : variant === 'watermark'
        ? 'h-40 w-auto max-w-[480px] sm:h-56 sm:max-w-[560px]'
        : 'h-8 w-auto max-w-[180px]';

  return (
    <BrandLogo
      className={`select-none object-contain object-left ${sizeClass} ${className}`}
    />
  );
}
