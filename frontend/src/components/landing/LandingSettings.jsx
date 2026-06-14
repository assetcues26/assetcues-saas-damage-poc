import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Settings } from 'lucide-react';
import { MARKET_OPTIONS } from '../../constants/markets';
import {
  UPLOAD_MODE_LABELS,
  UPLOAD_PROCESSING_MODES,
} from '../../constants/uploadMode';
import { useApp } from '../../context/AppContext';
import { useBatchContext } from '../../context/BatchContext';
import { useHistoryContext } from '../../context/HistoryContext';
import { useSessionContext } from '../../context/SessionContext';
import { clearDemoDatabase } from '../../services/demoApi';
import { ConfirmModal } from '../ui/Modal';
import { Button } from '../ui/button';

const OPTIONS = [
  {
    id: UPLOAD_PROCESSING_MODES.DIRECT,
    label: UPLOAD_MODE_LABELS[UPLOAD_PROCESSING_MODES.DIRECT],
    hint: 'Best for multiple angles — each photo analyzed individually.',
  },
  {
    id: UPLOAD_PROCESSING_MODES.COLLAGE,
    label: UPLOAD_MODE_LABELS[UPLOAD_PROCESSING_MODES.COLLAGE],
    hint: 'Stitches photos into one view — good for quick overview demos.',
  },
];

const PANEL_WIDTH = 340;

export function LandingSettings() {
  const { uploadProcessingMode, setUploadProcessingMode, marketRegion, setMarketRegion, showToast } = useApp();
  const { clearBatch } = useBatchContext();
  const { clearSession } = useSessionContext();
  const { reloadHistory } = useHistoryContext();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const buttonRef = useRef(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
      let left = rect.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setPanelPos({ top: rect.bottom + 8, left, width });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      const result = await clearDemoDatabase();
      clearBatch();
      clearSession();
      await reloadHistory();
      showToast(
        `Cleared ${result.analyses_deleted} report(s) and ${result.sessions_deleted} session(s)`,
        'success',
      );
      setConfirmClear(false);
      setOpen(false);
    } catch (err) {
      showToast(err?.message || 'Could not clear database', 'error');
    } finally {
      setClearing(false);
    }
  };

  const panel =
    open &&
    createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[200] cursor-default bg-black/20"
          aria-label="Close settings"
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-label="App settings"
          className="fixed z-[210] max-h-[min(80dvh,520px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
          }}
        >
          <p className="mb-1 text-sm font-semibold text-gray-900">Analysis mode</p>
          <p className="mb-4 text-xs text-gray-500">
            Applies to your next scan until you reload the page.
          </p>
          <ul className="space-y-3">
            {OPTIONS.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/40 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/60">
                  <input
                    type="checkbox"
                    name="upload-processing-mode"
                    checked={uploadProcessingMode === option.id}
                    onChange={() => {
                      setUploadProcessingMode(option.id);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{option.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <p className="mb-1 text-sm font-semibold text-gray-900">Market region</p>
            <p className="mb-3 text-xs text-gray-500">
              Valuation, currency, and market assumptions for your next scan.
            </p>
            <ul className="space-y-2">
              {MARKET_OPTIONS.map((market) => (
                <li key={market.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/40 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/60">
                    <input
                      type="radio"
                      name="market-region"
                      checked={marketRegion === market.id}
                      onChange={() => setMarketRegion(market.id)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">
                        {market.label} ({market.symbol})
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <p className="mb-1 text-sm font-semibold text-gray-900">Demo data</p>
            <p className="mb-3 text-xs leading-relaxed text-gray-500">
              Removes all saved reports, phone sessions, and uploaded images from the database.
              Table structure and IDs are not changed — safe before a client demo.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                setConfirmClear(true);
              }}
            >
              <Database size={16} aria-hidden />
              Clear database
            </Button>
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        aria-label="App settings"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Settings size={20} />
      </button>
      {panel}
      <ConfirmModal
        open={confirmClear}
        title="Clear all demo data?"
        description="This deletes every saved analysis, capture session, and stored image for the demo account. Database tables stay intact. You cannot undo this."
        confirmLabel={clearing ? 'Clearing…' : 'Clear database'}
        cancelLabel="Keep data"
        confirmDisabled={clearing}
        onConfirm={handleClearDatabase}
        onCancel={() => !clearing && setConfirmClear(false)}
      />
    </>
  );
}
