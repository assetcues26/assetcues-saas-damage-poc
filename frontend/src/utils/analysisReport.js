import { CHECK_LABELS } from './aiValidationLabels';

/** @param {string | boolean | null | undefined} value */
export function isPass(value) {
  if (value === true || value === 'Y') return true;
  if (value === false || value === 'N') return false;
  return null;
}

/**
 * @param {object | null | undefined} response
 * @param {object | null | undefined} [asset]
 */
export function buildAnalysisReport(response, asset = null) {
  const data = response || {};
  const cost = data.costvalidation || {};
  const date = data.acquisitiondatevalidation || {};
  const barcode = data.barcodeposition || {};

  const checks = [
    {
      key: 'imageReadability',
      label: CHECK_LABELS.imageReadability,
      pass: isPass(data.imageReadability),
      percent: null,
    },
    {
      key: 'namedescriptionmatch',
      label: CHECK_LABELS.namedescriptionmatch,
      pass: isPass(data.namedescriptionmatch),
      percent: data.namedescriptionmatchpercent,
    },
    {
      key: 'subcatmodelmatch',
      label: CHECK_LABELS.subcatmodelmatch,
      pass: isPass(data.subcatmodelmatch),
      percent: data.subcatmodelmatchpercent,
    },
    {
      key: 'detectedtagnumbermatch',
      label: CHECK_LABELS.detectedtagnumbermatch,
      pass: isPass(data.detectedtagnumbermatch),
      percent: data.detectedtagnumbermatchpercent,
    },
    {
      key: 'costmatch',
      label: CHECK_LABELS.costmatch,
      pass: isPass(cost.costmatch),
      percent: data.costmatchpercent,
    },
    {
      key: 'datematch',
      label: CHECK_LABELS.datematch,
      pass: isPass(date.datematch),
      percent: data.datematchpercent,
    },
  ];

  const passCount = checks.filter((c) => c.pass === true).length;
  const failCount = checks.filter((c) => c.pass === false).length;

  return {
    data,
    checks,
    passCount,
    failCount,
    detectedAsset: data.detectedAsset,
    condition: data.condition,
    imageAnalysis: data.imageAnalysis,
    damageAssessment: data.damage_assessment,
    imageReadability: data.imageReadability,
    identityReasoning: data.reasoning,
    recommendedSubcategory: data.recommendedsubcategory,
    recommendedMakeModel: data.recommendedmakemodel,
    registeredTag: asset?.tagnumber ?? data.tagnumber,
    detectedTag: data.detectedtagnumber,
    barcodePosition: barcode.position,
    cost: {
      user: cost.usercost,
      estimated: cost.estimatedcost,
      match: cost.costmatch,
      reasoning: cost.reasoning,
    },
    date: {
      user: date.useracquisitiondate,
      estimatedYear: date.estimatedyear,
      marketStatus: date.estimatedmarketstatus,
      match: date.datematch,
      reasoning: date.reasoning,
    },
    registered: {
      name: asset?.assetname,
      description: asset?.description,
      subcategory: asset?.subcategoryname,
      makeModel: asset?.makemodelname,
      cost: asset?.cost,
      acquisitionDate: asset?.acquisitiondate,
    },
    error: data.error,
  };
}

/** @param {number | string | null | undefined} value */
export function formatReportCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString('en-IN')}`;
}

/** @param {number | null | undefined} percent */
export function formatConfidence(percent) {
  if (percent === null || percent === undefined) return null;
  return `${percent}%`;
}
