import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/testUtils';
import { AuroraPageLayout } from './AuroraPageLayout';

describe('AuroraPageLayout', () => {
  it('renders children inside aurora hero', () => {
    const { container } = renderWithProviders(
      <AuroraPageLayout>
        <p>Page body</p>
      </AuroraPageLayout>,
      { route: '/' },
    );
    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(container.querySelector('.aurora-backdrop-layer')).toBeTruthy();
  });
});
