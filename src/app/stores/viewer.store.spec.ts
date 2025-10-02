import { ViewerStore } from './viewer.store';
import { Chair } from '../models/chair.model';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('ViewerStore', () => {
  let store: ViewerStore;
  let mockChairStore: any;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new ViewerStore();
    mockChairStore = {
      chairs: new Map(),
      updateChair: jasmine.createSpy('updateChair')
    };

    // Clear timers after each test
    jasmine.clock().uninstall();
  });

  describe('initialization', () => {
    it('should initialize in editor mode', () => {
      expect(store.currentMode).toBe('editor');
      expect(store.isEditorMode).toBe(true);
      expect(store.isViewerMode).toBe(false);
    });

    it('should initialize with no selected seats', () => {
      expect(store.selectedSeatsForReservation).toEqual([]);
      expect(store.selectedSeatsCount).toBe(0);
    });

    it('should initialize with unlimited seats (0)', () => {
      expect(store.seatLimit).toBe(0);
      expect(store.isSeatLimitReached).toBe(false);
      expect(store.remainingSeats).toBe(Infinity);
    });

    it('should initialize with empty customer info', () => {
      expect(store.customerInfo).toEqual({ name: '' });
    });

    it('should initialize with no notifications', () => {
      expect(store.notifications).toEqual([]);
    });
  });

  describe('mode switching', () => {
    it('should switch to viewer mode', () => {
      store.setMode('viewer');

      expect(store.currentMode).toBe('viewer');
      expect(store.isViewerMode).toBe(true);
      expect(store.isEditorMode).toBe(false);
    });

    it('should toggle between modes', () => {
      expect(store.currentMode).toBe('editor');

      store.toggleMode();
      expect(store.currentMode).toBe('viewer');

      store.toggleMode();
      expect(store.currentMode).toBe('editor');
    });

    it('should clear selections when switching to editor mode', () => {
      store.setMode('viewer');
      store.selectSeatForReservation('seat-1');

      store.setMode('editor');

      expect(store.selectedSeatsForReservation).toEqual([]);
    });

    it('should clear notifications when switching modes', () => {
      store.addNotification({ message: 'Test', type: 'info' });

      store.setMode('viewer');

      expect(store.notifications).toEqual([]);
    });
  });

  describe('seat selection', () => {
    beforeEach(() => {
      store.setMode('viewer');
    });

    it('should select a seat for reservation', () => {
      store.selectSeatForReservation('seat-1');

      expect(store.selectedSeatsForReservation).toContain('seat-1');
      expect(store.selectedSeatsCount).toBe(1);
    });

    it('should not select the same seat twice', () => {
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-1');

      expect(store.selectedSeatsCount).toBe(1);
    });

    it('should select multiple seats', () => {
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');
      store.selectSeatForReservation('seat-3');

      expect(store.selectedSeatsCount).toBe(3);
    });

    it('should not select pre-reserved seat', () => {
      store.setPreReservedSeats(['seat-1']);

      store.selectSeatForReservation('seat-1');

      expect(store.selectedSeatsForReservation).not.toContain('seat-1');
    });

    it('should show notification when trying to select reserved seat', () => {
      store.setPreReservedSeats(['seat-1']);

      store.selectSeatForReservation('seat-1');

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].type).toBe('warning');
      expect(store.notifications[0].message).toContain('already reserved');
    });
  });

  describe('seat deselection', () => {
    beforeEach(() => {
      store.setMode('viewer');
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');
    });

    it('should deselect a seat', () => {
      store.deselectSeatForReservation('seat-1');

      expect(store.selectedSeatsForReservation).not.toContain('seat-1');
      expect(store.selectedSeatsCount).toBe(1);
    });

    it('should handle deselecting non-selected seat', () => {
      expect(() => store.deselectSeatForReservation('seat-99')).not.toThrow();
      expect(store.selectedSeatsCount).toBe(2);
    });
  });

  describe('seat limits', () => {
    beforeEach(() => {
      store.setMode('viewer');
    });

    it('should enforce seat limit', () => {
      store.setSeatLimit(2);

      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');
      store.selectSeatForReservation('seat-3'); // Should be rejected

      expect(store.selectedSeatsCount).toBe(2);
    });

    it('should show notification when limit reached', () => {
      store.setSeatLimit(2);
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');

      store.selectSeatForReservation('seat-3');

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].message).toContain('only select up to 2');
    });

    it('should calculate remaining seats correctly', () => {
      store.setSeatLimit(5);

      expect(store.remainingSeats).toBe(5);

      store.selectSeatForReservation('seat-1');
      expect(store.remainingSeats).toBe(4);

      store.selectSeatForReservation('seat-2');
      expect(store.remainingSeats).toBe(3);
    });

    it('should truncate selection when limit is reduced', () => {
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');
      store.selectSeatForReservation('seat-3');

      store.setSeatLimit(2);

      expect(store.selectedSeatsCount).toBe(2);
      expect(store.selectedSeatsForReservation).toEqual(['seat-1', 'seat-2']);
    });

    it('should handle null limit (unlimited)', () => {
      store.setSeatLimit(null);

      expect(store.isSeatLimitReached).toBe(false);
      expect(store.remainingSeats).toBe(Infinity);
    });

    it('should handle zero limit (unlimited)', () => {
      store.setSeatLimit(0);

      expect(store.isSeatLimitReached).toBe(false);
      expect(store.remainingSeats).toBe(Infinity);
    });
  });

  describe('pre-reserved seats', () => {
    it('should set pre-reserved seats', () => {
      store.setPreReservedSeats(['seat-1', 'seat-2']);

      expect(store.preReservedSeats).toEqual(['seat-1', 'seat-2']);
    });

    it('should check if seat is pre-reserved', () => {
      store.setPreReservedSeats(['seat-1']);

      expect(store.isPreReservedSeat('seat-1')).toBe(true);
      expect(store.isPreReservedSeat('seat-2')).toBe(false);
    });

    it('should remove pre-reserved seats from selection', () => {
      store.setMode('viewer');
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');

      store.setPreReservedSeats(['seat-1']);

      expect(store.selectedSeatsForReservation).not.toContain('seat-1');
      expect(store.selectedSeatsForReservation).toContain('seat-2');
    });
  });

  describe('customer info', () => {
    it('should update customer info', () => {
      store.updateCustomerInfo({ name: 'John Doe' });

      expect(store.customerInfo.name).toBe('John Doe');
    });

    it('should update partial customer info', () => {
      store.updateCustomerInfo({ name: 'John Doe' });
      store.updateCustomerInfo({ email: 'john@example.com' });

      expect(store.customerInfo.name).toBe('John Doe');
      expect(store.customerInfo.email).toBe('john@example.com');
    });
  });

  describe('reservation', () => {
    beforeEach(() => {
      store.setMode('viewer');
      mockChairStore.chairs.set('seat-1', { id: 'seat-1' } as Chair);
      mockChairStore.chairs.set('seat-2', { id: 'seat-2' } as Chair);
    });

    it('should check if can reserve seats', () => {
      expect(store.canReserveSeats).toBe(false);

      store.selectSeatForReservation('seat-1');
      expect(store.canReserveSeats).toBe(false); // No customer name

      store.updateCustomerInfo({ name: 'John Doe' });
      expect(store.canReserveSeats).toBe(true);
    });

    it('should not allow reservation with empty name', () => {
      store.selectSeatForReservation('seat-1');
      store.updateCustomerInfo({ name: '   ' }); // Whitespace only

      expect(store.canReserveSeats).toBe(false);
    });

    it('should reserve selected seats', () => {
      store.selectSeatForReservation('seat-1');
      store.selectSeatForReservation('seat-2');
      store.updateCustomerInfo({ name: 'John Doe' });

      store.reserveSelectedSeats(mockChairStore);

      expect(mockChairStore.updateChair).toHaveBeenCalledWith('seat-1', {
        reservationStatus: 'reserved',
        reservedBy: 'John Doe'
      });
      expect(mockChairStore.updateChair).toHaveBeenCalledWith('seat-2', {
        reservationStatus: 'reserved',
        reservedBy: 'John Doe'
      });
    });

    it('should clear selection after reservation', () => {
      store.selectSeatForReservation('seat-1');
      store.updateCustomerInfo({ name: 'John Doe' });

      store.reserveSelectedSeats(mockChairStore);

      expect(store.selectedSeatsForReservation).toEqual([]);
      expect(store.customerInfo.name).toBe('');
    });

    it('should show success notification after reservation', () => {
      store.selectSeatForReservation('seat-1');
      store.updateCustomerInfo({ name: 'John Doe' });

      store.reserveSelectedSeats(mockChairStore);

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].type).toBe('success');
      expect(store.notifications[0].message).toContain('Successfully reserved');
    });

    it('should not reserve if canReserveSeats is false', () => {
      store.reserveSelectedSeats(mockChairStore);

      expect(mockChairStore.updateChair).not.toHaveBeenCalled();
    });
  });

  describe('seat reservation status', () => {
    const mockChair: Chair = {
      id: 'seat-1',
      tableId: 'table-1',
      label: '1',
      price: 25,
      position: { angle: 0, distance: 50 },
      isSelected: false,
      reservationStatus: 'free'
    };

    it('should return "free" for available seat', () => {
      const status = store.getSeatReservationStatus(mockChair);

      expect(status).toBe('free');
    });

    it('should return "pre-reserved" for externally reserved seat', () => {
      store.setPreReservedSeats(['seat-1']);

      const status = store.getSeatReservationStatus(mockChair);

      expect(status).toBe('pre-reserved');
    });

    it('should return "reserved" for internally reserved seat', () => {
      const reservedChair = { ...mockChair, reservationStatus: 'reserved' } as any;

      const status = store.getSeatReservationStatus(reservedChair);

      expect(status).toBe('reserved');
    });

    it('should return "selected-for-reservation" for selected seat', () => {
      store.setMode('viewer');
      store.selectSeatForReservation('seat-1');

      const status = store.getSeatReservationStatus(mockChair);

      expect(status).toBe('selected-for-reservation');
    });

    it('should prioritize pre-reserved over other statuses', () => {
      store.setMode('viewer');
      store.setPreReservedSeats(['seat-1']);
      store.selectSeatForReservation('seat-1');

      const status = store.getSeatReservationStatus(mockChair);

      expect(status).toBe('pre-reserved');
    });
  });

  describe('notifications', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    it('should add notification', () => {
      store.addNotification({ message: 'Test', type: 'info' });

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].message).toBe('Test');
      expect(store.notifications[0].type).toBe('info');
    });

    it('should auto-remove notification after 3 seconds', () => {
      store.addNotification({ message: 'Test', type: 'info' });
      expect(store.notifications.length).toBe(1);

      jasmine.clock().tick(3000);

      expect(store.notifications.length).toBe(0);
    });

    it('should manually remove notification', () => {
      store.addNotification({ message: 'Test', type: 'info' });
      const id = store.notifications[0].id;

      store.removeNotification(id);

      expect(store.notifications.length).toBe(0);
    });

    it('should clear all notifications', () => {
      store.addNotification({ message: 'Test 1', type: 'info' });
      store.addNotification({ message: 'Test 2', type: 'error' });

      store.clearNotifications();

      expect(store.notifications).toEqual([]);
    });

    it('should assign unique IDs to notifications', () => {
      store.addNotification({ message: 'Test 1', type: 'info' });
      store.addNotification({ message: 'Test 2', type: 'info' });

      const ids = store.notifications.map(n => n.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('should add timestamp to notifications', () => {
      const before = Date.now();
      store.addNotification({ message: 'Test', type: 'info' });
      const after = Date.now();

      const notification = store.notifications[0];
      expect(notification.timestamp).toBeGreaterThanOrEqual(before);
      expect(notification.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      store.setMode('viewer');
    });

    it('should reactively update selectedSeatsCount', () => {
      expect(store.selectedSeatsCount).toBe(0);

      store.selectSeatForReservation('seat-1');
      expect(store.selectedSeatsCount).toBe(1);

      store.selectSeatForReservation('seat-2');
      expect(store.selectedSeatsCount).toBe(2);

      store.deselectSeatForReservation('seat-1');
      expect(store.selectedSeatsCount).toBe(1);
    });

    it('should reactively update isSeatLimitReached', () => {
      store.setSeatLimit(2);

      expect(store.isSeatLimitReached).toBe(false);

      store.selectSeatForReservation('seat-1');
      expect(store.isSeatLimitReached).toBe(false);

      store.selectSeatForReservation('seat-2');
      expect(store.isSeatLimitReached).toBe(true);
    });
  });
});
