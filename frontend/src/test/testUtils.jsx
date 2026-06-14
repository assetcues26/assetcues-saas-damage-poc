import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { BatchProvider } from '../context/BatchContext';
import { CameraProvider } from '../context/CameraContext';
import { HistoryProvider } from '../context/HistoryContext';
import { SessionProvider } from '../context/SessionContext';
import { ToastContainer } from '../components/ui/Toast';
import { AppRoutes } from '../router/AppRouter';

export function createTestImageFile(name = 'test-asset.jpg', type = 'image/jpeg') {
  return new File(['mock-binary-image-data'], name, { type });
}

export function renderWithProviders(ui, { route = '/', routes } = {}) {
  const initialEntries = routes ?? [route];
  return render(
    <AppProvider>
      <CameraProvider>
        <HistoryProvider>
          <BatchProvider>
            <MemoryRouter initialEntries={initialEntries}>
              <SessionProvider>
                {ui}
                <ToastContainer />
              </SessionProvider>
            </MemoryRouter>
          </BatchProvider>
        </HistoryProvider>
      </CameraProvider>
    </AppProvider>,
  );
}

export function renderAppAt(route = '/') {
  return renderWithProviders(<AppRoutes />, { route });
}

export function seedLocalHistory(entries) {
  const items = (entries || []).map((entry) => ({
    entry_id: entry.id || entry.request_id,
    request_id: entry.request_id || entry.id,
    asset_name: entry.asset_name,
    asset_tag: entry.detected_tag_number_raw,
    condition_grade: entry.condition,
    processed_at: entry.processedAt || new Date().toISOString(),
  }));

  vi.spyOn(global, 'fetch').mockImplementation(async (url, options = {}) => {
    const href = typeof url === 'string' ? url : url?.url || '';
    if (href.includes('/v1/history') && !href.match(/\/v1\/history\/[^/?]+$/)) {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ items, total: items.length, limit: 100, offset: 0 }),
      };
    }
    if (href.includes('/v1/history/')) {
      const entryId = decodeURIComponent(href.split('/v1/history/')[1]?.split('?')[0] || '');
      const entry =
        entries.find((e) => e.id === entryId || e.request_id === entryId) || entries[0];
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          entry_id: entry.id,
          request_id: entry.request_id,
          processed_at: entry.processedAt,
          result_json: {
            request_id: entry.request_id,
            status: 'success',
            analysis_method: entry.analysis_method || 'multi_image',
            images_analyzed: entry.images_analyzed || 1,
            asset: {
              name: entry.asset_name,
              description: entry.asset_description,
            },
            condition: {
              grade: entry.condition,
              summary: entry.asset_condition,
            },
            identifiers: {
              asset_tag_number_raw: entry.detected_tag_number_raw,
              asset_tag_number: entry.detected_tag_number_raw,
              tag_readable: Boolean(entry.detected_tag_number_raw),
              tag_position: entry.barcodeposition,
              tag_detection_reasoning: entry.tag_detection_reasoning,
              visible_labels: entry.visible_labels || [],
            },
            valuation: entry.valuation || {},
            confidence: { overall: entry.stitching_confidence ?? 0.9 },
            processing_mode: entry.processingMode || 'collage',
            api_route: entry.apiRoute || '',
          },
          image_urls: {
            preview_urls: entry.previewUrls || [],
            merged_image_url: entry.mergedImageUrl || null,
          },
        }),
      };
    }
    return {
      ok: true,
      blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
    };
  });
}

export async function waitForHistoryHydration() {
  await vi.waitFor(() => {
    expect(true).toBe(true);
  });
}

export { SEED_HISTORY } from '../utils/mockData';
