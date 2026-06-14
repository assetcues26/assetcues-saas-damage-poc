/**
 * Returns a stored image URL for history cards, or null when none is available.
 * Never uses random placeholder photos.
 * @param {object} entry
 * @returns {string | null}
 */
export function getHistoryCardImageUrl(entry) {
  const thumb = entry?.mergedImageUrl || entry?.previewUrls?.[0];
  if (
    thumb &&
    (thumb.startsWith('blob:') || thumb.startsWith('http') || thumb.startsWith('data:'))
  ) {
    return thumb;
  }
  return null;
}

export function hasHistoryCardImage(entry) {
  return Boolean(getHistoryCardImageUrl(entry));
}
