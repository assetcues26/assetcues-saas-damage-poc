import { useEffect, useMemo, useState } from 'react';
import { V6_ERP_CATALOG_ENDPOINT } from '../config/api';
import fallbackCatalog from './erpCatalogFallback.json';

let cachedCatalog = null;
let inflight = null;

async function fetchCatalog() {
  if (cachedCatalog) return cachedCatalog;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(V6_ERP_CATALOG_ENDPOINT);
      if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('Empty catalog');
      cachedCatalog = data;
      return data;
    } catch {
      cachedCatalog = fallbackCatalog;
      return fallbackCatalog;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useErpCatalog() {
  const [catalog, setCatalog] = useState(cachedCatalog || fallbackCatalog);
  const [loading, setLoading] = useState(!cachedCatalog);

  useEffect(() => {
    let active = true;
    fetchCatalog().then((data) => {
      if (active) {
        setCatalog(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const getCatalogAsset = useMemo(
    () => (catalogId) => catalog.find((a) => a.catalog_id === catalogId) ?? null,
    [catalog],
  );

  return { catalog, loading, getCatalogAsset };
}

export { catalogToContext } from './erpCatalog';
