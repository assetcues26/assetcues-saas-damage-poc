import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-open a live batch panel when phone-synced images arrive or increase.
 * @param {number} sessionImageCount
 */
export function usePhoneBatchPanel(sessionImageCount) {
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (sessionImageCount > prev) {
      setOpen(true);
    }
    prevCountRef.current = sessionImageCount;
  }, [sessionImageCount]);

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  return { open, openPanel, closePanel };
}
