/** Clear stale AI check fields while a new analysis is running. */
export function withAnalyzingState(asset) {
  return {
    ...asset,
    ai_status: 'analyzing',
    namedescriptionmatch: null,
    subcatmodelmatch: null,
    detectedtagnumbermatch: null,
    costmatch: null,
    datematch: null,
    detected_asset: null,
    condition: null,
    failure_summary: null,
  };
}

export function isAssetAnalyzing(asset) {
  return (asset?.ai_status || 'pending') === 'analyzing';
}
