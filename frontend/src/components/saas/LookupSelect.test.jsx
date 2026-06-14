import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LookupSelect } from './LookupSelect';
import { CUSTOM_LOOKUP_VALUE } from '../../utils/lookupCustom';

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

  it('allows creating a custom option', async () => {
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

    fireEvent.change(screen.getByRole('combobox'), { target: { value: CUSTOM_LOOKUP_VALUE } });
    fireEvent.change(screen.getByPlaceholderText('Enter custom name'), {
      target: { value: 'Lab Equipment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add custom' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/^custom-lab-equipment-\d+$/),
      'Lab Equipment',
    );
  });

  it('shows selected id after choosing an option', async () => {
    const onChange = vi.fn();
    render(
      <LookupSelect
        type="company"
        value="2000"
        label="Company 1"
        onChange={onChange}
        placeholder="Select company"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeEnabled();
    });

    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('persists custom company with auto id', async () => {
    const storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = value;
      },
    });

    const onChange = vi.fn();
    render(
      <LookupSelect
        type="company"
        value=""
        onChange={onChange}
        placeholder="Select company"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeEnabled();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: CUSTOM_LOOKUP_VALUE } });
    fireEvent.change(screen.getByPlaceholderText('Enter custom name'), {
      target: { value: 'My Custom Co' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add custom' }));

    expect(onChange).toHaveBeenCalledWith('8000', 'My Custom Co');
    expect(JSON.parse(storage.saas_custom_lookups).company).toEqual(
      expect.arrayContaining([{ id: '8000', name: 'My Custom Co', label: 'My Custom Co' }]),
    );

    vi.unstubAllGlobals();
  });
});
