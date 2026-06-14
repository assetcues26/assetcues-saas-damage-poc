/**
 * Split legacy combined estimated_age into model year + age-as-of-today.
 * Mirrors backend age_parser when API returns only estimated_age.
 * @param {object | null | undefined} asset
 * @returns {object | null | undefined}
 */
export function enrichAssetAgeFields(asset) {
  if (!asset || typeof asset !== 'object') return asset;

  if (asset.estimated_model_years || asset.estimated_age_years) {
    return asset;
  }

  const raw = asset.estimated_age;
  if (!raw || typeof raw !== 'string') return asset;

  const text = raw.trim();
  if (!text || /^unknown$/i.test(text)) return asset;

  const yearMatch = text.match(/(20\d{2})\s*[-–]\s*(20\d{2})/);
  if (!yearMatch) {
    return {
      ...asset,
      estimated_age_years: text,
    };
  }

  const y1 = Number.parseInt(yearMatch[1], 10);
  const y2 = Number.parseInt(yearMatch[2], 10);
  const lo = Math.min(y1, y2);
  const hi = Math.max(y1, y2);
  const now = new Date().getFullYear();
  const ageMin = Math.max(0, now - hi);
  const ageMax = Math.max(0, now - lo);

  let ageYears;
  if (ageMin === ageMax) {
    ageYears = `~${ageMin} year${ageMin === 1 ? '' : 's'} (as of ${now})`;
  } else {
    ageYears = `~${ageMin}–${ageMax} years (as of ${now})`;
  }

  return {
    ...asset,
    estimated_model_years: lo === hi ? String(lo) : `${lo}–${hi}`,
    estimated_age_years: ageYears,
    age_as_of_year: now,
  };
}
