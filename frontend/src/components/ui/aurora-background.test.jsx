import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuroraBackground } from './aurora-background';

describe('AuroraBackground', () => {
  it('renders children above the aurora layer', () => {
    render(
      <AuroraBackground className="min-h-screen h-auto">
        <p>Page content</p>
      </AuroraBackground>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('includes an animated aurora backdrop layer', () => {
    const { container } = render(
      <AuroraBackground contained>
        <span>Child</span>
      </AuroraBackground>,
    );
    const layer = container.querySelector('[data-aurora-layer]');
    expect(layer).toBeTruthy();
    expect(layer).toHaveClass('aurora-backdrop-layer');
    expect(container.querySelector('[aria-hidden]')).toBeTruthy();
  });
});
