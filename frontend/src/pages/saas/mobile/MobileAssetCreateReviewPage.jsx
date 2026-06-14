import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileAssetPageLayout } from '../../../components/saas/mobile/MobileAssetPageLayout';
import { useAssetCreateSession } from '../../../hooks/useAssetCreateSession';
import {
  ASSET_FORM_FIELDS,
  EMPTY_ASSET_FORM,
  assetFormToPayload,
  validateAssetForm,
} from '../../../components/saas/assetFormConfig';

export function MobileAssetCreateReviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, complete, uploading, error: sessionError } = useAssetCreateSession(token);
  const [values, setValues] = useState({ ...EMPTY_ASSET_FORM });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.draft_json) {
      setValues((prev) => ({ ...prev, ...session.draft_json }));
    }
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
      await complete(assetFormToPayload(values));
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

        {ASSET_FORM_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-gray-700">
              {field.label}
              {field.required && ' *'}
            </label>
            <input
              type={field.type || 'text'}
              value={values[field.key]}
              onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm"
            />
          </div>
        ))}

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
