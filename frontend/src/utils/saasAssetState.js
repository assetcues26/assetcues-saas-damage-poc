/** Mark asset as analyzing while keeping the last known AI check results visible. */
export function withAnalyzingState(asset) {
  return {
    ...asset,
    ai_status: 'analyzing',
  };
}

export function isAssetAnalyzing(asset) {
  return (asset?.ai_status || 'pending') === 'analyzing';
}
