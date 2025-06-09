import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import viewerStore from '../../stores/viewer.store';
import { rootStore } from '../../stores/root.store';

@Component({
  selector: 'app-reservation-panel',
  standalone: true,
  imports: [CommonModule, MobxAngularModule, FormsModule],
  template: `
    <div class="w-80 h-full bg-white shadow-lg flex flex-col" *mobxAutorun>
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Seat Reservation</h2>
        <p class="text-sm text-gray-600">Select seats and enter customer details</p>
      </div>

      <!-- Selected Seats Summary -->
      <div class="px-4 py-3 border-b border-gray-100" *ngIf="viewerStore.selectedSeatsCount > 0">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Selected Seats</span>
          <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
            {{ viewerStore.selectedSeatsCount }}
          </span>
        </div>
        
        <!-- List of selected seats -->
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <div *ngFor="let seatId of getSelectedSeats()" 
               class="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
            <span>{{ getSeatDisplayName(seatId) }}</span>
            <button (click)="deselectSeat(seatId)" 
                    class="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        </div>
        
        <button (click)="clearAllSeats()" 
                class="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">
          Clear all selections
        </button>
      </div>

      <!-- Customer Information Form -->
      <div class="flex-1 px-4 py-3 overflow-y-auto">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
        
        <div class="space-y-3">
          <!-- Customer Name (Required) -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Customer Name *
            </label>
            <input type="text" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   [(ngModel)]="viewerStore.customerInfo.name"
                   placeholder="Enter customer name"
                   [class.border-red-300]="!viewerStore.customerInfo.name.trim() && viewerStore.selectedSeatsCount > 0">
          </div>

          <!-- Customer Email (Optional) -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Email (Optional)
            </label>
            <input type="email" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   [(ngModel)]="viewerStore.customerInfo.email"
                   placeholder="customer@example.com">
          </div>

          <!-- Customer Phone (Optional) -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Phone (Optional)
            </label>
            <input type="tel" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   [(ngModel)]="viewerStore.customerInfo.phone"
                   placeholder="(555) 123-4567">
          </div>
        </div>
      </div>

      <!-- Reservation Summary & Action -->
      <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <!-- Pricing Summary -->
        <div class="mb-3" *ngIf="viewerStore.selectedSeatsCount > 0">
          <div class="flex justify-between text-sm">
            <span>{{ viewerStore.selectedSeatsCount }} seat(s)</span>
            <span>\${{ getTotalPrice() }}</span>
          </div>
          <div class="flex justify-between font-medium text-gray-900">
            <span>Total</span>
            <span>\${{ getTotalPrice() }}</span>
          </div>
        </div>

        <!-- Reserve Button -->
        <button (click)="makeReservation()"
                [disabled]="!viewerStore.canReserveSeats"
                class="w-full py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200"
                [class.bg-green-600]="viewerStore.canReserveSeats"
                [class.hover:bg-green-700]="viewerStore.canReserveSeats"
                [class.text-white]="viewerStore.canReserveSeats"
                [class.bg-gray-300]="!viewerStore.canReserveSeats"
                [class.text-gray-500]="!viewerStore.canReserveSeats"
                [class.cursor-not-allowed]="!viewerStore.canReserveSeats">
          {{ getReserveButtonText() }}
        </button>

        <!-- Instructions -->
        <p class="text-xs text-gray-500 mt-2 text-center">
          {{ getInstructionText() }}
        </p>
      </div>
    </div>
  `
})
export class ReservationPanelComponent {
  viewerStore = viewerStore;
  rootStore = rootStore;

  getSelectedSeats(): string[] {
    return Array.from(this.viewerStore.selectedSeatsForReservation);
  }

  getSeatDisplayName(seatId: string): string {
    const chair = this.rootStore.chairStore.chairs.get(seatId);
    if (!chair) return seatId;
    
    // Try to get table/row name and chair label
    const tableElement = this.rootStore.layoutStore.elements.find(e => e.id === chair.tableId);
    const tableName = tableElement?.name || 'Unknown';
    return `${tableName} - Seat ${chair.label}`;
  }

  deselectSeat(seatId: string): void {
    this.viewerStore.deselectSeatForReservation(seatId);
  }

  clearAllSeats(): void {
    this.viewerStore.clearSelectedSeats();
  }

  getTotalPrice(): number {
    let total = 0;
    this.viewerStore.selectedSeatsForReservation.forEach(seatId => {
      const chair = this.rootStore.chairStore.chairs.get(seatId);
      if (chair) {
        total += chair.price;
      }
    });
    return total;
  }

  makeReservation(): void {
    if (this.viewerStore.canReserveSeats) {
      this.viewerStore.reserveSelectedSeats(this.rootStore.chairStore);
    }
  }

  getReserveButtonText(): string {
    if (this.viewerStore.selectedSeatsCount === 0) {
      return 'Select seats to reserve';
    }
    if (!this.viewerStore.customerInfo.name.trim()) {
      return 'Enter customer name';
    }
    return `Reserve ${this.viewerStore.selectedSeatsCount} seat(s)`;
  }

  getInstructionText(): string {
    if (this.viewerStore.selectedSeatsCount === 0) {
      return 'Click on available seats to select them for reservation';
    }
    if (!this.viewerStore.customerInfo.name.trim()) {
      return 'Customer name is required to complete reservation';
    }
    return 'Review details and click Reserve to confirm';
  }
} 