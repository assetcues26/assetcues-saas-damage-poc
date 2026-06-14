import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateAssetWizard } from './CreateAssetWizard';
import { EMPTY_ASSET_FORM, validateWizardStep } from './assetFormConfig';

vi.mock('../../services/saasAssetsApi', () => ({
  fetchLookups: vi.fn().mockResolvedValue({ items: [{ id: '1', label: 'Test Co' }] }),
}));

describe('CreateAssetWizard', () => {
  it('renders step 1 identity fields', () => {
    render(
      <CreateAssetWizard
        values={{ ...EMPTY_ASSET_FORM, assetname: 'Laptop' }}
        onChange={() => {}}
        step={0}
        onStepChange={() => {}}
      />,
    );
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument();
  });

  it('validates date format on financial step', () => {
    const values = {
      ...EMPTY_ASSET_FORM,
      assetname: 'X',
      tagnumber: '1',
      assetnumber: '2',
      makemodelid: 'm',
      makemodelname: 'M',
      companyid: 'c',
      company: 'C',
      customerid: 'cu',
      assetclassname: 'IT',
      cost: '100',
      acquisitiondate: 'bad',
    };
    expect(validateWizardStep(values, 2)).toMatch(/DD-MM-YYYY/);
  });

  it('advances to next step when valid', () => {
    const onStepChange = vi.fn();
    const values = {
      ...EMPTY_ASSET_FORM,
      assetname: 'X',
      tagnumber: '1',
      assetnumber: '2',
      assetclassname: 'IT',
    };
    render(
      <CreateAssetWizard
        values={values}
        onChange={() => {}}
        step={0}
        onStepChange={onStepChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onStepChange).toHaveBeenCalledWith(1);
  });
});
