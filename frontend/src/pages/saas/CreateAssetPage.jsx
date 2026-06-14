import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { ProceedButton } from '../../components/ui/ProceedButton';
import { SaasFlowPageLayout } from '../../components/saas/SaasFlowPageLayout';
import { useApp } from '../../context/AppContext';
import { useSaasAssets } from '../../context/SaasAssetsContext';
import { createSaasAsset, saveWebDraft } from '../../services/saasAssetsApi';
import { useSaasSettings } from '../../context/SaasSettingsContext';
import { AssetCreateQrPanel } from '../../components/saas/AssetCreateQrPanel';
import { AssetPhotoUploadPanel } from '../../components/saas/AssetPhotoUploadPanel';
import { CreateAssetModeCards } from '../../components/saas/CreateAssetModeCards';
import { CreateAssetWizard } from '../../components/saas/CreateAssetWizard';
import { DraftResumeBanner } from '../../components/saas/DraftResumeBanner';
import { DraftDrawer } from '../../components/saas/DraftDrawer';
import {
  EMPTY_ASSET_FORM,
  WIZARD_STEPS,
  assetFormToPayload,
  buildSessionDraft,
  validateAssetForm,
  validateWizardStep,
} from '../../components/saas/assetFormConfig';
import { applyAssetFormPrefs, saveAssetFormPrefs } from '../../utils/assetFormPrefs';
import { clearWizardDraft, loadWizardDraft, saveWizardDraft } from '../../utils/assetFormDraft';
import { useAutoAssetIdentifiers } from '../../hooks/useAutoAssetIdentifiers';

const DRAFT_DEBOUNCE_MS = 3000;

export function CreateAssetPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { refreshAll, queueNewAssetAnalysis } = useSaasAssets();
  const { aiAnalysisEnabled } = useSaasSettings();
  const [createMode, setCreateMode] = useState(null);
  const [values, setValues] = useState(() => applyAssetFormPrefs({ ...EMPTY_ASSET_FORM }));
  const [wizardStep, setWizardStep] = useState(0);
  const [draftId, setDraftId] = useState(null);
  const [assetFile, setAssetFile] = useState(null);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [assetPreview, setAssetPreview] = useState(null);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const [sessionAssetUrl, setSessionAssetUrl] = useState(null);
  const [sessionBarcodeUrl, setSessionBarcodeUrl] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false);
  const mobileSectionRef = useRef(null);
  const draftTimerRef = useRef(null);

  useAutoAssetIdentifiers(setValues, { enabled: createMode === 'web' });

  const scrollToMobileSection = useCallback(() => {
    mobileSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (createMode !== 'mobile') return undefined;
    const t = window.setTimeout(scrollToMobileSection, 80);
    return () => window.clearTimeout(t);
  }, [createMode, scrollToMobileSection]);

  useEffect(() => {
    if (createMode !== 'web') return undefined;
    saveWizardDraft(values, wizardStep);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const payload = assetFormToPayload(values);
      if (Object.values(payload).some((v) => v)) {
        saveWebDraft(payload, {
          draftId: draftId || undefined,
          title: values.assetname || 'Auto-saved draft',
        })
          .then((saved) => setDraftId(saved.id))
          .catch(() => {});
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [values, wizardStep, createMode, draftId]);

  useEffect(() => {
    if (createMode !== 'web') return;
    const local = loadWizardDraft();
    if (!local?.values) return;
    const hasData = Object.values(local.values).some((v) => String(v || '').trim());
    if (hasData) {
      setValues((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(prev).map((k) => [k, local.values[k] ?? prev[k]]),
        ),
      }));
      if (typeof local.step === 'number') {
        setWizardStep(Math.min(local.step, WIZARD_STEPS.length - 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once when entering web mode
  }, [createMode]);

  useEffect(() => {
    setError(null);
  }, [wizardStep]);

  const handleModeChange = (mode) => setCreateMode(mode);

  const handleChange = (key, raw) => {
    setValues((prev) => ({ ...prev, [key]: raw }));
  };

  const handleResumeDraft = (draft) => {
    const json = draft.draft_json || draft.values || {};
    setValues((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(prev).map((k) => [k, json[k] ?? prev[k]])),
    }));
    if (typeof draft.step === 'number') {
      setWizardStep(Math.min(draft.step, WIZARD_STEPS.length - 1));
    }
    if (draft.asset_image_url) {
      setSessionAssetUrl(draft.asset_image_url);
      setAssetPreview(null);
      setAssetFile(null);
    }
    if (draft.barcode_image_url) {
      setSessionBarcodeUrl(draft.barcode_image_url);
      setBarcodePreview(null);
      setBarcodeFile(null);
    }
    showToast('Draft loaded', 'success');
  };

  const handleAssetFile = (file) => {
    setAssetFile(file);
    setAssetPreview(URL.createObjectURL(file));
    setSessionAssetUrl(null);
  };

  const handleBarcodeFile = (file) => {
    setBarcodeFile(file);
    setBarcodePreview(URL.createObjectURL(file));
    setSessionBarcodeUrl(null);
  };

  const onSessionImages = useCallback((session) => {
    if (session.asset_image_url) {
      setSessionAssetUrl(session.asset_image_url);
      setAssetPreview(null);
      setAssetFile(null);
    }
    if (session.barcode_image_url) {
      setSessionBarcodeUrl(session.barcode_image_url);
      setBarcodePreview(null);
      setBarcodeFile(null);
    }
    if (session.newAsset || session.newBarcode) {
      refreshAll({ silent: true });
    }
  }, [refreshAll]);

  const onSessionCompleted = useCallback(() => {
    showToast('Asset created on mobile — AI analysis started', 'success');
    navigate('/');
  }, [navigate, showToast]);

  const hasAssetImage = Boolean(assetFile || sessionAssetUrl);
  const hasAnyPhoto = hasAssetImage || barcodeFile || sessionBarcodeUrl;
  const displayAssetPreview = assetPreview || sessionAssetUrl;
  const displayBarcodePreview = barcodePreview || sessionBarcodeUrl;
  const onReviewStep = wizardStep === WIZARD_STEPS.length - 1;

  const submit = async () => {
    const msg = validateAssetForm(values);
    if (msg) {
      setError(msg);
      return;
    }
    if (!assetFile && !sessionAssetUrl) {
      setError('Asset image is required — upload from computer or add via mobile QR');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      let imageFile = assetFile;
      if (!imageFile && sessionAssetUrl) {
        const res = await fetch(sessionAssetUrl);
        const blob = await res.blob();
        imageFile = new File([blob], 'asset.jpg', { type: blob.type || 'image/jpeg' });
      }
      let barcode = barcodeFile;
      if (!barcode && sessionBarcodeUrl) {
        const res = await fetch(sessionBarcodeUrl);
        const blob = await res.blob();
        barcode = new File([blob], 'barcode.jpg', { type: blob.type || 'image/jpeg' });
      }

      saveAssetFormPrefs(values);
      const result = await createSaasAsset(
        assetFormToPayload(values),
        imageFile,
        barcode || undefined,
        { autoAnalyze: false, skipAi: !aiAnalysisEnabled },
      );
      clearWizardDraft();
      if (aiAnalysisEnabled) {
        queueNewAssetAnalysis(result.id);
        showToast('Asset created — AI analysis queued', 'success');
      } else {
        showToast('Asset created — AI analysis is disabled in settings', 'success');
      }
      await refreshAll({ silent: true });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  const photosSection = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <AssetPhotoUploadPanel
          assetPreview={displayAssetPreview}
          barcodePreview={displayBarcodePreview}
          onAssetFile={handleAssetFile}
          onBarcodeFile={handleBarcodeFile}
        />
        <AssetCreateQrPanel
          mode="images_only"
          draftJson={buildSessionDraft(values, 'images_only')}
          onSessionImages={onSessionImages}
        />
      </div>
      {!hasAssetImage && (
        <p className="text-sm text-amber-700">Asset image is required before creating.</p>
      )}
    </div>
  );

  const reviewSection = (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(assetFormToPayload(values)).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-xs font-medium text-gray-500">{k}</span>
            <p className="text-gray-900">{String(v)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {displayAssetPreview && (
          <img src={displayAssetPreview} alt="Asset" className="h-32 rounded-xl border object-cover" />
        )}
        {displayBarcodePreview && (
          <img src={displayBarcodePreview} alt="Barcode" className="h-28 rounded-xl border object-cover" />
        )}
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );

  const footer =
    createMode === 'web' && onReviewStep ? (
      <AnimatePresence>
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 p-3 pb-safe backdrop-blur-md sm:p-4">
          <PageWrapper>
            <ProceedButton
              label={submitting ? 'Saving…' : 'Create Asset'}
              disabled={submitting || !hasAssetImage}
              onClick={submit}
            />
          </PageWrapper>
        </div>
      </AnimatePresence>
    ) : null;

  return (
    <SaasFlowPageLayout title="Create Asset" onBack={() => navigate('/')} footer={footer}>
      <PageWrapper className="py-6 pb-32 sm:py-8 sm:pb-36">
        <header className="mb-6 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Register a new asset</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Step through the wizard or scan a QR code to complete on mobile.
          </p>
        </header>

        <section className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">How would you like to create?</h3>
          <CreateAssetModeCards value={createMode} onChange={handleModeChange} />
        </section>

        {createMode === 'web' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DraftResumeBanner
                draftJson={assetFormToPayload(values)}
                onResume={handleResumeDraft}
                activeDraftId={draftId}
                onDraftIdChange={setDraftId}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraftDrawerOpen(true)}
              >
                <PanelRightOpen size={14} className="mr-1" />
                Drafts
              </Button>
            </div>
            <CreateAssetWizard
              values={values}
              onChange={handleChange}
              onPatch={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
              step={wizardStep}
              onStepChange={(n) => {
                if (n > wizardStep) {
                  const err = validateWizardStep(values, wizardStep);
                  if (err) {
                    setError(err);
                    return;
                  }
                }
                setError(null);
                setWizardStep(n);
              }}
              photosSection={photosSection}
              reviewSection={reviewSection}
            />
            <DraftDrawer
              open={draftDrawerOpen}
              onClose={() => setDraftDrawerOpen(false)}
              draftJson={assetFormToPayload(values)}
              wizardStep={wizardStep}
              activeDraftId={draftId}
              onDraftIdChange={setDraftId}
              onResume={handleResumeDraft}
            />
          </div>
        )}

        {createMode === 'mobile' && (
          <div ref={mobileSectionRef} className="scroll-mt-20 space-y-6">
            <header className="max-w-2xl">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">Create on your phone</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Scan the QR code to open the full asset form on mobile with capture or upload.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
              <AssetCreateQrPanel
                mode="full_mobile"
                draftJson={buildSessionDraft(values, 'full_mobile')}
                onSessionCompleted={onSessionCompleted}
                onQrReady={scrollToMobileSection}
                autoStart
                title="Create on Mobile"
                description="Scan the QR code to fill the asset form and add photos directly from your phone."
              />

              <section className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
                <h3 className="text-sm font-semibold text-gray-900">What happens next</h3>
                <ol className="mt-4 space-y-4 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      1
                    </span>
                    <span>Scan the QR code with your phone camera.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      2
                    </span>
                    <span>Complete the asset form and add photos via capture or upload.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      3
                    </span>
                    <span>Tap Create Asset on your phone — this page updates when done.</span>
                  </li>
                </ol>
              </section>
            </div>
          </div>
        )}
      </PageWrapper>
    </SaasFlowPageLayout>
  );
}
