import { Component, Input, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RectangleTableProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
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
export class RectangleTableComponent implements OnInit {
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
  
  store = rootStore;
  viewerStore = viewerStore;
  
  @HostBinding('class') @Input() class: string = '';
  
  constructor() {
    makeAutoObservable(this, {
      tableStyles: computed,
      chairStyles: computed,
      x: observable,
      y: observable,
      width: observable,
      height: observable,
      upChairs: observable,
      downChairs: observable,
      leftChairs: observable,
      rightChairs: observable,
      name: observable,
      rotation: observable,
      tableLabelVisible: observable,
      chairLabelVisible: observable
    });
  }

  ngOnInit() {
    console.log('🔄 Rectangle table ngOnInit called. TableData:', this.tableData, 'isPreview:', this.isPreview);
    
    // Generate chairs for this rectangle table if they don't exist and this is not a preview
    if (this.tableData && this.tableData.id && !this.isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this.tableData.id);
      console.log('📋 Existing chairs for rectangle table', this.tableData.id, ':', existingChairs);
      
      if (existingChairs.length === 0) {
        console.log('🪑 Generating chairs for rectangle table:', this.tableData.id);
        this.generateChairsForRectangleTable();
        console.log('✅ Chairs generated. Total chairs in store:', this.store.chairStore.chairs.size);
      }
    } else {
      console.log('❌ Not generating chairs for rectangle table. Conditions:', {
        hasTableData: !!this.tableData,
        hasId: this.tableData?.id,
        isPreview: this.isPreview
      });
    }
  }

  get tableStyles() {
    if (this.tableData) {
      return {
        left: `${this.tableData.x}px`,
        top: `${this.tableData.y}px`,
        width: `${this.tableData.width}px`,
        height: `${this.tableData.height}px`,
        transform: `translate(-50%, -50%) rotate(${this.rotation || this.tableData.rotation || 0}deg)`
      };
    }
    
    return {
      left: `${this.x}px`,
      top: `${this.y}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
      transform: `translate(-50%, -50%) rotate(${this.rotation}deg)`
    };
  }

  get totalChairs(): number {
    if (this.tableData) {
      return (this.tableData.upChairs || 0) + (this.tableData.downChairs || 0) + 
             (this.tableData.leftChairs || 0) + (this.tableData.rightChairs || 0);
    }
    return this.upChairs + this.downChairs + this.leftChairs + this.rightChairs;
  }

  get chairStyles() {
    const effectiveWidth = this.tableData ? this.tableData.width : this.width;
    const effectiveHeight = this.tableData ? this.tableData.height : this.height;
    const effectiveUpChairs = this.tableData ? this.tableData.upChairs : this.upChairs;
    const effectiveDownChairs = this.tableData ? this.tableData.downChairs : this.downChairs;
    const effectiveLeftChairs = this.tableData ? this.tableData.leftChairs : this.leftChairs;
    const effectiveRightChairs = this.tableData ? this.tableData.rightChairs : this.rightChairs;
    
    const chairsArray = [];
    const chairOffset = 25; // Distance from table edge
    let chairIndex = 0;
    
    console.log('🪑 Building chair styles for rectangle table:');
    console.log('  - tableData:', this.tableData);
    console.log('  - isPreview:', this.isPreview);
    console.log('  - up/down/left/right chairs:', effectiveUpChairs, effectiveDownChairs, effectiveLeftChairs, effectiveRightChairs);
    
    // Top chairs (up)
    for (let i = 0; i < effectiveUpChairs; i++) {
      const spacing = effectiveWidth / (effectiveUpChairs + 1);
      const x = -effectiveWidth / 2 + spacing * (i + 1);
      const y = -effectiveHeight / 2 - chairOffset;
      
      const chairId = `${this.tableData ? this.tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this.tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
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
      
      const chairId = `${this.tableData ? this.tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this.tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
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
      
      const chairId = `${this.tableData ? this.tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this.tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
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
      
      const chairId = `${this.tableData ? this.tableData.id : 'preview'}-chair-${chairIndex}`;
      const chair = this.tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
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
    
    console.log('📋 Final rectangle chairsArray:', chairsArray);
    return chairsArray;
  }

  private generateChairsForRectangleTable(): void {
    if (!this.tableData) return;
    
    const totalChairs = this.totalChairs;
    let chairIndex = 0;
    
    // Generate chairs for each side
    const sides = [
      { count: this.tableData.upChairs, name: 'up' },
      { count: this.tableData.downChairs, name: 'down' },
      { count: this.tableData.leftChairs, name: 'left' },
      { count: this.tableData.rightChairs, name: 'right' }
    ];
    
    sides.forEach(side => {
      for (let i = 0; i < side.count; i++) {
        const chair: Chair = {
          id: `${this.tableData.id}-chair-${chairIndex}`,
          tableId: this.tableData.id,
          label: (chairIndex + 1).toString(),
          price: 0,
          position: {
            angle: 0, // Not used for rectangle tables
            distance: 25 // Standard chair offset
          },
          isSelected: false
        };
        this.store.chairStore.addChair(chair);
        chairIndex++;
      }
    });
  }

  onChairClick(event: Event, chair: any): void {
    console.log('🪑 RECTANGLE CHAIR CLICK DETECTED!', event, chair);
    event.stopPropagation();
    
    if (chair.chair) {
      console.log('✅ Rectangle chair found, selecting:', chair.chair);
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(chair.chair, clickX, clickY);
    } else {
      console.log('❌ No rectangle chair found. Chair:', chair.chair);
    }
  }

  onChairMouseDown(event: Event, chair: any): void {
    console.log('🖱️ Rectangle chair mousedown:', chair.label);
    event.stopPropagation();
    
    // Only handle mousedown in editor mode to avoid conflicts with click events in viewer mode
    if (this.viewerStore.isViewerMode) {
      return; // Don't handle mousedown in viewer mode
    }
    
    if (chair.chair) {
      console.log('✅ Rectangle chair found on mousedown, selecting:', chair.chair);
      
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
    
    return `${baseClasses} bg-gray-200 border border-gray-400 hover:bg-gray-300 hover:scale-105 cursor-pointer`;
  }

  getSeatTitle(chair: any): string {
    if (!chair.chair) return `Seat ${chair.label}`;
    
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
    if (!chair.chair) return 'text-xs text-gray-700';
    
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
      
      // Don't allow selection of already reserved seats - add visual feedback
      if (reservationStatus === 'reserved') {
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