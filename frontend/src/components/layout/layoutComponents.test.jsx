import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../test/testUtils';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { PageWrapper } from './PageWrapper';

describe('Layout components', () => {
  it('AppHeader renders logo and nav links', () => {
    renderWithProviders(<AppHeader />, { route: '/' });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByAltText('AssetCues')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Capture' })).toHaveAttribute('href', '/capture');
    expect(screen.getByRole('link', { name: 'Upload' })).toHaveAttribute('href', '/upload');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history');
    expect(screen.getByLabelText('App settings')).toBeInTheDocument();
  });

  it('AppFooter renders tagline and powered badge', () => {
    render(
      <MemoryRouter>
        <AppFooter />
      </MemoryRouter>,
    );
    expect(screen.getByText('Enterprise Asset Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Powered by AI')).toBeInTheDocument();
  });

  it('PageWrapper renders children', () => {
    render(<PageWrapper><p>Child content</p></PageWrapper>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
