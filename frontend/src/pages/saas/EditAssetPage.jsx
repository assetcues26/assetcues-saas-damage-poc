import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../components/ui/Spinner';
import { CreateAssetWizard } from '../../components/saas/CreateAssetWizard';
import { AddAssetPhotosPanel } from '../../components/saas/AddAssetPhotosPanel';
import {
  EMPTY_ASSET_FORM,
  WIZARD_STEPS,
  assetFormToPayload,
  validateWizardStep,
} from '../../components/saas/assetFormConfig';
import { fetchSaasAsset, updateSaasAsset } from '../../services/saasAssetsApi';
import { useApp } from '../../context/AppContext';
import { useSaasAssets } from '../../context/SaasAssetsContext';
import { isAiAnalysisEnabled } from '../../utils/saasAiSettings';

export function EditAssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { refresh, refreshAll, markAssetAnalyzing } = useSaasAssets();
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [hasAssetImage, setHasAssetImage] = useState(true);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSaasAsset(id)
      .then((d) => {
        const a = d.asset || {};
        setValues((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(prev).map((k) => [k, a[k] != null ? String(a[k]) : '']),
          ),
        }));
        setHasAssetImage(Boolean(a.asset_image_url));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load asset');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const editSteps = WIZARD_STEPS.filter((s) => s.id !== 'photos' && s.id !== 'review');

  const handleSave = async () => {
    const err = editSteps
      .map((s) => WIZARD_STEPS.findIndex((w) => w.id === s.id))
      .map((idx) => validateWizardStep(values, idx))
      .find(Boolean);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const runAi = hasAssetImage && isAiAnalysisEnabled();
      if (runAi) markAssetAnalyzing(id);
      await updateSaasAsset(id, assetFormToPayload(values), { reanalyze: runAi });
      showToast(
        runAi ? 'Changes saved — AI analysis started' : 'Changes saved',
        'success',
      );
      await refresh({ silent: true });
      navigate('/');
    } catch (e) {
      await refresh({ silent: true });
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="p-3 pb-24 sm:p-6 sm:pb-28">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(`/assets/${id}`)}>
        <ArrowLeft size={16} className="mr-1" />
        Back to asset
      </Button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit asset</h1>

      {!hasAssetImage && (
        <div className="mb-6">
          <AddAssetPhotosPanel
            assetId={id}
            assetName={values.assetname || values.assetid}
            onAnalyzing={() => markAssetAnalyzing(id)}
            onComplete={async () => {
              setHasAssetImage(true);
              await refreshAll({ silent: true });
              const d = await fetchSaasAsset(id);
              const a = d.asset || {};
              setValues((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  Object.keys(prev).map((k) => [k, a[k] != null ? String(a[k]) : '']),
                ),
              }));
            }}
          />
        </div>
      )}

      <CreateAssetWizard
        values={values}
        onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
        onPatch={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        step={step}
        onStepChange={setStep}
        hideAssetId={false}
        readOnlyAutoAssign={false}
        steps={editSteps}
      />

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur sm:left-56">
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save & re-analyze'}
          </Button>
          <p className="text-xs text-gray-500">
            Saves your edits and automatically runs a new AI validation.
          </p>
        </div>
      </div>
    </div>
  );
}
