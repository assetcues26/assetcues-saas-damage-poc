import { buildAnalysisReport, formatConfidence, formatReportCurrency } from '../../utils/analysisReport';
import { AiStatusBadge, MatchBadge } from './AiStatusBadge';

/**
 * Executive-style AI validation report for SaaS asset register.
 *
 * @param {{
 *   analysis?: object | null,
 *   asset?: object | null,
 *   aiStatus?: string,
 *   analyzedAt?: string | null,
 *   compact?: boolean,
 * }} props
 */
export function AnalysisReportView({
  analysis,
  asset,
  aiStatus,
  analyzedAt,
  compact = false,
}) {
  const response = analysis?.response_json || analysis || {};
  const report = buildAnalysisReport(response, asset);
  const status = aiStatus || analysis?.ai_status || asset?.ai_status || 'pending';

  if (!response || Object.keys(response).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600">
        No AI analysis report available for this asset yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AI Validation Report
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {asset?.assetname || report.detectedAsset || asset?.assetid || 'Asset'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {asset?.assetid ? `Asset ID ${asset.assetid}` : null}
              {asset?.company ? ` · ${asset.company}` : null}
            </p>
            {analyzedAt && (
              <p className="mt-2 text-xs text-slate-500">
                Analyzed {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <AiStatusBadge status={status} />
            <p className="mt-2 text-xs text-slate-500">
              {report.passCount} passed · {report.failCount} failed
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.checks.map((check) => (
            <ScorecardItem key={check.key} check={check} />
          ))}
        </div>
      </header>

      {report.error && (
        <NoticePanel title="Analysis error" variant="error">
          {String(report.error)}
        </NoticePanel>
      )}

      <ReportSection
        number="1"
        title="Visual inspection"
        subtitle="What the AI detected from asset imagery"
      >
        <MetricGrid>
          <Metric label="Detected asset" value={report.detectedAsset} highlight />
          <Metric label="Condition" value={report.condition} />
          <Metric
            label="Image readability"
            value={<MatchBadge value={report.imageReadability} />}
          />
        </MetricGrid>
        {report.imageAnalysis && (
          <ProseBlock title="Image analysis">{report.imageAnalysis}</ProseBlock>
        )}
        {report.damageAssessment && (
          <ProseBlock title="Damage & wear assessment">{report.damageAssessment}</ProseBlock>
        )}
      </ReportSection>

      <ReportSection
        number="2"
        title="Identity & description"
        subtitle="Registered record vs visual identification"
      >
        <ValidationHeader
          pass={report.checks.find((c) => c.key === 'namedescriptionmatch')?.pass}
          percent={report.data.namedescriptionmatchpercent}
        />
        <ComparisonTable
          rows={[
            ['Asset name', report.registered.name, report.detectedAsset],
            ['Description', report.registered.description, '—'],
          ]}
        />
        {report.identityReasoning && (
          <ProseBlock title="AI reasoning">{report.identityReasoning}</ProseBlock>
        )}
      </ReportSection>

      <ReportSection
        number="3"
        title="Classification"
        subtitle="Subcategory and make/model alignment"
      >
        <ValidationHeader
          pass={report.checks.find((c) => c.key === 'subcatmodelmatch')?.pass}
          percent={report.data.subcatmodelmatchpercent}
        />
        <ComparisonTable
          rows={[
            ['Subcategory', report.registered.subcategory, report.recommendedSubcategory],
            ['Make / model', report.registered.makeModel, report.recommendedMakeModel],
          ]}
        />
      </ReportSection>

      <ReportSection
        number="4"
        title="Asset tag verification"
        subtitle="Registered tag number vs detected label"
      >
        <ValidationHeader
          pass={report.checks.find((c) => c.key === 'detectedtagnumbermatch')?.pass}
          percent={report.data.detectedtagnumbermatchpercent}
        />
        <ComparisonTable
          rows={[
            ['Tag number', report.registeredTag, report.detectedTag],
          ]}
        />
        {report.barcodePosition && (
          <ProseBlock title="Barcode / label position">{report.barcodePosition}</ProseBlock>
        )}
      </ReportSection>

      <div className={compact ? 'space-y-6' : 'grid gap-6 lg:grid-cols-2'}>
        <ReportSection
          number="5"
          title="Cost validation"
          subtitle="Registered cost vs market estimate"
        >
          <ValidationHeader pass={report.cost.match} percent={report.data.costmatchpercent} />
          <ComparisonTable
            rows={[
              [
                'Cost',
                formatReportCurrency(report.cost.user ?? report.registered.cost),
                formatReportCurrency(report.cost.estimated),
              ],
            ]}
          />
          {report.cost.reasoning && (
            <ProseBlock title="Cost reasoning">{report.cost.reasoning}</ProseBlock>
          )}
        </ReportSection>

        <ReportSection
          number="6"
          title="Acquisition date"
          subtitle="Purchase date plausibility vs model availability"
        >
          <ValidationHeader pass={report.date.match} percent={report.data.datematchpercent} />
          <MetricGrid>
            <Metric label="Registered date" value={report.registered.acquisitionDate || report.date.user} />
            <Metric label="Estimated model year" value={report.date.estimatedYear} />
            <Metric label="Market status" value={report.date.marketStatus} />
          </MetricGrid>
          {report.date.reasoning && (
            <ProseBlock title="Date reasoning">{report.date.reasoning}</ProseBlock>
          )}
        </ReportSection>
      </div>
    </div>
  );
}

function ScorecardItem({ check }) {
  const pass = check.pass;
  const tone =
    pass === true ? 'border-emerald-200 bg-emerald-50' : pass === false ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white';

  return (
    <div className={`rounded-lg border px-3 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-700">{check.label}</p>
        {pass !== null ? <MatchBadge value={pass ? 'Y' : 'N'} /> : <span className="text-xs text-slate-400">—</span>}
      </div>
      {check.percent != null && (
        <p className="mt-1 text-xs text-slate-500">Confidence {formatConfidence(check.percent)}</p>
      )}
    </div>
  );
}

function ReportSection({ number, title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Section {number}
        </p>
        <h3 className="mt-0.5 text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ValidationHeader({ pass, percent }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">Validation result</span>
      {pass !== null && pass !== undefined ? (
        <MatchBadge value={isPassValue(pass) ? 'Y' : 'N'} />
      ) : (
        <span className="text-sm text-slate-400">Pending</span>
      )}
      {percent != null && (
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {formatConfidence(percent)} confidence
        </span>
      )}
    </div>
  );
}

function isPassValue(pass) {
  return pass === true || pass === 'Y';
}

function MetricGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Metric({ label, value, highlight = false }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className={`mt-1 text-sm ${highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </div>
    </div>
  );
}

function ComparisonTable({ rows }) {
  const visible = rows.filter(([, registered, detected]) => registered || detected);
  if (visible.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Field</th>
            <th className="px-4 py-2.5 font-semibold">Registered</th>
            <th className="px-4 py-2.5 font-semibold">AI detected / recommended</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visible.map(([field, registered, detected]) => (
            <tr key={field}>
              <td className="px-4 py-3 font-medium text-slate-700">{field}</td>
              <td className="px-4 py-3 text-slate-600">{registered || '—'}</td>
              <td className="px-4 py-3 text-slate-900">{detected || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProseBlock({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-slate-50/50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{children}</p>
    </div>
  );
}

function NoticePanel({ title, children, variant = 'info' }) {
  const styles =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-relaxed">{children}</p>
    </div>
  );
}
