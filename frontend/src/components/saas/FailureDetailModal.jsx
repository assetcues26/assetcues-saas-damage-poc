import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '../ui/Modal';
import { MatchBadge } from './AiStatusBadge';
import { analyzeSaasAssetWithPatch } from '../../services/saasAssetsApi';

import { CHECK_LABELS, FIELD_PATCH_MAP, PERCENT_KEYS } from '../../utils/aiValidationLabels';
import { getCheckReason } from '../../utils/aiStatusSummary';

/**
 * @param {{ open: boolean, onClose: () => void, failureSummary: object | null, asset: object | null, onFixed?: () => void, onAnalysisStarted?: () => void }} props
 */
export function FailureDetailModal({ open, onClose, failureSummary, asset, onFixed, onAnalysisStarted }) {
  const [fixing, setFixing] = useState(false);
  const [edits, setEdits] = useState({});
  const [showFix, setShowFix] = useState(false);

  if (!open || !failureSummary) return null;

  const checks = failureSummary.checks || {};
  const failed = Object.entries(checks).filter(([, passed]) => !passed);
  const comparisons = failureSummary.field_comparison || {};

  const handleFixSubmit = async () => {
    if (!asset?.id) return;
    setFixing(true);
    try {
      onAnalysisStarted?.();
      await analyzeSaasAssetWithPatch(asset.id, edits);
      setShowFix(false);
      setEdits({});
      onFixed?.();
      onClose();
    } finally {
      setFixing(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Validation Failures" size="xl">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
        {asset && (
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">{asset.assetname}</span> ({asset.assetid})
          </p>
        )}

        <div className="space-y-3">
          {failed.map(([key]) => {
            const comp = comparisons[key];
            const pct = failureSummary[PERCENT_KEYS[key]];
            const reason = getCheckReason(key, failureSummary);
            return (
              <div key={key} className="rounded-lg border border-red-100 bg-red-50 px-3 py-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-red-800">{CHECK_LABELS[key] || key}</p>
                  {pct != null && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-red-900">
                      {pct}% confidence
                    </span>
                  )}
                </div>
                {reason && <p className="text-red-900 leading-relaxed">{reason}</p>}
                {comp && (
                  <div className={`grid gap-2 sm:grid-cols-2 ${reason ? 'mt-3' : ''}`}>
                    <div className="rounded bg-white/80 px-2 py-1.5">
                      <p className="text-xs font-medium text-gray-500">Registered</p>
                      <p className="text-gray-900">{comp.registered ?? '—'}</p>
                    </div>
                    <div className="rounded bg-white/80 px-2 py-1.5">
                      <p className="text-xs font-medium text-gray-500">Detected</p>
                      <p className="text-gray-900">{comp.detected ?? '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {failureSummary.reasoning && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
            <p className="font-medium text-gray-900">Overall reasoning</p>
            <p className="mt-1 leading-relaxed text-gray-700">{failureSummary.reasoning}</p>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="mb-2 font-medium text-gray-900">All checks</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(checks).map(([key, passed]) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs text-gray-600">
                {CHECK_LABELS[key] || key}: <MatchBadge value={passed ? 'Y' : 'N'} />
              </span>
            ))}
          </div>
        </div>

        {asset && (
          <div className="border-t pt-4">
            {!showFix ? (
              <Button variant="primary" size="sm" onClick={() => setShowFix(true)}>
                Fix & re-submit
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="font-medium text-gray-900">Edit failed fields</p>
                {failed.flatMap(([key]) => FIELD_PATCH_MAP[key] || []).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-gray-600">{field}</label>
                    <input
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      defaultValue={asset[field] ?? ''}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" disabled={fixing} onClick={handleFixSubmit}>
                    {fixing ? 'Submitting…' : 'Patch & re-analyze'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowFix(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
