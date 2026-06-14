import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchTray } from './BatchTray';

const images = [
  { id: '1', previewUrl: 'blob:1', name: 'a.jpg' },
  { id: '2', previewUrl: 'blob:2', name: 'b.jpg' },
];

describe('BatchTray', () => {
  it('renders counter and thumbnails', () => {
    render(<BatchTray images={images} maxImages={5} onRemove={vi.fn()} />);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove image 1/i })).toBeInTheDocument();
  });

  it('calls onRemove when remove clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<BatchTray images={images} maxImages={5} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: /Remove image 1/i }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
