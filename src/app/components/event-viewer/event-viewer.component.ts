import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from '../grid/grid.component';
import { ReservationPanelComponent } from '../reservation-panel/reservation-panel.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { MobxAngularModule } from 'mobx-angular';
import { reaction } from 'mobx';
import viewerStore from '../../stores/viewer.store';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import { LayoutExportImportService, LayoutExportData } from '../../services/layout-export-import.service';

@Component({
  selector: 'app-event-viewer',
  standalone: true,
  imports: [
    CommonModule,
    GridComponent,
    ReservationPanelComponent,
    NotificationsComponent,
    MobxAngularModule
  ],
  template: `
    <div class="flex flex-col h-screen viewer-mode" *mobxAutorun>
      <!-- Viewer Header -->
      <div class="flex flex-row h-12 justify-between items-center px-4 border-b shadow-sm bg-green-50 relative z-10">
        <!-- Logo -->
        <div class="text-lg font-bold text-green-600">TicketSeats Viewer</div>
        
        <!-- Viewer Mode Indicator -->
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span class="text-sm text-green-700 font-medium">Seat Selection & Reservation</span>
        </div>
        
        <!-- Selected Seats Summary -->
        <div class="bg-green-100 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-4" *mobxAutorun>
          <div class="flex items-center gap-2">
            <span class="text-sm text-green-700 font-medium">Selected Seats:</span>
            <span class="bg-green-600 text-white px-2 py-1 rounded-full text-sm font-bold">
              {{ viewerStore.selectedSeatsCount }}{{ getSeatLimitDisplay() }}
            </span>
          </div>
          <div class="text-sm text-green-600">
            {{ getSelectionInstructions() }}
          </div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div class="flex flex-row h-full overflow-hidden">
        <!-- Grid/Layout Area -->
        <div class="flex-1 h-full overflow-hidden">
          <app-grid></app-grid>
        </div>
        
        <!-- Reservation Panel -->
        <div class="h-full">
          <app-reservation-panel></app-reservation-panel>
        </div>
      </div>
      
      <!-- Notifications -->
      <app-notifications></app-notifications>
    </div>
  `,
  styles: [`
    .viewer-mode {
      background-color: #f0fdf4; /* Very light green background */
    }
    
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class EventViewerComponent implements OnInit, OnChanges, OnDestroy {
  viewerStore = viewerStore;

  private selectionReactionDisposer?: () => void;

  @Input() design?: LayoutExportData | string | null;
  @Input() reservedIds?: string[] | null;
  @Input() seatLimit?: number; // New property to limit seat selection

  @Output() selectedSeatsChange = new EventEmitter<Chair[]>(); // Emits selected chair objects

  constructor(private layoutImportService: LayoutExportImportService) {
    // Ensure we're in viewer mode when this component is used
    this.viewerStore.setMode('viewer');
  }

  ngOnInit(): void {
    this.loadDesignIfProvided();
    this.setReservedSeatsIfProvided();
    this.setSeatLimitIfProvided();
    this.setupSelectionReaction();
  }

  ngOnDestroy(): void {
    // Clean up the reaction when component is destroyed
    if (this.selectionReactionDisposer) {
      this.selectionReactionDisposer();
    }
  }

  private setupSelectionReaction(): void {
    // Set up a reaction to emit selected chairs when selection changes
    this.selectionReactionDisposer = reaction(
      () => this.viewerStore.selectedSeatsForReservation.slice(), // Observe the selection array
      (selectedSeatIds) => {
        const selectedChairs = this.getSelectedChairObjects(selectedSeatIds);
        this.selectedSeatsChange.emit(selectedChairs);
      }
    );
  }

  private getSelectedChairObjects(seatIds: string[]): Chair[] {
    return seatIds
      .map(id => rootStore.chairStore.chairs.get(id))
      .filter((chair): chair is Chair => chair !== undefined);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['design'] && !changes['design'].firstChange) {
      this.loadDesignIfProvided();
    }

    if (changes['reservedIds']) {
      this.setReservedSeatsIfProvided();
    }

    if (changes['seatLimit']) {
      this.setSeatLimitIfProvided();
    }
  }

  private loadDesignIfProvided(): void {
    if (this.design) {
      try {
        let designData: LayoutExportData;

        // Handle both string and object inputs
        if (typeof this.design === 'string') {
          designData = JSON.parse(this.design);
        } else {
          designData = this.design;
        }

        // Import the design using the layout import service
        this.layoutImportService.importLayout(designData, 'replace');
        console.log('Design loaded successfully in viewer:', designData.meta.name);
      } catch (error) {
        console.error('Failed to load design in viewer:', error);
      }
    }
  }

  private setReservedSeatsIfProvided(): void {
    if (this.reservedIds && Array.isArray(this.reservedIds)) {
      this.viewerStore.setPreReservedSeats(this.reservedIds);
      console.log('Pre-reserved seats set:', this.reservedIds);
    } else {
      // Clear pre-reserved seats if no IDs provided
      this.viewerStore.setPreReservedSeats([]);
    }
  }

  private setSeatLimitIfProvided(): void {
    if (this.seatLimit !== undefined && this.seatLimit > 0) {
      this.viewerStore.setSeatLimit(this.seatLimit);
      console.log('Seat limit set to:', this.seatLimit);
    } else {
      // Clear seat limit if not provided or invalid
      this.viewerStore.setSeatLimit(null);
    }
  }

  getSelectionInstructions(): string {
    if (this.viewerStore.selectedSeatsCount === 0) {
      const limitText = this.viewerStore.seatLimit
        ? ` (max ${this.viewerStore.seatLimit})`
        : '';
      return `Click on available seats to select them for reservation${limitText}`;
    }

    const remainingText = this.viewerStore.seatLimit
      ? ` (${this.viewerStore.remainingSeats} remaining)`
      : '';
    return `Ready to reserve ${this.viewerStore.selectedSeatsCount} seat(s)${remainingText}`;
  }

  getSeatLimitDisplay(): string {
    return this.viewerStore.seatLimit ? ` / ${this.viewerStore.seatLimit}` : '';
  }
}