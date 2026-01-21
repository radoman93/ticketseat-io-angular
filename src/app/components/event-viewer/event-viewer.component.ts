import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from '../grid/grid.component';
import { ReservationPanelComponent } from '../reservation-panel/reservation-panel.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { NavigationControlsComponent } from '../navigation-controls/navigation-controls.component';
import { MobxAngularModule } from 'mobx-angular';
import { reaction } from 'mobx';
import viewerStore from '../../stores/viewer.store';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import { LayoutExportImportService, LayoutExportData } from '../../services/layout-export-import.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-event-viewer',
  standalone: true,
  imports: [
    CommonModule,
    GridComponent,
    ReservationPanelComponent,
    NotificationsComponent,
    NavigationControlsComponent,
    MobxAngularModule
  ],
  template: `
    <div class="flex flex-col h-screen viewer-mode" *mobxAutorun>
      <!-- Viewer Header -->

      <div *ngIf="showReservationPanel" class="viewer-header flex flex-row h-12 justify-between items-center px-4 border-b shadow-sm bg-green-50 relative z-10">
        <!-- Logo -->
        <div class="text-lg font-bold text-green-600 logo-text">TicketSeats Viewer</div>

        <!-- Viewer Mode Indicator - Hidden on very small screens -->
        <div class="flex items-center gap-2 mode-indicator">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span class="text-sm text-green-700 font-medium">Seat Selection & Reservation</span>
          <span class="text-xs text-green-600 ml-2 nav-hint">{{ getNavigationHint() }}</span>
        </div>

        <!-- Selected Seats Summary -->
        <div class="bg-green-100 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-4 seats-summary" *mobxAutorun>
          <div class="flex items-center gap-2">
            <span class="text-sm text-green-700 font-medium seats-label">Selected Seats:</span>
            <span class="bg-green-600 text-white px-2 py-1 rounded-full text-sm font-bold">
              {{ viewerStore.selectedSeatsCount }}{{ getSeatLimitDisplay() }}
            </span>
          </div>
          <div class="text-sm text-green-600 instructions-text">
            {{ getSelectionInstructions() }}
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div #gridContainer class="flex flex-row h-full overflow-hidden">
        <!-- Grid/Layout Area -->
        <div class="flex-1 h-full overflow-hidden">
          <app-grid></app-grid>
        </div>

        <!-- Reservation Panel -->
        <div class="h-full" *ngIf="showReservationPanel">
          <app-reservation-panel></app-reservation-panel>
        </div>
      </div>

      <!-- Navigation Controls - Always visible -->
      <app-navigation-controls
        [containerRef]="gridContainer"
        [compact]="isCompactMode">
      </app-navigation-controls>

      <!-- Notifications -->
       <div class="h-full" *ngIf="showReservationPanel">
      <app-notifications></app-notifications>
      <div></div>
    </div>
  `,
  styles: [`
    .viewer-mode {
      background-color: #f0fdf4; /* Very light green background */
    }

    .viewer-mode .table-container {
      cursor: grab;
    }

    .viewer-mode .table-container:active {
      cursor: grabbing;
    }

    :host {
      display: block;
      height: 100%;
    }

    /* Responsive header styles */
    .viewer-header {
      flex-wrap: wrap;
      gap: 8px;
      min-height: 48px;
      height: auto;
      padding: 8px 16px;
    }

    .mode-indicator {
      display: flex;
    }

    .nav-hint {
      display: inline;
    }

    .instructions-text {
      display: block;
    }

    /* Tablet styles */
    @media (max-width: 1024px) {
      .instructions-text {
        display: none;
      }
    }

    /* Mobile styles */
    @media (max-width: 768px) {
      .viewer-header {
        justify-content: space-between;
        padding: 8px 12px;
      }

      .logo-text {
        font-size: 14px;
      }

      .mode-indicator {
        display: none;
      }

      .seats-summary {
        padding: 6px 12px;
        gap: 8px;
      }

      .seats-label {
        display: none;
      }
    }

    /* Very small screens */
    @media (max-width: 375px) {
      .viewer-header {
        padding: 6px 8px;
      }

      .logo-text {
        font-size: 12px;
      }

      .seats-summary {
        padding: 4px 8px;
      }
    }
  `]
})
export class EventViewerComponent implements OnInit, OnChanges, OnDestroy {
  viewerStore = viewerStore;

  @ViewChild('gridContainer') gridContainerRef?: ElementRef<HTMLElement>;

  private selectionReactionDisposer?: () => void;

  // Touch device detection
  isTouchDevice = false;
  isCompactMode = false;

  // Getter for grid container element
  get gridContainer(): HTMLElement | undefined {
    return this.gridContainerRef?.nativeElement;
  }

  @Input() design?: LayoutExportData | string | null;
  @Input() reservedIds?: string[] | null;
  @Input() seatLimit?: number; // New property to limit seat selection
  @Input() showReservationPanel: boolean = false; // Control reservation panel visibility

  @Output() selectedSeatsChange = new EventEmitter<Chair[]>(); // Emits selected chair objects

  constructor(
    private layoutImportService: LayoutExportImportService,
    private logger: LoggerService
  ) {
    // Ensure we're in viewer mode when this component is used
    this.viewerStore.setMode('viewer');
  }

  ngOnInit(): void {
    this.loadDesignIfProvided();
    this.setReservedSeatsIfProvided();
    this.setSeatLimitIfProvided();
    this.setupSelectionReaction();
    this.detectTouchDevice();
    this.detectCompactMode();

    // Listen for window resize to update compact mode
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy(): void {
    // Clean up the reaction when component is destroyed
    if (this.selectionReactionDisposer) {
      this.selectionReactionDisposer();
    }

    // Clean up resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private detectTouchDevice(): void {
    this.isTouchDevice = 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;
  }

  private detectCompactMode(): void {
    this.isCompactMode = window.innerWidth < 768;
  }

  private handleResize(): void {
    this.detectCompactMode();
  }

  getNavigationHint(): string {
    if (this.isTouchDevice) {
      return '• Drag to pan, pinch to zoom';
    }
    return '• Drag to pan view';
  }

  private setupSelectionReaction(): void {
    // Set up a reaction to emit selected chairs when selection changes
    this.selectionReactionDisposer = reaction(
      () => this.viewerStore.selectedSeatsForReservation.slice(), // Observe the selection array
      (selectedSeatIds) => {
        // Only emit if the change is user-initiated, not programmatic
        if (!this.viewerStore.isProgrammaticUpdate) {
          const selectedChairs = this.getSelectedChairObjects(selectedSeatIds);
          this.selectedSeatsChange.emit(selectedChairs);
        }
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
      } catch (error) {
        this.logger.error('Failed to load design in viewer', error instanceof Error ? error : new Error(String(error)), { component: 'EventViewerComponent', action: 'loadDesignIfProvided' });
      }
    }
  }

  private setReservedSeatsIfProvided(): void {
    if (this.reservedIds && Array.isArray(this.reservedIds)) {
      this.viewerStore.setPreReservedSeats(this.reservedIds);
    } else {
      // Clear pre-reserved seats if no IDs provided
      this.viewerStore.setPreReservedSeats([]);
    }
  }

  private setSeatLimitIfProvided(): void {
    if (this.seatLimit !== undefined) {
      this.viewerStore.setSeatLimit(this.seatLimit);
      if (this.seatLimit === 0) {
      } else {
      }
    } else {
      // Default to unlimited (0) if not provided
      this.viewerStore.setSeatLimit(0);
    }
  }

  getSelectionInstructions(): string {
    const tapOrClick = this.isTouchDevice ? 'Tap' : 'Click';
    const navigationHint = this.isTouchDevice
      ? 'Drag to pan, pinch to zoom.'
      : 'Drag to pan view, scroll to zoom.';

    if (this.viewerStore.selectedSeatsCount === 0) {
      const limitText = this.viewerStore.seatLimit && this.viewerStore.seatLimit > 0
        ? ` (max ${this.viewerStore.seatLimit})`
        : '';
      return `${tapOrClick} on available seats to select them for reservation${limitText}. ${navigationHint}`;
    }

    const remainingText = this.viewerStore.seatLimit && this.viewerStore.seatLimit > 0
      ? ` (${this.viewerStore.remainingSeats} remaining)`
      : '';
    return `Ready to reserve ${this.viewerStore.selectedSeatsCount} seat(s)${remainingText}. ${navigationHint}`;
  }

  getSeatLimitDisplay(): string {
    return this.viewerStore.seatLimit && this.viewerStore.seatLimit > 0
      ? ` / ${this.viewerStore.seatLimit}`
      : '';
  }
}