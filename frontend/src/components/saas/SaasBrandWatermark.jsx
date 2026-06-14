import { AssetCuesLogo } from './AssetCuesLogo';

export function SaasBrandWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <AssetCuesLogo
        variant="watermark"
        className="opacity-[0.04] sm:opacity-[0.05]"
      />
    </div>
  );
}
