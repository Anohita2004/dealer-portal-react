import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// CRITICAL: Mock import.meta.env BEFORE any modules that use it are imported
// This must be at the very top of the setup file
if (typeof globalThis.import === 'undefined') {
  globalThis.import = {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000/api',
        VITE_SOCKET_URL: 'http://localhost:3000',
      },
    },
  };
} else {
  if (!globalThis.import.meta) {
    globalThis.import.meta = {};
  }
  if (!globalThis.import.meta.env) {
    globalThis.import.meta.env = {};
  }
  globalThis.import.meta.env.VITE_API_URL = globalThis.import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  globalThis.import.meta.env.VITE_SOCKET_URL = globalThis.import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'user') return null;
    if (key === 'token') return null;
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver;
if (typeof window !== 'undefined') {
  window.IntersectionObserver = MockIntersectionObserver;
}

// Mock ResizeObserver for charts (e.g., Recharts ResponsiveContainer)
class MockResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = MockResizeObserver;
}
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = MockResizeObserver;
}

// Mock import.meta.env for Vite - this must be done before any imports that use it
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000/api',
        VITE_SOCKET_URL: 'http://localhost:3000',
      },
    },
  },
  writable: true,
  configurable: true,
});

