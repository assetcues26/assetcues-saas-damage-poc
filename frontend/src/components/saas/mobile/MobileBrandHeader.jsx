import { AssetCuesLogo } from '../AssetCuesLogo';

/**
 * Consistent AssetCues mark for mobile SaaS flows.
 * @param {{ title?: string, subtitle?: string, className?: string }} props
 */
export function MobileBrandHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <AssetCuesLogo variant="mobile" className="mx-auto" />
      {title && <h1 className="mt-3 text-xl font-bold text-gray-900 sm:mt-4 sm:text-2xl">{title}</h1>}
      {subtitle && (
        <p className="mx-auto mt-2 max-w-md px-1 text-sm leading-relaxed text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}
