import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from './DropZone';
import { createTestImageFile } from '../../test/testUtils';

describe('DropZone', () => {
  it('calls onFilesSelected when file input changes', async () => {
    const onFilesSelected = vi.fn();
    const user = userEvent.setup();
    render(<DropZone onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, createTestImageFile());
    expect(onFilesSelected).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'test-asset.jpg' })]),
    );
  });

  it('handles drag and drop', () => {
    const onFilesSelected = vi.fn();
    render(<DropZone onFilesSelected={onFilesSelected} />);
    const zone = screen.getByTestId('drop-zone');
    const file = createTestImageFile();
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });
    expect(onFilesSelected).toHaveBeenCalled();
  });

  it('does not accept files when disabled', async () => {
    const onFilesSelected = vi.fn();
    render(<DropZone onFilesSelected={onFilesSelected} disabled />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });
});
