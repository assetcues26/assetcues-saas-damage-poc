import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { AssetFormFields } from '../../../components/saas/AssetFormFields';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import {
  EMPTY_ASSET_FORM,
  assetFormToPayload,
  mergeFormWithDraft,
  validateAssetForm,
} from '../../../components/saas/assetFormConfig';

export function MobileAssetCreateReviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, complete, uploading, error: sessionError } = useAssetCreateSession(token);
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const draftHydratedRef = useRef(false);

  useEffect(() => {
    if (!session?.draft_json || draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    setValues((prev) => mergeFormWithDraft(prev, session.draft_json));
  }, [session?.draft_json]);

  const submit = async (e) => {
    e.preventDefault();
    const msg = validateAssetForm(values);
    if (msg) {
      setError(msg);
      return;
    }
    if (!session?.asset_image_url) {
      setError('Asset image is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await complete(assetFormToPayload(values, { omitAutoAssignedIds: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileAssetPageLayout
      title="Review & create"
      onBack={() => navigate(`/assets/create/mobile/${token}`)}
      wrapperClassName="flex flex-1 flex-col py-4"
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {session?.asset_image_url && (
          <img src={session.asset_image_url} alt="Asset" className="h-36 w-full rounded-xl border object-cover" />
        )}
        {session?.barcode_image_url && (
          <img src={session.barcode_image_url} alt="Barcode" className="h-24 rounded-xl border object-cover" />
        )}

        <AssetFormFields
          values={values}
          onChange={(key, val) => setValues((p) => ({ ...p, [key]: val }))}
          onPatch={(patch) => setValues((p) => ({ ...p, ...patch }))}
          compact
          hideAssetId
        />

        {(error || sessionError) && (
          <p className="text-sm text-red-600">{error || sessionError}</p>
        )}

        <Button type="submit" disabled={submitting || uploading} className="mt-2">
          {submitting ? 'Creating…' : 'Create Asset'}
        </Button>
      </form>
    </MobileAssetPageLayout>
  );
}
