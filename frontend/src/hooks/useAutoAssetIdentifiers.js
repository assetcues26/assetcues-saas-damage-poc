import { useEffect, useState } from 'react';
import { applyAutoIdentifiers } from '../utils/autoAssetIdentifiers';
import { fetchNextAssetIdentifiers } from '../services/saasAssetsApi';

/**
 * Fetch and apply server-suggested assetid / assetnumber when fields are empty.
 * @param {(patch: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void} setValues
 * @param {{ enabled?: boolean }} [options]
 */
export function useAutoAssetIdentifiers(setValues, options = {}) {
  const { enabled = true } = options;
  const [identifiers, setIdentifiers] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetchNextAssetIdentifiers()
      .then((ids) => {
        if (!cancelled) setIdentifiers(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !identifiers) return;
    setValues((prev) => applyAutoIdentifiers(prev, identifiers));
  }, [enabled, identifiers, setValues]);
}
