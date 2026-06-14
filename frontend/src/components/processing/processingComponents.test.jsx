import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusCycler } from './StatusCycler';
import { ProcessingAnimation, ShimmerProgressBar } from './ProcessingAnimation';

describe('Processing components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('StatusCycler displays processing messages', () => {
    render(<StatusCycler intervalMs={2500} />);
    expect(screen.getByText(/Stitching image views/i)).toBeInTheDocument();
  });

  it('ProcessingAnimation and ShimmerProgressBar render', () => {
    render(
      <>
        <ProcessingAnimation />
        <ShimmerProgressBar />
      </>,
    );
    expect(document.querySelector('.logo-element-video-canvas')).toBeTruthy();
  });
});
