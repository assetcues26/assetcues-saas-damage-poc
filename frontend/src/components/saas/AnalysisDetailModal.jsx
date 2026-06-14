import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { MatchBadge } from './AiStatusBadge';

/**
 * @param {{ open: boolean, onClose: () => void, analysis: object | null, assetId?: string, analyses?: object[] }} props
 */
export function AnalysisDetailModal({ open, onClose, analysis, assetId, analyses = [] }) {
  const [tab, setTab] = useState('detail');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const data = analysis?.response_json || analysis || {};
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
    <Modal open={open} onClose={onClose} title="Full AI Analysis" size="xl">
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
        <div className="max-h-[70vh] space-y-5 overflow-y-auto text-sm">
          <Section title="Asset detected">
            <Row label="Detected asset" value={data.detectedAsset} />
            <Row label="Condition" value={data.condition} />
            <p className="text-gray-600">{data.imageAnalysis}</p>
            <Row label="Image readability" value={data.imageReadability} />
          </Section>

          <Section title="Name & description">
            <Row label="Match" value={<MatchBadge value={data.namedescriptionmatch} />} />
            <Row label="Confidence" value={`${data.namedescriptionmatchpercent ?? '—'}%`} />
            <p className="text-gray-600">{data.reasoning}</p>
          </Section>

          <Section title="Classification">
            <Row label="Match" value={<MatchBadge value={data.subcatmodelmatch} />} />
            <Row label="Confidence" value={`${data.subcatmodelmatchpercent ?? '—'}%`} />
            {data.recommendedsubcategory && (
              <Row label="Recommended subcategory" value={data.recommendedsubcategory} />
            )}
            {data.recommendedmakemodel && (
              <Row label="Recommended make/model" value={data.recommendedmakemodel} />
            )}
          </Section>

          <Section title="Tag / barcode">
            <Row label="User tag" value={data.tagnumber} />
            <Row label="Detected tag" value={data.detectedtagnumber} />
            <Row label="Match" value={<MatchBadge value={data.detectedtagnumbermatch} />} />
          </Section>

          <Section title="Cost validation">
            <Row label="Match" value={<MatchBadge value={data.costvalidation?.costmatch} />} />
            <Row label="User cost" value={data.costvalidation?.usercost} />
            <Row label="Estimated cost" value={data.costvalidation?.estimatedcost} />
            <p className="text-gray-600">{data.costvalidation?.reasoning}</p>
          </Section>

          <Section title="Acquisition date">
            <Row label="Match" value={<MatchBadge value={data.acquisitiondatevalidation?.datematch} />} />
            <Row label="User date" value={data.acquisitiondatevalidation?.useracquisitiondate} />
            <p className="text-gray-600">{data.acquisitiondatevalidation?.reasoning}</p>
          </Section>

          {data.damage_assessment && (
            <Section title="Damage assessment">
              <p className="text-gray-600">{data.damage_assessment}</p>
            </Section>
          )}
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

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <p className="text-gray-700">
      <span className="font-medium">{label}:</span>{' '}
      <span className="text-gray-600">{value}</span>
    </p>
  );
}
