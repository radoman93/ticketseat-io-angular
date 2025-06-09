import { makeAutoObservable, action, computed, observable } from 'mobx';
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
  customerInfo: { name: string; email?: string; phone?: string } = { name: '' };
  notifications: Notification[] = [];
  
  constructor() {
    makeAutoObservable(this, {
      selectedSeatsForReservation: observable,
      setMode: action,
      toggleMode: action,
      selectSeatForReservation: action,
      deselectSeatForReservation: action,
      clearSelectedSeats: action,
      reserveSelectedSeats: action,
      updateCustomerInfo: action,
      addNotification: action,
      removeNotification: action,
      clearNotifications: action,
      canReserveSeats: computed,
      isViewerMode: computed,
      isEditorMode: computed,
      selectedSeatsCount: computed
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

  selectSeatForReservation(chairId: string): void {
    if (!this.selectedSeatsForReservation.includes(chairId)) {
      this.selectedSeatsForReservation.push(chairId);
    }
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

  getSeatReservationStatus(chair: Chair): 'free' | 'reserved' | 'selected-for-reservation' {
    if (chair.reservationStatus === 'reserved') return 'reserved';
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
}

// Create and export singleton instance
const viewerStore = new ViewerStore();
export default viewerStore; 