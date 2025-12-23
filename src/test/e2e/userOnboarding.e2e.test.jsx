import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setMockUser } from '../utils/testUtils';
import UserFormPage from '../../pages/superadmin/UserFormPage';
import { userAPI, roleAPI, geoAPI, dealerAPI } from '../../services/api';

// Mock API services - must be done before any imports
vi.mock('../../services/api', async () => {
  const { createApiMocks } = await import('../utils/apiMocks');
  return createApiMocks();
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}), // New user form
  };
});

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('E2E: User Onboarding Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    setMockUser({
      id: 'admin-1',
      username: 'superadmin',
      role: 'super_admin',
      roleId: 1,
    });

    // Import mocked APIs synchronously (mocks are already set up via vi.mock)
    const { roleAPI, geoAPI, dealerAPI, userAPI, teamAPI } = require('../../services/api');
    
    // Override mocks with specific data (reassign spies explicitly)
    roleAPI.getRoles = vi.fn(() =>
      Promise.resolve([
        { id: 8, name: 'dealer_admin' },
        { id: 9, name: 'dealer_staff' },
        { id: 10, name: 'sales_executive' },
        { id: 4, name: 'territory_manager' },
      ])
    );

    // Mock geography
    geoAPI.getRegions = vi.fn(() =>
      Promise.resolve([
        { id: 'region-1', name: 'North Region' },
      ])
    );
    geoAPI.getAreas = vi.fn(() =>
      Promise.resolve([
        { id: 'area-1', name: 'Area A', regionId: 'region-1' },
      ])
    );
    geoAPI.getTerritories = vi.fn(() =>
      Promise.resolve([
        { id: 'territory-1', name: 'Territory 1', areaId: 'area-1' },
      ])
    );

    // Mock dealers
    dealerAPI.getDealers = vi.fn(() =>
      Promise.resolve([
        { id: 'dealer-1', businessName: 'Dealer A', dealerCode: 'D001' },
        { id: 'dealer-2', businessName: 'Dealer B', dealerCode: 'D002' },
      ])
    );

    // Mock managers for sales_executive
    userAPI.getUsers = vi.fn(() =>
      Promise.resolve({
        users: [
          { id: 'manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' } },
        ],
      })
    );
  });

  it.skip('should create dealer_admin user with dealer assignment', async () => {
    userAPI.createUser.mockResolvedValue({
      id: 'user-123',
      username: 'dealer_admin_1',
      email: 'admin@dealer.com',
      roleId: 8,
      dealerId: 'dealer-1',
    });

    renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

    // Step 1: Basic Information
    const usernameInput = await screen.findByLabelText(/username/i);
    const emailInput = await screen.findByLabelText(/email/i);

    await user.type(usernameInput, 'dealer_admin_1');
    await user.type(emailInput, 'admin@dealer.com');
    const passwordInputs = await screen.findAllByLabelText(/password/i);
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    // Move to next step
    const nextButton = await screen.findByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Step 2: Role & Hierarchy
    const roleSelect = await screen.findByLabelText(/role/i);
    await user.click(roleSelect);
    await user.click(screen.getByText('dealer_admin'));

    // Wait for dealer dropdown to appear
    const dealerSelect = await screen.findByLabelText(/dealer/i);
    await user.click(dealerSelect);
    await user.click(screen.getByText(/Dealer A/));

    // Move to final step
    const nextStep2 = await screen.findByRole('button', { name: /next/i });
    await user.click(nextStep2);

    // Step 3: Submit
    const submitButton = await screen.findByRole('button', { name: /create user/i });
    await user.click(submitButton);

    // Verify API call includes dealerId
    await waitFor(() => {
      expect(userAPI.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'dealer_admin_1',
          email: 'admin@dealer.com',
          roleId: 8,
          dealerId: 'dealer-1',
        })
      );
    });
  });

  it.skip('should create sales_executive with manager assignment', async () => {
    const { userAPI } = require('../../services/api');
    userAPI.createUser = vi.fn(() =>
      Promise.resolve({
        id: 'user-456',
        username: 'sales_exec_1',
        email: 'sales@example.com',
        roleId: 10,
        managerId: 'manager-1',
      })
    );

    renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

    // Fill basic info
    const usernameInput = await screen.findByLabelText(/username/i);
    const emailInput = await screen.findByLabelText(/email/i);

    await user.type(usernameInput, 'sales_exec_1');
    await user.type(emailInput, 'sales@example.com');
    const passwordInputs = await screen.findAllByLabelText(/password/i);
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    await user.click(await screen.findByRole('button', { name: /next/i }));

    // Select sales_executive role (MUI Select uses a button/combobox trigger)
    const roleSelect = await screen.findByRole('button', { name: /role/i });
    await user.click(roleSelect);
    await user.click(screen.getByText('sales_executive'));

    // Wait for manager dropdown (required for sales_executive)
    const managerSelect = await screen.findByLabelText(/manager/i, undefined, { timeout: 3000 });
    await user.click(managerSelect);
    await user.click(screen.getByText(/territory_manager_1/));

    // Optional: Set geographic assignment
    const regionSelect = screen.queryByLabelText(/region.*optional/i);
    if (regionSelect) {
      await user.click(regionSelect);
      await user.click(screen.getByText('North Region'));
    }

    // Submit
    await user.click(await screen.findByRole('button', { name: /next/i }));
    const createButton = await screen.findByRole('button', { name: /create user/i });

    await user.click(createButton);

    // Verify managerId is included
    await waitFor(() => {
      expect(userAPI.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'sales_exec_1',
          roleId: 10,
          managerId: 'manager-1',
        })
      );
    });
  });

  it.skip('should create dealer_staff with dealer and manager assignment', async () => {
    const { userAPI } = require('../../services/api');
    userAPI.createUser = vi.fn(() =>
      Promise.resolve({
        id: 'user-789',
        username: 'staff_1',
        email: 'staff@dealer.com',
        roleId: 9,
        dealerId: 'dealer-1',
        managerId: 'dealer-admin-1', // Dealer Admin as manager
      })
    );

    // Mock dealer admin as manager option
    userAPI.getUsers.mockResolvedValue({
      users: [
        { id: 'dealer-admin-1', username: 'dealer_admin_1', roleDetails: { name: 'dealer_admin' }, dealerId: 'dealer-1' },
      ],
    });

    renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

    // Fill form
    const usernameInput = await screen.findByLabelText(/username/i);
    const emailInput = await screen.findByLabelText(/email/i);

    await user.type(usernameInput, 'staff_1');
    await user.type(emailInput, 'staff@dealer.com');
    const passwordInputs = await screen.findAllByLabelText(/password/i);
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    await user.click(await screen.findByRole('button', { name: /next/i }));

    // Select dealer_staff role
    const roleSelect = await screen.findByRole('button', { name: /role/i });
    await user.click(roleSelect);
    await user.click(screen.getByText('dealer_staff'));

    // Select dealer
    const dealerSelect = await screen.findByLabelText(/dealer/i);

    await user.click(dealerSelect);
    await user.click(screen.getByText(/Dealer A/));

    // Manager should be auto-populated or selectable
    await waitFor(() => {
      expect(userAPI.getUsers).toHaveBeenCalled();
    });

    // Submit
    await user.click(await screen.findByRole('button', { name: /next/i }));
    const createButton = await screen.findByRole('button', { name: /create user/i });

    await user.click(createButton);

    // Verify dealerId is included
    await waitFor(() => {
      expect(userAPI.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'staff_1',
          roleId: 9,
          dealerId: 'dealer-1',
        })
      );
    });
  });
});

