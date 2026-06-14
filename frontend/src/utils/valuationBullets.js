/**
 * Normalize ERP verification so bullet arrays exist (API points or legacy paragraphs).
 * @param {object | null | undefined} erp
 * @returns {object | null}
 */
export function normalizeErpVerification(erp) {
  if (!erp || typeof erp !== 'object') return null;

  const out = { ...erp };

  if (!out.climate_valuation_points?.length && out.climate_valuation_note) {
    out.climate_valuation_points = splitProseToBullets(out.climate_valuation_note);
  }

  if (!out.nbv_vs_market_points?.length && out.nbv_vs_market_note) {
    out.nbv_vs_market_points = legacyNbvBullets(out.nbv_vs_market_note);
  }

  return out;
}

/**
 * Resolve valuation insight bullets from ERP verification.
 * @param {object | null | undefined} erp
 * @param {'climate_valuation' | 'nbv_vs_market'} kind
 * @returns {string[]}
 */
export function getValuationBullets(erp, kind) {
  const normalized = normalizeErpVerification(erp);
  if (!normalized) return [];

  const pointsKey = kind === 'climate_valuation' ? 'climate_valuation_points' : 'nbv_vs_market_points';
  const noteKey = kind === 'climate_valuation' ? 'climate_valuation_note' : 'nbv_vs_market_note';

  if (Array.isArray(normalized[pointsKey]) && normalized[pointsKey].length) {
    return normalized[pointsKey].map(normalizeBullet);
  }

  if (normalized[noteKey]) {
    return kind === 'nbv_vs_market'
      ? legacyNbvBullets(normalized[noteKey])
      : splitProseToBullets(normalized[noteKey]);
  }

  return [];
}

/**
 * Legacy NBV field sometimes duplicated the full climate paragraph — keep NBV-only lines.
 * @param {string} note
 * @returns {string[]}
 */
function legacyNbvBullets(note) {
  const all = splitProseToBullets(note);
  const focused = all.filter((b) => /\b(nbv|book|market|as-is|resale|books)\b/i.test(b));
  return focused.length ? focused : all.slice(0, 2);
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalizeBullet(text) {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  if (!/[.!?]$/.test(cleaned)) return `${cleaned}.`;
  return cleaned;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitProseToBullets(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];

  const chunks = [];
  for (const block of raw.split(/[;\n]+/)) {
    let part = block.trim();
    if (!part) continue;
    part = part.replace(/\s+—\s+/g, '. ');
    const sentences = part.split(/(?<=[.!?])\s+(?=[A-Z"(])/);
    chunks.push(...sentences);
  }

  const bullets = chunks.map(normalizeBullet).filter(Boolean);
  return [...new Set(bullets)];
}
