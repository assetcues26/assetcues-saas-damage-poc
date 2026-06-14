import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FailureDetailModal } from './FailureDetailModal';

vi.mock('../../services/saasAssetsApi', () => ({
  analyzeSaasAssetWithPatch: vi.fn(),
}));

const SUMMARY = {
  checks: {
    costmatch: false,
    namedescriptionmatch: false,
  },
  reasoning: 'User Claim: HP Laptop. Image Shows: MacBook Pro.',
  costvalidation: {
    reasoning: 'Cost mismatch. User cost INR 250000 does not align with market estimate.',
  },
  field_comparison: {
    namedescriptionmatch: {
      registered: 'HP Laptop',
      detected: 'MacBook Pro',
    },
  },
  namedescriptionmatchpercent: 0,
};

describe('FailureDetailModal', () => {
  it('shows per-check reasons and overall reasoning when open', () => {
    render(
      <FailureDetailModal
        open
        onClose={vi.fn()}
        failureSummary={SUMMARY}
        asset={{ id: '1', assetid: 'AST-1', assetname: 'HP Laptop' }}
      />,
    );

    expect(screen.getByText(/Cost mismatch/)).toBeInTheDocument();
    expect(screen.getByText(/Registered: HP Laptop/)).toBeInTheDocument();
    expect(screen.getByText(/User Claim: HP Laptop/)).toBeInTheDocument();
  });
});
