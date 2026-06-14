import { fetchSaasAsset, runSaasAssetAnalysis } from '../services/saasAssetsApi';

const queue = [];
let draining = false;

async function waitForAnalysisComplete(assetId, maxMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const detail = await fetchSaasAsset(assetId);
    const status = detail?.asset?.ai_status;
    if (status && status !== 'analyzing') {
      return status;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
  return 'timeout';
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const job = queue.shift();
    try {
      job.onStart?.(job.assetId);
      const body = await runSaasAssetAnalysis(job.assetId);
      let status = body?.ai_status || 'error';
      if (status === 'analyzing') {
        status = await waitForAnalysisComplete(job.assetId);
      }
      job.onDone?.(job.assetId, status);
      job.resolve(status);
    } catch (err) {
      job.onDone?.(job.assetId, 'error');
      job.reject(err);
    }
  }
  draining = false;
}

export function isAnalysisQueueBusy() {
  return draining || queue.length > 0;
}

export function getAnalysisQueueLength() {
  return queue.length + (draining ? 1 : 0);
}

/**
 * Run AI analysis one asset at a time.
 * @param {string} assetId
 * @param {{ onStart?: (id: string) => void, onDone?: (id: string, status: string) => void }} [hooks]
 */
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

/**
 * @param {string[]} assetIds
 * @param {{ onStart?: (id: string) => void, onDone?: (id: string, status: string) => void }} [hooks]
 */
export async function enqueueAssetAnalysesSequential(assetIds, hooks = {}) {
  const results = [];
  for (const assetId of assetIds) {
    try {
      const status = await enqueueAssetAnalysis(assetId, hooks);
      results.push({ assetId, status, ok: true });
    } catch (err) {
      results.push({
        assetId,
        status: 'error',
        ok: false,
        error: err instanceof Error ? err.message : 'Failed',
      });
    }
  }
  return results;
}
