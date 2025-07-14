import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableProperties, ChairProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import viewerStore from '../../stores/viewer.store';

@Component({
  selector: 'app-round-table',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './round-table.component.html',
  styleUrls: []
})
export class RoundTableComponent implements OnInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() radius: number = 50;
  @Input() seats: number = 10;
  @Input() openSpaces: number = 0;
  @Input() name: string = 'Table';
  @Input() tableData!: RoundTableProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  @Input() tableLabelVisible: boolean = true;
  @Input() chairLabelVisible: boolean = true;

  // Internal observable properties that sync with inputs
  public _x: number = 0;
  public _y: number = 0;
  public _radius: number = 50;
  public _seats: number = 10;
  public _openSpaces: number = 0;
  public _name: string = 'Table';
  public _tableData: RoundTableProperties | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;
  public _tableLabelVisible: boolean = true;
  public _chairLabelVisible: boolean = true;

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      tableStyles: computed,
      seatStyles: computed,
      // Internal observable properties
      _x: observable,
      _y: observable,
      _radius: observable,
      _seats: observable,
      _openSpaces: observable,
      _name: observable,
      _tableData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      _tableLabelVisible: observable,
      _chairLabelVisible: observable,
      // Actions
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      x: false,
      y: false,
      radius: false,
      seats: false,
      openSpaces: false,
      name: false,
      tableData: false,
      isSelected: false,
      isPreview: false,
      rotation: false,
      tableLabelVisible: false,
      chairLabelVisible: false,
      class: false,
      // Exclude stores as they are already observable
      store: false,
      viewerStore: false
    });
  }

  // Handle table click for selecting the table
  handleTableClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this._tableData && this._tableData.id) {
      this.store.selectionStore.selectItem(this._tableData);
    }
  }

  ngOnInit() {
    this.syncInputs();

    this.generateChairsIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();

    // Check if properties that affect chair generation have changed
    const seatCountChanged = changes['seats'] || (changes['tableData'] &&
      changes['tableData'].previousValue?.seats !== changes['tableData'].currentValue?.seats);
    const radiusChanged = changes['radius'] || (changes['tableData'] &&
      changes['tableData'].previousValue?.radius !== changes['tableData'].currentValue?.radius);

    if (seatCountChanged || radiusChanged) {
      this.generateChairsIfNeeded(true); // Force regeneration
    }
  }

  @action
  public syncInputs() {
    this._x = this.x;
    this._y = this.y;
    this._radius = this.radius;
    this._seats = this.seats;
    this._openSpaces = this.openSpaces;
    this._name = this.name;
    this._tableData = this.tableData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
    this._tableLabelVisible = this.tableLabelVisible;
    this._chairLabelVisible = this.chairLabelVisible;
  }

  private generateChairsIfNeeded(forceRegenerate: boolean = false) {
    // Generate chairs for this table if they don't exist and this is not a preview
    if (this._tableData && this._tableData.id && !this._isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this._tableData.id);

      const needsRegeneration = forceRegenerate ||
        existingChairs.length === 0 ||
        existingChairs.length !== this._tableData.seats;

      if (needsRegeneration) {

        // Remove existing chairs first
        existingChairs.forEach(chair => {
          this.store.chairStore.removeChair(chair.id);
        });

        // Generate new chairs
        this.store.chairStore.generateChairsForTable(
          this._tableData.id,
          this._tableData.seats,
          this._tableData.radius
        );
      }
    } else {
    }
  }

  get tableStyles() {
    if (this._tableData) {
      return {
        left: `${this._tableData.x}px`,
        top: `${this._tableData.y}px`,
        width: `${this._tableData.radius * 2}px`,
        height: `${this._tableData.radius * 2}px`,
        transform: `translate(-50%, -50%) rotate(${this._rotation || this._tableData.rotation || 0}deg)`
      };
    }

    return {
      left: `${this._x}px`,
      top: `${this._y}px`,
      width: `${this._radius * 2}px`,
      height: `${this._radius * 2}px`,
      transform: `translate(-50%, -50%) rotate(${this._rotation}deg)`
    };
  }

  get seatStyles() {
    const effectiveSeats = this._tableData ? this._tableData.seats : this._seats;
    const effectiveOpenSpaces = this._tableData ? this._tableData.openSpaces : this._openSpaces;
    const effectiveRadius = this._tableData ? this._tableData.radius : this._radius;
    const totalPositions = effectiveSeats + effectiveOpenSpaces;

    const seatsArray = [];
    if (totalPositions === 0) {
      return [];
    }

    const angleStep = 360 / totalPositions;
    const distanceToItemCenter = effectiveRadius + 20;


    for (let i = 0; i < totalPositions; i++) {
      const angleDegrees = angleStep * i;
      const angleRadians = angleDegrees * Math.PI / 180;

      const x = Math.cos(angleRadians) * distanceToItemCenter;
      const y = Math.sin(angleRadians) * distanceToItemCenter;

      const isSeat = i < effectiveSeats;
      const isOpenSpace = i >= effectiveSeats;

      const chairId = `${this._tableData ? this._tableData.id : 'preview'}-chair-${i}`;
      const chair = this._tableData ? this.store.chairStore.chairs.get(chairId) : null;


      seatsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        isOpenSpace: isOpenSpace,
        label: chair ? chair.label : (isSeat ? (i + 1).toString() : null),
        isSelected: chair ? chair.isSelected : false,
        chair: chair
      });
    }

    return seatsArray;
  }

  onChairClick(event: Event, seat: any): void {
    event.stopPropagation();

    if (!seat.isOpenSpace && seat.chair) {

      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;

      this.selectChair(seat.chair, clickX, clickY);
    } else {
    }
  }

  onChairMouseDown(event: Event, seat: any): void {
    event.stopPropagation();

    // Only handle mousedown in editor mode to avoid conflicts with click events in viewer mode
    if (this.viewerStore.isViewerMode) {
      return; // Don't handle mousedown in viewer mode
    }

    if (!seat.isOpenSpace && seat.chair) {

      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;

      this.selectChair(seat.chair, clickX, clickY);
    }
  }

  onChairHover(seat: any): void {
  }

  getSeatClasses(seat: any): string {
    if (!seat.chair) return 'w-5 h-5 bg-gray-200 border border-gray-400';

    const baseClasses = 'w-5 h-5 transition-all duration-200';

    // In viewer mode, show reservation status
    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(seat.chair);

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
    if (seat.isSelected) {
      return `w-6 h-6 bg-blue-500 border-2 border-blue-700 shadow-lg text-white animate-pulse font-bold`;
    }

    return `${baseClasses} bg-blue-200 border border-blue-300 hover:bg-blue-300 hover:scale-105 cursor-pointer`;
  }

  getSeatTitle(seat: any): string {
    if (!seat.chair) return `Seat ${seat.label}`;

    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(seat.chair);
      if (reservationStatus === 'pre-reserved') {
        return `Seat ${seat.label} - Already Reserved (External)`;
      } else if (reservationStatus === 'reserved') {
        return `Seat ${seat.label} - Reserved by ${seat.chair.reservedBy || 'Unknown'}`;
      } else if (reservationStatus === 'selected-for-reservation') {
        return `Seat ${seat.label} - Selected for reservation (Price: $${seat.chair.price})`;
      } else {
        return `Seat ${seat.label} - Available (Price: $${seat.chair.price})`;
      }
    }

    return `Chair ${seat.label} (ID: ${seat.id})`;
  }

  getSeatLabelClasses(seat: any): string {
    if (!seat.chair) return 'text-xs text-gray-700';

    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(seat.chair);
      if (reservationStatus === 'pre-reserved' || reservationStatus === 'reserved' || reservationStatus === 'selected-for-reservation') {
        return 'text-xs text-white font-bold';
      }
      return 'text-xs text-gray-700';
    }

    return seat.isSelected ? 'text-xs text-white font-bold' : 'text-xs text-gray-700';
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
}