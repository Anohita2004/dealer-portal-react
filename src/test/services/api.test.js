import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing API
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Services Structure', () => {
  it('should have userAPI methods defined', async () => {
    const { userAPI } = await import('../../services/api');
    expect(userAPI).toBeDefined();
    expect(userAPI.getUsers).toBeDefined();
    expect(userAPI.createUser).toBeDefined();
    expect(userAPI.updateUser).toBeDefined();
    expect(userAPI.deleteUser).toBeDefined();
  });

  it('should have campaignAPI methods defined', async () => {
    const { campaignAPI } = await import('../../services/api');
    expect(campaignAPI).toBeDefined();
    expect(campaignAPI.getCampaigns).toBeDefined();
    expect(campaignAPI.createCampaign).toBeDefined();
    expect(campaignAPI.updateCampaign).toBeDefined();
    expect(campaignAPI.deleteCampaign).toBeDefined();
  });

  it('should have orderAPI methods defined', async () => {
    const { orderAPI } = await import('../../services/api');
    expect(orderAPI).toBeDefined();
    expect(orderAPI.getAllOrders).toBeDefined();
  });

  it('should have paymentAPI methods defined', async () => {
    const { paymentAPI } = await import('../../services/api');
    expect(paymentAPI).toBeDefined();
    expect(paymentAPI.getAllPayments).toBeDefined();
  });
});
