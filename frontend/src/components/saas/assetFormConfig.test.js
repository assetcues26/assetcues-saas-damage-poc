import { describe, it, expect } from 'vitest';
import {
  validateAssetForm,
  validateWizardStep,
  assetFormToPayload,
  draftJsonToFormValues,
  mergeFormWithDraft,
  buildLookupChangePatch,
  EMPTY_ASSET_FORM,
} from './assetFormConfig';

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

  it('accepts lookup id without separate name field', () => {
    const withClassIdOnly = {
      ...valid,
      assetclassid: 'CLASS-1',
      assetclassname: '',
      makemodelid: 'MK-1',
      makemodelname: '',
      companyid: 'COMP-1',
      company: '',
    };
    expect(validateAssetForm(withClassIdOnly)).toBeNull();
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

  it('validateWizardStep details requires make/model selection', () => {
    const partial = {
      assetname: 'Test',
      tagnumber: '1',
      assetnumber: '2',
      assetclassname: 'IT Equipment',
      cost: '1000',
      acquisitiondate: '15-08-2023',
      companyid: 'COMP-1',
    };
    expect(validateWizardStep(partial, 0)).toMatch(/Make\/model/);
  });

  it('draftJsonToFormValues ignores empty draft fields and session meta', () => {
    const values = draftJsonToFormValues({
      assetname: 'Laptop',
      tagnumber: '',
      _session_mode: 'full_mobile',
      _existing_asset_id: 'abc',
      not_a_field: 'x',
    });
    expect(values).toEqual({ assetname: 'Laptop' });
  });

  it('mergeFormWithDraft preserves in-progress mobile edits', () => {
    const merged = mergeFormWithDraft(
      { ...EMPTY_ASSET_FORM, assetname: 'Typed on phone' },
      { assetname: '', tagnumber: 'TAG-99', _session_mode: 'full_mobile' },
    );
    expect(merged.assetname).toBe('Typed on phone');
    expect(merged.tagnumber).toBe('TAG-99');
  });

  it('buildLookupChangePatch fills customerid from company when customer blank', () => {
    const patch = buildLookupChangePatch('companyid', 'company', '3000', 'Demo Company Beta', {
      customerid: '',
    });
    expect(patch).toMatchObject({
      companyid: '3000',
      company: 'Demo Company Beta',
      customerid: '3000',
    });
  });

  it('buildLookupChangePatch keeps customerid when already set', () => {
    const patch = buildLookupChangePatch('companyid', 'company', '3000', 'Demo Company Beta', {
      customerid: 'CUST-99',
    });
    expect(patch.customerid).toBeUndefined();
  });
});
