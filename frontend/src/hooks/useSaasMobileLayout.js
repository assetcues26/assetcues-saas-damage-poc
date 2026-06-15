import { useEffect, useState } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';

function getMatchesMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/** True when the SaaS shell should use phone layout (no sidebar, bottom nav). */
export function useSaasMobileLayout() {
  const [isMobile, setIsMobile] = useState(getMatchesMobile);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
