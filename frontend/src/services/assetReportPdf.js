import { jsPDF } from 'jspdf';
import companyLogoUrl from '../assets/AssetCues-Logo 1.png';
import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';
import {
  bookNbvSublabel,
  formatAgeYearsMonths,
  formatBookNbvDisplay,
  formatConfidence,
  formatDateTime,
  formatDisplayMoneyRange,
  formatInrAmount,
  formatList,
  formatProcessingTime,
  getValuationDisplayMeta,
  getValuationRange,
} from '../utils/formatters';
import {
  humanizeAnalysisMethod,
  humanizeRepairField,
  humanizeUncertaintyFlags,
  humanizeValidationWarning,
  humanizeValuationStatus,
} from '../utils/humanizeLabels';
import { buildAssetReportUrl } from '../utils/reportUrl';
import { formatPlacement, formatStickerType } from '../utils/placementFormatters';
import { getValuationBullets, normalizeErpVerification } from '../utils/valuationBullets';

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 12;
const LABEL_COL = 52;
const MAX_VALUE_CHARS = 1200;
const MAX_FIELD_LINES = 24;

const THEMES = {
  summary: { fill: [239, 246, 255], accent: [37, 99, 235], bar: [59, 130, 246] },
  erp: { fill: [236, 253, 245], accent: [5, 150, 105], bar: [16, 185, 129] },
  valuation: { fill: [255, 251, 235], accent: [180, 83, 9], bar: [245, 158, 11] },
  asset: { fill: [238, 242, 255], accent: [67, 56, 202], bar: [99, 102, 241] },
  condition: { fill: [254, 242, 242], accent: [185, 28, 28], bar: [239, 68, 68] },
  tracking: { fill: [241, 245, 249], accent: [71, 85, 105], bar: [100, 116, 139] },
  insights: { fill: [250, 245, 255], accent: [126, 34, 206], bar: [168, 85, 247] },
  meta: { fill: [248, 250, 252], accent: [100, 116, 139], bar: [148, 163, 184] },
};

function sanitizeFilename(name) {
  return (name || 'asset')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
}

function truncateText(text, max = MAX_VALUE_CHARS) {
  const s = String(text ?? '');
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}...`;
}

/** jsPDF Helvetica is Latin-1 only — strip/replace Unicode that garbles output. */
export function pdfSafeText(text) {
  return String(text ?? '')
    .replace(/\u20b9/g, 'Rs. ')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u00b7/g, ' - ')
    .replace(/\u2026/g, '...')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\t\n\r\x20-\x7e]/g, '');
}

function formatPdfMoneyRange(range, currency = 'INR') {
  const raw = formatDisplayMoneyRange(range, currency);
  if (raw === '—') return null;
  return pdfSafeText(raw);
}

function moneyFieldLabel(baseLabel, currency = 'INR') {
  const suffix =
    currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'Rs.';
  return `${baseLabel} (${suffix})`;
}

function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function urlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to load resource');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function prepareImageForPdf(src, maxWidthPx = 480, quality = 0.68) {
  const dataSrc =
    src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')
      ? src
      : await urlToDataUrl(src);

  const img = await loadImage(dataSrc);
  const scale = Math.min(1, maxWidthPx / (img.naturalWidth || img.width || maxWidthPx));
  const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    width,
    height,
  };
}

/**
 * Load the brand logo for the PDF header.
 * Uses loadImage() directly so the browser's native image loader resolves the
 * Vite-generated asset URL without going through fetch/FileReader.
 * Outputs PNG without a white background fill so the logo's transparent areas
 * show through to the header colour instead of rendering as a white box.
 */
async function prepareLogoForPdf(src) {
  const img = await loadImage(src);
  const w = img.naturalWidth || img.width || 320;
  const h = img.naturalHeight || img.height || 80;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  // No white fill — keep PNG transparency so the logo sits cleanly on any background colour
  ctx.drawImage(img, 0, 0, w, h);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: w,
    height: h,
  };
}

function collectReportImages(entry) {
  const isMulti =
    entry.analysis_method === 'multi_image' ||
    entry.processingMode === UPLOAD_PROCESSING_MODES.DIRECT;

  if (isMulti) {
    return (entry.previewUrls || []).map((url, index) => ({
      url,
      caption: `Image ${index + 1}`,
    }));
  }

  const items = [];
  if (entry.mergedImageUrl) {
    items.push({ url: entry.mergedImageUrl, caption: 'Collage (AI input)' });
  }
  const uploads = (entry.previewUrls || []).filter((u) => u && u !== entry.mergedImageUrl);
  uploads.forEach((url, index) => {
    items.push({ url, caption: `Upload ${index + 1}` });
  });
  return items;
}

function buildReportSections(entry) {
  const asset = entry.asset || {};
  const condition = entry.conditionDetail || {};
  const valuation = entry.valuation || {};
  const identifiers = entry.identifiers || {};
  const erp = normalizeErpVerification(
    entry.erp_verification ?? entry.apiResponse?.demo_verification,
  );
  const ctx = entry.erpContext || {};
  const reasoning = entry.reasoning_summary || {};
  const confidence = entry.confidence || {};
  const displayMeta = getValuationDisplayMeta(entry.analysis_policy);
  const asIs = getValuationRange(valuation, 'as_is');
  const likeNew = getValuationRange(valuation, 'like_new_reference');

  const sections = [];

  sections.push({
    id: 'summary',
    title: 'Executive summary',
    subtitle: 'Key facts at a glance',
    theme: THEMES.summary,
    fields: [
      ['Asset name', entry.asset_name],
      ['Condition grade', entry.condition || condition.grade],
      [
        moneyFieldLabel('Current estimate', displayMeta.currency),
        formatPdfMoneyRange(asIs?.range, asIs?.currency || displayMeta.currency),
      ],
      [
        moneyFieldLabel('Book NBV', displayMeta.currency),
        valuation.nbv
          ? pdfSafeText(
              formatBookNbvDisplay(valuation, erp, ctx, displayMeta.currency),
            )
          : null,
      ],
      ['Tag (detected)', entry.detected_tag_number_raw],
      ['Tag match (ERP)', erp ? yesNo(erp.tag_number_match) : null],
      ['Analysis method', humanizeAnalysisMethod(entry.analysis_method)],
      ['Images analyzed', entry.images_analyzed != null ? String(entry.images_analyzed) : null],
      ['Review required', yesNo(entry.review_required)],
      ['Description', entry.asset_description || asset.description],
    ],
  });

  if (erp || ctx.catalog_id) {
    const climateBullets = getValuationBullets(erp, 'climate_valuation').map(pdfSafeText);
    const nbvBullets = getValuationBullets(erp, 'nbv_vs_market').map(pdfSafeText);
    const warningBullets = (erp?.validation_warnings || [])
      .map(humanizeValidationWarning)
      .map(pdfSafeText);

    sections.push({
      id: 'erp',
      title: 'ERP verification',
      subtitle: 'Vision compared to register payload',
      theme: THEMES.erp,
      fields: [
        ['Catalog ID', ctx.catalog_id],
        ['Asset number (FAR)', ctx.asset_number || ctx.asset_tag_number],
        ['Company code', ctx.company_code],
        ['Location code', ctx.location_code],
        ['Cost center', ctx.cost_center],
        [
          'GL accounts (asset / accum. dep.)',
          ctx.gl_account_asset
            ? `${ctx.gl_account_asset} / ${ctx.gl_account_accum_dep || '-'}`
            : null,
        ],
        ['Capitalization date', ctx.capitalization_date || ctx.acquisition_date],
        ['Depreciation method', ctx.depreciation_method],
        [
          'Useful life',
          ctx.useful_life_years != null ? `${ctx.useful_life_years} years` : null,
        ],
        ['Annual depreciation (Rs.)', ctx.annual_depreciation_inr != null ? formatInrAmount(ctx.annual_depreciation_inr) : null],
        [
          'Accumulated depreciation (Rs.)',
          ctx.accumulated_depreciation_inr != null
            ? formatInrAmount(ctx.accumulated_depreciation_inr)
            : null,
        ],
        [
          'Residual value (Rs.)',
          ctx.residual_value_inr != null ? formatInrAmount(ctx.residual_value_inr) : null,
        ],
        ['FAR as-of date', ctx.far_as_of_date],
        ['ERP asset name', ctx.asset_name],
        ['ERP make / model', [ctx.make, ctx.model].filter(Boolean).join(' / ') || null],
        ['ERP category', erp?.erp_category || ctx.category],
        ['Vision category', erp?.vision_category || asset.category],
        ['Category match', erp?.category_match == null ? null : yesNo(erp.category_match)],
        ['ERP tag', erp?.erp_tag_number || ctx.asset_tag_number],
        ['Detected tag', erp?.detected_tag_number || erp?.detected_tag_number_raw],
        ['Tag visible', erp?.tag_visible == null ? null : yesNo(erp.tag_visible)],
        ['Tag readable', erp?.tag_readable == null ? null : yesNo(erp.tag_readable)],
        ['Tag match', erp ? yesNo(erp.tag_number_match) : null],
        ['Tag match note', erp?.tag_match_note],
        ['Make match', erp?.make_match == null ? null : yesNo(erp.make_match)],
        ['Model match', erp?.model_match == null ? null : yesNo(erp.model_match)],
        ['Vision make', erp?.vision_make || asset.brand],
        ['Vision model', erp?.vision_model || asset.model],
        ['Book NBV (ERP input)', erp?.erp_book_nbv_inr != null ? formatInrAmount(erp.erp_book_nbv_inr) : ctx.book_nbv_inr != null ? formatInrAmount(ctx.book_nbv_inr) : null],
        ['Acquisition date', ctx.acquisition_date],
        ['Original cost (Rs.)', ctx.original_cost_inr != null ? formatInrAmount(ctx.original_cost_inr) : null],
        ['Location', erp?.location || ctx.location],
        ['Climate profile', erp?.location_profile],
        ['Rust / corrosion noted', erp?.rust_corrosion_noted == null ? null : yesNo(erp.rust_corrosion_noted)],
        ['Functional appearance', erp?.functional_appearance || condition.functional_status],
        [
          'Photo coverage score',
          erp?.photo_coverage_score != null ? `${erp.photo_coverage_score}/5` : null,
        ],
        ['Suggests manual review', erp?.suggests_review == null ? null : yesNo(erp.suggests_review)],
        [
          'Tag zoom hint',
          erp?.tag_zoom_hint
            ? `Image ${erp.tag_zoom_hint.image_index ?? '?'} @ ${erp.tag_zoom_hint.x_pct?.toFixed?.(0) ?? erp.tag_zoom_hint.x_pct}%,${erp.tag_zoom_hint.y_pct?.toFixed?.(0) ?? erp.tag_zoom_hint.y_pct}%`
            : null,
        ],
        ...(erp?.photo_angles || []).map((a) => [
          `Angle: ${a.label}`,
          a.satisfied ? 'Captured' : 'Not evidenced',
        ]),
      ],
      bullets: [
        ...(nbvBullets.length ? [{ heading: 'NBV vs market', items: nbvBullets }] : []),
        ...(climateBullets.length ? [{ heading: 'Climate valuation', items: climateBullets }] : []),
        ...(warningBullets.length ? [{ heading: 'Validation warnings', items: warningBullets }] : []),
      ],
    });
  }

  sections.push({
    id: 'valuation',
    title: 'Valuation',
    subtitle: displayMeta.subtitle,
    theme: THEMES.valuation,
    fields: [
      ['Status', valuation.status ? humanizeValuationStatus(valuation.status) : null],
      [
        moneyFieldLabel('Current estimate', displayMeta.currency),
        formatPdfMoneyRange(asIs?.range, asIs?.currency || displayMeta.currency),
      ],
      [
        moneyFieldLabel('Book NBV', displayMeta.currency),
        valuation.nbv
          ? pdfSafeText(
              formatBookNbvDisplay(valuation, erp, ctx, displayMeta.currency),
            )
          : null,
      ],
      ['NBV method', valuation.nbv?.method === 'erp_book_nbv' ? 'ERP book value' : valuation.nbv?.method],
      ['NBV sublabel', valuation.nbv ? bookNbvSublabel(valuation) : null],
      [
        'Asset age (NBV context)',
        valuation.nbv?.age_years_used != null
          ? formatAgeYearsMonths(valuation.nbv.age_years_used)
          : null,
      ],
      [
        moneyFieldLabel('Like-new reference', displayMeta.currency),
        formatPdfMoneyRange(likeNew?.range, likeNew?.currency || displayMeta.currency),
      ],
      [
        'NBV exceeds current estimate',
        valuation.nbv_exceeds_as_is == null ? null : yesNo(valuation.nbv_exceeds_as_is),
      ],
      ['NBV vs estimate note', valuation.nbv_vs_as_is_note],
      ['Estimate confidence', valuation.confidence != null ? formatConfidence(valuation.confidence) : null],
      ['Assumptions', valuation.assumptions],
      ['Currency note', valuation.currency_note],
      ['NBV disclaimer', valuation.nbv?.disclaimer],
      ['Valuation disclaimer', valuation.disclaimer],
    ],
  });

  sections.push({
    id: 'asset',
    title: 'Asset profile',
    subtitle: 'Identity and specifications',
    theme: THEMES.asset,
    fields: [
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
      ['Normalized tag', asset.asset_tag_number || identifiers.asset_tag_number],
      ['Quantity', asset.quantity != null ? String(asset.quantity) : null],
      ['Specifications', asset.specifications?.length ? formatList(asset.specifications) : null],
      ['Accessories', asset.accessories?.length ? formatList(asset.accessories) : null],
      [
        'Distinguishing features',
        asset.distinguishing_features?.length ? formatList(asset.distinguishing_features) : null,
      ],
      ['Full description', asset.description || entry.asset_description],
    ],
  });

  const severity = condition.damage_by_severity;
  sections.push({
    id: 'condition',
    title: 'Condition and damage',
    subtitle: 'Physical state and repair outlook',
    theme: THEMES.condition,
    fields: [
      ['Grade', condition.grade],
      [
        'Overall score',
        condition.overall_score != null
          ? `${Math.round(
              condition.overall_score > 10
                ? condition.overall_score
                : condition.overall_score > 1
                  ? condition.overall_score * 10
                  : condition.overall_score * 100,
            )}/100`
          : null,
      ],
      ['Summary', condition.summary || entry.asset_condition],
      ['Cosmetic', condition.cosmetic_condition],
      ['Structural', condition.structural_condition],
      ['Functional', condition.functional_status],
      ['Cleanliness', condition.cleanliness],
      ['Wear level', condition.wear_level],
      ['Usability', condition.usability],
      ['Repair recommendation', condition.repair_recommendation],
      ['Remaining life', condition.estimated_remaining_life],
      ['Has damage', yesNo(condition.has_damage)],
      ['Damage count', condition.damage_count != null ? String(condition.damage_count) : null],
      severity
        ? [
            'Severity breakdown',
            `Minor ${severity.minor ?? 0} | Moderate ${severity.moderate ?? 0} | Severe ${severity.severe ?? 0}`,
          ]
        : null,
      [
        'Positive aspects',
        condition.positive_aspects?.length ? formatList(condition.positive_aspects) : null,
      ],
      [
        'Functional issues',
        condition.functional_issues?.length ? formatList(condition.functional_issues) : null,
      ],
      ['Missing parts', condition.missing_parts?.length ? formatList(condition.missing_parts) : null],
      ['Repair plan summary', condition.repair_plan?.summary],
      [
        'Overall repair needed',
        condition.repair_plan?.overall_repair_needed == null
          ? null
          : yesNo(condition.repair_plan.overall_repair_needed),
      ],
      ...(condition.repair_plan?.items || []).flatMap((item, i) => [
        [`Repair #${i + 1}`, [item.damage_type, item.location].filter(Boolean).join(' - ')],
        [
          `Repair #${i + 1} action`,
          [
            humanizeRepairField(item.repair_needed, 'repair_needed'),
            humanizeRepairField(item.repair_urgency, 'repair_urgency'),
          ]
            .filter(Boolean)
            .join(' | '),
        ],
        [`Repair #${i + 1} rationale`, item.rationale],
      ]),
      ...(condition.damage_items || []).flatMap((item, i) => [
        [`Damage #${i + 1}`, [item.type, item.severity, item.location].filter(Boolean).join(' - ')],
        [`Damage #${i + 1} detail`, item.detail],
        [`Damage #${i + 1} placement`, formatPlacement(item.placement)],
        [
          `Damage #${i + 1} seen in`,
          item.seen_in_image != null ? `Image ${item.seen_in_image}` : null,
        ],
        [
          `Damage #${i + 1} affects function`,
          item.affects_function == null ? null : yesNo(item.affects_function),
        ],
        [`Damage #${i + 1} repair`, item.repair_action],
        [
          `Damage #${i + 1} repair needed`,
          item.repair_needed ? humanizeRepairField(item.repair_needed, 'repair_needed') : null,
        ],
        [
          `Damage #${i + 1} urgency`,
          item.repair_urgency ? humanizeRepairField(item.repair_urgency, 'repair_urgency') : null,
        ],
        [
          `Damage #${i + 1} acceptable wear`,
          item.acceptable_wear == null ? null : yesNo(item.acceptable_wear),
        ],
      ]),
    ].filter(Boolean),
  });

  sections.push({
    id: 'tracking',
    title: 'Tracking and labels',
    subtitle: 'Tags, barcodes, and stickers',
    theme: THEMES.tracking,
    fields: [
      ['Tag (raw)', identifiers.asset_tag_number_raw],
      ['Tag (normalized)', identifiers.asset_tag_number],
      ['Tag readable', identifiers.tag_readable == null ? null : yesNo(identifiers.tag_readable)],
      ['Tag position', entry.barcodeposition || identifiers.tag_position],
      ['Detection notes', entry.tag_detection_reasoning || identifiers.tag_detection_reasoning],
      ['Visible labels', entry.visible_labels?.length ? formatList(entry.visible_labels) : null],
      ...(identifiers.barcode?.present
        ? [
            ['Barcode present', yesNo(identifiers.barcode.present)],
            [
              'Barcode readable',
              identifiers.barcode.readable == null ? null : yesNo(identifiers.barcode.readable),
            ],
            ['Barcode placement', formatPlacement(identifiers.barcode.placement)],
            ['Barcode notes', identifiers.barcode.detection_reasoning],
          ]
        : []),
      ...(identifiers.stickers || []).flatMap((sticker, i) => [
        [`Sticker #${i + 1}`, sticker.label_text],
        [`Sticker #${i + 1} type`, formatStickerType(sticker.sticker_type)],
        [`Sticker #${i + 1} placement`, formatPlacement(sticker.placement)],
      ]),
    ],
  });

  const uncertainty = humanizeUncertaintyFlags(reasoning.uncertainty_flags || []);
  sections.push({
    id: 'insights',
    title: 'AI insights',
    subtitle: 'Reasoning and confidence notes',
    theme: THEMES.insights,
    fields: [
      ['Narrative', reasoning.narrative],
      ['Identity rationale', reasoning.selected_identity_rationale],
      ['Damage notes', reasoning.damage_notes],
      ['Repair judgement', reasoning.repair_judgement_notes],
      ['Overall confidence', confidence.overall != null ? formatConfidence(confidence.overall) : null],
      ['Name confidence', confidence.asset_name != null ? formatConfidence(confidence.asset_name) : null],
      [
        'Condition confidence',
        confidence.asset_condition != null ? formatConfidence(confidence.asset_condition) : null,
      ],
      [
        'Description confidence',
        confidence.asset_description != null ? formatConfidence(confidence.asset_description) : null,
      ],
      [
        'Tag confidence',
        confidence.asset_tag_number != null ? formatConfidence(confidence.asset_tag_number) : null,
      ],
      ...(reasoning.identity_candidates || []).flatMap((c, i) => [
        [`Candidate #${i + 1}`, c.label],
        [`Candidate #${i + 1} confidence`, c.confidence != null ? formatConfidence(c.confidence) : null],
      ]),
    ],
    bullets: uncertainty.length
      ? [{ heading: 'Uncertainty flags', items: uncertainty.map(pdfSafeText) }]
      : [],
  });

  sections.push({
    id: 'meta',
    title: 'Analysis metadata',
    subtitle: 'Run details and costs',
    theme: THEMES.meta,
    fields: [
      ['Request ID', entry.request_id],
      ['Prompt version', entry.prompt_version],
      ['Processing time', entry.processing_time_ms != null ? formatProcessingTime(entry.processing_time_ms) : null],
      ['API route', entry.apiRoute],
      ['Processed at', entry.processedAt ? formatDateTime(entry.processedAt) : null],
      ['Total tokens', entry.token_usage?.total_tokens != null ? String(entry.token_usage.total_tokens) : null],
      ['Model', entry.cost?.model],
      ['Analysis cost (USD)', entry.cost?.total_cost_usd != null ? String(entry.cost.total_cost_usd) : null],
    ],
  });

  return sections
    .map((section) => ({
      ...section,
      fields: (section.fields || [])
        .filter(Boolean)
        .map(([label, value]) => [label, truncateText(pdfSafeText(value))])
        .filter(([, v]) => v != null && v !== '' && v !== '-'),
      bullets: (section.bullets || []).filter((b) => b.items?.length),
    }))
    .filter((s) => s.fields.length > 0 || s.bullets?.length > 0);
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(pdfSafeText(text), maxWidth);
}

function gridColumns(count) {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

function createPageState(doc) {
  return {
    doc,
    y: MARGIN,
    pageNum: 1,
    ensureSpace(neededMm) {
      if (this.y + neededMm > FOOTER_Y - 8) {
        drawPageFooter(this.doc, this.pageNum);
        this.doc.addPage();
        this.pageNum += 1;
        this.y = MARGIN;
      }
    },
  };
}

function drawPageFooter(doc, pageNum) {
  doc.setFillColor(248, 250, 252);
  doc.rect(0, FOOTER_Y - 4, PAGE_WIDTH, 14, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AssetCues - Asset Intelligence Report', MARGIN, FOOTER_Y);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: 'right' });
}

function drawCoverHeader(doc, entry, startY) {
  let y = startY;

  doc.setFillColor(239, 246, 255);
  doc.rect(0, 0, PAGE_WIDTH, 42, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, PAGE_WIDTH, 3, 'F');

  try {
    // logo drawn async in exportAssetReportPdf
  } catch {
    /* handled in caller */
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Asset Intelligence Report', PAGE_WIDTH - MARGIN, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(formatDateTime(new Date()), PAGE_WIDTH - MARGIN, y + 10, { align: 'right' });
  y = 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  const titleLines = wrapText(doc, entry.asset_name || 'Asset report', CONTENT_WIDTH);
  doc.text(titleLines.slice(0, 2), MARGIN, y);
  y += titleLines.length > 1 ? 12 : 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    pdfSafeText(
      `Condition: ${entry.condition || '-'}  |  Tag: ${entry.detected_tag_number_raw || '-'}  |  Images: ${entry.images_analyzed ?? '-'}`,
    ),
    MARGIN,
    y,
  );
  y += 8;

  return y;
}

function drawSummaryMetrics(state, entry) {
  const valuation = entry.valuation || {};
  const erp = normalizeErpVerification(
    entry.erp_verification ?? entry.apiResponse?.demo_verification,
  );
  const displayMeta = getValuationDisplayMeta(entry.analysis_policy);
  const asIs = getValuationRange(valuation, 'as_is');
  const metrics = [
    { label: 'Condition', value: entry.condition || '-', color: [219, 234, 254] },
    {
      label: 'Current estimate',
      value:
        formatPdfMoneyRange(asIs?.range, asIs?.currency || displayMeta.currency) || '-',
      color: [254, 243, 199],
    },
    {
      label: 'Book NBV',
      value:
        pdfSafeText(
          formatBookNbvDisplay(valuation, erp, entry.erpContext, displayMeta.currency),
        ) || '-',
      color: [209, 250, 229],
    },
    {
      label: 'Tag match',
      value: erp ? (erp.tag_number_match ? 'Yes' : 'No') : '-',
      color: erp?.tag_number_match ? [209, 250, 229] : [254, 226, 226],
    },
  ];

  const gap = 3;
  const boxW = (CONTENT_WIDTH - gap * (metrics.length - 1)) / metrics.length;
  const boxH = 18;
  state.ensureSpace(boxH + 6);

  metrics.forEach((m, i) => {
    const x = MARGIN + i * (boxW + gap);
    const { doc } = state;
    docSetFill(doc, m.color);
    doc.rect(x, state.y, boxW, boxH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(x, state.y, boxW, boxH, 'S');

    state.doc.setFont('helvetica', 'bold');
    state.doc.setFontSize(6);
    state.doc.setTextColor(100, 116, 139);
    state.doc.text(pdfSafeText(m.label).toUpperCase(), x + 2.5, state.y + 5);

    state.doc.setFont('helvetica', 'bold');
    state.doc.setFontSize(8);
    state.doc.setTextColor(30, 41, 59);
    const valLines = wrapText(state.doc, m.value, boxW - 5);
    state.doc.text(valLines.slice(0, 2), x + 2.5, state.y + 11);
  });

  state.y += boxH + 8;
}

function docSetFill(doc, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function drawSectionHeader(state, section) {
  const theme = section.theme || THEMES.meta;
  state.ensureSpace(14);

  docSetFill(state.doc, theme.bar);
  state.doc.rect(MARGIN, state.y, CONTENT_WIDTH, 7, 'F');
  state.doc.setFont('helvetica', 'bold');
  state.doc.setFontSize(10);
  state.doc.setTextColor(255, 255, 255);
  state.doc.text(pdfSafeText(section.title), MARGIN + 3, state.y + 5);
  state.y += 9;

  if (section.subtitle) {
    state.doc.setFont('helvetica', 'normal');
    state.doc.setFontSize(7);
    state.doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    state.doc.text(pdfSafeText(section.subtitle), MARGIN + 1, state.y);
    state.y += 5;
  }

  state.y += 2;
}

function drawFieldRow(state, label, value, theme, rowIndex) {
  // Set value font BEFORE splitTextToSize so jsPDF uses correct glyph widths for wrapping.
  state.doc.setFont('helvetica', 'normal');
  state.doc.setFontSize(8);
  const valueLines = wrapText(state.doc, value, CONTENT_WIDTH - LABEL_COL - 4);
  const lineCount = Math.min(valueLines.length, MAX_FIELD_LINES);
  const blockH = Math.max(5, lineCount * 3.8) + 3;
  state.ensureSpace(blockH);

  const rowY = state.y;
  if (rowIndex % 2 === 0) {
    docSetFill(state.doc, theme.fill);
    state.doc.rect(MARGIN, rowY - 1, CONTENT_WIDTH, blockH, 'F');
  }

  state.doc.setFont('helvetica', 'bold');
  state.doc.setFontSize(7);
  state.doc.setTextColor(100, 116, 139);
  const labelLines = wrapText(state.doc, `${label}:`, LABEL_COL - 2);
  state.doc.text(labelLines.slice(0, 2), MARGIN + 2, rowY + 3);

  state.doc.setFont('helvetica', 'normal');
  state.doc.setFontSize(8);
  state.doc.setTextColor(30, 41, 59);
  state.doc.text(valueLines.slice(0, MAX_FIELD_LINES), MARGIN + LABEL_COL, rowY + 3);

  state.y += blockH;
}

function drawBulletGroup(state, group, theme) {
  state.ensureSpace(10);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setFontSize(8);
  state.doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  state.doc.text(pdfSafeText(group.heading), MARGIN + 2, state.y);
  state.y += 5;

  for (const item of group.items) {
    const lines = wrapText(state.doc, item, CONTENT_WIDTH - 8);
    const lineCount = Math.min(lines.length, MAX_FIELD_LINES);
    state.ensureSpace(lineCount * 3.8 + 2);
    state.doc.setFont('helvetica', 'normal');
    state.doc.setFontSize(7.5);
    state.doc.setTextColor(theme.bar[0], theme.bar[1], theme.bar[2]);
    state.doc.text('*', MARGIN + 2, state.y + 1);
    state.doc.setTextColor(51, 65, 85);
    state.doc.text(lines.slice(0, MAX_FIELD_LINES), MARGIN + 6, state.y + 1);
    state.y += lineCount * 3.8 + 1.5;
  }
  state.y += 3;
}

function drawSection(state, section) {
  drawSectionHeader(state, section);
  section.fields.forEach(([label, value], idx) => {
    drawFieldRow(state, label, value, section.theme, idx);
  });
  for (const group of section.bullets || []) {
    drawBulletGroup(state, group, section.theme);
  }
  state.y += 4;
}

async function drawImagesGrid(state, imageItems, startY) {
  let y = startY;
  const { doc } = state;

  state.ensureSpace(12);
  docSetFill(doc, [241, 245, 249]);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text('Asset images', MARGIN + 2, y + 5.5);
  y += 10;

  const prepared = await Promise.all(
    imageItems.map(async (item) => {
      try {
        const img = await prepareImageForPdf(item.url, 420, 0.65);
        return { ...item, img };
      } catch {
        return { ...item, img: null };
      }
    }),
  );

  const valid = prepared.filter((p) => p.img);
  if (!valid.length) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('No images could be embedded.', MARGIN, y + 4);
    state.y = y + 8;
    return;
  }

  const cols = gridColumns(valid.length);
  const rows = Math.ceil(valid.length / cols);
  const gap = 2.5;
  const captionH = 4;
  const cellW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
  const maxGridH = FOOTER_Y - y - 8;
  const cellImgH = Math.min(52, Math.max(20, (maxGridH - rows * (captionH + gap)) / rows));
  const rowH = cellImgH + captionH + gap;

  state.ensureSpace(rows * rowH + 4);

  valid.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = MARGIN + col * (cellW + gap);
    const cellY = y + row * rowH;

    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.rect(x, cellY, cellW, cellImgH, 'S');

    const { img } = item;
    const scale = Math.min(cellW / img.width, cellImgH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const offsetX = x + (cellW - w) / 2;
    const offsetY = cellY + (cellImgH - h) / 2;

    doc.addImage(item.img.dataUrl, 'JPEG', offsetX, offsetY, w, h);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(wrapText(doc, item.caption, cellW).slice(0, 1), x + 1, cellY + cellImgH + 3);
  });

  state.y = y + rows * rowH + 6;
}

function drawViewAssetLink(state, entry) {
  const url = buildAssetReportUrl(entry);
  if (!url) return;

  state.ensureSpace(12);
  state.doc.setFont('helvetica', 'normal');
  state.doc.setFontSize(9);
  state.doc.setTextColor(37, 99, 235);
  state.doc.textWithLink('View this asset online', MARGIN, state.y, { url });
  state.y += 4;
  state.doc.setFontSize(7);
  state.doc.setTextColor(100, 116, 139);
  const urlLines = wrapText(state.doc, url, CONTENT_WIDTH);
  state.doc.text(urlLines.slice(0, 2), MARGIN, state.y);
  state.y += Math.min(urlLines.length, 2) * 3.5 + 4;
}

/**
 * @param {object} entry
 */
export async function exportAssetReportPdf(entry) {
  if (!entry) throw new Error('No report data to export');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const state = createPageState(doc);

  // Draw the header background, title, and date first — then overlay the logo
  // on top. Previous code drew the logo before the background rect which covered it.
  state.y = drawCoverHeader(doc, entry, state.y);

  try {
    const logo = await prepareLogoForPdf(companyLogoUrl);
    const logoW = 48;
    const logoH = Math.min(16, (logo.height / logo.width) * logoW);
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, 6, logoW, logoH);
  } catch {
    // Fallback: brand name text in dark slate so it's always legible on the light header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('AssetCues', MARGIN, 20);
    doc.setFont('helvetica', 'normal');
  }
  drawSummaryMetrics(state, entry);
  drawViewAssetLink(state, entry);

  const imageItems = collectReportImages(entry);
  if (imageItems.length > 0) {
    await drawImagesGrid(state, imageItems, state.y);
  }

  const sections = buildReportSections(entry);
  for (const section of sections) {
    drawSection(state, section);
  }

  state.ensureSpace(10);
  doc.setFillColor(254, 252, 232);
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text(
    wrapText(
      doc,
      'AI-generated report from AssetCues. Verify before operational or financial use.',
      CONTENT_WIDTH - 6,
    ),
    MARGIN + 3,
    state.y + 6,
  );

  drawPageFooter(doc, state.pageNum);

  const filename = `AssetCues-Report-${sanitizeFilename(entry.asset_name)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export {
  THEMES,
  MARGIN,
  PAGE_WIDTH,
  CONTENT_WIDTH,
  FOOTER_Y,
  sanitizeFilename,
  truncateText,
  wrapText,
  createPageState,
  drawPageFooter,
  prepareLogoForPdf,
  prepareImageForPdf,
  drawSection,
  drawImagesGrid,
};
