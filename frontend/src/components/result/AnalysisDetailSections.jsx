import {
  DollarSign,
  Fingerprint,
  IndianRupee,
  Lightbulb,
  Package,
  PoundSterling,
  Wrench,
} from 'lucide-react';
import { LabelChip } from '../ui/LabelChip';
import { ConfidenceBar } from '../ui/ConfidenceBar';
import {
  formatAgeYearsMonths,
  formatConfidence,
  formatList,
  bookNbvSublabel,
  formatBookNbvDisplay,
  formatDisplayMoneyRange,
  formatInrAmount,
  getValuationDisplayMeta,
  getValuationRange,
} from '../../utils/formatters';
import { formatPlacement, formatStickerType } from '../../utils/placementFormatters';
import { enrichAssetAgeFields } from '../../utils/assetAgeFields';
import {
  humanizeAnalysisMethod,
  humanizeRepairField,
  humanizeUncertaintyFlags,
  humanizeValuationStatus,
  humanizeValidationWarning,
} from '../../utils/humanizeLabels';
import { tagReadableGridValue } from '../../utils/tagReadability';
import { getValuationBullets, normalizeErpVerification } from '../../utils/valuationBullets';
import { ValuationBulletList } from './ValuationBulletList';
import {
  CollapsiblePanel,
  DamageCard,
  InfoGrid,
  InfoRow,
  MoneyHighlight,
  ProseBlock,
  ResultPanel,
} from './ResultLayout';

export function AnalysisMetaChips({ result }) {
  if (!result.analysis_method && result.images_analyzed == null) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {result.analysis_method && (
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
          {humanizeAnalysisMethod(result.analysis_method)}
        </span>
      )}
      {result.images_analyzed != null && (
        <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
          {result.images_analyzed} image{result.images_analyzed === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

function hasMoneyRange(range) {
  return range?.min != null || range?.max != null;
}

function currencyIcon(currency) {
  if (currency === 'USD') return DollarSign;
  if (currency === 'GBP') return PoundSterling;
  return IndianRupee;
}

function ValuationPanel({ valuation, erpVerification, erpContext, analysisPolicy }) {
  if (!valuation) return null;

  const displayMeta = getValuationDisplayMeta(analysisPolicy);
  const asIs = getValuationRange(valuation, 'as_is');
  const nbv = getValuationRange(valuation, 'nbv');
  const likeNew = getValuationRange(valuation, 'like_new_reference');
  const hasAmounts =
    hasMoneyRange(asIs?.range) || hasMoneyRange(nbv?.range) || hasMoneyRange(likeNew?.range);

  return (
    <ResultPanel
      icon={currencyIcon(displayMeta.currency)}
      title="Valuation"
      subtitle={displayMeta.subtitle}
    >
      {!hasAmounts ? (
        <div className="space-y-2 text-sm text-gray-600">
          <p>No market estimate is available for this scan.</p>
          {valuation.assumptions && <InfoRow label="Notes" value={valuation.assumptions} />}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <MoneyHighlight
              label="Current Estimate Value"
              sublabel="Damage-adjusted market value"
              value={formatDisplayMoneyRange(asIs?.range, asIs?.currency || displayMeta.currency)}
              variant="primary"
            />
            <MoneyHighlight
              label="Book value (NBV)"
              sublabel={bookNbvSublabel(valuation)}
              value={
                valuation.nbv
                  ? formatBookNbvDisplay(
                      valuation,
                      erpVerification,
                      erpContext,
                      displayMeta.currency,
                    )
                  : 'Unavailable'
              }
              variant="muted"
            />
          </div>

          {valuation.nbv?.age_years_used != null && (
            <p className="text-sm text-gray-600">
              {valuation.nbv.method === 'erp_book_nbv' ? (
                <>
                  Book NBV from ERP input. Asset age from acquisition date:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatAgeYearsMonths(valuation.nbv.age_years_used)}
                  </span>
                  .
                </>
              ) : (
                <>
                  NBV calculated using approximately{' '}
                  <span className="font-semibold text-gray-900">
                    {formatAgeYearsMonths(valuation.nbv.age_years_used)}
                  </span>{' '}
                  of age.
                </>
              )}
            </p>
          )}

          {getValuationBullets(erpVerification, 'climate_valuation').length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <p className="font-semibold text-sky-900">Location & climate impact on current estimate</p>
              <ValuationBulletList
                className="mt-2 text-sky-950"
                bullets={getValuationBullets(erpVerification, 'climate_valuation')}
              />
            </div>
          )}

          {valuation.nbv_exceeds_as_is != null && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                valuation.nbv_exceeds_as_is
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-950'
              }`}
            >
              <p className="font-semibold">
                NBV exceeds current estimate? {valuation.nbv_exceeds_as_is ? 'Yes' : 'No'}
              </p>
              <p className="mt-1 text-xs opacity-80">
                We allow about 10% wiggle room either way — these figures are estimates, not
                precise numbers.
              </p>
              {valuation.nbv_vs_as_is_note && (
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {valuation.nbv_vs_as_is_note}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Like-new reference
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatDisplayMoneyRange(
                  likeNew?.range,
                  likeNew?.currency || displayMeta.currency,
                )}
              </p>
            </div>
            {valuation.confidence != null && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                <ConfidenceBar value={valuation.confidence} label="Estimate confidence" />
              </div>
            )}
          </div>

          {valuation.assumptions && <InfoRow label="Assumptions" value={valuation.assumptions} />}
          {valuation.currency_note && <InfoRow label="Market" value={valuation.currency_note} />}
        </div>
      )}
    </ResultPanel>
  );
}

function ConditionPanel({ condition }) {
  if (!condition) return null;
  const severity = condition.damage_by_severity;

  return (
    <ResultPanel
      icon={Wrench}
      title="Damage analysis"
      subtitle="Severity, repair outlook, and item-level damage"
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {condition.grade && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              Grade
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-900">{condition.grade}</p>
          </div>
        )}
        {condition.damage_count != null && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Damage items
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">{condition.damage_count}</p>
          </div>
        )}
        {severity && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              By severity
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800">
              <span className="text-amber-700">{severity.minor ?? 0} minor</span>
              {' · '}
              <span className="text-orange-700">{severity.moderate ?? 0} moderate</span>
              {' · '}
              <span className="text-red-700">{severity.severe ?? 0} severe</span>
            </p>
          </div>
        )}
      </div>

      {condition.overall_score != null && (
        <div className="mb-5">
          <ConfidenceBar
            value={condition.overall_score / 100}
            label="Condition score"
          />
        </div>
      )}

      <InfoGrid
        items={[
          ['Summary', condition.summary],
          ['Cosmetic', condition.cosmetic_condition],
          ['Structural', condition.structural_condition],
          ['Functional', condition.functional_status],
          ['Cleanliness', condition.cleanliness],
          ['Wear', condition.wear_level],
          ['Usability', condition.usability],
          ['Repair recommendation', condition.repair_recommendation],
          ['Remaining life', condition.estimated_remaining_life],
          ['Positive aspects', condition.positive_aspects?.length ? formatList(condition.positive_aspects) : null],
          ['Functional issues', condition.functional_issues?.length ? formatList(condition.functional_issues) : null],
          ['Missing parts', condition.missing_parts?.length ? formatList(condition.missing_parts) : null],
        ]}
      />

      {condition.repair_plan && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Repair plan</p>
          {condition.repair_plan.summary && (
            <ProseBlock className="rounded-xl bg-amber-50/50 px-4 py-3">{condition.repair_plan.summary}</ProseBlock>
          )}
          {condition.repair_plan.items?.length > 0 ? (
            <ul className="space-y-2">
              {condition.repair_plan.items.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {item.damage_type || 'Issue'}
                    {item.location ? ` — ${item.location}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {humanizeRepairField(item.repair_needed, 'repair_needed')}
                    {item.repair_urgency
                      ? ` · ${humanizeRepairField(item.repair_urgency, 'repair_urgency')}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-gray-900">Damage details</p>
        {condition.damage_items?.length ? (
          <ul className="space-y-3">
            {condition.damage_items.map((item, index) => (
              <DamageCard key={`${item.location}-${index}`} item={item} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No damage reported.</p>
        )}
      </div>
    </ResultPanel>
  );
}

function AssetProfilePanel({ asset }) {
  if (!asset) return null;

  return (
    <CollapsiblePanel icon={Package} title="Asset profile" subtitle="Identity and specifications">
      <InfoGrid
        items={[
          ['Category', asset.category],
          ['Type', asset.type],
          ['Brand', asset.brand],
          ['Model', asset.model],
          ['Color', asset.color],
          ['Material', asset.material],
          ['Dimensions', asset.estimated_dimensions],
          ['Model year', asset.estimated_model_years],
          ['Age (today)', formatAgeYearsMonths(asset.estimated_age_years)],
          ['Serial number', asset.serial_number],
          ['Normalized tag', asset.asset_tag_number],
          ['Quantity', asset.quantity != null ? String(asset.quantity) : null],
          ['Specifications', asset.specifications?.length ? formatList(asset.specifications) : null],
          ['Accessories', asset.accessories?.length ? formatList(asset.accessories) : null],
          [
            'Distinguishing features',
            asset.distinguishing_features?.length ? formatList(asset.distinguishing_features) : null,
          ],
        ]}
      />
    </CollapsiblePanel>
  );
}

function PhotoCoverageBar({ score, angles }) {
  if (score == null && !angles?.length) return null;
  const pct = score != null ? Math.round((score / 5) * 100) : 0;
  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Photo coverage
        {score != null ? ` — ${score}/5` : ''}
      </p>
      {score != null && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {angles?.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-700">
          {angles.map((angle) => (
            <li key={angle.id} className="flex items-center gap-2">
              <span
                className={
                  angle.satisfied ? 'text-emerald-600' : 'text-amber-600'
                }
              >
                {angle.satisfied ? '✓' : '○'}
              </span>
              <span>{angle.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ValuationInsightsBlock({ title, bullets }) {
  if (!bullets?.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <ValuationBulletList bullets={bullets} />
    </div>
  );
}

function ErpVerificationPanel({ erpVerification }) {
  if (!erpVerification) return null;

  const nbvBullets = getValuationBullets(erpVerification, 'nbv_vs_market');
  const climateBullets = getValuationBullets(erpVerification, 'climate_valuation');

  const yesNo = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return '—';
  };

  const matchVariant = (value) => {
    if (value === true) return 'text-emerald-700';
    if (value === false) return 'text-red-700';
    return 'text-gray-600';
  };

  const warnings = erpVerification.validation_warnings || [];

  return (
    <CollapsiblePanel
      icon={Fingerprint}
      title="ERP verification"
      subtitle="Vision results compared to input payload"
    >
      <PhotoCoverageBar
        score={erpVerification.photo_coverage_score}
        angles={erpVerification.photo_angles}
      />

      <InfoGrid
        items={[
          [
            'Tag number match',
            <span key="tag-match" className={`font-semibold ${matchVariant(erpVerification.tag_number_match)}`}>
              {yesNo(erpVerification.tag_number_match)}
            </span>,
          ],
          ['Tag visible', erpVerification.tag_visible == null ? null : yesNo(erpVerification.tag_visible)],
          ['Tag readable', erpVerification.tag_readable == null ? null : yesNo(erpVerification.tag_readable)],
          ['ERP tag (input)', erpVerification.erp_tag_number],
          ['Detected tag (vision)', erpVerification.detected_tag_number || erpVerification.detected_tag_number_raw],
          ['Tag match notes', erpVerification.tag_match_note],
          [
            'Category match',
            erpVerification.category_match == null ? '—' : yesNo(erpVerification.category_match),
          ],
          ['ERP category', erpVerification.erp_category],
          ['Vision category', erpVerification.vision_category],
          [
            'Make match (vision vs ERP)',
            erpVerification.make_match == null ? '—' : yesNo(erpVerification.make_match),
          ],
          [
            'Model match (vision vs ERP)',
            erpVerification.model_match == null ? '—' : yesNo(erpVerification.model_match),
          ],
          ['Vision make', erpVerification.vision_make],
          ['Vision model', erpVerification.vision_model],
          [
            'Rust / corrosion noted',
            erpVerification.rust_corrosion_noted == null
              ? null
              : yesNo(erpVerification.rust_corrosion_noted),
          ],
          ['Functional appearance', erpVerification.functional_appearance],
          [
            'Book NBV (ERP input)',
            erpVerification.erp_book_nbv_inr != null
              ? formatInrAmount(erpVerification.erp_book_nbv_inr)
              : null,
          ],
          ['Location', erpVerification.location],
          ['Climate profile', erpVerification.location_profile],
        ]}
      />

      <ValuationInsightsBlock title="NBV vs market" bullets={nbvBullets} />
      <ValuationInsightsBlock title="Climate valuation note" bullets={climateBullets} />

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-2 rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
          {warnings.map((code) => (
            <li key={code}>{humanizeValidationWarning(code)}</li>
          ))}
        </ul>
      )}
    </CollapsiblePanel>
  );
}

function TrackingPanel({ result, identifiers }) {
  const hasLabels = (result.visible_labels?.length ?? 0) > 0;
  const hasStickers = identifiers?.stickers?.length > 0;
  const hasIds =
    identifiers &&
    (identifiers.asset_tag_number_raw ||
      identifiers.asset_tag_number ||
      identifiers.tag_position ||
      identifiers.tag_detection_reasoning ||
      identifiers.barcode?.present);

  if (!hasIds && !hasLabels && !hasStickers) return null;

  return (
    <CollapsiblePanel icon={Fingerprint} title="Tracking & labels" subtitle="Tags, barcodes, and stickers">
      <div className="space-y-5">
        <InfoGrid
          items={[
            ['Tag (raw)', identifiers?.asset_tag_number_raw],
            ['Tag (normalized)', identifiers?.asset_tag_number],
            ['Tag readable', tagReadableGridValue(identifiers)],
            ['Tag position', identifiers?.tag_position],
            ['Detection notes', identifiers?.tag_detection_reasoning],
          ]}
        />

        {identifiers?.barcode?.present && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Barcode
            </p>
            <InfoGrid
              items={[
                ['Present', identifiers.barcode.present ? 'Yes' : 'No'],
                [
                  'Readable',
                  identifiers.barcode.readable == null
                    ? null
                    : identifiers.barcode.readable
                      ? 'Yes'
                      : 'No',
                ],
                ['Placement', formatPlacement(identifiers.barcode.placement)],
                ['Notes', identifiers.barcode.detection_reasoning],
              ]}
            />
          </div>
        )}

        {hasStickers && (
          <ul className="space-y-2">
            {identifiers.stickers.map((sticker, index) => (
              <li
                key={`${sticker.label_text}-${index}`}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3"
              >
                <p className="font-medium text-gray-900">{sticker.label_text || 'Sticker'}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {[formatStickerType(sticker.sticker_type), formatPlacement(sticker.placement)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}

        {hasLabels && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Visible labels
            </p>
            <div className="flex flex-wrap gap-2">
              {result.visible_labels.map((label) => (
                <LabelChip key={label} label={label} />
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}

function InsightsPanel({ reasoning }) {
  if (!reasoning) return null;
  const hasContent =
    reasoning.narrative ||
    reasoning.selected_identity_rationale ||
    reasoning.damage_notes ||
    reasoning.repair_judgement_notes ||
    reasoning.uncertainty_flags?.length ||
    reasoning.identity_candidates?.length;
  if (!hasContent) return null;

  return (
    <CollapsiblePanel
      icon={Lightbulb}
      title="Analysis insights"
      subtitle="How the AI reached its conclusions"
    >
      <div className="space-y-4">
        {reasoning.narrative && <ProseBlock>{reasoning.narrative}</ProseBlock>}
        <InfoRow label="Identity" value={reasoning.selected_identity_rationale} />
        <InfoRow label="Damage" value={reasoning.damage_notes} />
        <InfoRow label="Repair judgement" value={reasoning.repair_judgement_notes} />
        {reasoning.uncertainty_flags?.length > 0 && (
          <ul className="space-y-2 text-sm text-gray-700">
            {humanizeUncertaintyFlags(reasoning.uncertainty_flags).map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-violet-500" aria-hidden>
                  •
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
        {reasoning.identity_candidates?.length > 0 && (
          <ul className="space-y-2">
            {reasoning.identity_candidates.map((c) => (
              <li key={c.label} className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{c.label}</span>
                  {c.confidence != null && (
                    <span className="text-xs font-semibold text-violet-700">
                      {formatConfidence(c.confidence)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollapsiblePanel>
  );
}

export function AnalysisDetailSections({ result }) {
  const asset = enrichAssetAgeFields(result.asset);
  const condition = result.conditionDetail;
  const valuation = result.valuation;
  const identifiers = result.identifiers;
  const erpVerification = normalizeErpVerification(
    result.erp_verification ?? result.apiResponse?.demo_verification,
  );
  const hasApiShape = Boolean(asset || condition || valuation);

  if (!hasApiShape) return null;

  return (
    <div className="space-y-6">
      <ValuationPanel
        valuation={valuation}
        erpVerification={erpVerification}
        erpContext={result.erpContext}
        analysisPolicy={result.analysis_policy}
      />
      <ConditionPanel condition={condition} />
      <ErpVerificationPanel erpVerification={erpVerification} />
      <AssetProfilePanel asset={asset} />
      <TrackingPanel result={result} identifiers={identifiers} />
      <InsightsPanel reasoning={result.reasoning_summary} />
    </div>
  );
}
