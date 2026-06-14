import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSaasAssets } from '../../context/SaasAssetsContext';
import { useApp } from '../../context/AppContext';

function formatActivityTime(createdAt) {
  if (!createdAt) return '';
  try {
    return new Date(createdAt).toLocaleTimeString();
  } catch {
    return '';
  }
}

export function ActivityNotificationBell() {
  const { activity } = useSaasAssets();
  const { showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const baselineSetRef = useRef(false);

  useEffect(() => {
    const known = knownIdsRef.current;
    const incoming = activity || [];
    const newItems = incoming.filter((item) => item.id && !known.has(item.id));

    incoming.forEach((item) => {
      if (item.id) known.add(item.id);
    });

    if (!baselineSetRef.current) {
      baselineSetRef.current = true;
      return;
    }

    if (newItems.length > 0) {
      setUnreadCount((count) => count + newItems.length);
      newItems.forEach((item) => {
        showToast(item.message || 'New activity', 'info');
      });
    }
  }, [activity, showToast]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Notifications
            </h2>
          </div>
          <ul className="max-h-64 space-y-2 overflow-y-auto px-4 py-3 text-xs text-gray-600">
            {activity.length === 0 ? (
              <li className="text-gray-500">No recent activity</li>
            ) : (
              activity.map((ev) => (
                <li key={ev.id} className="leading-snug">
                  <span className="text-gray-900">{ev.message}</span>
                  <span className="ml-1 text-gray-400">
                    · {formatActivityTime(ev.created_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
