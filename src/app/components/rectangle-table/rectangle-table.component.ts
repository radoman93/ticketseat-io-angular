import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RectangleTableProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import viewerStore from '../../stores/viewer.store';

@Component({
  selector: 'app-rectangle-table',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './rectangle-table.component.html',
  styleUrls: []
})
export class RectangleTableComponent implements OnInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() width: number = 120;
  @Input() height: number = 80;
  @Input() upChairs: number = 4;
  @Input() downChairs: number = 4;
  @Input() leftChairs: number = 0;
  @Input() rightChairs: number = 0;
  @Input() name: string = 'Table';
  @Input() tableData!: RectangleTableProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  @Input() tableLabelVisible: boolean = true;
  @Input() chairLabelVisible: boolean = true;
  
  // Internal observable properties that sync with inputs
  public _x: number = 0;
  public _y: number = 0;
  public _width: number = 120;
  public _height: number = 80;
  public _upChairs: number = 4;
  public _downChairs: number = 4;
  public _leftChairs: number = 0;
  public _rightChairs: number = 0;
  public _name: string = 'Table';
  public _tableData: RectangleTableProperties | null = null;
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
      chairStyles: computed,
      totalChairs: computed,
      // Internal observable properties
      _x: observable,
      _y: observable,
      _width: observable,
      _height: observable,
      _upChairs: observable,
      _downChairs: observable,
      _leftChairs: observable,
      _rightChairs: observable,
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
      width: false,
      height: false,
      upChairs: false,
      downChairs: false,
      leftChairs: false,
      rightChairs: false,
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

  ngOnInit() {
    this.syncInputs();
    
    this.generateChairsIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
    
    // Check if properties that affect chair generation have changed
    const chairCountChanged = changes['upChairs'] || changes['downChairs'] || 
      changes['leftChairs'] || changes['rightChairs'] ||
      (changes['tableData'] && this.hasChairCountChanged(changes['tableData'].previousValue, changes['tableData'].currentValue));
    
    if (chairCountChanged) {
      this.generateChairsIfNeeded(true); // Force regeneration
    }
  }

  @action
  public syncInputs() {
    this._x = this.x;
    this._y = this.y;
    this._width = this.width;
    this._height = this.height;
    this._upChairs = this.upChairs;
    this._downChairs = this.downChairs;
    this._leftChairs = this.leftChairs;
    this._rightChairs = this.rightChairs;
    this._name = this.name;
    this._tableData = this.tableData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
    this._tableLabelVisible = this.tableLabelVisible;
    this._chairLabelVisible = this.chairLabelVisible;
  }

  private hasChairCountChanged(prev: RectangleTableProperties, curr: RectangleTableProperties): boolean {
    if (!prev || !curr) return false;
    return prev.upChairs !== curr.upChairs ||
           prev.downChairs !== curr.downChairs ||
           prev.leftChairs !== curr.leftChairs ||
           prev.rightChairs !== curr.rightChairs;
  }

  private generateChairsIfNeeded(forceRegenerate: boolean = false) {
    // Generate chairs for this rectangle table if they don't exist and this is not a preview
    if (this._tableData && this._tableData.id && !this._isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this._tableData.id);
      
      const needsRegeneration = forceRegenerate || 
        existingChairs.length === 0 || 
        existingChairs.length !== this.totalChairs;
      
      if (needsRegeneration) {
        
        // Remove existing chairs first
        existingChairs.forEach(chair => {
          this.store.chairStore.removeChair(chair.id);
        });
        
        // Generate new chairs
        this.generateChairsForRectangleTable();
      }
    } else {
    }
  }

  get tableStyles() {
    if (this._tableData) {
      return {
        left: `${this._tableData.x}px`,
        top: `${this._tableData.y}px`,
        width: `${this._tableData.width}px`,
        height: `${this._tableData.height}px`,
        transform: `translate(-50%, -50%) rotate(${this._rotation || this._tableData.rotation || 0}deg)`
      };
    }
    
    return {
      left: `${this._x}px`,
      top: `${this._y}px`,
      width: `${this._width}px`,
      height: `${this._height}px`,
      transform: `translate(-50%, -50%) rotate(${this._rotation}deg)`
    };
  }

  get totalChairs(): number {
    if (this._tableData) {
      return (this._tableData.upChairs || 0) + (this._tableData.downChairs || 0) + 
             (this._tableData.leftChairs || 0) + (this._tableData.rightChairs || 0);
    }
    return this._upChairs + this._downChairs + this._leftChairs + this._rightChairs;
  }

  get chairStyles() {
    const effectiveWidth = this._tableData ? this._tableData.width : this._width;
    const effectiveHeight = this._tableData ? this._tableData.height : this._height;
    const effectiveUpChairs = this._tableData ? this._tableData.upChairs : this._upChairs;
    const effectiveDownChairs = this._tableData ? this._tableData.downChairs : this._downChairs;
    const effectiveLeftChairs = this._tableData ? this._tableData.leftChairs : this._leftChairs;
    const effectiveRightChairs = this._tableData ? this._tableData.rightChairs : this._rightChairs;
    
    const chairsArray = [];
    const chairOffset = 25; // Distance from table edge
    let chairIndex = 0;
    
    
    // Top chairs (up)
    for (let i = 0; i < effectiveUpChairs; i++) {
      const spacing = effectiveWidth / (effectiveUpChairs + 1);
      const x = -effectiveWidth / 2 + spacing * (i + 1);
      const y = -effectiveHeight / 2 - chairOffset;
      
      const chairId = `${this._tableData ? this._tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this._tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : (chairIndex + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        side: 'up'
      });
      chairIndex++;
    }
    
    // Bottom chairs (down)
    for (let i = 0; i < effectiveDownChairs; i++) {
      const spacing = effectiveWidth / (effectiveDownChairs + 1);
      const x = -effectiveWidth / 2 + spacing * (i + 1);
      const y = effectiveHeight / 2 + chairOffset;
      
      const chairId = `${this._tableData ? this._tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this._tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : (chairIndex + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        side: 'down'
      });
      chairIndex++;
    }
    
    // Left chairs
    for (let i = 0; i < effectiveLeftChairs; i++) {
      const spacing = effectiveHeight / (effectiveLeftChairs + 1);
      const x = -effectiveWidth / 2 - chairOffset;
      const y = -effectiveHeight / 2 + spacing * (i + 1);
      
      const chairId = `${this._tableData ? this._tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this._tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : (chairIndex + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        side: 'left'
      });
      chairIndex++;
    }
    
    // Right chairs
    for (let i = 0; i < effectiveRightChairs; i++) {
      const spacing = effectiveHeight / (effectiveRightChairs + 1);
      const x = effectiveWidth / 2 + chairOffset;
      const y = -effectiveHeight / 2 + spacing * (i + 1);
      
      const chairId = `${this._tableData ? this._tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this._tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : (chairIndex + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        side: 'right'
      });
      chairIndex++;
    }
    
    return chairsArray;
  }

  private generateChairsForRectangleTable(): void {
    if (!this._tableData) return;
    
    const totalChairs = this.totalChairs;
    let chairIndex = 0;
    
    // Generate chairs for each side
    const sides = [
      { count: this._tableData.upChairs, name: 'up' },
      { count: this._tableData.downChairs, name: 'down' },
      { count: this._tableData.leftChairs, name: 'left' },
      { count: this._tableData.rightChairs, name: 'right' }
    ];
    
    sides.forEach(side => {
      for (let i = 0; i < side.count; i++) {
        const chair: Chair = {
          id: `${this._tableData!.id}-chair-${chairIndex}`,
          tableId: this._tableData!.id,
          label: (chairIndex + 1).toString(),
          price: 25.00,
          position: {
            angle: 0, // Not used for rectangle tables
            distance: 25 // Standard chair offset
          },
          isSelected: false,
          reservationStatus: 'free'
        };
        this.store.chairStore.addChair(chair);
        chairIndex++;
      }
    });
  }

  onChairClick(event: Event, chair: any): void {
    event.stopPropagation();
    
    if (chair.chair) {
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(chair.chair, clickX, clickY);
    } else {
    }
  }

  onChairMouseDown(event: Event, chair: any): void {
    event.stopPropagation();
    
    // Only handle mousedown in editor mode to avoid conflicts with click events in viewer mode
    if (this.viewerStore.isViewerMode) {
      return; // Don't handle mousedown in viewer mode
    }
    
    if (chair.chair) {
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(chair.chair, clickX, clickY);
    }
  }

  onChairHover(chair: any): void {
    // Optional: Add hover effects here
  }

  getSeatClasses(chair: any): string {
    if (!chair.chair) return 'w-5 h-5 bg-gray-200 border border-gray-400';

    const baseClasses = 'w-5 h-5 transition-all duration-200';

    // In viewer mode, show reservation status
    if (this.viewerStore.isViewerMode) {
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
    if (!chair.chair) return `Seat ${chair.label}`;
    
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
    if (!chair.chair) return 'text-xs text-gray-700';
    
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
} 