const baseResult = {
  barcodeposition:
    'Lower-right quadrant of the nameplate, approximately 12mm from the bottom edge.',
  tag_detection_reasoning:
    'High-contrast alphanumeric sequence detected on the manufacturer label with OCR confidence above 0.94. Pattern matches standard HVAC asset tag format.',
  asset_description:
    'Commercial split-system air conditioning unit with outdoor condenser housing. Visible weathering on the enclosure with intact service ports and legible manufacturer branding.',
  stitching_confidence: 0.91,
  image_readability: 'Readable',
  visible_labels: [
    'Carrier',
    'Model 38MAR',
    'R-410A',
    '240V',
    'Serial No.',
    'Made in USA',
  ],
};

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const SEED_HISTORY = [
  {
    id: 'seed-carrier-001',
    processedAt: daysAgo(1),
    request_id: 'req_a7f3c891_carrier',
    asset_name: 'Carrier Split AC Unit',
    condition: 'Good',
    asset_condition:
      'Unit shows minor surface dust with no structural damage. Coil fins appear straight with no visible corrosion. Nameplate and barcode fully legible.',
    detected_tag_number_raw: 'CAR-38MAR-2024-88421',
    processing_time_ms: 24120,
    ...baseResult,
    stitching_confidence: 0.93,
    visible_labels: ['Carrier', '38MAR', 'R-410A', '240V', '88421'],
    previewUrls: [],
  },
  {
    id: 'seed-daikin-002',
    processedAt: daysAgo(3),
    request_id: 'req_b2e9d104_daikin',
    asset_name: 'Daikin Inverter AC',
    condition: 'Fair',
    asset_condition:
      'Moderate oxidation on mounting bracket. Housing paint chipped on the left panel. Functional components appear intact; label slightly faded but readable.',
    detected_tag_number_raw: 'DKN-FTXM35-771902',
    processing_time_ms: 26840,
    barcodeposition: 'Center of the data matrix label, 8mm above model line.',
    tag_detection_reasoning:
      'Daikin serial format identified via prefix match. Secondary validation from QR-adjacent text block.',
    asset_description:
      'Wall-mounted inverter heat pump with matte white finish. Inverter badge visible; minor scuffing near the access panel.',
    stitching_confidence: 0.87,
    image_readability: 'Readable',
    visible_labels: ['Daikin', 'FTXM35', 'Inverter', 'Heat Pump', '771902'],
    previewUrls: [],
  },
  {
    id: 'seed-macbook-003',
    processedAt: daysAgo(7),
    request_id: 'req_c8a41f55_macbook',
    asset_name: 'Apple Macbook Pro',
    condition: 'Fair',
    asset_condition:
      'Silver MacBook Pro with light keyboard wear and minor palm-rest scuffs. Screen and hinge operate normally. Asset tag and QR label legible on lower right palm rest.',
    detected_tag_number_raw: '1000002129',
    processing_time_ms: 28400,
    barcodeposition:
      'Lower-right palm rest, black asset tag with QR code adjacent to trackpad.',
    tag_detection_reasoning:
      'Asset tag number 1000002129 read from QR-adjacent numeric block with high OCR confidence. Matches ERP register format.',
    asset_description:
      'Apple MacBook Pro laptop on desk with AssetCues tracking screen visible. Aluminium unibody with Apple logo on lid; asset tag affixed per company policy.',
    stitching_confidence: 0.88,
    image_readability: 'Readable',
    visible_labels: ['Apple', 'MacBook Pro', '1000002129', 'AssetCues', 'Do not remove this tag'],
    previewUrls: [],
  },
];

/** Legacy sample entries previously auto-seeded into localStorage — stripped on load. */
export const LEGACY_SEED_ENTRY_IDS = SEED_HISTORY.map((entry) => entry.id);

export function isLegacySeedEntry(entry) {
  if (!entry?.id) return false;
  return LEGACY_SEED_ENTRY_IDS.includes(entry.id) || String(entry.id).startsWith('seed-');
}


export function createSampleAnalysisResult(overrides = {}) {
  const requestId = `req_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  const processingMs = 3000 + Math.floor(Math.random() * 2000);

  return {
    request_id: requestId,
    asset_name: 'Lennox Commercial RTU',
    condition: 'Good',
    asset_condition:
      'Rooftop unit in serviceable condition. Minimal corrosion on access panels. All identification labels present and legible. Condenser fan guard intact.',
    detected_tag_number_raw: 'LNX-RTU-48-992184',
    barcodeposition:
      'Right side of the electrical panel door, vertically centered on the UL listing sticker.',
    tag_detection_reasoning:
      'Multi-frame consensus aligned tag characters across three viewpoints. Barcode decode corroborated OCR output with 0.97 match score.',
    asset_description:
      'Packaged rooftop HVAC unit with dual compressors. Enamel coating largely intact with light UV fading on the south-facing panel.',
    stitching_confidence: 0.89 + Math.random() * 0.08,
    image_readability: 'Readable',
    visible_labels: [
      'Lennox',
      'Model LGH048',
      '480V 3-Phase',
      'R-454B',
      '992184',
      'UL Listed',
    ],
    processing_time_ms: processingMs,
    ...overrides,
  };
}
