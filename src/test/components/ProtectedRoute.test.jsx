import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { renderWithProviders, mockUser, setMockUser } from '../utils/testUtils';

// Mock useAuth to return our mock value
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset to default super_admin user
    setMockUser(mockUser);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      loading: false,
    });
  });

  it('should render children when user has allowed role', () => {
    renderWithProviders(
      <ProtectedRoute allowed={['super_admin']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user does not have allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'dealer_admin' },
      token: 'test-token',
      loading: false,
    });

    renderWithProviders(
      <ProtectedRoute allowed={['super_admin']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
