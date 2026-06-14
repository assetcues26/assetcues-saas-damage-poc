import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteWebDraft, fetchWebDrafts, saveWebDraft } from '../../services/saasAssetsApi';

/**
 * @param {{
 *   draftJson: Record<string, unknown>,
 *   onResume: (draft: object) => void,
 *   activeDraftId?: string | null,
 *   onDraftIdChange?: (id: string | null) => void,
 * }} props
 */
export function DraftResumeBanner({ draftJson, onResume, activeDraftId, onDraftIdChange }) {
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchWebDrafts()
      .then((body) => setDrafts(body.items || []))
      .catch(() => setDrafts([]));
  }, []);

  const latest = drafts[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveWebDraft(draftJson, {
        draftId: activeDraftId || undefined,
        title: draftJson.assetname ? String(draftJson.assetname) : 'Untitled draft',
      });
      onDraftIdChange?.(saved.id);
    } finally {
      setSaving(false);
    }
  };

  const handleResume = () => {
    if (!latest) return;
    onResume(latest);
    onDraftIdChange?.(latest.id);
    setDismissed(true);
  };

  const handleDiscard = async () => {
    if (latest) {
      await deleteWebDraft(latest.id).catch(() => {});
    }
    setDismissed(true);
    setDrafts([]);
  };

  if (dismissed || !latest) {
    return (
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-sm text-blue-900">
        <FileText size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Resume your draft?</p>
          <p className="text-blue-700">
            {latest.title || 'Saved draft'} · updated{' '}
            {latest.updated_at ? new Date(latest.updated_at).toLocaleString() : 'recently'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" onClick={handleResume}>
          Resume
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={handleSave}>
          Save current
        </Button>
        <button
          type="button"
          onClick={handleDiscard}
          className="inline-flex items-center gap-1 px-2 text-xs text-blue-700 hover:text-blue-900"
        >
          <X size={14} />
          Dismiss
        </button>
      </div>
    </div>
  );
}
