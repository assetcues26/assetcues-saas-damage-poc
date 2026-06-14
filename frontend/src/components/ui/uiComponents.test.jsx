import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionBadge } from './ConditionBadge';
import { LabelChip } from './LabelChip';
import { ConfidenceBar } from './ConfidenceBar';
import { BackButton } from './BackButton';
import { ProceedButton } from './ProceedButton';
import { ConfirmModal } from './Modal';
import { Badge } from './Badge';

describe('UI components', () => {
  it('ConditionBadge renders Good, Fair, Poor', () => {
    const { rerender } = render(<ConditionBadge condition="Good" />);
    expect(screen.getByText('Good')).toBeInTheDocument();
    rerender(<ConditionBadge condition="damaged" />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('LabelChip renders label text', () => {
    render(<LabelChip label="Carrier" />);
    expect(screen.getByText('Carrier')).toBeInTheDocument();
  });

  it('ConfidenceBar shows percentage', () => {
    render(<ConfidenceBar value={0.87} />);
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('BackButton fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<BackButton label="Go back" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('ProceedButton respects disabled state', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ProceedButton label="Proceed" disabled onClick={onClick} count={3} />);
    const btn = screen.getByRole('button', { name: 'Proceed' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('ConfirmModal confirms and cancels', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmModal
        open
        title="Delete?"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Badge renders children', () => {
    render(<Badge>Max 10 images</Badge>);
    expect(screen.getByText('Max 10 images')).toBeInTheDocument();
  });
});
