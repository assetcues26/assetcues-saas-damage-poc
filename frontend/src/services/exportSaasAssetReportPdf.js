import { jsPDF } from 'jspdf';
import companyLogoUrl from '../assets/AssetCues-Logo 1.png';
import { buildAnalysisReport, formatReportCurrency, isPass } from '../utils/analysisReport';
import { formatDateTime } from '../utils/formatters';
import {
  CONTENT_WIDTH,
  FOOTER_Y,
  MARGIN,
  PAGE_WIDTH,
  THEMES,
  createPageState,
  drawImagesGrid,
  drawPageFooter,
  drawSection,
  pdfSafeText,
  prepareImageForPdf,
  prepareLogoForPdf,
  sanitizeFilename,
  truncateText,
  wrapText,
} from './assetReportPdf';

function passLabel(pass) {
  if (pass === true) return 'PASS';
  if (pass === false) return 'FAIL';
  return 'Pending';
}

function checkResultLine(check) {
  const base = passLabel(check.pass);
  if (check.percent != null && check.percent !== '') {
    return `${base} (${check.percent}% confidence)`;
  }
  return base;
}

function filterSections(sections) {
  return sections
    .map((section) => ({
      ...section,
      fields: (section.fields || [])
        .filter(Boolean)
        .map(([label, value]) => [label, truncateText(pdfSafeText(value))])
        .filter(([, value]) => value != null && value !== '' && value !== '-'),
      bullets: (section.bullets || []).filter((group) => group.items?.length),
    }))
    .filter((section) => section.fields.length > 0 || section.bullets?.length > 0);
}

/**
 * @param {object} asset
 * @param {ReturnType<typeof buildAnalysisReport>} report
 * @param {object | null | undefined} analysis
 */
function buildSaasReportSections(asset, report, analysis) {
  const nameCheck = report.checks.find((c) => c.key === 'namedescriptionmatch');
  const classCheck = report.checks.find((c) => c.key === 'subcatmodelmatch');
  const tagCheck = report.checks.find((c) => c.key === 'detectedtagnumbermatch');

  const sections = [
    {
      id: 'asset',
      title: 'Asset record',
      subtitle: 'Registered master data',
      theme: THEMES.asset,
      fields: [
        ['Asset ID', asset.assetid],
        ['Asset name', asset.assetname],
        ['Tag number', asset.tagnumber],
        ['Asset number', asset.assetnumber],
        ['Company', asset.company],
        ['Asset class', asset.assetclassname],
        ['Category', asset.categoryname],
        ['Subcategory', asset.subcategoryname],
        ['Make / model', asset.makemodelname],
        ['Cost', asset.cost != null ? formatReportCurrency(asset.cost) : null],
        ['Acquisition date', asset.acquisitiondate],
        ['Description', asset.description],
      ],
    },
    {
      id: 'visual',
      title: 'Visual inspection',
      subtitle: 'What the AI detected from asset imagery',
      theme: THEMES.condition,
      fields: [
        ['Detected asset', report.detectedAsset],
        ['Condition', report.condition],
        ['Image readability', passLabel(isPass(report.imageReadability))],
      ],
      bullets: [
        report.imageAnalysis
          ? { heading: 'Image analysis', items: [report.imageAnalysis] }
          : null,
        report.damageAssessment
          ? { heading: 'Damage and wear assessment', items: [report.damageAssessment] }
          : null,
      ].filter(Boolean),
    },
    {
      id: 'identity',
      title: 'Identity and description',
      subtitle: 'Registered record vs visual identification',
      theme: THEMES.summary,
      fields: [
        ['Validation result', checkResultLine(nameCheck || { pass: null, percent: null })],
        ['Registered asset name', report.registered.name],
        ['AI detected asset', report.detectedAsset],
        ['Registered description', report.registered.description],
      ],
      bullets: report.identityReasoning
        ? [{ heading: 'AI reasoning', items: [report.identityReasoning] }]
        : [],
    },
    {
      id: 'classification',
      title: 'Classification',
      subtitle: 'Subcategory and make/model alignment',
      theme: THEMES.erp,
      fields: [
        ['Validation result', checkResultLine(classCheck || { pass: null, percent: null })],
        ['Registered subcategory', report.registered.subcategory],
        ['AI recommended subcategory', report.recommendedSubcategory],
        ['Registered make/model', report.registered.makeModel],
        ['AI recommended make/model', report.recommendedMakeModel],
      ],
    },
    {
      id: 'tag',
      title: 'Asset tag verification',
      subtitle: 'Registered tag number vs detected label',
      theme: THEMES.tracking,
      fields: [
        ['Validation result', checkResultLine(tagCheck || { pass: null, percent: null })],
        ['Registered tag', report.registeredTag],
        ['Detected tag', report.detectedTag],
        ['Barcode position', report.barcodePosition],
      ],
    },
    {
      id: 'cost',
      title: 'Cost validation',
      subtitle: 'Registered cost vs market estimate',
      theme: THEMES.valuation,
      fields: [
        ['Validation result', checkResultLine(report.checks.find((c) => c.key === 'costmatch') || { pass: null, percent: null })],
        ['Registered cost', formatReportCurrency(report.cost.user ?? report.registered.cost)],
        ['AI estimated cost', formatReportCurrency(report.cost.estimated)],
      ],
      bullets: report.cost.reasoning
        ? [{ heading: 'Cost reasoning', items: [report.cost.reasoning] }]
        : [],
    },
    {
      id: 'date',
      title: 'Acquisition date',
      subtitle: 'Purchase date plausibility vs model availability',
      theme: THEMES.valuation,
      fields: [
        ['Validation result', checkResultLine(report.checks.find((c) => c.key === 'datematch') || { pass: null, percent: null })],
        ['Registered date', report.registered.acquisitionDate || report.date.user],
        ['Estimated model year', report.date.estimatedYear],
        ['Market status', report.date.marketStatus],
      ],
      bullets: report.date.reasoning
        ? [{ heading: 'Date reasoning', items: [report.date.reasoning] }]
        : [],
    },
    {
      id: 'checks',
      title: 'Validation summary',
      subtitle: `${report.passCount} passed, ${report.failCount} failed`,
      theme: THEMES.insights,
      fields: report.checks.map((check) => [check.label, checkResultLine(check)]),
    },
    {
      id: 'meta',
      title: 'Analysis metadata',
      subtitle: 'Run details',
      theme: THEMES.meta,
      fields: [
        ['AI status', (asset.ai_status || 'pending').toUpperCase()],
        ['Request ID', analysis?.request_id],
        ['Response time', analysis?.response_time_seconds != null ? `${analysis.response_time_seconds}s` : null],
        ['Analyzed at', analysis?.created_at ? formatDateTime(analysis.created_at) : null],
      ],
    },
  ];

  if (report.error) {
    sections.unshift({
      id: 'error',
      title: 'Analysis error',
      theme: THEMES.condition,
      fields: [['Error', String(report.error)]],
    });
  }

  return filterSections(sections);
}

function drawSaasCoverHeader(doc, asset, report, analysis, startY) {
  let y = startY;

  doc.setFillColor(239, 246, 255);
  doc.rect(0, 0, PAGE_WIDTH, 42, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, PAGE_WIDTH, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('AssetCues Asset Validation Report', PAGE_WIDTH - MARGIN, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const analyzedLabel = analysis?.created_at
    ? formatDateTime(analysis.created_at)
    : formatDateTime(new Date());
  doc.text(analyzedLabel, PAGE_WIDTH - MARGIN, y + 10, { align: 'right' });
  y = 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  const title = asset.assetname || report.detectedAsset || asset.assetid || 'Asset report';
  const titleLines = wrapText(doc, title, CONTENT_WIDTH);
  doc.text(titleLines.slice(0, 2), MARGIN, y);
  y += titleLines.length > 1 ? 12 : 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const subtitle = [
    asset.assetid ? `Asset ID ${asset.assetid}` : null,
    asset.company ? asset.company : null,
    asset.ai_status ? `Status ${String(asset.ai_status).toUpperCase()}` : null,
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.text(wrapText(doc, subtitle, CONTENT_WIDTH).slice(0, 2), MARGIN, y);
  y += 8;

  return y;
}

function drawSaasSummaryMetrics(state, asset, report) {
  const metrics = [
    {
      label: 'AI status',
      value: String(asset.ai_status || 'pending').toUpperCase(),
      color: [219, 234, 254],
    },
    {
      label: 'Checks passed',
      value: String(report.passCount),
      color: [209, 250, 229],
    },
    {
      label: 'Checks failed',
      value: String(report.failCount),
      color: report.failCount > 0 ? [254, 226, 226] : [241, 245, 249],
    },
    {
      label: 'Condition',
      value: report.condition || '-',
      color: [254, 243, 199],
    },
  ];

  const gap = 3;
  const boxW = (CONTENT_WIDTH - gap * (metrics.length - 1)) / metrics.length;
  const boxH = 18;
  state.ensureSpace(boxH + 6);

  metrics.forEach((metric, index) => {
    const x = MARGIN + index * (boxW + gap);
    const { doc } = state;
    doc.setFillColor(...metric.color);
    doc.rect(x, state.y, boxW, boxH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(x, state.y, boxW, boxH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafeText(metric.label).toUpperCase(), x + 2.5, state.y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const valueLines = wrapText(doc, metric.value, boxW - 5);
    doc.text(valueLines.slice(0, 2), x + 2.5, state.y + 11);
  });

  state.y += boxH + 8;
}

function collectSaasImages(asset) {
  const items = [];
  if (asset.asset_image_url) {
    items.push({ url: asset.asset_image_url, caption: 'Asset photo' });
  }
  if (asset.barcode_image_url) {
    items.push({ url: asset.barcode_image_url, caption: 'Barcode photo' });
  }
  return items;
}

/**
 * @param {{ asset: object, analysis?: object | null }} input
 */
export async function exportSaasAssetReportPdf({ asset, analysis }) {
  if (!asset) throw new Error('No asset data to export');

  const response = analysis?.response_json || analysis || {};
  const report = buildAnalysisReport(response, asset);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const state = createPageState(doc);

  state.y = drawSaasCoverHeader(doc, asset, report, analysis, state.y);

  try {
    const logo = await prepareLogoForPdf(companyLogoUrl);
    const logoW = 48;
    const logoH = Math.min(16, (logo.height / logo.width) * logoW);
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, 6, logoW, logoH);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('AssetCues', MARGIN, 20);
    doc.setFont('helvetica', 'normal');
  }

  drawSaasSummaryMetrics(state, asset, report);

  const imageItems = collectSaasImages(asset);
  if (imageItems.length > 0) {
    await drawImagesGrid(state, imageItems, state.y);
  }

  const sections = buildSaasReportSections(asset, report, analysis);
  if (sections.length === 0) {
    state.ensureSpace(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No detailed analysis data available for this asset.', MARGIN, state.y);
    state.y += 8;
  } else {
    for (const section of sections) {
      drawSection(state, section);
    }
  }

  state.ensureSpace(10);
  doc.setFillColor(254, 252, 232);
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text(
    wrapText(
      doc,
      'AI-generated validation report from AssetCues. Verify before operational or financial use.',
      CONTENT_WIDTH - 6,
    ),
    MARGIN + 3,
    state.y + 6,
  );

  drawPageFooter(doc, state.pageNum);

  const filename = `AssetCues-Report-${sanitizeFilename(asset.assetname || asset.assetid)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
