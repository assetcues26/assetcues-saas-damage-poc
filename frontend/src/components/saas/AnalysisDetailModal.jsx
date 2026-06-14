import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { MatchBadge } from './AiStatusBadge';
import { AnalysisReportView } from './AnalysisReportView';

/**
 * @param {{ open: boolean, onClose: () => void, analysis: object | null, asset?: object | null, assetId?: string, analyses?: object[] }} props
 */
export function AnalysisDetailModal({ open, onClose, analysis, asset, assetId, analyses = [] }) {
  const [tab, setTab] = useState('detail');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const canCompare = analyses.length >= 2;

  const diff = useMemo(() => {
    if (!compareA || !compareB || compareA === compareB) return null;
    const a = analyses.find((x) => x.id === compareA);
    const b = analyses.find((x) => x.id === compareB);
    if (!a || !b) return null;
    const checksA = a.failure_summary?.checks || {};
    const checksB = b.failure_summary?.checks || {};
    const keys = new Set([...Object.keys(checksA), ...Object.keys(checksB)]);
    return [...keys].map((k) => ({
      key: k,
      a: checksA[k],
      b: checksB[k],
      changed: checksA[k] !== checksB[k],
    }));
  }, [compareA, compareB, analyses]);

  if (!analysis) return null;

  return (
    <Modal open={open} onClose={onClose} title="AI Validation Report" size="xl">
      <div className="mb-4 flex gap-2 border-b border-gray-100 pb-2">
        <TabButton active={tab === 'detail'} onClick={() => setTab('detail')}>
          Details
        </TabButton>
        {canCompare && (
          <TabButton active={tab === 'compare'} onClick={() => setTab('compare')}>
            Compare runs
          </TabButton>
        )}
        {assetId && analysis.id && (
          <Link
            to={`/assets/${assetId}/analysis/${analysis.id}`}
            className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700"
            onClick={onClose}
          >
            Deep dive →
          </Link>
        )}
      </div>

      {tab === 'compare' && canCompare ? (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded border border-gray-300 px-2 py-2"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            >
              <option value="">Run A…</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.created_at).toLocaleString()} ({a.ai_status})
                </option>
              ))}
            </select>
            <select
              className="rounded border border-gray-300 px-2 py-2"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            >
              <option value="">Run B…</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.created_at).toLocaleString()} ({a.ai_status})
                </option>
              ))}
            </select>
          </div>
          {diff && (
            <ul className="space-y-2">
              {diff.map((row) => (
                <li
                  key={row.key}
                  className={`rounded-lg border px-3 py-2 ${row.changed ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}
                >
                  <span className="font-medium">{row.key}</span>:{' '}
                  <MatchBadge value={row.a ? 'Y' : 'N'} /> → <MatchBadge value={row.b ? 'Y' : 'N'} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <AnalysisReportView
            analysis={analysis}
            asset={asset}
            aiStatus={analysis.ai_status}
            analyzedAt={analysis.created_at}
          />
        </div>
      )}
    </Modal>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
