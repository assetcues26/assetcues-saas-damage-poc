import { describe, expect, it } from 'vitest';
import { applyAutoIdentifiers } from './autoAssetIdentifiers';

describe('applyAutoIdentifiers', () => {
  it('fills only empty identity fields', () => {
    const result = applyAutoIdentifiers(
      { assetid: '', assetnumber: 'FAR1005', tagnumber: '', assetname: 'Laptop' },
      { assetid: 'AST-10006', assetnumber: 'FAR1006', tagnumber: 'TAG1006' },
    );
    expect(result).toEqual({
      assetid: 'AST-10006',
      assetnumber: 'FAR1005',
      tagnumber: '',
      assetname: 'Laptop',
    });
  });

  it('returns values unchanged when identifiers missing', () => {
    const values = { assetid: '', assetnumber: '' };
    expect(applyAutoIdentifiers(values, null)).toBe(values);
  });
});
