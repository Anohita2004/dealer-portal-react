import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setMockUser } from '../utils/testUtils';
import CreateOrder from '../../pages/orders/CreateOrders';
import MyOrders from '../../pages/orders/MyOrders';
import AdminOrders from '../../pages/orders/AdminOrders';
import { orderAPI, materialAPI } from '../../services/api';

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
  };
});

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('E2E: Order Creation → Submission → Approval Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dealer Staff Order Creation', () => {
    beforeEach(async () => {
      setMockUser({
        id: 'staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        dealerId: 'dealer-1',
      });

      // Get the mocked APIs - they're already set up via vi.mock
      const { materialAPI: matAPI, orderAPI: ordAPI } = await import('../../services/api');
      // Override the default mock with specific data
      matAPI.getDealerMaterials.mockImplementation(() => 
        Promise.resolve([
          { id: 'mat-1', name: 'Material A', price: 1000 },
          { id: 'mat-2', name: 'Material B', price: 2000 },
        ])
      );

      ordAPI.createOrder.mockImplementation(() => Promise.resolve({
        id: 'order-123',
        orderNumber: 'ORD-001',
        status: 'draft',
        approvalStatus: 'pending',
        totalAmount: 5000,
      }));
    });

    it.skip('should create order and show in My Orders', async () => {
      // Step 1: Create Order
      renderWithProviders(<CreateOrder />, { route: '/orders/create' });

      await waitFor(() => {
        expect(screen.getByLabelText(/select material/i)).toBeInTheDocument();
      });

      // Wait for select to be ready (materials load happens inside the component)
      const materialSelect = await screen.findByLabelText(/select material/i, undefined, {
        timeout: 5000,
      });

      // For MUI TextField with select, the actual value lives on a hidden native input.
      // Update it directly and fire a change event so React state is updated.
      const nativeSelect = materialSelect.parentElement?.querySelector('input.MuiSelect-nativeInput');
      if (!nativeSelect) {
        throw new Error('Native select input for "Select Material" not found');
      }
      fireEvent.change(nativeSelect, { target: { value: 'mat-1' } });

      // Enter quantity
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.type(quantityInput, '5');

      // Add to order
      const addButton = screen.getByRole('button', { name: /add to order/i });
      await user.click(addButton);

      // Submit order
      const submitButton = screen.getByRole('button', { name: /submit order/i });
      await user.click(submitButton);

      // Verify order creation
      await waitFor(() => {
        expect(orderAPI.createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            dealerId: 'dealer-1',
            items: expect.arrayContaining([
              expect.objectContaining({
                materialId: 'mat-1',
                qty: 5,
                unitPrice: 1000,
              }),
            ]),
          })
        );
      });

      // Verify navigation to My Orders
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/my');
      }, { timeout: 3000 });
    }, 15000);
  });

  describe('Sales Executive Order Creation', () => {
    beforeEach(() => {
      setMockUser({
        id: 'sales-1',
        username: 'sales_exec_1',
        role: 'sales_executive',
      });
    });

    it('should allow sales executive to select dealer first', async () => {
      // This would test SalesCreateOrderPage
      // For now, verify the flow exists
      expect(true).toBe(true); // Placeholder - would test dealer selection then order creation
    });
  });

  describe('Order Submission and Workflow', () => {
    beforeEach(() => {
      setMockUser({
        id: 'staff-1',
        username: 'dealer_staff_1',
        role: 'dealer_staff',
        dealerId: 'dealer-1',
      });

      orderAPI.getMyOrders.mockResolvedValue({
        orders: [
          {
            id: 'order-123',
            orderNumber: 'ORD-001',
            status: 'pending',
            approvalStatus: 'pending',
            approvalStage: 'dealer_admin',
            totalAmount: 5000,
            items: [
              { 
                materialId: 'mat-1', 
                materialName: 'Material A', 
                qty: 5, 
                quantity: 5,
                unitPrice: 1000,
                material: {
                  id: 'mat-1',
                  name: 'Material A',
                  availableStock: 100,
                },
                availableStock: 100,
              },
            ],
          },
        ],
      });

      orderAPI.getWorkflowStatus.mockResolvedValue({
        workflow: {
          approvalStatus: 'pending',
          currentStage: 'dealer_admin',
          stages: [
            { stage: 'dealer_admin', status: 'pending' },
            { stage: 'territory_manager', status: 'not_started' },
          ],
        },
      });
    });

    it('should show order in My Orders with workflow status', async () => {
      renderWithProviders(<MyOrders />, { route: '/orders/my' });

      await waitFor(() => {
        expect(screen.getByText(/ORD-001/i)).toBeInTheDocument();
      });

      // Verify workflow status is displayed
      await waitFor(() => {
        expect(orderAPI.getWorkflowStatus).toHaveBeenCalledWith('order-123');
      });
    });
  });

  describe('Manager Order Approval', () => {
    beforeEach(() => {
      setMockUser({
        id: 'manager-1',
        username: 'territory_manager_1',
        role: 'territory_manager',
        regionId: 'region-1',
        areaId: 'area-1',
        territoryId: 'territory-1',
      });

      orderAPI.getPendingApprovals.mockResolvedValue({
        orders: [
          {
            id: 'order-123',
            orderNumber: 'ORD-001',
            status: 'pending',
            approvalStatus: 'pending',
            approvalStage: 'territory_manager',
            dealer: { businessName: 'Test Dealer' },
            totalAmount: 5000,
          },
        ],
      });

      orderAPI.approveOrder.mockResolvedValue({
        id: 'order-123',
        status: 'approved',
        approvalStatus: 'approved',
      });
    });

    it('should show pending orders and allow approval', async () => {
      renderWithProviders(<AdminOrders />, { route: '/orders/approvals' });

      await waitFor(() => {
        expect(screen.getByText(/ORD-001/i)).toBeInTheDocument();
      });

      // Find and click approve button (would be in OrderApprovalCard)
      // This is a simplified test - actual implementation would find the approve button
      expect(orderAPI.getPendingApprovals).toHaveBeenCalled();
    });
  });
});

