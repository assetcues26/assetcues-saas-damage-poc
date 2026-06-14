/** Backend base URL — required for production builds (set in CI / hosting env). */
function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_ASSET_ANALYSIS_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_ASSET_ANALYSIS_API_BASE is not set. Configure it for production deployments.',
    );
  }

  return 'http://localhost:8000';
}

export const ASSET_ANALYSIS_API_BASE = resolveApiBase();

export const ASSET_ANALYSIS_ENDPOINTS = {
  collage: `${ASSET_ANALYSIS_API_BASE}/v1/assets/analyze/collage`,
  multi: `${ASSET_ANALYSIS_API_BASE}/v1/assets/analyze/multi`,
};

export const V6_ERP_ANALYZE_ENDPOINT = `${ASSET_ANALYSIS_API_BASE}/v6/demo/analyze/multi`;
export const V6_ERP_CATALOG_ENDPOINT = `${ASSET_ANALYSIS_API_BASE}/v6/demo/catalog`;
