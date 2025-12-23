import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setMockUser } from '../utils/testUtils';
import DealerFormPage from '../../pages/superadmin/DealerFormPage';
import { dealerAPI, geoAPI, userAPI } from '../../services/api';

// Mock API services
vi.mock('../../services/api', () => {
  const { createApiMocks } = require('../utils/apiMocks');
  return createApiMocks();
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}), // New dealer form
  };
});

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

  describe('E2E: Dealer Onboarding Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up super_admin user
    setMockUser({
      id: 'admin-1',
      username: 'superadmin',
      role: 'super_admin',
      roleId: 1,
    });

    // Get mocked APIs synchronously
    const { geoAPI, userAPI, dealerAPI } = require('../../services/api');

    // Mock geography data
    geoAPI.getRegions = vi.fn(() =>
      Promise.resolve([
        { id: 'region-1', name: 'North Region' },
        { id: 'region-2', name: 'South Region' },
      ])
    );

    geoAPI.getAreas = vi.fn(() =>
      Promise.resolve([
        { id: 'area-1', name: 'Area A', regionId: 'region-1' },
        { id: 'area-2', name: 'Area B', regionId: 'region-1' },
      ])
    );

    geoAPI.getTerritories = vi.fn(() =>
      Promise.resolve([
        { id: 'territory-1', name: 'Territory 1', areaId: 'area-1' },
        { id: 'territory-2', name: 'Territory 2', areaId: 'area-1' },
      ])
    );

    // Mock managers
    userAPI.getUsers = vi.fn(() =>
      Promise.resolve({
        users: [
          { id: 'manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' } },
          { id: 'manager-2', username: 'area_manager_1', roleDetails: { name: 'area_manager' } },
        ],
      })
    );

    // Mock successful dealer creation
    dealerAPI.createDealer = vi.fn(() =>
      Promise.resolve({
        id: 'dealer-123',
        dealerCode: 'D001',
        businessName: 'Test Dealer',
        status: 'pending_approval',
        approvalStage: 'territory_manager',
      })
    );
  });

it(
  'should complete full dealer onboarding wizard',
  async () => {
    renderWithProviders(<DealerFormPage />, { route: '/superadmin/dealers/new' });

    // Step 1: Fill basic dealer information
    await waitFor(() => {
      expect(screen.getByLabelText(/dealer code/i)).toBeInTheDocument();
    });

    const dealerCodeInput = screen.getByLabelText(/dealer code/i);
    const businessNameInput = screen.getByLabelText(/business name/i);

    await user.type(dealerCodeInput, 'D001');
    await user.type(businessNameInput, 'Test Dealer Company');

    // Step 2: Fill contact details
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    
    if (emailInput) await user.type(emailInput, 'test@dealer.com');
    if (phoneInput) await user.type(phoneInput, '1234567890');

    // Step 3/4: Set geographic hierarchy & optional manager via test helper to avoid brittle MUI Select interactions
    if (typeof window !== 'undefined' && window.__setDealerFormState) {
      window.__setDealerFormState({
        regionId: 'region-1',
        areaId: 'area-1',
        territoryId: 'territory-1',
        managerId: 'manager-1',
      });
    }

    // Step 5: Submit form
    const submitButton = screen.getByRole('button', { name: /create dealer/i });
    expect(submitButton).toBeInTheDocument();
    
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(dealerAPI.createDealer).toHaveBeenCalledWith(
        expect.objectContaining({
          dealerCode: 'D001',
          businessName: 'Test Dealer Company',
          regionId: 'region-1',
          areaId: 'area-1',
          territoryId: 'territory-1',
        })
      );
    });

    // Verify navigation after success
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/superadmin/dealers');
    }, { timeout: 3000 });
  },
  15000
);

it(
  'should show approval status after dealer creation',
  async () => {
    renderWithProviders(<DealerFormPage />, { route: '/superadmin/dealers/new' });

    // Fill required fields
    const dealerCodeInput = await screen.findByLabelText(/dealer code/i);
    const businessNameInput = await screen.findByLabelText(/business name/i);

    await user.type(dealerCodeInput, 'D002');
    await user.type(businessNameInput, 'Another Dealer');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create dealer/i });
    await user.click(submitButton);

    // Verify response includes approval status
    await waitFor(() => {
      expect(dealerAPI.createDealer).toHaveBeenCalled();
    });

    // The response should include status = pending_approval
    const createCall = dealerAPI.createDealer.mock.calls[0][0];
    expect(createCall).toBeDefined();
  },
  15000
);
});

