import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renders children with contained aurora layer', () => {
    const { container } = render(
      <HeroSection>
        <h1>Hero content</h1>
      </HeroSection>,
    );
    expect(screen.getByRole('heading', { name: 'Hero content' })).toBeInTheDocument();
    expect(container.querySelector('[data-aurora-layer]')).toBeTruthy();
    expect(container.querySelector('.aurora-backdrop-layer')).toBeTruthy();
  });
});
