import { makeAutoObservable, action, computed, observable, runInAction } from 'mobx';
import { Chair } from '../models/chair.model';

export type AppMode = 'editor' | 'viewer';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export class ViewerStore {
  currentMode: AppMode = 'editor';
  selectedSeatsForReservation: string[] = [];
  preReservedSeats: string[] = []; // External reserved seat IDs
  customerInfo: { name: string; email?: string; phone?: string } = { name: '' };
  notifications: Notification[] = [];
  seatLimit: number | null = 0; // 0 means unlimited, null means no limit set (same as 0)
  private isUpdatingProgrammatically: boolean = false; // Track if changes are programmatic vs user-initiated

  constructor() {
    makeAutoObservable(this, {
      selectedSeatsForReservation: observable,
      preReservedSeats: observable,
      seatLimit: observable,
      setMode: action,
      toggleMode: action,
      selectSeatForReservation: action,
      deselectSeatForReservation: action,
      clearSelectedSeats: action,
      setPreReservedSeats: action,
      setSeatLimit: action,
      reserveSelectedSeats: action,
      updateCustomerInfo: action,
      addNotification: action,
      removeNotification: action,
      clearNotifications: action,
      canReserveSeats: computed,
      isViewerMode: computed,
      isEditorMode: computed,
      selectedSeatsCount: computed,
      isSeatLimitReached: computed,
      remainingSeats: computed
    });
  }

  get isViewerMode(): boolean {
    return this.currentMode === 'viewer';
  }

  get isEditorMode(): boolean {
    return this.currentMode === 'editor';
  }

  get selectedSeatsCount(): number {
    return this.selectedSeatsForReservation.length;
  }

  get isSeatLimitReached(): boolean {
    if (this.seatLimit === null || this.seatLimit === 0) return false;
    return this.selectedSeatsCount >= this.seatLimit;
  }

  get remainingSeats(): number {
    if (this.seatLimit === null || this.seatLimit === 0) return Infinity;
    return Math.max(0, this.seatLimit - this.selectedSeatsCount);
  }

  get canReserveSeats(): boolean {
    return this.selectedSeatsForReservation.length > 0 && this.customerInfo.name.trim().length > 0;
  }

  setMode(mode: AppMode): void {
    this.currentMode = mode;
    // Clear selections when switching modes
    if (mode === 'editor') {
      this.clearSelectedSeats();
    }
    this.clearNotifications();
  }

  toggleMode(): void {
    this.setMode(this.currentMode === 'editor' ? 'viewer' : 'editor');
  }

  setPreReservedSeats(seatIds: string[]): void {
    runInAction(() => {
      this.preReservedSeats = [...seatIds];
      // Remove any pre-reserved seats from current selection
      // Mark as programmatic update to prevent selectedSeatsChange event emission
      this.isUpdatingProgrammatically = true;
      this.selectedSeatsForReservation = this.selectedSeatsForReservation.filter(
        id => !this.preReservedSeats.includes(id)
      );
      // Reset flag on next tick to ensure the reaction has time to check it
      Promise.resolve().then(() => {
        runInAction(() => {
          this.isUpdatingProgrammatically = false;
        });
      });
    });
  }

  isPreReservedSeat(chairId: string): boolean {
    return this.preReservedSeats.includes(chairId);
  }

  setSeatLimit(limit: number | null): void {
    runInAction(() => {
      this.seatLimit = limit;

      // If setting a limit > 0 and current selection exceeds it, truncate selection
      if (limit !== null && limit > 0 && this.selectedSeatsForReservation.length > limit) {
        // Keep only the first 'limit' number of selected seats
        // Mark as programmatic update to prevent selectedSeatsChange event emission
        this.isUpdatingProgrammatically = true;
        this.selectedSeatsForReservation = this.selectedSeatsForReservation.slice(0, limit);
        this.addNotification({
          message: `Selection reduced to ${limit} seat(s) due to seat limit`,
          type: 'info'
        });
        // Reset flag on next tick to ensure the reaction has time to check it
        Promise.resolve().then(() => {
          runInAction(() => {
            this.isUpdatingProgrammatically = false;
          });
        });
      }
    });
  }

  selectSeatForReservation(chairId: string): void {
    // Don't allow selection of pre-reserved seats
    if (this.isPreReservedSeat(chairId)) {
      this.showReservedSeatFeedback();
      return;
    }

    // Check if seat is already selected
    if (this.selectedSeatsForReservation.includes(chairId)) {
      return; // Already selected
    }

    // Check seat limit before adding (only if limit > 0)
    if (this.seatLimit !== null && this.seatLimit > 0 && this.selectedSeatsCount >= this.seatLimit) {
      this.showSeatLimitReachedFeedback();
      return;
    }

    // Add seat to selection
    this.selectedSeatsForReservation.push(chairId);
  }

  deselectSeatForReservation(chairId: string): void {
    const index = this.selectedSeatsForReservation.indexOf(chairId);
    if (index > -1) {
      this.selectedSeatsForReservation.splice(index, 1);
    }
  }

  clearSelectedSeats(): void {
    this.selectedSeatsForReservation.length = 0;
  }

  get isProgrammaticUpdate(): boolean {
    return this.isUpdatingProgrammatically;
  }

  updateCustomerInfo(info: Partial<{ name: string; email?: string; phone?: string }>): void {
    this.customerInfo = { ...this.customerInfo, ...info };
  }

  reserveSelectedSeats(chairStore: any): void {
    if (!this.canReserveSeats) return;

    // Update chairs with reservation status
    this.selectedSeatsForReservation.forEach(chairId => {
      const chair = chairStore.chairs.get(chairId);
      if (chair) {
        chairStore.updateChair(chairId, {
          reservationStatus: 'reserved' as const,
          reservedBy: this.customerInfo.name
        });
      }
    });

    // Show success notification
    this.addNotification({
      message: `Successfully reserved ${this.selectedSeatsForReservation.length} seat(s) for ${this.customerInfo.name}`,
      type: 'success'
    });

    // Clear selections and customer info after reservation
    this.clearSelectedSeats();
    this.customerInfo = { name: '' };
  }

  isSeatSelectedForReservation(chairId: string): boolean {
    return this.selectedSeatsForReservation.includes(chairId);
  }

  getSeatReservationStatus(chair: Chair): 'free' | 'reserved' | 'selected-for-reservation' | 'pre-reserved' {
    // Check if seat is pre-reserved first (external reservation)
    if (this.isPreReservedSeat(chair.id)) return 'pre-reserved';

    // Check internal reservation status
    if (chair.reservationStatus === 'reserved') return 'reserved';

    // Check if currently selected for reservation
    if (this.isSeatSelectedForReservation(chair.id)) return 'selected-for-reservation';

    return 'free';
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    this.notifications.push(newNotification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.removeNotification(newNotification.id);
    }, 3000);
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  // Helper method to show reserved seat feedback
  showReservedSeatFeedback(): void {
    this.addNotification({
      message: 'This seat is already reserved and cannot be selected',
      type: 'warning'
    });
  }

  // Helper method to show seat limit reached feedback
  showSeatLimitReachedFeedback(): void {
    this.addNotification({
      message: `You can only select up to ${this.seatLimit} seat(s) for reservation`,
      type: 'warning'
    });
  }
}

// Create and export singleton instance
const viewerStore = new ViewerStore();
export default viewerStore;