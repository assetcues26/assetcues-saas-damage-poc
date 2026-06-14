import { describe, it, expect } from 'vitest';
import { validateAssetForm, validateWizardStep, assetFormToPayload } from './assetFormConfig';

describe('assetFormConfig', () => {
  const valid = {
    assetname: 'Dell Latitude',
    tagnumber: 'TAG-1',
    assetnumber: 'AST-NUM-1',
    makemodelid: 'MK-1',
    makemodelname: 'Dell Latitude',
    companyid: 'COMP-1',
    company: 'Tech Co',
    customerid: 'CUST-1',
    assetclassname: 'IT Equipment',
    cost: '125000',
    acquisitiondate: '15-08-2023',
  };

  it('validates required fields', () => {
    expect(validateAssetForm(valid)).toBeNull();
  });

  it('rejects bad date format', () => {
    expect(validateAssetForm({ ...valid, acquisitiondate: '2023-08-15' })).toMatch(/DD-MM-YYYY/);
  });

  it('strips optional empty fields from payload', () => {
    const payload = assetFormToPayload({ ...valid, categoryid: '', assetid: '' });
    expect(payload.categoryid).toBeUndefined();
    expect(payload.assetid).toBeUndefined();
  });

  it('strips internal session meta keys from payload', () => {
    const payload = assetFormToPayload({ ...valid, _session_mode: 'images_only' });
    expect(payload._session_mode).toBeUndefined();
  });

  it('validateWizardStep identity does not require make/model', () => {
    const identity = {
      assetname: 'Test',
      tagnumber: '1',
      assetnumber: '2',
      description: 'x',
    };
    expect(validateWizardStep(identity, 0)).toBeNull();
  });

  it('validateWizardStep classification requires make/model selection', () => {
    const partial = {
      assetclassname: 'IT Equipment',
    };
    expect(validateWizardStep(partial, 1)).toMatch(/Make\/model/);
  });
});
