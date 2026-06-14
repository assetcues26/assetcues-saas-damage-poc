import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderAppAt } from '../test/testUtils';

describe('BatchGuard', () => {
  it('blocks /batch without images', async () => {
    renderAppAt('/batch');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });
});
