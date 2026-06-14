/** Feature flags from Vite env (build-time). */
export const V6_DEMO_ENABLED = import.meta.env.VITE_V6_DEMO_ENABLED === 'true';
export const CAPTURE_SESSION_ENABLED =
  import.meta.env.VITE_CAPTURE_SESSION_ENABLED !== 'false';
export const SAAS_MODULE_ENABLED =
  import.meta.env.VITE_SAAS_MODULE_ENABLED === 'true';
