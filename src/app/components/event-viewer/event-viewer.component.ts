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
      <!-- Viewer Card -->
      <div class="ts-viewer-card">
        <!-- Header -->
        <div class="ts-viewer-header" *ngIf="showReservationPanel">
          <div class="ts-viewer-header-left">
            <div class="ts-viewer-pill">
              {{ getNavigationHint() }}
            </div>
            <h1 class="ts-viewer-title">Select your seats</h1>
          </div>
          <div class="ts-viewer-header-right" *mobxAutorun>
            <div class="ts-viewer-meta">{{ viewerStore.selectedSeatsCount }}{{ getSeatLimitDisplay() }} seats selected</div>
          </div>
        </div>

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

        <!-- Checkout Bar -->
        <div class="ts-viewer-checkout" *ngIf="showReservationPanel">
          <div class="ts-checkout-info">
            <div class="ts-checkout-count">
              {{ viewerStore.selectedSeatsCount }} {{ viewerStore.selectedSeatsCount === 1 ? 'SEAT' : 'SEATS' }}
              <span *ngIf="viewerStore.selectedSeatsCount > 0" class="ts-checkout-ids">
                · {{ getSelectedSeatLabels() }}
              </span>
            </div>
            <div class="ts-checkout-total">\${{ getTotalPrice().toFixed(2) }}</div>
          </div>
          <button class="ts-checkout-btn"
                  [class.ts-checkout-btn-disabled]="viewerStore.selectedSeatsCount === 0"
                  [disabled]="viewerStore.selectedSeatsCount === 0">
            Continue to checkout →
          </button>
        </div>
      </div>

      <!-- Navigation Controls -->
      <app-navigation-controls
        [containerRef]="gridContainer"
        [compact]="isCompactMode">
      </app-navigation-controls>

      <!-- Notifications -->
      <div *ngIf="showReservationPanel">
        <app-notifications></app-notifications>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .ts-viewer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--ts-bg, #F4EFE6);
      font-family: var(--ts-font, 'Inter', system-ui, sans-serif);
      color: var(--ts-ink, #1C160C);
      padding: 24px;
    }

    .ts-viewer-card {
      width: 100%;
      max-width: 1280px;
      background: var(--ts-panel, #FDFBF7);
      border-radius: 16px;
      box-shadow:
        0 1px 0 rgba(28,22,12,0.04),
        0 24px 60px -20px rgba(28,22,12,0.18),
        0 8px 24px -12px rgba(28,22,12,0.08);
      border: 1px solid rgba(28,22,12,0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .ts-viewer-header {
      padding: 28px 36px 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .ts-viewer-header-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ts-viewer-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--ts-panel-alt, #F8F3E8);
      border: 1px solid var(--ts-border, rgba(28,22,12,0.08));
      font-size: 12px;
      color: var(--ts-ink-soft, #5C5446);
      font-weight: 500;
      width: fit-content;
    }

    .ts-viewer-title {
      font-size: 28px;
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.6px;
      margin: 0;
      color: var(--ts-ink, #1C160C);
    }

    .ts-viewer-header-right {
      text-align: right;
      font-size: 13px;
      color: var(--ts-ink-soft, #5C5446);
      line-height: 1.6;
      padding-top: 4px;
    }

    .ts-viewer-meta {
      font-family: var(--ts-mono, 'JetBrains Mono', monospace);
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    /* Layout Area */
    .ts-viewer-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 400px;
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
      padding: 16px 36px;
      border-top: 1px solid var(--ts-border, rgba(28,22,12,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .ts-legend-items {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 12px;
      color: var(--ts-ink-soft, #5C5446);
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

    /* Checkout Bar */
    .ts-viewer-checkout {
      padding: 20px 36px;
      background: var(--ts-panel-alt, #F8F3E8);
      border-top: 1px solid var(--ts-border, rgba(28,22,12,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .ts-checkout-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ts-checkout-count {
      font-family: var(--ts-mono, 'JetBrains Mono', monospace);
      font-size: 11px;
      color: var(--ts-ink-soft, #5C5446);
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .ts-checkout-ids {
      font-weight: 400;
    }

    .ts-checkout-total {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.4px;
    }

    .ts-checkout-btn {
      height: 44px;
      padding: 0 20px;
      border: none;
      border-radius: 8px;
      background: var(--ts-accent, #B8331C);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--ts-font, 'Inter', system-ui, sans-serif);
      box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 4px rgba(184,51,28,0.18);
      transition: background 0.15s, box-shadow 0.15s;
    }

    .ts-checkout-btn:hover {
      background: var(--ts-accent-deep, #962513);
    }

    .ts-checkout-btn-disabled {
      background: var(--ts-seat-avail-edge, #D9CCB0);
      cursor: not-allowed;
      box-shadow: none;
    }

    .ts-checkout-btn-disabled:hover {
      background: var(--ts-seat-avail-edge, #D9CCB0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ts-viewer {
        padding: 12px;
      }

      .ts-viewer-header {
        padding: 20px 20px 16px;
      }

      .ts-viewer-title {
        font-size: 22px;
      }

      .ts-viewer-legend {
        padding: 12px 20px;
      }

      .ts-viewer-checkout {
        padding: 16px 20px;
      }

      .ts-legend-items {
        gap: 12px;
        font-size: 11px;
      }

      .ts-viewer-layout {
        flex-direction: column;
      }

      .ts-checkout-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .ts-viewer-header-right {
        display: none;
      }

      .ts-viewer-pill {
        font-size: 11px;
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
