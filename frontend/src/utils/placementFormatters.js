/**
 * Formats API placement objects (damage, barcode, stickers).
 * @param {object | null | undefined} placement
 * @returns {string | null}
 */
export function formatPlacement(placement) {
  if (!placement || typeof placement !== 'object') return null;

  const parts = [];

  if (placement.asset_location) parts.push(placement.asset_location);

  const axis = [placement.horizontal, placement.vertical].filter(Boolean).join(' / ');
  if (axis) parts.push(axis);

  if (placement.in_frame_position) parts.push(`In frame: ${placement.in_frame_position}`);

  if (placement.seen_in_image != null) {
    parts.push(`Image ${placement.seen_in_image}`);
  }

  if (placement.description) parts.push(placement.description);

  return parts.length ? parts.join(' · ') : null;
}

/**
 * @param {string | null | undefined} type
 */
export function formatStickerType(type) {
  if (!type) return null;
  return String(type)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
