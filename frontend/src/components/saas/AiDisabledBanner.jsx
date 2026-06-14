import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

/**
 * Shown on new assets created while AI auto-analysis was disabled.
 */
export function AiDisabledBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-medium">AI analysis is not enabled</p>
      <p className="mt-1 text-amber-900/90">
        This asset was saved without automatic AI validation. Enable AI analysis in settings, or run
        analysis manually from the dashboard.
      </p>
      <Link
        to="/settings"
        className="mt-3 inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-800"
      >
        <Settings size={16} />
        Open settings
      </Link>
    </div>
  );
}
