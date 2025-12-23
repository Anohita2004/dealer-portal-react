import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'super_admin',
  roleId: 1,
  regionId: null,
  areaId: null,
  territoryId: null,
  dealerId: null,
};

// Create a mutable mock auth value
let currentMockAuthValue = {
  user: mockUser,
  token: 'test-token',
  login: vi.fn(),
  verifyOTP: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => currentMockAuthValue,
  AuthContext: React.createContext(null),
}));

// Mock NotificationContext
const mockNotificationValue = {
  notifications: [],
  unreadCount: 0,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
};

vi.mock('../../context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <>{children}</>,
  useNotifications: () => mockNotificationValue,
}));

// Mock useApiCall hook
vi.mock('../../hooks/useApiCall', () => ({
  default: vi.fn(() => ({
    call: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  })),
  useApiCall: vi.fn(() => ({
    call: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  })),
}));

// Custom render function that includes all providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    route = '/',
    user = mockUser,
    ...renderOptions
  } = {}
) => {
  // Update mock auth value
  if (user) {
    currentMockAuthValue = { ...currentMockAuthValue, user };
  }

  // Set up router
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Export mock user and helpers
export { mockUser };
export const getMockAuthValue = () => currentMockAuthValue;
export const setMockUser = (user) => {
  currentMockAuthValue = { ...currentMockAuthValue, user };
};

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});
