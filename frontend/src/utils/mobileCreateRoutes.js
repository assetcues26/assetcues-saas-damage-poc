import { SESSION_MODE_FULL_MOBILE, SESSION_MODE_IMAGES_ONLY } from '../components/saas/assetFormConfig';

/**
 * Route helpers for mobile asset-create flows.
 * @param {string} token
 * @param {'images_only' | 'full_mobile'} [mode]
 */
export function mobileCreateRoutes(token, mode = SESSION_MODE_FULL_MOBILE) {
  const base = `/assets/create/mobile/${encodeURIComponent(token)}`;
  const photosOnly = mode === SESSION_MODE_IMAGES_ONLY;

  return {
    details: base,
    photos: photosOnly ? `${base}/photos` : `${base}/add-photos`,
    capture: photosOnly ? `${base}/photos/capture` : `${base}/capture`,
    upload: photosOnly ? `${base}/photos/upload` : `${base}/upload`,
    done: photosOnly ? `${base}/photos/done` : `${base}/done`,
    created: `${base}/done`,
  };
}

export function resolveMobileCreateMode(draft) {
  if (draft?._session_mode === SESSION_MODE_IMAGES_ONLY) return SESSION_MODE_IMAGES_ONLY;
  return SESSION_MODE_FULL_MOBILE;
}
