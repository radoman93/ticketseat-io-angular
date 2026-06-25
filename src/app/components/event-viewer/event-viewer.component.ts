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
    <div class="ts-viewer viewer-mode" *mobxAutorun>
      <!-- Top Toolbar (zoom / navigation) -->
      <app-navigation-controls
        [containerRef]="gridContainer"
        [compact]="isCompactMode">
      </app-navigation-controls>

      <!-- Layout Area -->
      <div #gridContainer class="ts-viewer-layout">
        <div class="ts-viewer-grid-wrap">
          <app-grid></app-grid>
        </div>

        <!-- Reservation Panel (side) -->
        <div class="ts-viewer-reservation" *ngIf="showReservationPanel">
          <app-reservation-panel></app-reservation-panel>
        </div>
      </div>

      <!-- Legend Row -->
      <div class="ts-viewer-legend" *ngIf="showReservationPanel">
        <div class="ts-legend-items">
          <span class="ts-legend-dot">
            <span class="ts-dot ts-dot-avail"></span> Available
          </span>
          <span class="ts-legend-dot">
            <span class="ts-dot ts-dot-selected"></span> Your selection
          </span>
          <span class="ts-legend-dot">
            <span class="ts-dot ts-dot-held"></span> Held
          </span>
          <span class="ts-legend-dot">
            <span class="ts-dot ts-dot-sold"></span> Reserved
          </span>
        </div>
        <div class="ts-hold-pill" *mobxAutorun>
          <span class="ts-hold-indicator"></span>
          {{ viewerStore.selectedSeatsCount }} seat{{ viewerStore.selectedSeatsCount !== 1 ? 's' : '' }} selected
        </div>
      </div>

      <!-- Notifications -->
      <div *ngIf="showReservationPanel">
        <app-notifications></app-notifications>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .ts-viewer {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      font-family: var(--ts-font, 'Inter', system-ui, sans-serif);
      color: var(--ts-ink, #1C160C);
      position: relative;
    }

    /* Layout Area */
    .ts-viewer-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 300px;
    }

    .ts-viewer-grid-wrap {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .ts-viewer-reservation {
      flex-shrink: 0;
    }

    /* Legend Row */
    .ts-viewer-legend {
      padding: 10px 16px;
      border-top: 1px solid var(--ts-border, rgba(28,22,12,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: var(--ts-panel, #FDFBF7);
    }

    .ts-legend-items {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 12px;
      color: var(--ts-ink-soft, #5C5446);
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .ts-legend-items::-webkit-scrollbar {
      display: none;
    }

    .ts-legend-dot {
      white-space: nowrap;
    }

    .ts-legend-dot {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .ts-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .ts-dot-avail {
      background: var(--ts-seat-avail, #E8DCC4);
      border: 1px solid var(--ts-seat-avail-edge, #D9CCB0);
    }

    .ts-dot-selected {
      background: var(--ts-accent, #B8331C);
      border: 1px solid var(--ts-accent-deep, #962513);
    }

    .ts-dot-held {
      background: var(--ts-seat-held, #D89A3C);
      border: 1px solid var(--ts-seat-held-edge, #B07F2A);
    }

    .ts-dot-sold {
      background: var(--ts-seat-sold, #C9C2B5);
      border: 1px solid var(--ts-seat-sold-edge, #B8B0A2);
    }

    .ts-hold-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--ts-accent-soft, #F4DDD4);
      color: var(--ts-accent, #B8331C);
      font-size: 12px;
      font-weight: 500;
    }

    .ts-hold-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ts-accent, #B8331C);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ts-viewer-layout {
        flex-direction: column;
      }

      .ts-viewer-legend {
        padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
        flex-wrap: nowrap;
      }

      .ts-legend-items {
        gap: 12px;
        font-size: 11px;
      }

      .ts-hold-pill {
        flex-shrink: 0;
      }
    }
  `]
})
export class EventViewerComponent implements OnInit, OnChanges, OnDestroy {
  viewerStore = viewerStore;

  @ViewChild('gridContainer') gridContainerRef?: ElementRef<HTMLElement>;

  private selectionReactionDisposer?: () => void;

  isTouchDevice = false;
  isCompactMode = false;

  get gridContainer(): HTMLElement | undefined {
    return this.gridContainerRef?.nativeElement;
  }

  @Input() design?: LayoutExportData | string | null;
  @Input() reservedIds?: string[] | null;
  @Input() seatLimit?: number;
  @Input() showReservationPanel: boolean = false;

  @Output() selectedSeatsChange = new EventEmitter<Chair[]>();
  @Output() designLoadError = new EventEmitter<string>();

  constructor(
    private layoutImportService: LayoutExportImportService,
    private logger: LoggerService
  ) {
    this.viewerStore.setMode('viewer');
  }

  ngOnInit(): void {
    this.loadDesignIfProvided();
    this.setReservedSeatsIfProvided();
    this.setSeatLimitIfProvided();
    this.setupSelectionReaction();
    this.detectTouchDevice();
    this.detectCompactMode();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy(): void {
    if (this.selectionReactionDisposer) {
      this.selectionReactionDisposer();
    }
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
      return 'Drag to pan, pinch to zoom';
    }
    return 'Click seats to select · Drag to pan';
  }

  private setupSelectionReaction(): void {
    this.selectionReactionDisposer = reaction(
      () => this.viewerStore.selectedSeatsForReservation.slice(),
      (selectedSeatIds) => {
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

  getSelectedSeatLabels(): string {
    return this.viewerStore.selectedSeatsForReservation
      .map(id => {
        const chair = rootStore.chairStore.chairs.get(id);
        return chair ? chair.label : id;
      })
      .join(', ');
  }

  getTotalPrice(): number {
    let total = 0;
    this.viewerStore.selectedSeatsForReservation.forEach(seatId => {
      const chair = rootStore.chairStore.chairs.get(seatId);
      if (chair) {
        total += chair.price;
      }
    });
    return total;
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
        if (typeof this.design === 'string') {
          designData = JSON.parse(this.design);
        } else {
          designData = this.design;
        }
        this.layoutImportService.importLayout(designData, 'replace');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error('Failed to load design in viewer', error instanceof Error ? error : new Error(message), { component: 'EventViewerComponent', action: 'loadDesignIfProvided' });
        this.designLoadError.emit(message);
      }
    }
  }

  private setReservedSeatsIfProvided(): void {
    if (this.reservedIds && Array.isArray(this.reservedIds)) {
      this.viewerStore.setPreReservedSeats(this.reservedIds);
    } else {
      this.viewerStore.setPreReservedSeats([]);
    }
  }

  private setSeatLimitIfProvided(): void {
    if (this.seatLimit !== undefined) {
      this.viewerStore.setSeatLimit(this.seatLimit);
    } else {
      this.viewerStore.setSeatLimit(0);
    }
  }

  getSeatLimitDisplay(): string {
    return this.viewerStore.seatLimit && this.viewerStore.seatLimit > 0
      ? ` / ${this.viewerStore.seatLimit}`
      : '';
  }
}
