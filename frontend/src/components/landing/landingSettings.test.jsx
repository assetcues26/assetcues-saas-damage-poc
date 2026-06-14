import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LandingSettings } from './LandingSettings';
import { AppProvider, useApp } from '../../context/AppContext';
import { BatchProvider } from '../../context/BatchContext';
import { HistoryProvider } from '../../context/HistoryContext';
import { SessionProvider } from '../../context/SessionContext';
import {
  UPLOAD_MODE_LABELS,
  UPLOAD_PROCESSING_MODES,
} from '../../constants/uploadMode';
import { MARKET_OPTIONS } from '../../constants/markets';

function Harness() {
  const { uploadProcessingMode, marketRegion } = useApp();
  return (
    <>
      <LandingSettings />
      <span data-testid="upload-mode">{uploadProcessingMode}</span>
      <span data-testid="market-region">{marketRegion}</span>
    </>
  );
}

function renderSettings() {
  return render(
    <AppProvider>
      <HistoryProvider>
        <BatchProvider>
          <MemoryRouter>
            <SessionProvider>
              <Harness />
            </SessionProvider>
          </MemoryRouter>
        </BatchProvider>
      </HistoryProvider>
    </AppProvider>,
  );
}

describe('LandingSettings', () => {
  it('updates direct upload mode in app context when selected', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }),
    });

    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByLabelText('App settings'));
    await user.click(screen.getByText(UPLOAD_MODE_LABELS[UPLOAD_PROCESSING_MODES.DIRECT]));

    await waitFor(() => {
      expect(screen.getByTestId('upload-mode')).toHaveTextContent(
        UPLOAD_PROCESSING_MODES.DIRECT,
      );
    });
  });

  it('updates market region in app context when selected', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }),
    });

    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByLabelText('App settings'));
    const usMarket = MARKET_OPTIONS.find((m) => m.id === 'US');
    await user.click(screen.getByLabelText(new RegExp(usMarket.label, 'i')));

    await waitFor(() => {
      expect(screen.getByTestId('market-region')).toHaveTextContent('US');
    });
  });

  it('shows clear database control in settings', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }),
    });

    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByLabelText('App settings'));
    expect(screen.getByRole('button', { name: 'Clear database' })).toBeInTheDocument();
  });
});
