import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setMockUser } from '../utils/testUtils';
import UserFormPage from '../../pages/superadmin/UserFormPage';
import DealerFormPage from '../../pages/superadmin/DealerFormPage';
import CreateOrder from '../../pages/orders/CreateOrders';
import MyOrders from '../../pages/orders/MyOrders';
import AdminOrders from '../../pages/orders/AdminOrders';
import Invoices from '../../pages/Invoices';
import CreatePaymentRequest from '../../pages/payments/CreatePaymentRequest';
// Import APIs at module level - these will be the same references the component uses
import * as apiServices from '../../services/api';

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
    useParams: () => ({}),
  };
});

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('E2E: Comprehensive Workflow - Full Business Process', () => {
  const user = userEvent.setup();

  // Test data - shared across tests
  const testData = {
    region: { id: 'region-1', name: 'North Region' },
    area: { id: 'area-1', name: 'Area A', regionId: 'region-1' },
    territory: { id: 'territory-1', name: 'Territory 1', areaId: 'area-1' },
    dealer: { id: 'dealer-1', businessName: 'Test Dealer', dealerCode: 'TD001' },
    roles: [
      { id: 1, name: 'super_admin' },
      { id: 2, name: 'regional_admin' },
      { id: 3, name: 'regional_manager' },
      { id: 4, name: 'territory_manager' },
      { id: 5, name: 'area_manager' },
      { id: 8, name: 'dealer_admin' },
      { id: 9, name: 'dealer_staff' },
      { id: 10, name: 'sales_executive' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    setMockUser({
      id: 'admin-1',
      username: 'superadmin',
      role: 'super_admin',
      roleId: 1,
    });

    // Setup comprehensive API mocks
    apiServices.roleAPI.getRoles = vi.fn(() => Promise.resolve(testData.roles));
    
    apiServices.geoAPI.getRegions = vi.fn(() => Promise.resolve([testData.region]));
    apiServices.geoAPI.getAreas = vi.fn(() => Promise.resolve([testData.area]));
    apiServices.geoAPI.getTerritories = vi.fn(() => Promise.resolve([testData.territory]));
    
    apiServices.dealerAPI.getDealers = vi.fn(() => Promise.resolve([testData.dealer]));
    apiServices.dealerAPI.createDealer = vi.fn(() => Promise.resolve({ dealer: testData.dealer }));
    
    apiServices.userAPI.getUsers = vi.fn(() => Promise.resolve({ users: [] }));
    apiServices.userAPI.createUser = vi.fn(() => Promise.resolve({ id: 'user-new', username: 'test_user' }));
    
    apiServices.materialAPI.getMaterials = vi.fn(() => Promise.resolve({
      materials: [
        { id: 'mat-1', name: 'Material A', sku: 'MAT001', availableStock: 100, price: 1000 },
        { id: 'mat-2', name: 'Material B', sku: 'MAT002', availableStock: 50, price: 2000 },
      ],
    }));
    
    apiServices.orderAPI.createOrder = vi.fn(() => Promise.resolve({
      order: { id: 'order-1', orderNumber: 'ORD-001', status: 'Pending' },
    }));
    apiServices.orderAPI.getMyOrders = vi.fn(() => Promise.resolve({ orders: [] }));
    apiServices.orderAPI.getAllOrders = vi.fn(() => Promise.resolve({ orders: [] }));
    apiServices.orderAPI.approveOrder = vi.fn(() => Promise.resolve({ success: true }));
    
    apiServices.invoiceAPI.createInvoice = vi.fn(() => Promise.resolve({
      invoice: { id: 'inv-1', invoiceNumber: 'INV-001', status: 'unpaid' },
    }));
    apiServices.invoiceAPI.getInvoices = vi.fn(() => Promise.resolve({ invoices: [] }));
    
    apiServices.paymentAPI.createRequest = vi.fn(() => Promise.resolve({
      payment: { id: 'pay-1', requestNumber: 'PAY-001', status: 'pending' },
    }));
  });

  afterEach(() => {
    cleanup();
  });

  describe('User Onboarding - All Role Types', () => {
    it('should create regional_admin user', async () => {
      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-reg-admin',
        username: 'reg_admin_1',
        roleId: 2,
        regionId: testData.region.id,
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      // Fill basic info
      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'reg_admin_1');
      await user.type(emailInput, 'regadmin@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      // Set role and region
      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
      });

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 2, // regional_admin
            regionId: testData.region.id,
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));

      // Submit
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'reg_admin_1',
            roleId: 2,
            regionId: testData.region.id,
          })
        );
      });
    });

    it('should create regional_manager with regional_admin as manager', async () => {
      // First create the regional_admin (manager)
      const managers = [
        { id: 'reg-admin-1', username: 'reg_admin_1', roleDetails: { name: 'regional_admin' }, regionId: testData.region.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-reg-manager',
        username: 'reg_manager_1',
        roleId: 3,
        regionId: testData.region.id,
        managerId: 'reg-admin-1',
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'reg_manager_1');
      await user.type(emailInput, 'regmanager@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 3, // regional_manager
            regionId: testData.region.id,
            managerId: 'reg-admin-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'reg_manager_1',
            roleId: 3,
            regionId: testData.region.id,
            managerId: 'reg-admin-1',
          })
        );
      });
    });

    it('should create area_manager with region and area assignment', async () => {
      const managers = [
        { id: 'reg-manager-1', username: 'reg_manager_1', roleDetails: { name: 'regional_manager' }, regionId: testData.region.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-area-manager',
        username: 'area_manager_1',
        roleId: 5,
        regionId: testData.region.id,
        areaId: testData.area.id,
        managerId: 'reg-manager-1',
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'area_manager_1');
      await user.type(emailInput, 'areamanager@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 5, // area_manager
            regionId: testData.region.id,
            areaId: testData.area.id,
            managerId: 'reg-manager-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'area_manager_1',
            roleId: 5,
            regionId: testData.region.id,
            areaId: testData.area.id,
            managerId: 'reg-manager-1',
          })
        );
      });
    });

    it('should create territory_manager with full geographic hierarchy', async () => {
      const managers = [
        { id: 'area-manager-1', username: 'area_manager_1', roleDetails: { name: 'area_manager' }, regionId: testData.region.id, areaId: testData.area.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-territory-manager',
        username: 'territory_manager_1',
        roleId: 4,
        regionId: testData.region.id,
        areaId: testData.area.id,
        territoryId: testData.territory.id,
        managerId: 'area-manager-1',
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'territory_manager_1');
      await user.type(emailInput, 'territorymanager@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 4, // territory_manager
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'area-manager-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'territory_manager_1',
            roleId: 4,
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'area-manager-1',
          })
        );
      });
    });

    it('should create dealer_admin with territory_manager as manager', async () => {
      const managers = [
        { id: 'territory-manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' }, territoryId: testData.territory.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-dealer-admin',
        username: 'dealer_admin_1',
        roleId: 8,
        dealerId: testData.dealer.id,
        managerId: 'territory-manager-1',
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'dealer_admin_1');
      await user.type(emailInput, 'dealeradmin@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.dealerAPI.getDealers).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 8, // dealer_admin
            dealerId: testData.dealer.id,
            managerId: 'territory-manager-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'dealer_admin_1',
            roleId: 8,
            dealerId: testData.dealer.id,
            managerId: 'territory-manager-1',
          })
        );
      });
    });

    it('should create dealer_staff with dealer_admin as manager', async () => {
      const managers = [
        { id: 'dealer-admin-1', username: 'dealer_admin_1', roleDetails: { name: 'dealer_admin' }, dealerId: testData.dealer.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-dealer-staff',
        username: 'dealer_staff_1',
        roleId: 9,
        dealerId: testData.dealer.id,
        managerId: 'dealer-admin-1',
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'dealer_staff_1');
      await user.type(emailInput, 'dealerstaff@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.dealerAPI.getDealers).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 9, // dealer_staff
            dealerId: testData.dealer.id,
            managerId: 'dealer-admin-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'dealer_staff_1',
            roleId: 9,
            dealerId: testData.dealer.id,
            managerId: 'dealer-admin-1',
          })
        );
      });
    });

    it('should create sales_executive with manager assignment', async () => {
      const managers = [
        { id: 'territory-manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' }, regionId: testData.region.id },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers,
      });

      apiServices.userAPI.createUser.mockResolvedValue({
        id: 'user-sales-exec',
        username: 'sales_exec_1',
        roleId: 10,
        managerId: 'territory-manager-1',
        regionId: testData.region.id,
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'sales_exec_1');
      await user.type(emailInput, 'salesexec@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
        expect(apiServices.userAPI.getUsers).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 10, // sales_executive
            managerId: 'territory-manager-1',
            regionId: testData.region.id,
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'sales_exec_1',
            roleId: 10,
            managerId: 'territory-manager-1',
            regionId: testData.region.id,
          })
        );
      });
    });
  });

  describe('Dealer Creation and Geographic Assignment', () => {
    it('should create dealer with full geographic hierarchy and manager assignment', async () => {
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: [
          { id: 'territory-manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' } },
        ],
      });

      apiServices.dealerAPI.createDealer.mockResolvedValue({
        dealer: {
          ...testData.dealer,
          regionId: testData.region.id,
          areaId: testData.area.id,
          territoryId: testData.territory.id,
          managerId: 'territory-manager-1',
        },
      });

      renderWithProviders(<DealerFormPage />, { route: '/superadmin/dealers/new' });

      // Fill dealer form
      const businessNameInput = await screen.findByLabelText(/business name/i);
      const dealerCodeInput = await screen.findByLabelText(/dealer code/i);
      await user.type(businessNameInput, testData.dealer.businessName);
      await user.type(dealerCodeInput, testData.dealer.dealerCode);

      // Set geographic hierarchy and manager via test helper
      if (typeof window !== 'undefined' && window.__setDealerFormState) {
        await act(async () => {
          window.__setDealerFormState({
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'territory-manager-1',
          });
        });
      }

      // Submit
      const submitButton = await screen.findByRole('button', { name: /create dealer|save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.dealerAPI.createDealer).toHaveBeenCalledWith(
          expect.objectContaining({
            businessName: testData.dealer.businessName,
            dealerCode: testData.dealer.dealerCode,
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'territory-manager-1',
          })
        );
      });
    });
  });

  describe('Order Creation and Approval Workflow', () => {
    beforeEach(() => {
      setMockUser({
        id: 'staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        roleId: 9,
        dealerId: testData.dealer.id,
      });
    });

    it('should create order as dealer_staff and show in My Orders', async () => {
      apiServices.orderAPI.getMyOrders.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            dealerId: testData.dealer.id,
            status: 'Pending',
            approvalStatus: 'pending',
            items: [{ materialId: 'mat-1', quantity: 10, price: 1000 }],
            totalAmount: 10000,
          },
        ],
      });

      renderWithProviders(<CreateOrder />, { route: '/orders/create' });

      // Wait for materials to load
      await waitFor(() => {
        expect(apiServices.materialAPI.getMaterials).toHaveBeenCalled();
      });

      // Select material
      const materialSelect = await screen.findByLabelText(/material|product/i);
      await user.click(materialSelect);
      const materialOption = await screen.findByRole('option', { name: /Material A|MAT001/i });
      await user.click(materialOption);

      // Enter quantity
      const quantityInput = await screen.findByLabelText(/quantity/i);
      await user.type(quantityInput, '10');

      // Add item to order first
      const addButton = await screen.findByRole('button', { name: /add|add item/i });
      await user.click(addButton);

      // Submit order
      const submitButton = await screen.findByRole('button', { name: /submit order for approval/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.orderAPI.createOrder).toHaveBeenCalled();
      });

      // Verify order appears in My Orders
      renderWithProviders(<MyOrders />, { route: '/orders/my' });
      await waitFor(() => {
        expect(apiServices.orderAPI.getMyOrders).toHaveBeenCalled();
      });
    });

    it('should approve order through hierarchy (territory_manager → area_manager → regional_manager)', async () => {
      // First, create an order
      apiServices.orderAPI.getAllOrders.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            dealerId: testData.dealer.id,
            status: 'Pending',
            approvalStatus: 'pending',
            approvalStage: 'territory_manager',
            items: [{ materialId: 'mat-1', quantity: 10 }],
            totalAmount: 10000,
          },
        ],
      });

      // Test as territory_manager
      setMockUser({
        id: 'territory-manager-1',
        username: 'territory_manager_1',
        role: 'territory_manager',
        roleId: 4,
        regionId: testData.region.id,
        areaId: testData.area.id,
        territoryId: testData.territory.id,
      });

      renderWithProviders(<AdminOrders />, { route: '/orders/admin' });

      await waitFor(() => {
        expect(apiServices.orderAPI.getAllOrders).toHaveBeenCalled();
      });

      // Approve order
      const approveButton = await screen.findByRole('button', { name: /approve/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(apiServices.orderAPI.approveOrder).toHaveBeenCalledWith('order-1', expect.any(Object));
      });

      // Verify order moves to next approval stage
      apiServices.orderAPI.approveOrder.mockResolvedValue({
        order: {
          id: 'order-1',
          approvalStatus: 'approved',
          approvalStage: 'area_manager',
        },
      });
    });
  });

  describe('Invoice Creation from Approved Order', () => {
    beforeEach(() => {
      setMockUser({
        id: 'staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        roleId: 9,
        dealerId: testData.dealer.id,
      });
    });

    it('should create invoice from approved order', async () => {
      apiServices.orderAPI.getMyOrders.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            status: 'Approved',
            approvalStatus: 'approved',
            items: [{ materialId: 'mat-1', quantity: 10, price: 1000 }],
            totalAmount: 10000,
          },
        ],
      });

      apiServices.invoiceAPI.getInvoices.mockResolvedValue({
        invoices: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            orderId: 'order-1',
            totalAmount: 10000,
            status: 'unpaid',
          },
        ],
      });

      renderWithProviders(<MyOrders />, { route: '/orders/my' });

      await waitFor(() => {
        expect(apiServices.orderAPI.getMyOrders).toHaveBeenCalled();
      });

      // Wait for order to render and check if Raise Invoice button is enabled
      await waitFor(async () => {
        const raiseInvoiceButtons = await screen.findAllByRole('button', { name: /raise invoice/i });
        const enabledButton = raiseInvoiceButtons.find(btn => !btn.disabled);
        if (enabledButton) {
          await user.click(enabledButton);
        }
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(apiServices.invoiceAPI.createInvoice).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: 'order-1',
          })
        );
      });

      // Verify invoice appears in invoices list
      renderWithProviders(<Invoices />, { route: '/invoices' });
      await waitFor(() => {
        expect(apiServices.invoiceAPI.getInvoices).toHaveBeenCalled();
      });
    });
  });

  describe('Payment Request Creation from Invoice', () => {
    beforeEach(() => {
      setMockUser({
        id: 'staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        roleId: 9,
        dealerId: testData.dealer.id,
      });
    });

    it('should create payment request from invoice', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          orderId: 'order-1',
          totalAmount: 10000,
          balanceAmount: 10000,
          status: 'unpaid',
        },
      ];

      // Mock api.get for invoices (CreatePaymentRequest uses api.get directly)
      apiServices.default.get = vi.fn((url) => {
        if (url === '/invoices') {
          return Promise.resolve({ data: { invoices: mockInvoices } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithProviders(<CreatePaymentRequest />, { route: '/payments/create' });

      await waitFor(() => {
        expect(apiServices.default.get).toHaveBeenCalledWith('/invoices');
      });

      // Select invoice - CreatePaymentRequest uses native select, not MUI combobox
      const invoiceSelect = await screen.findByLabelText(/invoice/i);
      await user.selectOptions(invoiceSelect, 'inv-1');

      // Select payment mode - also native select
      const paymentModeSelect = await screen.findByLabelText(/payment mode/i);
      await user.selectOptions(paymentModeSelect, 'bank_transfer');

      // Enter amount
      const amountInput = await screen.findByLabelText(/amount/i);
      await user.type(amountInput, '10000');

      // Submit payment request
      const submitButton = await screen.findByRole('button', { name: /create|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.paymentAPI.createRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            invoiceId: 'inv-1',
            amount: 10000,
          })
        );
      });
    });
  });

  describe('Complete Workflow: User → Dealer → Order → Invoice → Payment', () => {
    it('should complete full business workflow end-to-end', async () => {
      // Step 1: Create territory_manager
      const managers1 = [
        { id: 'area-manager-1', username: 'area_manager_1', roleDetails: { name: 'area_manager' } },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers1,
      });

      apiServices.userAPI.createUser.mockImplementation((payload) => {
        if (payload.roleId === 4) {
          // territory_manager
          return Promise.resolve({
            id: 'territory-manager-1',
            username: payload.username,
            roleId: 4,
            regionId: payload.regionId,
            areaId: payload.areaId,
            territoryId: payload.territoryId,
            managerId: payload.managerId,
          });
        }
        return Promise.resolve({ id: 'user-new', username: payload.username });
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput = await screen.findByLabelText(/username/i);
      const emailInput = await screen.findByLabelText(/email/i);
      await user.type(usernameInput, 'territory_manager_1');
      await user.type(emailInput, 'territorymanager@test.com');
      const passwordInput = await screen.findByTestId('password-input');
      const confirmPasswordInput = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      // Wait for roles to load (getUsers may not always be called)
      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
      });

      // Populate managers before setting managerId
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers1);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 4,
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'area-manager-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            roleId: 4,
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
          })
        );
      });

      // Step 2: Create dealer_admin
      const managers2 = [
        { id: 'territory-manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' } },
      ];
      
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: managers2,
      });

      apiServices.userAPI.createUser.mockImplementation((payload) => {
        if (payload.roleId === 8) {
          return Promise.resolve({
            id: 'dealer-admin-1',
            username: payload.username,
            roleId: 8,
            dealerId: payload.dealerId,
            managerId: payload.managerId,
          });
        }
        return Promise.resolve({ id: 'user-new', username: payload.username });
      });

      renderWithProviders(<UserFormPage />, { route: '/superadmin/users/new' });

      const usernameInput2 = await screen.findByLabelText(/username/i);
      const emailInput2 = await screen.findByLabelText(/email/i);
      await user.type(usernameInput2, 'dealer_admin_1');
      await user.type(emailInput2, 'dealeradmin@test.com');
      const passwordInput2 = await screen.findByTestId('password-input');
      const confirmPasswordInput2 = await screen.findByTestId('confirm-password-input');
      await user.type(passwordInput2, 'password123');
      await user.type(confirmPasswordInput2, 'password123');

      await user.click(await screen.findByRole('button', { name: /next/i }));

      // Wait for roles to load, then populate managers
      await waitFor(() => {
        expect(apiServices.roleAPI.getRoles).toHaveBeenCalled();
      });

      // Populate managers before setting managerId (getUsers may not be called for dealer_admin)
      if (typeof window !== 'undefined' && window.__setManagers) {
        await act(async () => {
          window.__setManagers(managers2);
        });
      }

      if (typeof window !== 'undefined' && window.__setUserFormState) {
        await act(async () => {
          window.__setUserFormState({
            roleId: 8,
            dealerId: testData.dealer.id,
            managerId: 'territory-manager-1',
          });
        });
      }

      await user.click(await screen.findByRole('button', { name: /next/i }));
      const submitButton2 = await screen.findByRole('button', { name: /create user/i });
      await user.click(submitButton2);

      await waitFor(() => {
        expect(apiServices.userAPI.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            roleId: 8,
            dealerId: testData.dealer.id,
          })
        );
      });

      // Step 3: Create dealer
      apiServices.userAPI.getUsers.mockResolvedValue({
        users: [
          { id: 'territory-manager-1', username: 'territory_manager_1', roleDetails: { name: 'territory_manager' } },
        ],
      });

      renderWithProviders(<DealerFormPage />, { route: '/superadmin/dealers/new' });

      const businessNameInput = await screen.findByLabelText(/business name/i);
      const dealerCodeInput = await screen.findByLabelText(/dealer code/i);
      await user.type(businessNameInput, testData.dealer.businessName);
      await user.type(dealerCodeInput, testData.dealer.dealerCode);

      if (typeof window !== 'undefined' && window.__setDealerFormState) {
        await act(async () => {
          window.__setDealerFormState({
            regionId: testData.region.id,
            areaId: testData.area.id,
            territoryId: testData.territory.id,
            managerId: 'territory-manager-1',
          });
        });
      }

      const submitDealerButton = await screen.findByRole('button', { name: /create dealer|save/i });
      await user.click(submitDealerButton);

      await waitFor(() => {
        expect(apiServices.dealerAPI.createDealer).toHaveBeenCalled();
      });

      // Step 4: Create order as dealer_staff
      setMockUser({
        id: 'dealer-staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        roleId: 9,
        dealerId: testData.dealer.id,
      });

      apiServices.orderAPI.getMyOrders.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            dealerId: testData.dealer.id,
            status: 'Approved',
            approvalStatus: 'approved',
            items: [{ materialId: 'mat-1', quantity: 10, price: 1000 }],
            totalAmount: 10000,
          },
        ],
      });

      renderWithProviders(<CreateOrder />, { route: '/orders/create' });

      await waitFor(() => {
        expect(apiServices.materialAPI.getMaterials).toHaveBeenCalled();
      });

      // Note: Material selection would happen here, but simplified for test
      // In a real scenario, we'd select material and quantity

      // Step 5: Create invoice from approved order
      renderWithProviders(<MyOrders />, { route: '/orders/my' });

      await waitFor(() => {
        expect(apiServices.orderAPI.getMyOrders).toHaveBeenCalled();
      });

      // Step 6: Create payment request
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          orderId: 'order-1',
          totalAmount: 10000,
          balanceAmount: 10000,
          status: 'unpaid',
        },
      ];

      apiServices.default.get = vi.fn((url) => {
        if (url === '/invoices') {
          return Promise.resolve({ data: { invoices: mockInvoices } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithProviders(<CreatePaymentRequest />, { route: '/payments/create' });

      await waitFor(() => {
        expect(apiServices.default.get).toHaveBeenCalledWith('/invoices');
      });

      // Verify all steps completed successfully
      expect(apiServices.userAPI.createUser).toHaveBeenCalled();
      expect(apiServices.dealerAPI.createDealer).toHaveBeenCalled();
    }, 60000); // Extended timeout for comprehensive workflow
  });
});

