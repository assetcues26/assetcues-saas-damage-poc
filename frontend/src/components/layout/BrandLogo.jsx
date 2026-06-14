import assetCuesLogo from '../../assets/AssetCues-Logo 1.png';

/** Static logo for header/footer (no animation). */
export function BrandLogo({ className = 'h-8 w-auto' }) {
  return (
    <img
      src={assetCuesLogo}
      alt="AssetCues"
      className={className}
    />
  );
}
