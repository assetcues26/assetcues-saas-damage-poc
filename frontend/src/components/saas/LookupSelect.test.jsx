import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LookupSelect } from './LookupSelect';

vi.mock('../../services/saasAssetsApi', () => ({
  fetchLookups: vi.fn(),
}));

import { fetchLookups } from '../../services/saasAssetsApi';

describe('LookupSelect', () => {
  beforeEach(() => {
    vi.mocked(fetchLookups).mockRejectedValue(new Error('offline'));
  });

  it('renders native select with fallback options', async () => {
    const onChange = vi.fn();
    render(
      <LookupSelect
        type="assetclass"
        value=""
        onChange={onChange}
        placeholder="Select asset class"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeEnabled();
    });

    expect(screen.getByRole('option', { name: 'IT Equipment' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'IT' } });
    expect(onChange).toHaveBeenCalledWith('IT', 'IT Equipment');
  });

  it('disables category until parent asset class is chosen', async () => {
    render(
      <LookupSelect
        type="category"
        parentId=""
        value=""
        onChange={() => {}}
        placeholder="Select category"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });
});
