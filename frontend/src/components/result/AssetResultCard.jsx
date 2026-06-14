import { useState } from 'react';
import { Copy, Check, Share2, FileText, Tag } from 'lucide-react';
import { exportAssetReportPdf } from '../../services/assetReportPdf';
import { ConditionBadge } from '../ui/ConditionBadge';
import { LabelChip } from '../ui/LabelChip';
import { useApp } from '../../context/AppContext';
import { AnalysisDetailSections, AnalysisMetaChips } from './AnalysisDetailSections';
import { enrichAssetAgeFields } from '../../utils/assetAgeFields';
import { ScanImageGallery } from './ScanImageGallery';
import { HighlightMetric, InfoGrid, ProseBlock, ResultPanel } from './ResultLayout';
import {
  bookNbvSublabel,
  formatAgeYearsMonths,
  formatBookNbvDisplay,
  formatDisplayMoneyRange,
  getCurrencyMeta,
  getValuationRange,
  resolveConditionLabel,
} from '../../utils/formatters';
import { tagReadabilityLabel, tagReadabilityStatus } from '../../utils/tagReadability';

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);
  const display = value && value !== '—' ? value : null;

  const copy = async () => {
    if (!display) return;
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!display) {
    return <span className="text-sm text-gray-500">Not detected</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-lg font-bold tracking-tight text-indigo-700 sm:text-xl">
        {display}
      </span>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function conditionVariant(label) {
  if (label === 'Excellent' || label === 'Good') return 'success';
  if (label === 'Poor') return 'warning';
  return 'default';
}

function sentenceCase(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function repairVariant(text) {
  const lower = (text || '').toLowerCase();
  if (/no repair|none needed|not (needed|required)/.test(lower)) return 'success';
  if (/replace|severe|urgent|immediate/.test(lower)) return 'warning';
  return 'default';
}

export function AssetResultCard({
  result,
  images = [],
  onImageClick,
  activeLightboxIndex = null,
  showExport = true,
  onExportPdf,
}) {
  const { showToast } = useApp();
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const desc =
    [result.asset_description, result.asset?.description, result.conditionDetail?.summary].find(
      (v) => v && v !== '—',
    ) || '';
  const descLong = desc.length > 220;
  const displayDesc = expandedDesc || !descLong ? desc : `${desc.slice(0, 220)}…`;

  const tagStatus = tagReadabilityStatus(result.identifiers);
  const tagBadgeLabel = tagReadabilityLabel(result.identifiers);
  const previewUrls = result.previewUrls?.length ? result.previewUrls : images;
  const hasExtended = Boolean(result.asset || result.conditionDetail || result.valuation);
  const asset = enrichAssetAgeFields(result.asset);
  const assetSubtitle = [asset?.brand, asset?.model, asset?.category].filter(Boolean).join(' · ');
  const ageSummary = formatAgeYearsMonths(asset?.estimated_age_years);
  const modelYearSummary = asset?.estimated_model_years;
  const displayCurrency = result.analysis_policy?.display_currency || 'INR';
  const currencySymbol = getCurrencyMeta(displayCurrency).symbol;
  const asIsRange = getValuationRange(result.valuation, 'as_is');
  const valuationRange = formatDisplayMoneyRange(
    asIsRange?.range,
    asIsRange?.currency || displayCurrency,
  );
  const hasValuation = valuationRange !== '—';
  const bookNbvDisplay = formatBookNbvDisplay(
    result.valuation,
    result.erp_verification,
    result.erpContext,
    displayCurrency,
  );
  const hasBookNbv = bookNbvDisplay !== '—';
  const isErpBookNbv = result.valuation?.nbv?.method === 'erp_book_nbv';
  const conditionLabel = resolveConditionLabel(
    result.conditionDetail?.grade ?? result.condition,
    result.conditionDetail?.overall_score,
  );
  const rawTag =
    result.detected_tag_number_raw && result.detected_tag_number_raw !== '—'
      ? result.detected_tag_number_raw
      : null;
  const tagHighlight =
    rawTag && rawTag.length > 18 ? `${rawTag.slice(0, 16)}…` : rawTag || 'Not detected';
  const repairRecommendation =
    result.conditionDetail?.repair_recommendation &&
    result.conditionDetail.repair_recommendation !== '—'
      ? sentenceCase(result.conditionDetail.repair_recommendation)
      : null;
  const repairShort =
    repairRecommendation && repairRecommendation.length > 40
      ? `${repairRecommendation.slice(0, 38)}…`
      : repairRecommendation;
  const nbvExceedsAsIs = result.valuation?.nbv_exceeds_as_is;
  const erpVerify = result.erp_verification;
  const tagMatchLabel =
    erpVerify != null
      ? erpVerify.tag_number_match
        ? 'Tag match: Yes'
        : 'Tag match: No'
      : null;

  const handleExportPdf = async () => {
    if (onExportPdf) {
      await onExportPdf();
      return;
    }
    setExportingPdf(true);
    try {
      await exportAssetReportPdf(result);
      showToast('PDF report downloaded', 'success');
    } catch (err) {
      showToast(err?.message || 'Could not generate PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-lg ring-1 ring-gray-100">
      <header className="border-b border-gray-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">
              Asset intelligence report
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {result.asset_name}
            </h2>
            {assetSubtitle && <p className="mt-1.5 text-sm text-gray-600">{assetSubtitle}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ConditionBadge
                condition={result.conditionDetail?.grade ?? result.condition}
                overallScore={result.conditionDetail?.overall_score}
              />
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                  tagStatus === 'readable'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : tagStatus === 'unreadable'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                {tagBadgeLabel}
              </span>
              {tagMatchLabel && (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                    erpVerify.tag_number_match
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {tagMatchLabel}
                </span>
              )}
            </div>
            <div className="mt-3">
              <AnalysisMetaChips result={result} />
            </div>
          </div>
          {showExport && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
              aria-label="Export PDF report"
              title="Export PDF report"
            >
              <Share2 size={20} className={exportingPdf ? 'animate-pulse' : ''} aria-hidden />
            </button>
          )}
        </div>
      </header>

      <ScanImageGallery
        mergedImageUrl={result.mergedImageUrl}
        previewUrls={previewUrls}
        processingMode={result.processingMode}
        analysisMethod={result.analysis_method}
        onImageClick={onImageClick}
        activeIndex={activeLightboxIndex}
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HighlightMetric
            label="Condition"
            value={conditionLabel}
            hint={result.asset_condition !== '—' ? 'See overview' : undefined}
            variant={conditionVariant(conditionLabel)}
          />
          <HighlightMetric
            label="Current estimate"
            value={hasValuation ? valuationRange : 'Pending'}
            hint={
              hasValuation
                ? `Damage-adjusted market (${currencySymbol})`
                : 'Run fresh analysis'
            }
            variant={hasValuation ? 'primary' : 'muted'}
          />
          {isErpBookNbv && hasBookNbv && (
            <HighlightMetric
              label="Book NBV"
              value={bookNbvDisplay}
              hint={bookNbvSublabel(result.valuation)}
              variant="default"
            />
          )}
          <HighlightMetric
            label={erpVerify ? 'Tag match' : 'Asset tag'}
            value={
              erpVerify
                ? erpVerify.tag_number_match
                  ? 'Yes'
                  : 'No'
                : tagHighlight
            }
            hint={
              erpVerify
                ? erpVerify.detected_tag_number || erpVerify.erp_tag_number || 'See ERP verification'
                : rawTag && rawTag.length > 18
                  ? 'Full tag in Tracking'
                  : undefined
            }
            mono={!erpVerify}
            variant={erpVerify?.tag_number_match ? 'primary' : erpVerify ? 'warning' : 'muted'}
          />
          <HighlightMetric
            label="Age"
            value={ageSummary || modelYearSummary || '—'}
            hint={modelYearSummary && ageSummary ? `Year ${modelYearSummary}` : undefined}
            variant="default"
          />
          {repairShort && (
            <HighlightMetric
              label="Repair recommendation"
              value={repairShort}
              hint="See condition & damage"
              variant={repairVariant(repairRecommendation)}
            />
          )}
          {nbvExceedsAsIs != null && (
            <HighlightMetric
              label="NBV vs current estimate"
              value={nbvExceedsAsIs ? 'NBV above estimate' : 'Within estimate'}
              hint={
                nbvExceedsAsIs
                  ? 'Book NBV exceeds damage-adjusted market value'
                  : 'Book NBV is at or below market value'
              }
              variant={nbvExceedsAsIs ? 'warning' : 'success'}
            />
          )}
        </div>

        <ResultPanel
          icon={FileText}
          title="Overview"
          subtitle="What we see and how the asset is doing"
        >
          <div className="space-y-5">
            {result.asset_name && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Asset name
                </p>
                <p className="text-lg font-semibold text-gray-900">{result.asset_name}</p>
              </div>
            )}
            {displayDesc ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </p>
                <ProseBlock>{displayDesc}</ProseBlock>
                {descLong && (
                  <button
                    type="button"
                    onClick={() => setExpandedDesc((e) => !e)}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {expandedDesc ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : null}
            {result.asset_condition && result.asset_condition !== '—' && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Condition summary
                </p>
                <ProseBlock className="mt-2">{result.asset_condition}</ProseBlock>
              </div>
            )}
          </div>
        </ResultPanel>

        {!hasExtended && (
          <ResultPanel icon={Tag} title="Tracking" subtitle="Tag and label detection">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Asset tag number
                </p>
                <CopyField value={result.detected_tag_number_raw} label="tag number" />
              </div>
              <InfoGrid
                items={[
                  ['Tag position', result.barcodeposition],
                  ['Detection notes', result.tag_detection_reasoning],
                ]}
              />
            </div>
          </ResultPanel>
        )}

        <AnalysisDetailSections result={result} />

        {!hasExtended && (result.visible_labels?.length ?? 0) > 0 && (
          <ResultPanel icon={Tag} title="Detected labels" subtitle="Text seen on the asset">
            <div className="flex flex-wrap gap-2">
              {result.visible_labels.map((label) => (
                <LabelChip key={label} label={label} />
              ))}
            </div>
          </ResultPanel>
        )}
      </div>
    </article>
  );
}
