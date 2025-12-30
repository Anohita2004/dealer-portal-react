import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Socket.IO client first
const mockSocket = {
  connected: true,
  id: 'test-socket-id',
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Now import and test the actual functions
import {
  joinOrderRoom,
  leaveOrderRoom,
  onTrackingStarted,
  offTrackingStarted,
  onNotification,
  offNotification,
  getSocket,
} from '../../services/socket';

// Mock getSocket to return our mock socket
vi.spyOn({ getSocket }, 'getSocket').mockReturnValue(mockSocket);

describe('Socket Service - Location Tracking Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock socket
    mockSocket.connected = true;
    mockSocket.emit = vi.fn();
    mockSocket.on = vi.fn();
    mockSocket.off = vi.fn();
  });

  describe('joinOrderRoom', () => {
    it('should emit join_order_tracking event', () => {
      // Mock getSocket to return our mock socket
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      
      joinOrderRoom(123);

      expect(mockSocket.emit).toHaveBeenCalledWith('join_order_tracking', { orderId: 123 });
      
      getSocketSpy.mockRestore();
    });

    it('should handle null socket gracefully', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(null);

      expect(() => joinOrderRoom(123)).not.toThrow();
      
      getSocketSpy.mockRestore();
    });
  });

  describe('leaveOrderRoom', () => {
    it('should emit leave_order_tracking event', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      
      leaveOrderRoom(123);

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_order_tracking', { orderId: 123 });
      
      getSocketSpy.mockRestore();
    });
  });

  describe('onTrackingStarted', () => {
    it('should register event listener', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      const callback = vi.fn();
      
      onTrackingStarted(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('order:tracking:started', callback);
      
      getSocketSpy.mockRestore();
    });
  });

  describe('offTrackingStarted', () => {
    it('should remove event listener', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      
      offTrackingStarted();

      expect(mockSocket.off).toHaveBeenCalledWith('order:tracking:started');
      
      getSocketSpy.mockRestore();
    });
  });

  describe('onNotification', () => {
    it('should register notification listener', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      const callback = vi.fn();
      
      onNotification(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('notification', callback);
      
      getSocketSpy.mockRestore();
    });
  });

  describe('offNotification', () => {
    it('should remove notification listener', () => {
      const getSocketSpy = vi.spyOn(require('../../services/socket'), 'getSocket').mockReturnValue(mockSocket);
      
      offNotification();

      expect(mockSocket.off).toHaveBeenCalledWith('notification');
      
      getSocketSpy.mockRestore();
    });
  });
});

