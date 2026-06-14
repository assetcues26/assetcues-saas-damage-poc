import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import { Trash } from 'lucide-react';

describe('Button (shadcn)', () => {
  it('renders destructive variant with icon', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="destructive" onClick={onClick}>
        <Trash className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
        Delete
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).toHaveBeenCalled();
  });
});
