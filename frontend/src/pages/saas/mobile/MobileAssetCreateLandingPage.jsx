import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, ChevronDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '../../../components/ui/Card';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { MobileFormProgress } from '../../../components/saas/mobile/MobileFormProgress';
import { AssetCuesLogo } from '../../../components/saas/AssetCuesLogo';
import { AssetFormFields } from '../../../components/saas/AssetFormFields';
import { SessionExpiryCountdown } from '../../../components/saas/SessionExpiryCountdown';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import {
  EMPTY_ASSET_FORM,
  SESSION_MODE_IMAGES_ONLY,
  WIZARD_STEPS,
  assetFormToPayload,
  getSessionMode,
  validateAssetForm,
} from '../../../components/saas/assetFormConfig';

export function MobileAssetCreateLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, loading, error, canUse, complete, uploading, expiresAt } =
    useAssetCreateSession(token);
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [openSection, setOpenSection] = useState('identity');

  const formSteps = WIZARD_STEPS.filter((s) => s.id !== 'photos' && s.id !== 'review');

  useEffect(() => {
    if (session?.draft_json) {
      const draft = { ...session.draft_json };
      delete draft._session_mode;
      setValues((prev) => ({ ...prev, ...draft }));
    }
  }, [session?.draft_json]);

  useEffect(() => {
    if (session?.draft_json && getSessionMode(session.draft_json) === SESSION_MODE_IMAGES_ONLY) {
      navigate(`/assets/create/mobile/${token}/photos`, { replace: true });
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

  const hasAsset = Boolean(session?.asset_image_url);
  const base = `/assets/create/mobile/${token}`;

  const submit = async (e) => {
    e.preventDefault();
    const msg = validateAssetForm(values);
    if (msg) {
      setFormError(msg);
      return;
    }
    if (!hasAsset) {
      setFormError('Asset image is required — capture or upload a photo first');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await complete(assetFormToPayload(values));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileAssetPageLayout title="Create asset" wrapperClassName="flex flex-1 flex-col py-6 pb-10">
      <div className="text-center">
        <AssetCuesLogo className="mx-auto" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Fill in asset details</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Complete the form below, then add photos via capture or upload.
        </p>
      </div>

      <form onSubmit={submit} className="mx-auto mt-6 flex w-full max-w-lg flex-1 flex-col gap-6">
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
                    compact
                    fieldKeys={fields}
                  />
                </div>
              )}
            </Card>
          );
        })}

        <div>
          <h2 className="text-sm font-semibold text-gray-900">Photos</h2>
          {(session?.asset_image_url || session?.barcode_image_url) && (
            <div className="mt-3 grid gap-2">
              {session.asset_image_url && (
                <img
                  src={session.asset_image_url}
                  alt="Asset"
                  className="h-36 w-full rounded-xl border object-cover"
                />
              )}
              {session.barcode_image_url && (
                <img
                  src={session.barcode_image_url}
                  alt="Barcode"
                  className="h-24 w-full rounded-xl border object-cover"
                />
              )}
            </div>
          )}

          <div className="mt-3 grid gap-3">
            <Card
              hover
              onClick={() => navigate(`${base}/capture`)}
              className="touch-manipulation p-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Capture photos</h3>
                  <p className="text-xs text-gray-600">Camera for asset and barcode</p>
                </div>
              </div>
            </Card>

            <Card
              hover
              onClick={() => navigate(`${base}/upload`)}
              className="touch-manipulation p-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload photos</h3>
                  <p className="text-xs text-gray-600">Pick from gallery</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button type="submit" disabled={submitting || uploading} className="mt-auto w-full shadow-lg">
          {submitting ? 'Creating…' : 'Create Asset'}
        </Button>
      </form>
    </MobileAssetPageLayout>
  );
}
