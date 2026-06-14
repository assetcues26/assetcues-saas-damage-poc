import { fetchSaasAsset, runSaasAssetAnalysis } from '../services/saasAssetsApi';

const queue = [];
let draining = false;
let currentAssetId = null;

async function waitForAnalysisComplete(assetId, maxMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const detail = await fetchSaasAsset(assetId);
    const status = detail?.asset?.ai_status;
    if (status && status !== 'analyzing') {
      return { status, asset: detail?.asset || null };
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
  return { status: 'timeout', asset: null };
}

async function runOneAnalysis(assetId, hooks = {}) {
  hooks.onStart?.(assetId);
  currentAssetId = assetId;
  try {
    await runSaasAssetAnalysis(assetId);
    const { status, asset } = await waitForAnalysisComplete(assetId);
    hooks.onDone?.(assetId, status, asset);
    return status;
  } catch (err) {
    hooks.onDone?.(assetId, 'error', null);
    throw err;
  } finally {
    if (currentAssetId === assetId) {
      currentAssetId = null;
    }
  }
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const job = queue.shift();
    try {
      if (job.type === 'batch') {
        const results = [];
        for (const assetId of job.assetIds) {
          try {
            const status = await runOneAnalysis(assetId, job.hooks);
            results.push({ assetId, status, ok: status !== 'error' && status !== 'timeout' });
          } catch (err) {
            results.push({
              assetId,
              status: 'error',
              ok: false,
              error: err instanceof Error ? err.message : 'Failed',
            });
          }
        }
        job.resolve(results);
      } else {
        const status = await runOneAnalysis(job.assetId, job);
        job.resolve(status);
      }
    } catch (err) {
      if (job.type === 'batch') {
        job.reject(err);
      } else {
        job.reject(err);
      }
    }
  }
  draining = false;
}

export function getCurrentAnalysisAssetId() {
  return currentAssetId;
}

export function isAnalysisQueueBusy() {
  return draining || queue.length > 0;
}

export function getAnalysisQueueLength() {
  return queue.length + (draining ? 1 : 0);
}

export function enqueueAssetAnalysis(assetId, hooks = {}) {
  return new Promise((resolve, reject) => {
    queue.push({
      assetId,
      onStart: hooks.onStart,
      onDone: hooks.onDone,
      resolve,
      reject,
    });
    drainQueue();
  });
}

export function enqueueAssetAnalysesSequential(assetIds, hooks = {}) {
  const ids = [...assetIds];
  if (!ids.length) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    queue.push({
      type: 'batch',
      assetIds: ids,
      hooks,
      resolve,
      reject,
    });
    drainQueue();
  });
}
