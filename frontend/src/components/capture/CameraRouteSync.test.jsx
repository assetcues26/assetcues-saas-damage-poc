import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CameraProvider } from '../../context/CameraContext';
import { CameraRouteSync, isCaptureRoute } from './CameraRouteSync';

const ensureActive = vi.fn();
const releaseStream = vi.fn();

vi.mock('../../hooks/useCamera', () => ({
  useCamera: () => ({
    ensureActive,
    releaseStream,
  }),
}));

function renderAt(path) {
  return render(
    <CameraProvider>
      <MemoryRouter initialEntries={[path]}>
        <CameraRouteSync />
        <Routes>
          <Route path="/capture" element={<div>Capture</div>} />
          <Route path="/v6/capture" element={<div>V6 Capture</div>} />
          <Route path="/upload" element={<div>Upload</div>} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </CameraProvider>,
  );
}

describe('CameraRouteSync', () => {
  beforeEach(() => {
    ensureActive.mockClear();
    releaseStream.mockClear();
  });

  it('releases the stream on non-capture routes', () => {
    renderAt('/upload');
    expect(releaseStream).toHaveBeenCalled();
    expect(ensureActive).not.toHaveBeenCalled();
  });

  it('starts the camera only on /capture', () => {
    renderAt('/capture');
    expect(ensureActive).toHaveBeenCalled();
    expect(releaseStream).not.toHaveBeenCalled();
  });

  it('starts the camera on /v6/capture', () => {
    renderAt('/v6/capture');
    expect(ensureActive).toHaveBeenCalled();
    expect(releaseStream).not.toHaveBeenCalled();
  });
});

describe('isCaptureRoute', () => {
  it('matches main and v6 capture paths', () => {
    expect(isCaptureRoute('/capture')).toBe(true);
    expect(isCaptureRoute('/v6/capture')).toBe(true);
    expect(isCaptureRoute('/upload')).toBe(false);
    expect(isCaptureRoute('/v6/upload')).toBe(false);
  });
});
