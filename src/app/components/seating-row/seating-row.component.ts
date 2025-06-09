import { Component, Input, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { SeatingRowProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
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
export class SeatingRowComponent implements OnInit {
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
  
  store = rootStore;
  viewerStore = viewerStore;
  
  @HostBinding('class') @Input() class: string = '';
  
  constructor() {
    makeAutoObservable(this, {
      seatingRowStyles: computed,
      chairStyles: computed,
      x: observable,
      y: observable,
      endX: observable,
      endY: observable,
      seatCount: observable,
      seatSpacing: observable,
      name: observable,
      rotation: observable,
      chairLabelVisible: observable,
      rowLabelVisible: observable
    });
  }

  ngOnInit() {
    console.log('🔄 Seating row ngOnInit called. SeatingRowData:', this.seatingRowData, 'isPreview:', this.isPreview);
    
    // Generate chairs for this seating row if they don't exist and this is not a preview
    if (this.seatingRowData && this.seatingRowData.id && !this.isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this.seatingRowData.id);
      console.log('📋 Existing chairs for seating row', this.seatingRowData.id, ':', existingChairs);
      
      if (existingChairs.length === 0) {
        console.log('🪑 Generating chairs for seating row:', this.seatingRowData.id);
        this.generateChairsForSeatingRow();
        console.log('✅ Chairs generated. Total chairs in store:', this.store.chairStore.chairs.size);
      }
    } else {
      console.log('❌ Not generating chairs for seating row. Conditions:', {
        hasSeatingRowData: !!this.seatingRowData,
        hasId: this.seatingRowData?.id,
        isPreview: this.isPreview
      });
    }
  }

  get seatingRowStyles() {
    // Position the seating row container at the start point
    if (this.seatingRowData) {
      return {
        left: `${this.seatingRowData.x}px`,
        top: `${this.seatingRowData.y}px`,
        transform: `rotate(${this.rotation || this.seatingRowData.rotation || 0}deg)`,
        transformOrigin: '0 0'
      };
    }
    
    return {
      left: `${this.x}px`,
      top: `${this.y}px`,
      transform: `rotate(${this.rotation}deg)`,
      transformOrigin: '0 0'
    };
  }

  get rowLength(): number {
    const effectiveX = this.seatingRowData ? this.seatingRowData.x : this.x;
    const effectiveY = this.seatingRowData ? this.seatingRowData.y : this.y;
    const effectiveEndX = this.seatingRowData ? this.seatingRowData.endX : this.endX;
    const effectiveEndY = this.seatingRowData ? this.seatingRowData.endY : this.endY;
    
    const dx = effectiveEndX - effectiveX;
    const dy = effectiveEndY - effectiveY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get rowAngle(): number {
    const effectiveX = this.seatingRowData ? this.seatingRowData.x : this.x;
    const effectiveY = this.seatingRowData ? this.seatingRowData.y : this.y;
    const effectiveEndX = this.seatingRowData ? this.seatingRowData.endX : this.endX;
    const effectiveEndY = this.seatingRowData ? this.seatingRowData.endY : this.endY;
    
    const dx = effectiveEndX - effectiveX;
    const dy = effectiveEndY - effectiveY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  get chairStyles() {
    const effectiveSeatCount = this.seatingRowData ? this.seatingRowData.seatCount : this.seatCount;
    const effectiveSeatSpacing = this.seatingRowData ? this.seatingRowData.seatSpacing : this.seatSpacing;
    
    const chairsArray = [];
    
    console.log('🪑 Building chair styles for seating row:');
    console.log('  - seatingRowData:', this.seatingRowData);
    console.log('  - isPreview:', this.isEffectivePreview);
    console.log('  - seatCount:', effectiveSeatCount);
    console.log('  - seatSpacing:', effectiveSeatSpacing);
    
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
      
      const chairId = `${this.seatingRowData ? this.seatingRowData.id : 'preview'}-chair-${i}`;
      const chair = this.seatingRowData ? this.store.chairStore.chairs.get(chairId) : null;
      
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
    
    console.log('📋 Final seating row chairsArray:', chairsArray);
    return chairsArray;
  }

  getLabelLeftPosition(): number {
    const effectiveSeatCount = this.seatingRowData ? this.seatingRowData.seatCount : this.seatCount;
    const effectiveSeatSpacing = this.seatingRowData ? this.seatingRowData.seatSpacing : this.seatSpacing;
    const labelPosition = this.seatingRowData?.labelPosition || 'left';
    
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
    const effectiveSeatCount = this.seatingRowData ? this.seatingRowData.seatCount : this.seatCount;
    const effectiveSeatSpacing = this.seatingRowData ? this.seatingRowData.seatSpacing : this.seatSpacing;
    
    // Use exact chair spacing for consistent width
    if (effectiveSeatCount <= 1) {
      return 20; // Just the chair width for a single seat
    }
    
    // Calculate the distance from first to last chair and add chair width
    return (effectiveSeatCount - 1) * effectiveSeatSpacing + 5; // Add 5px for the chair display
  }

  private generateChairsForSeatingRow(): void {
    if (!this.seatingRowData) return;
    
    const totalChairs = this.seatingRowData.seatCount;
    
    // Generate chairs for the seating row
    for (let i = 0; i < totalChairs; i++) {
      const chair: Chair = {
        id: `${this.seatingRowData.id}-chair-${i}`,
        tableId: this.seatingRowData.id,
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

    console.log('Chair clicked:', chair);
    this.selectChair(chair.chair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
  }

  onChairMouseDown(event: Event, chair: any): void {
    if (this.isEffectivePreview || !chair || !chair.chair) return;
    
    // Only handle mousedown in editor mode to avoid conflicts with click events in viewer mode
    if (this.viewerStore.isViewerMode) {
      return; // Don't handle mousedown in viewer mode
    }

    console.log('Chair mousedown:', chair);
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
      
      if (reservationStatus === 'reserved') {
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
      if (reservationStatus === 'reserved') {
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
      if (reservationStatus === 'reserved' || reservationStatus === 'selected-for-reservation') {
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
      
      // Don't allow selection of already reserved seats
      if (reservationStatus === 'reserved') {
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

    if (chair.isSelected) {
      this.store.chairStore.deselectChair();
    } else {
      this.store.chairStore.selectChair(chair.id);
      if (clickX !== undefined && clickY !== undefined) {
        this.store.chairStore.setPanelPosition(clickX + 10, clickY - 10);
      }
    }
  }

  // Helper getter to simplify HTML templates
  get isEffectivePreview(): boolean {
    return this.isPreview || (this.seatingRowData && !!this.seatingRowData.isPreview);
  }
} 