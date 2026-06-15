import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '../../components/ui/Modal';
import { useSaasSettings } from '../../context/SaasSettingsContext';
import { useSaasAssets } from '../../context/SaasAssetsContext';
import { useApp } from '../../context/AppContext';
import { clearAllSaasAnalyses } from '../../services/saasAssetsApi';

export function SaasSettingsPage() {
  const { aiAnalysisEnabled, setAiAnalysisEnabled } = useSaasSettings();
  const { refreshAll } = useSaasAssets();
  const { showToast } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAnalyses = async () => {
    setClearing(true);
    try {
      const result = await clearAllSaasAnalyses();
      await refreshAll({ silent: true });
      showToast(
        `Cleared ${result.analyses_deleted} analysis run(s); reset ${result.assets_reset} asset(s)`,
        'success',
      );
      setConfirmClear(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to clear analyses', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft size={16} className="mr-1" />
            Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <Brain size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">AI analysis on new assets</h2>
            <p className="mt-1 text-sm text-gray-600">
              When enabled, newly created assets are queued for AI validation one at a time. When
              disabled, assets are saved without automatic analysis — you can still run AI manually
              from the dashboard.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-800">Enable AI analysis</span>
              <input
                type="checkbox"
                checked={aiAnalysisEnabled}
                onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Analysis data</h2>
        <p className="mt-1 text-sm text-gray-600">
          Remove all stored AI analysis runs for your assets. Asset records and photos are kept;
          assets with completed analysis are reset to pending so you can re-run validation.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 size={16} className="mr-1" />
          Delete all analysis
        </Button>
      </section>

      <ConfirmModal
        open={confirmClear}
        title="Delete all AI analysis?"
        description="This removes every analysis history entry and resets analyzed assets to pending. Asset photos and metadata are not deleted."
        confirmLabel={clearing ? 'Deleting…' : 'Delete all analysis'}
        cancelLabel="Cancel"
        confirmDisabled={clearing}
        onConfirm={handleClearAnalyses}
        onCancel={() => !clearing && setConfirmClear(false)}
      />
    </div>
  );
}
