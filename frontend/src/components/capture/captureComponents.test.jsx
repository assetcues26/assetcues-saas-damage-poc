import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraView } from './CameraView';
import { ShutterButton } from './ShutterButton';
import { FlashToggle } from './FlashToggle';
import { CameraZoomControls } from './CameraZoomControls';

describe('Capture components', () => {
  it('CameraView shows error state with retry', async () => {
    const onRetry = vi.fn();
    render(
      <CameraView
        videoRef={{ current: null }}
        facingMode="environment"
        status="denied"
        error={new Error('denied')}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(/Camera access required/i)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Enable Camera/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('CameraView shows loading spinner', () => {
    render(
      <CameraView
        videoRef={{ current: null }}
        facingMode="environment"
        status="loading"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('ShutterButton captures on click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ShutterButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /Capture photo/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it('CameraZoomControls changes zoom level', async () => {
    const onZoomChange = vi.fn();
    const user = userEvent.setup();
    render(<CameraZoomControls zoomLevel={1} onZoomChange={onZoomChange} />);
    await user.click(screen.getByRole('button', { name: '3x zoom' }));
    expect(onZoomChange).toHaveBeenCalledWith(3);
  });

  it('FlashToggle cycles flash modes', async () => {
    const onCycle = vi.fn();
    const user = userEvent.setup();
    render(<FlashToggle mode="off" onCycle={onCycle} />);
    await user.click(screen.getByRole('button', { name: /Flash off/i }));
    expect(onCycle).toHaveBeenCalled();
  });
});
