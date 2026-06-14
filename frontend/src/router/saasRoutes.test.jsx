import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/testUtils';
import { SaasAssetsProvider } from '../context/SaasAssetsContext';
import { AppRoutes } from './AppRouter';

vi.mock('../config/features', () => ({
  V6_DEMO_ENABLED: false,
  CAPTURE_SESSION_ENABLED: true,
  SAAS_MODULE_ENABLED: true,
}));

vi.mock('../services/saasAssetsApi', () => ({
  fetchSaasAssetsList: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 200, offset: 0 }),
  runSaasAssetAnalysis: vi.fn(),
}));

function renderSaasAt(route = '/') {
  return renderWithProviders(
    <SaasAssetsProvider>
      <AppRoutes />
    </SaasAssetsProvider>,
    { route },
  );
}

describe('AppRouter — SaaS module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET / renders assets dashboard', async () => {
    renderSaasAt('/');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Assets Dashboard/i })).toBeInTheDocument();
    });
  });

  it('GET /poc renders POC landing', async () => {
    renderSaasAt('/poc');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('GET /assets/create renders create asset form', async () => {
    renderSaasAt('/assets/create');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Asset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      expect(screen.getByText(/Create here/i)).toBeInTheDocument();
      expect(screen.getByText(/Create using mobile/i)).toBeInTheDocument();
    });
  });
});
