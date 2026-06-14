import { useEffect, useState } from 'react';

/**
 * @param {{ expiresAt: string | null | undefined }} props
 */
export function SessionExpiryCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return undefined;
    }
    const tick = () => {
      const end = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining == null) return null;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const expired = remaining <= 0;

  return (
    <p className={`text-xs font-medium ${expired ? 'text-red-600' : 'text-gray-500'}`}>
      {expired ? 'Session expired' : `Expires in ${mins}m ${secs}s`}
    </p>
  );
}
