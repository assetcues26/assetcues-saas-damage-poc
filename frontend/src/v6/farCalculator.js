/**
 * Client-side Fixed Asset Register (FAR) calculator.
 * Mirrors backend/app/services/catalog_far.py — straight-line method (SLM),
 * 5% residual/salvage, pro-rata age from acquisition date to today.
 *
 * Call recomputeFar(context) whenever acquisition_date, original_cost_inr,
 * or useful_life_years changes to get updated FAR fields to merge into context.
 */

/** Useful lives (years) — mirrors USEFUL_LIFE_BY_SUBCATEGORY in catalog_far.py */
export const USEFUL_LIFE_BY_SUBCATEGORY = {
  'split ac': 15,
  'window ac': 15,
  laptop: 5,
  desktop: 3,
  printer: 5,
  display: 5,
  'office chair': 10,
  generator: 15,
  'water cooler': 8,
  suv: 8,
};

export const DEFAULT_RESIDUAL_PCT = 0.05;

/** Resolve useful life from the asset context, same logic as Python backend. */
export function resolveUsefulLife(item) {
  const explicit = Number(item?.useful_life_years);
  if (explicit > 0) return explicit;

  const sub = (item?.subcategory || '').toLowerCase();
  const cat = (item?.category || '').toLowerCase();

  for (const [key, life] of Object.entries(USEFUL_LIFE_BY_SUBCATEGORY)) {
    if (sub.includes(key)) return life;
  }
  if (sub.includes('laptop') || cat.includes('it assets')) return 5;
  if (sub.includes('desktop')) return 3;
  if (cat.includes('hvac')) return 15;
  if (cat.includes('vehicle')) return 8;
  if (cat.includes('furniture')) return 10;
  if (cat.includes('industrial')) return 15;
  if (cat.includes('appliances')) return 8;
  return 5;
}

/**
 * SLM depreciation — mirrors compute_slm_far() in catalog_far.py.
 * @param {number} originalCost
 * @param {string} acquisitionDate  ISO date string "YYYY-MM-DD"
 * @param {number} usefulLifeYears
 * @param {{ residualPct?: number, asOf?: string }} [opts]
 * @returns {object|null}  FAR fields, or null when inputs are invalid
 */
export function computeSlmFar(originalCost, acquisitionDate, usefulLifeYears, opts = {}) {
  const { residualPct = DEFAULT_RESIDUAL_PCT, asOf = todayIso() } = opts;

  if (!acquisitionDate || !originalCost || Number.isNaN(Number(originalCost)) || Number(originalCost) <= 0 || usefulLifeYears <= 0) return null;

  const acqMs = Date.parse(acquisitionDate);
  const asOfMs = Date.parse(asOf);
  if (Number.isNaN(acqMs) || Number.isNaN(asOfMs)) return null;

  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const ageYears = Math.max(0, (asOfMs - acqMs) / MS_PER_YEAR);

  const residualInr = round2(originalCost * residualPct);
  const depreciable = originalCost - residualInr;
  const annualDep = round2(depreciable / usefulLifeYears);
  const yearsCharged = Math.min(ageYears, usefulLifeYears);
  const rawAccum = Math.min(depreciable, annualDep * ageYears);
  const bookNbv = Math.round(Math.max(residualInr, originalCost - rawAccum));
  const accumDep = round2(originalCost - bookNbv);

  return {
    far_as_of_date: asOf,
    asset_age_years: round2(ageYears),
    useful_life_years: usefulLifeYears,
    residual_value_pct: residualPct,
    residual_value_inr: residualInr,
    annual_depreciation_inr: annualDep,
    depreciation_years_charged: round2(yearsCharged),
    accumulated_depreciation_inr: accumDep,
    book_nbv_inr: bookNbv,
  };
}

/**
 * Recompute all FAR fields from a context object.
 * Returns partial context with updated fields, ready to merge via updateEditedContext().
 */
export function recomputeFar(context) {
  if (!context) return null;
  const cost = Number(context.original_cost_inr);
  const date = context.acquisition_date;
  const life = resolveUsefulLife(context);
  const residualPct = Number(context.residual_value_pct || DEFAULT_RESIDUAL_PCT);
  return computeSlmFar(cost, date, life, { residualPct });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
