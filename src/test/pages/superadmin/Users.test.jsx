import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils';
import Users from '../../../pages/superadmin/Users';
import { userAPI, roleAPI } from '../../../services/api';

// Mock API
vi.mock('../../../services/api', () => ({
  userAPI: {
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  },
  roleAPI: {
    getRoles: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    userAPI.getUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          roleDetails: { name: 'Super Admin' },
          isActive: true,
          isBlocked: false,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      totalPages: 1,
    });

    roleAPI.getRoles.mockResolvedValue([
      { id: 1, name: 'Super Admin' },
      { id: 2, name: 'Dealer Admin' },
    ]);
  });

  it('should render users page with header', async () => {
    renderWithProviders(<Users />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('should display create user button', async () => {
    renderWithProviders(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
  });

  it('should load and display users', async () => {
    renderWithProviders(<Users />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display stats cards', async () => {
    renderWithProviders(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });
  });
});
