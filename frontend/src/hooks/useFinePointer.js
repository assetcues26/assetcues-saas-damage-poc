import { useEffect, useState } from 'react';

/** True on desktop with mouse; false on most phones/tablets (touch). */
export function useFinePointer() {
  const [finePointer, setFinePointer] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return finePointer;
}
