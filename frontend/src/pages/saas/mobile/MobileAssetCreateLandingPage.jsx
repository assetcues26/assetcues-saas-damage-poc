import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '../../../components/ui/Card';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileFormProgress } from '../../../components/saas/mobile/MobileFormProgress';
import { MobileCreateStepHeader } from '../../../components/saas/mobile/MobileCreateStepHeader';
import { MobileBrandHeader } from '../../../components/saas/mobile/MobileBrandHeader';
import { AssetFormFields } from '../../../components/saas/AssetFormFields';
import { SessionExpiryCountdown } from '../../../components/saas/SessionExpiryCountdown';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import {
  EMPTY_ASSET_FORM,
  MOBILE_STEP_PHOTOS,
  SESSION_MODE_FULL_MOBILE,
  SESSION_MODE_IMAGES_ONLY,
  WIZARD_STEPS,
  assetFormToPayload,
  buildMobileSessionDraft,
  draftJsonToFormValues,
  getSessionMode,
  mergeFormWithDraft,
  validateWizardStep,
} from '../../../components/saas/assetFormConfig';
import { mobileCreateRoutes } from '../../../utils/mobileCreateRoutes';
import { applyAutoIdentifiers } from '../../../utils/autoAssetIdentifiers';
import { fetchNextAssetIdentifiers } from '../../../services/saasAssetsApi';

export function MobileAssetCreateLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, loading, error, canUse, saveDraft, expiresAt } = useAssetCreateSession(token);
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState('identity');
  const lastSyncedDraftRef = useRef('');
  const [autoIds, setAutoIds] = useState(null);

  const formSteps = WIZARD_STEPS.filter((s) => s.id !== 'photos' && s.id !== 'review');
  const routes = mobileCreateRoutes(token, SESSION_MODE_FULL_MOBILE);

  useEffect(() => {
    fetchNextAssetIdentifiers().then(setAutoIds).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session?.draft_json && !autoIds) return;
    const sig = JSON.stringify({
      draft: draftJsonToFormValues(session?.draft_json || {}),
      autoIds,
    });
    if (sig === lastSyncedDraftRef.current) return;
    lastSyncedDraftRef.current = sig;
    setValues((prev) => {
      const merged = session?.draft_json
        ? mergeFormWithDraft(prev, session.draft_json)
        : prev;
      return applyAutoIdentifiers(merged, autoIds);
    });
  }, [session?.draft_json, autoIds]);

  useEffect(() => {
    if (!session?.draft_json) return;
    if (getSessionMode(session.draft_json) === SESSION_MODE_IMAGES_ONLY) {
      navigate(mobileCreateRoutes(token, SESSION_MODE_IMAGES_ONLY).photos, { replace: true });
    }
  }, [session?.draft_json, navigate, token]);

  if (loading) {
    return (
      <MobileAssetPageLayout title="Create asset">
        <div className="flex flex-1 items-center justify-center py-24 text-gray-600">Loading…</div>
      </MobileAssetPageLayout>
    );
  }

  if (error || !canUse) {
    return (
      <MobileAssetPageLayout title="Create asset">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">Link unavailable</p>
          <p className="max-w-sm text-sm text-gray-600">
            {error || 'This create-asset link has expired or was already used.'}
          </p>
        </div>
      </MobileAssetPageLayout>
    );
  }

  const proceedToPhotos = async (e) => {
    e.preventDefault();
    for (const step of formSteps) {
      const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step.id);
      const msg = validateWizardStep(values, stepIndex);
      if (msg) {
        setFormError(msg);
        setOpenSection(step.id);
        return;
      }
    }
    setFormError(null);
    setSaving(true);
    try {
      await saveDraft(
        buildMobileSessionDraft(values, SESSION_MODE_FULL_MOBILE, MOBILE_STEP_PHOTOS),
      );
      navigate(routes.photos);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileAssetPageLayout title="Create asset" wrapperClassName="flex flex-1 flex-col py-6 pb-10">
      <MobileBrandHeader
        title="Asset details"
        subtitle="Fill in the form below. Your answers are saved when you continue to photos."
      />

      <form onSubmit={proceedToPhotos} className="mx-auto mt-6 flex w-full max-w-lg flex-1 flex-col gap-6">
        <MobileCreateStepHeader step={1} label="Enter asset information" />
        <MobileFormProgress values={values} />
        <SessionExpiryCountdown expiresAt={expiresAt} />

        {formSteps.map((step) => {
          const fields = step.fields;
          const isOpen = openSection === step.id;
          return (
            <Card key={step.id} className="overflow-hidden p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenSection(isOpen ? '' : step.id)}
              >
                <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-2">
                  <AssetFormFields
                    values={values}
                    onChange={(key, val) => setValues((p) => ({ ...p, [key]: val }))}
                    onPatch={(patch) => setValues((p) => ({ ...p, ...patch }))}
                    compact
                    fieldKeys={fields}
                  />
                </div>
              )}
            </Card>
          );
        })}

        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={saving} className="mt-auto w-full shadow-lg">
          {saving ? 'Saving…' : 'Proceed to add photos'}
        </Button>
      </form>
    </MobileAssetPageLayout>
  );
}
