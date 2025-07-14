import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { SeatingRowProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import viewerStore from '../../stores/viewer.store';

@Component({
  selector: 'app-seating-row',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './seating-row.component.html',
  styleUrls: []
})
export class SeatingRowComponent implements OnInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() endX: number = 100;
  @Input() endY: number = 0;
  @Input() seatCount: number = 5;
  @Input() seatSpacing: number = 35;
  @Input() name: string = 'Row';
  @Input() seatingRowData!: SeatingRowProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  @Input() chairLabelVisible: boolean = true;
  @Input() rowLabelVisible: boolean = true;

  // Internal observable properties that sync with inputs
  public _x: number = 0;
  public _y: number = 0;
  public _endX: number = 100;
  public _endY: number = 0;
  public _seatCount: number = 5;
  public _seatSpacing: number = 35;
  public _name: string = 'Row';
  public _seatingRowData: SeatingRowProperties | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;
  public _chairLabelVisible: boolean = true;
  public _rowLabelVisible: boolean = true;

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      seatingRowStyles: computed,
      chairStyles: computed,
      rowLength: computed,
      rowAngle: computed,
      isEffectivePreview: computed,
      // Internal observable properties
      _x: observable,
      _y: observable,
      _endX: observable,
      _endY: observable,
      _seatCount: observable,
      _seatSpacing: observable,
      _name: observable,
      _seatingRowData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      _chairLabelVisible: observable,
      _rowLabelVisible: observable,
      // Actions
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      x: false,
      y: false,
      endX: false,
      endY: false,
      seatCount: false,
      seatSpacing: false,
      name: false,
      seatingRowData: false,
      isSelected: false,
      isPreview: false,
      rotation: false,
      chairLabelVisible: false,
      rowLabelVisible: false,
      class: false,
      // Exclude stores as they are already observable
      store: false,
      viewerStore: false
    });
  }

  ngOnInit() {
    this.syncInputs();


    // Generate chairs for this seating row if they don't exist and this is not a preview
    if (this._seatingRowData && this._seatingRowData.id && !this._isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this._seatingRowData.id);

      if (existingChairs.length === 0) {
        this.generateChairsForSeatingRow();
      }
    } else {
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
  }

  @action
  public syncInputs() {
    this._x = this.x;
    this._y = this.y;
    this._endX = this.endX;
    this._endY = this.endY;
    this._seatCount = this.seatCount;
    this._seatSpacing = this.seatSpacing;
    this._name = this.name;
    this._seatingRowData = this.seatingRowData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
    this._chairLabelVisible = this.chairLabelVisible;
    this._rowLabelVisible = this.rowLabelVisible;
  }

  get seatingRowStyles() {
    // Position the seating row container at the start point
    if (this._seatingRowData) {
      return {
        left: `${this._seatingRowData.x}px`,
        top: `${this._seatingRowData.y}px`,
        transform: `rotate(${this._rotation || this._seatingRowData.rotation || 0}deg)`,
        transformOrigin: '0 0'
      };
    }

    return {
      left: `${this._x}px`,
      top: `${this._y}px`,
      transform: `rotate(${this._rotation}deg)`,
      transformOrigin: '0 0'
    };
  }

  get rowLength(): number {
    const effectiveX = this._seatingRowData ? this._seatingRowData.x : this._x;
    const effectiveY = this._seatingRowData ? this._seatingRowData.y : this._y;
    const effectiveEndX = this._seatingRowData ? this._seatingRowData.endX : this._endX;
    const effectiveEndY = this._seatingRowData ? this._seatingRowData.endY : this._endY;

    const dx = effectiveEndX - effectiveX;
    const dy = effectiveEndY - effectiveY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get rowAngle(): number {
    const effectiveX = this._seatingRowData ? this._seatingRowData.x : this._x;
    const effectiveY = this._seatingRowData ? this._seatingRowData.y : this._y;
    const effectiveEndX = this._seatingRowData ? this._seatingRowData.endX : this._endX;
    const effectiveEndY = this._seatingRowData ? this._seatingRowData.endY : this._endY;

    const dx = effectiveEndX - effectiveX;
    const dy = effectiveEndY - effectiveY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  get chairStyles() {
    const effectiveSeatCount = this._seatingRowData ? this._seatingRowData.seatCount : this._seatCount;
    const effectiveSeatSpacing = this._seatingRowData ? this._seatingRowData.seatSpacing : this._seatSpacing;

    const chairsArray = [];


    // Handle special case for zero seats
    if (effectiveSeatCount <= 0) {
      return [];
    }

    // Calculate seat positions with consistent spacing
    for (let i = 0; i < effectiveSeatCount; i++) {
      // Position seats with exact spacing
      let x = i * effectiveSeatSpacing;

      // In preview mode, only center if it's a single chair
      if (this.isEffectivePreview && effectiveSeatCount === 1) {
        x = -2.5; // Center the single preview chair
      }

      const y = 0; // All seats are on the same line (rotation handled by container)

      const chairId = `${this._seatingRowData ? this._seatingRowData.id : 'preview'}-chair-${i}`;
      const chair = this._seatingRowData ? this.store.chairStore.chairs.get(chairId) : null;

      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : (i + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        index: i,
        isPreview: this.isEffectivePreview
      });
    }

    return chairsArray;
  }

  getLabelLeftPosition(): number {
    const effectiveSeatCount = this._seatingRowData ? this._seatingRowData.seatCount : this._seatCount;
    const effectiveSeatSpacing = this._seatingRowData ? this._seatingRowData.seatSpacing : this._seatSpacing;
    const labelPosition = this._seatingRowData?.labelPosition || 'left';

    // Calculate total row width (along the local x-axis)
    const totalRowWidth = (effectiveSeatCount - 1) * effectiveSeatSpacing;

    switch (labelPosition) {
      case 'left':
        // Position label to the left of the first seat
        return -60; // Fixed position to the left
      case 'center':
        // Position label at the center of the row
        return totalRowWidth / 2 - 20; // Center minus half label width estimate
      case 'right':
        // Position label to the right of the last seat
        return totalRowWidth + 30; // Position to the right of last seat
      default:
        return -60; // Default to left
    }
  }

  getRowWidth(): number {
    const effectiveSeatCount = this._seatingRowData ? this._seatingRowData.seatCount : this._seatCount;
    const effectiveSeatSpacing = this._seatingRowData ? this._seatingRowData.seatSpacing : this._seatSpacing;

    // Use exact chair spacing for consistent width
    if (effectiveSeatCount <= 1) {
      return 20; // Just the chair width for a single seat
    }

    // Calculate the distance from first to last chair and add chair width
    return (effectiveSeatCount - 1) * effectiveSeatSpacing + 5; // Add 5px for the chair display
  }

  private generateChairsForSeatingRow(): void {
    if (!this._seatingRowData) return;

    const totalChairs = this._seatingRowData.seatCount;


    // Generate chairs for the seating row
    for (let i = 0; i < totalChairs; i++) {
      const chair: Chair = {
        id: `${this._seatingRowData.id}-chair-${i}`,
        tableId: this._seatingRowData.id,
        label: (i + 1).toString(),
        price: 0,
        position: {
          angle: 0, // Not used for seating rows
          distance: 0 // Not used for seating rows
        },
        isSelected: false
      };
      this.store.chairStore.addChair(chair);
    }
  }

  onChairClick(event: Event, chair: any): void {
    event.stopPropagation();
    if (this.isEffectivePreview || !chair || !chair.chair) return;

    this.selectChair(chair.chair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
  }

  onChairMouseDown(event: Event, chair: any): void {
    event.stopPropagation();
    if (this.isEffectivePreview || !chair || !chair.chair) return;

    // Only handle mousedown in editor mode to avoid conflicts with click events in viewer mode
    if (this.viewerStore.isViewerMode) {
      return; // Don't handle mousedown in viewer mode
    }

    this.selectChair(chair.chair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
  }

  onChairHover(chair: any): void {
    if (this.isEffectivePreview || !chair) return;
    // Can add hover effects here if needed
  }

  getChairClasses(chair: any): string {
    if (!chair) return '';

    const baseClasses = 'w-5 h-5 transition-all duration-200';

    if (this.isEffectivePreview) {
      return `${baseClasses} bg-blue-300 border border-blue-400`;
    }

    // In viewer mode, show reservation status
    if (this.viewerStore.isViewerMode && chair.chair) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chair.chair);

      if (reservationStatus === 'pre-reserved') {
        return `${baseClasses} bg-red-600 text-white cursor-not-allowed border-2 border-red-800 shadow-md`;
      } else if (reservationStatus === 'reserved') {
        return `${baseClasses} bg-red-500 text-white cursor-not-allowed border-2 border-red-600 shadow-md`;
      } else if (reservationStatus === 'selected-for-reservation') {
        return `w-6 h-6 bg-green-500 border-2 border-green-700 shadow-lg text-white animate-pulse font-bold`;
      } else {
        return `${baseClasses} bg-gray-200 border border-gray-400 hover:bg-green-200 hover:border-green-400 cursor-pointer hover:scale-105 hover:shadow-md`;
      }
    }

    // In editor mode, show selection status
    if (chair.isSelected) {
      return `w-6 h-6 bg-blue-500 border-2 border-blue-700 shadow-lg text-white animate-pulse font-bold`;
    }

    return `${baseClasses} bg-blue-200 border border-blue-300 hover:bg-blue-300 hover:scale-105 cursor-pointer`;
  }

  getSeatTitle(chair: any): string {
    if (!chair || !chair.chair) return `Seat ${chair?.label || ''}`;

    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chair.chair);
      if (reservationStatus === 'pre-reserved') {
        return `Seat ${chair.label} - Already Reserved (External)`;
      } else if (reservationStatus === 'reserved') {
        return `Seat ${chair.label} - Reserved by ${chair.chair.reservedBy || 'Unknown'}`;
      } else if (reservationStatus === 'selected-for-reservation') {
        return `Seat ${chair.label} - Selected for reservation (Price: $${chair.chair.price})`;
      } else {
        return `Seat ${chair.label} - Available (Price: $${chair.chair.price})`;
      }
    }

    return `Chair ${chair.label} (ID: ${chair.id})`;
  }

  getSeatLabelClasses(chair: any): string {
    if (!chair || !chair.chair) return 'text-xs text-gray-700';

    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chair.chair);
      if (reservationStatus === 'pre-reserved' || reservationStatus === 'reserved' || reservationStatus === 'selected-for-reservation') {
        return 'text-xs text-white font-bold drop-shadow-sm';
      }
      return 'text-xs text-gray-700';
    }

    return chair.isSelected ? 'text-xs text-white font-bold drop-shadow-sm' : 'text-xs text-gray-700';
  }

  private selectChair(chair: Chair, clickX?: number, clickY?: number): void {
    // Handle viewer mode seat selection for reservations
    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chair);

      // Don't allow selection of pre-reserved or already reserved seats
      if (reservationStatus === 'pre-reserved' || reservationStatus === 'reserved') {
        this.viewerStore.showReservedSeatFeedback();
        return;
      }

      // Toggle seat selection for reservation
      if (this.viewerStore.isSeatSelectedForReservation(chair.id)) {
        this.viewerStore.deselectSeatForReservation(chair.id);
      } else {
        this.viewerStore.selectSeatForReservation(chair.id);
      }
      return;
    }

    // Handle editor mode selection
    if (this.store.chairStore.selectedChairId && this.store.chairStore.selectedChairId !== chair.id) {
      this.store.chairStore.deselectChair();
    }

    // Set panel position if click coordinates provided
    if (clickX !== undefined && clickY !== undefined) {
      // Add offset to position panel next to the chair, not over it
      const offsetX = clickX + 20;
      const offsetY = clickY - 100; // Position above the click
      this.store.chairStore.setPanelPosition(offsetX, offsetY);
    }

    if (chair.isSelected) {
      this.store.chairStore.deselectChair();
    } else {
      this.store.chairStore.selectChair(chair.id);
    }
  }

  // Helper getter to simplify HTML templates
  get isEffectivePreview(): boolean {
    return this._isPreview || (this._seatingRowData ? !!this._seatingRowData.isPreview : false);
  }
} 