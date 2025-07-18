import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { SeatingRowProperties, SegmentProperties } from '../../services/selection.service';
import { makeAutoObservable, computed, observable, action } from 'mobx';
import { rootStore } from '../../stores';
import { Chair } from '../../models/chair.model';
import viewerStore from '../../stores/viewer.store';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-segmented-seating-row',
  standalone: true,
  imports: [
    CommonModule,
    MobxAngularModule
  ],
  templateUrl: './segmented-seating-row.component.html'
})
export class SegmentedSeatingRowComponent implements OnInit, OnChanges {
  @Input() seatingRowData!: SeatingRowProperties;
  @Input() isSelected: boolean = false;
  @Input() isPreview: boolean = false;
  @Input() previewSegment: SegmentProperties | null = null;
  @Input() maxSegments: number = -1; // -1 means no limit
  @Input() chairLabelVisible: boolean = true;
  @Input() rowLabelVisible: boolean = true;
  
  // Internal observable properties that sync with inputs
  public _seatingRowData: SeatingRowProperties | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _previewSegment: SegmentProperties | null = null;
  public _maxSegments: number = -1;
  public _chairLabelVisible: boolean = true;
  public _rowLabelVisible: boolean = true;
  
  store = rootStore;
  viewerStore = viewerStore;
  private logger = new LoggerService();
  
  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      segmentData: computed,
      previewSegmentData: computed,
      completedSegments: computed,
      // Internal observable properties
      _seatingRowData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _previewSegment: observable,
      _maxSegments: observable,
      _chairLabelVisible: observable,
      _rowLabelVisible: observable,
      // Actions
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      seatingRowData: false,
      isSelected: false,
      isPreview: false,
      previewSegment: false,
      maxSegments: false,
      chairLabelVisible: false,
      rowLabelVisible: false,
      // Exclude stores as they are already observable
      store: false,
      viewerStore: false
    });
  }

  ngOnInit() {
    this.syncInputs();
    
    // Generate chairs for this seating row if they don't exist and this is not a preview
    if (this._seatingRowData && this._seatingRowData.id && !this._isPreview) {
      if (this._seatingRowData.type === 'seatingRow') {
        this.generateChairsForRegularRow();
      } else if (this._seatingRowData.type === 'segmentedSeatingRow' && this._seatingRowData.segments) {
        this.generateChairsForAllSegments();
      }
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
  }

  @action
  public syncInputs() {
    this._seatingRowData = this.seatingRowData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._previewSegment = this.previewSegment;
    this._maxSegments = this.maxSegments;
    this._chairLabelVisible = this.chairLabelVisible;
    this._rowLabelVisible = this.rowLabelVisible;
  }

  get segmentData() {
    if (!this._seatingRowData || !this._seatingRowData.segments) {
      return [];
    }
    
    return this._seatingRowData.segments.map((segment, index) => ({
      styles: this.getSegmentStyles(segment),
      width: this.getSegmentWidth(segment),
      chairs: this.getSegmentChairStyles(segment, index)
    }));
  }

  get previewSegmentData() {
    if (!this._previewSegment) {
      return null;
    }
    
    return {
      styles: this.getPreviewSegmentStyles(),
      width: this.getPreviewSegmentWidth(),
      chairs: this.getPreviewSegmentChairStyles()
    };
  }

  // Get completed segments from seatingRowData
  get completedSegments(): SegmentProperties[] {
    return this._seatingRowData?.segments || [];
  }

  // Calculate styles for a segment (position, rotation)
  getSegmentStyles(segment: SegmentProperties) {
    return {
      left: `${segment.startX}px`,
      top: `${segment.startY}px`,
      transform: `rotate(${segment.rotation}deg)`,
      transformOrigin: '0 0'
    };
  }

  // Calculate the visual width of a segment line
  getSegmentWidth(segment: SegmentProperties): number {
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get chair styles for a specific segment
  getSegmentChairStyles(segment: SegmentProperties, segmentIndex: number) {
    const chairsArray = [];
    const startIndex = (segmentIndex > 0) ? 1 : 0;
    
    for (let i = startIndex; i < segment.seatCount; i++) {
      let chairId: string;
      if (this._seatingRowData!.type === 'seatingRow') {
        chairId = `${this._seatingRowData!.id}-chair-${i}`;
      } else {
        chairId = `${this._seatingRowData!.id}-seg${segmentIndex}-chair-${i}`;
      }
      
      const chair = this.store.chairStore.chairs.get(chairId);
      
      let x: number;
      if (segment.seatCount === 1) {
        x = 0;
      } else {
        const spacing = segment.seatSpacing || 30;
        x = i * spacing;
      }
      
      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, 0px)`,
        label: chair ? chair.label : this.calculateGlobalChairLabel(segmentIndex, i),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        index: i,
        isPreviewChair: false
      });
    }
    return chairsArray;
  }
  
  // Calculate a global chair label across all segments
  private calculateGlobalChairLabel(currentSegmentIndex: number, chairIndexInSegment: number): string {
    // For regular rows, just use the chair index + 1
    if (this._seatingRowData!.type === 'seatingRow') {
      return (chairIndexInSegment + 1).toString();
    }
    
    // For segmented rows, calculate across all segments
    let globalIndex = chairIndexInSegment + 1; // Make it 1-indexed
    
    // For each previous segment, add its chair count
    for (let i = 0; i < currentSegmentIndex; i++) {
      // For segments after the first one, we count one less chair to account for the overlap
      const adjustedChairCount = i > 0 ? 
        this._seatingRowData!.segments![i].seatCount - 1 :
        this._seatingRowData!.segments![i].seatCount;
      
      globalIndex += adjustedChairCount;
    }
    
    // If this is not the first segment, subtract 1 to account for the overlapped chair
    if (currentSegmentIndex > 0) {
      globalIndex -= 1;
    }
    
    return globalIndex.toString();
  }

  // --- Preview segment methods ---
  getPreviewSegmentStyles() {
    if (!this._previewSegment) return {};
    return {
      left: `${this._previewSegment.startX}px`,
      top: `${this._previewSegment.startY}px`,
      transform: `rotate(${this._previewSegment.rotation}deg)`,
      transformOrigin: '0 0'
    };
  }

  getPreviewSegmentWidth(): number {
    if (!this._previewSegment) return 0;
    const dx = this._previewSegment.endX - this._previewSegment.startX;
    const dy = this._previewSegment.endY - this._previewSegment.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPreviewSegmentChairStyles() {
    if (!this._previewSegment) return [];
    
    const chairsArray = [];
    const isNewSegmentAfterExisting = this._seatingRowData?.segments && this._seatingRowData.segments.length > 0;
    const startOffset = isNewSegmentAfterExisting ? 1 : 0;
    const chairSpacing = this._previewSegment.seatSpacing;
    
    for (let i = startOffset; i < this._previewSegment.seatCount; i++) {
      let x = (this._previewSegment.seatCount === 1) ? 0 : i * chairSpacing;
      
      let label = (i + 1).toString();
      if (isNewSegmentAfterExisting) {
        let totalPreviousChairs = 0;
        for (let j = 0; j < this._seatingRowData!.segments!.length; j++) {
          totalPreviousChairs += (j > 0) 
            ? this._seatingRowData!.segments![j].seatCount - 1
            : this._seatingRowData!.segments![j].seatCount;
        }
        label = (totalPreviousChairs + i).toString();
      }
      
      chairsArray.push({
        id: `preview-chair-${i}`,
        transform: `translate(${x}px, 0px)`,
        label: label,
        isPreviewChair: true
      });
    }
    return chairsArray;
  }

  // Generate chairs for all committed segments
  private generateChairsForAllSegments(): void {
    if (!this._seatingRowData?.segments) return;
    
    let globalChairCounter = 1;
    this._seatingRowData.segments.forEach((segment, segmentIndex) => {
      for (let i = 0; i < segment.seatCount; i++) {
        const chairId = `${this._seatingRowData!.id}-seg${segmentIndex}-chair-${i}`;
        
        if (!this.store.chairStore.chairs.has(chairId)) {
          const chair: Chair = {
            id: chairId,
            tableId: this._seatingRowData!.id!,
            label: globalChairCounter.toString(),
            price: 0,
            position: { angle: segment.rotation, distance: 0 },
            isSelected: false
          };
          this.store.chairStore.addChair(chair);
        }
        globalChairCounter++;
      }
    });
  }

  // Generate chairs for regular rows (non-segmented)
  private generateChairsForRegularRow(): void {
    if (!this._seatingRowData?.segments || this._seatingRowData.segments.length === 0) return;
    
    const segment = this._seatingRowData.segments[0]; // Regular rows only have one segment
    
    for (let i = 0; i < segment.seatCount; i++) {
      const chairId = `${this._seatingRowData.id}-chair-${i}`;
      
      if (!this.store.chairStore.chairs.has(chairId)) {
        const chair: Chair = {
          id: chairId,
          tableId: this._seatingRowData.id!,
          label: (i + 1).toString(),
          price: 0,
          position: { angle: segment.rotation, distance: 0 },
          isSelected: false
        };
        this.store.chairStore.addChair(chair);
      }
    }
  }

  // Chair interaction methods
  onChairClick(event: Event, chairData: any, segmentIndex: number): void {
    if (this._isPreview) return;
    event.stopPropagation();
    
    const actualChair = this.store.chairStore.chairs.get(chairData.id);
    
    if (actualChair) {
      this.selectChair(actualChair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
    } else {
      this.logger.warn('Chair not found in store', { component: 'SegmentedSeatingRowComponent', action: 'onChairClick', chairId: chairData.id });
    }
  }

  getChairClasses(chairData: any): string {
    if (!chairData) return 'w-5 h-5 bg-gray-200 border border-gray-400';
    
    const baseClasses = 'w-5 h-5 transition-all duration-200';
    
    if (chairData.isPreviewChair) {
      return `${baseClasses} bg-blue-300 border border-blue-400`;
    }
    
    if (!chairData.chair) return `${baseClasses} bg-gray-200 border border-gray-400`;
    
    // In viewer mode, show reservation status
    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chairData.chair);
      
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
    if (chairData.isSelected) {
      return `w-6 h-6 bg-blue-500 border-2 border-blue-700 shadow-lg text-white animate-pulse font-bold`;
    }
    
    return `${baseClasses} bg-blue-200 border border-blue-300 hover:bg-blue-300 hover:scale-105 cursor-pointer`;
  }

  getSeatTitle(chairData: any): string {
    if (!chairData.chair) return `Seat ${chairData.label}`;
    
    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chairData.chair);
      if (reservationStatus === 'pre-reserved') {
        return `Seat ${chairData.label} - Already Reserved (External)`;
      } else if (reservationStatus === 'reserved') {
        return `Seat ${chairData.label} - Reserved by ${chairData.chair.reservedBy || 'Unknown'}`;
      } else if (reservationStatus === 'selected-for-reservation') {
        return `Seat ${chairData.label} - Selected for reservation (Price: $${chairData.chair.price})`;
      } else {
        return `Seat ${chairData.label} - Available (Price: $${chairData.chair.price})`;
      }
    }
    
    return `Chair ${chairData.label} (ID: ${chairData.id})`;
  }

  getSeatLabelClasses(chairData: any): string {
    if (!chairData.chair) return 'text-xs text-gray-700';
    
    if (this.viewerStore.isViewerMode) {
      const reservationStatus = this.viewerStore.getSeatReservationStatus(chairData.chair);
      if (reservationStatus === 'pre-reserved' || reservationStatus === 'reserved' || reservationStatus === 'selected-for-reservation') {
        return 'text-xs text-white font-bold drop-shadow-sm';
      }
      return 'text-xs text-gray-700';
    }
    
    return chairData.isSelected ? 'text-xs text-white font-bold drop-shadow-sm' : 'text-xs text-gray-700';
  }
  
  onChairMouseDown(event: Event, chairData: any): void {
    if (this._isPreview) return;
    event.stopPropagation();
  }

  onChairHover(chairData: any): void {
    // Optional: Add hover effects here
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
    
    if (clickX !== undefined && clickY !== undefined) {
      this.store.chairStore.setPanelPosition(clickX + 20, clickY - 100);
    }
    
    if (chair.isSelected) {
      this.store.chairStore.deselectChair();
    } else {
      this.store.chairStore.selectChair(chair.id);
    }
  }
  
  // Row label position
  getRowLabelPosition(): any {
    if (!this._seatingRowData || !this._seatingRowData.segments || this._seatingRowData.segments.length === 0) {
      return { display: 'none' };
    }
    
    const firstSegment = this._seatingRowData.segments[0];
    return {
      left: `${firstSegment.startX - 60}px`,
      top: `${firstSegment.startY - 15}px`,
      position: 'absolute'
    };
  }

  // Calculate the bounding box for the segmented seating row
  getBoundingBox(): { minX: number, minY: number, maxX: number, maxY: number, centerX: number, centerY: number } {
    if (!this._seatingRowData?.segments || this._seatingRowData.segments.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 };
    }

    const points: {x: number, y: number}[] = [];
    this._seatingRowData.segments.forEach(segment => {
      points.push({ x: segment.startX, y: segment.startY });
      points.push({ x: segment.endX, y: segment.endY });
    });

    let centerX: number;
    let centerY: number;

    let currentMinX = Infinity, currentMinY = Infinity, currentMaxX = -Infinity, currentMaxY = -Infinity;
    points.forEach(p => {
      currentMinX = Math.min(currentMinX, p.x);
      currentMinY = Math.min(currentMinY, p.y);
      currentMaxX = Math.max(currentMaxX, p.x);
      currentMaxY = Math.max(currentMaxY, p.y);
    });
    centerX = (currentMinX + currentMaxX) / 2;
    centerY = (currentMinY + currentMaxY) / 2;

    const rotation = this._seatingRowData.rotation || 0;
    const angle = -rotation * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let unrotatedMinX = Infinity, unrotatedMinY = Infinity, unrotatedMaxX = -Infinity, unrotatedMaxY = -Infinity;
    points.forEach(p => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const unrotatedX = dx * cosA - dy * sinA;
      const unrotatedY = dx * sinA + dy * cosA;
      
      unrotatedMinX = Math.min(unrotatedMinX, unrotatedX);
      unrotatedMinY = Math.min(unrotatedMinY, unrotatedY);
      unrotatedMaxX = Math.max(unrotatedMaxX, unrotatedX);
      unrotatedMaxY = Math.max(unrotatedMaxY, unrotatedY);
    });
    
    const padding = 25;
    const width = unrotatedMaxX - unrotatedMinX + (padding * 2);
    const height = unrotatedMaxY - unrotatedMinY + (padding * 2);

    return { 
      minX: unrotatedMinX - padding,
      minY: unrotatedMinY - padding,
      maxX: unrotatedMaxX + padding,
      maxY: unrotatedMaxY + padding,
      centerX: centerX,
      centerY: centerY
    };
  }

  // Get selection indicator styles
  getSelectionStyles(): any {
    const box = this.getBoundingBox();
    const width = box.maxX - box.minX;
    const height = box.maxY - box.minY;

    return {
      left: `${box.centerX}px`,
      top: `${box.centerY}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(-50%, -50%) rotate(${this._seatingRowData?.rotation || 0}deg)`,
      transformOrigin: 'center center'
    };
  }
} 