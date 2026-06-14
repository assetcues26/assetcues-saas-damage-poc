import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

vi.mock('../config/features', () => ({
  V6_DEMO_ENABLED: false,
  CAPTURE_SESSION_ENABLED: true,
  SAAS_MODULE_ENABLED: false,
}));

const STORAGE_KEY = 'assetlens_history';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
  global.URL.revokeObjectURL = vi.fn();

  vi.spyOn(global, 'fetch').mockImplementation(async (url, options = {}) => {
    const href = typeof url === 'string' ? url : url?.url || '';
    if (href.includes('/v1/sessions')) {
      if (options.method === 'POST' && href.endsWith('/analyze')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ status: 'analyzing', session_token: 'mock' }),
        };
      }
      if (options.method === 'POST' && href.includes('/images')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            session_token: 'mock',
            status: 'active',
            image_count: 1,
            images: [],
          }),
        };
      }
      if (options.method === 'POST') {
        return {
          ok: false,
          status: 503,
          headers: { get: () => 'application/json' },
          json: async () => ({ detail: 'Capture sessions are not configured' }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({ detail: 'Session not found' }),
      };
    }
    if (href.includes('/v1/history')) {
      if (options.method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ deleted: true }),
        };
      }
      return {
        ok: false,
        status: 503,
        headers: { get: () => 'application/json' },
        json: async () => ({ detail: 'History persistence is not configured' }),
      };
    }
    return {
      ok: true,
      blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
    };
  });

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/jpeg;base64,mock-history-image',
  );

  global.Image = class MockImage {
    constructor() {
      this.naturalWidth = 800;
      this.naturalHeight = 600;
      this.width = 800;
      this.height = 600;
    }

    set src(_value) {
      queueMicrotask(() => this.onload?.());
    }
  };

  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        active: true,
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [
          {
            stop: vi.fn(),
            getCapabilities: () => ({}),
            applyConstraints: vi.fn().mockResolvedValue(undefined),
          },
        ],
      }),
    },
  });

  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  } else {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  localStorage.removeItem(STORAGE_KEY);
});
