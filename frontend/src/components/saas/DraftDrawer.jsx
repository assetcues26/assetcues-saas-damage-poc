import { useEffect, useState } from 'react';
import { FileText, PanelRightClose, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteWebDraft, fetchWebDrafts, saveWebDraft } from '../../services/saasAssetsApi';
import { clearWizardDraft, loadWizardDraft } from '../../utils/assetFormDraft';

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   draftJson: Record<string, unknown>,
 *   wizardStep: number,
 *   activeDraftId?: string | null,
 *   onDraftIdChange?: (id: string | null) => void,
 *   onResume: (draft: { draft_json?: object, values?: object, step?: number }) => void,
 * }} props
 */
export function DraftDrawer({
  open,
  onClose,
  draftJson,
  wizardStep,
  activeDraftId,
  onDraftIdChange,
  onResume,
}) {
  const [drafts, setDrafts] = useState([]);
  const [localDraft, setLocalDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLocalDraft(loadWizardDraft());
    setLoading(true);
    try {
      const body = await fetchWebDrafts();
      setDrafts(body.items || []);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveWebDraft(draftJson, {
        draftId: activeDraftId || undefined,
        title: draftJson.assetname ? String(draftJson.assetname) : 'Untitled draft',
      });
      onDraftIdChange?.(saved.id);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleResumeLocal = () => {
    if (!localDraft) return;
    onResume({ values: localDraft.values, step: localDraft.step });
    onClose();
  };

  const handleResumeApi = (draft) => {
    onResume(draft);
    onDraftIdChange?.(draft.id);
    onClose();
  };

  const handleDeleteApi = async (id) => {
    await deleteWebDraft(id).catch(() => {});
    await refresh();
  };

  const handleClearLocal = () => {
    clearWizardDraft();
    setLocalDraft(null);
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label="Close drafts"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">Saved drafts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <PanelRightClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Current progress
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Step {wizardStep + 1} of 5
              {draftJson.assetname ? ` · ${draftJson.assetname}` : ''}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="w-full"
            >
              <Save size={14} className="mr-1" />
              {saving ? 'Saving…' : 'Save to server'}
            </Button>
          </section>

          {localDraft && (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Browser draft
              </h3>
              <p className="text-sm text-gray-700">
                Step {localDraft.step + 1}
                {localDraft.values?.assetname ? ` · ${localDraft.values.assetname}` : ''}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {localDraft.updatedAt
                  ? new Date(localDraft.updatedAt).toLocaleString()
                  : 'Recently saved'}
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleResumeLocal}>
                  Resume
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleClearLocal}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Server drafts
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : drafts.length === 0 ? (
              <p className="text-sm text-gray-500">No server drafts yet.</p>
            ) : (
              <ul className="space-y-2">
                {drafts.map((draft) => (
                  <li
                    key={draft.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <p className="font-medium text-gray-900">
                      {draft.title || draft.draft_json?.assetname || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {draft.updated_at
                        ? new Date(draft.updated_at).toLocaleString()
                        : 'Unknown date'}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeApi(draft)}
                      >
                        Resume
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteApi(draft.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
