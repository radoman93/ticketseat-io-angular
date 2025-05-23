import { Component, Input, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { SeatingRowProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';

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
    console.log('  - isPreview:', this.isPreview);
    console.log('  - seatCount:', effectiveSeatCount);
    console.log('  - seatSpacing:', effectiveSeatSpacing);
    
    // Calculate seat positions along the line (now using rotation)
    for (let i = 0; i < effectiveSeatCount; i++) {
      // Position seats along the local x-axis (rotation is handled by container transform)
      // In preview mode, adjust for centering the first chair
      let x = i * effectiveSeatSpacing;
      
      // In preview mode, only center if it's a single chair
      if (this.isPreview && effectiveSeatCount === 1) {
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
        index: i
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
    
    // Calculate the width from first seat to last seat (along local x-axis)
    return (effectiveSeatCount - 1) * effectiveSeatSpacing + 20; // Add 20px for the seat width
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
    console.log('🪑 SEATING ROW CHAIR CLICK DETECTED!', event, chair);
    event.stopPropagation();
    
    if (chair.chair) {
      console.log('✅ Seating row chair found, selecting:', chair.chair);
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(chair.chair, clickX, clickY);
    } else {
      console.log('❌ No seating row chair found. Chair:', chair.chair);
    }
  }

  onChairMouseDown(event: Event, chair: any): void {
    console.log('🖱️ Seating row chair mousedown:', chair.label);
    event.stopPropagation();
    
    if (chair.chair) {
      console.log('✅ Seating row chair found on mousedown, selecting:', chair.chair);
      
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

  getChairClasses(chair: any): string {
    if (this.isPreview) {
      return 'w-5 h-5 bg-blue-300 border border-blue-500 opacity-80';
    }
    
    if (chair.isSelected) {
      return 'w-7 h-7 bg-blue-500 border-3 border-blue-600 shadow-lg shadow-blue-400/50 scale-110 animate-pulse';
    }
    
    return 'w-5 h-5 bg-blue-200 border border-blue-400 hover:bg-blue-300 hover:scale-105';
  }

  private selectChair(chair: Chair, clickX?: number, clickY?: number): void {
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