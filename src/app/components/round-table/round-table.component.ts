import { Component, Input, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableProperties, ChairProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';

@Component({
  selector: 'app-round-table',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './round-table.component.html',
  styleUrls: []
})
export class RoundTableComponent implements OnInit {
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
  
  store = rootStore;
  
  @HostBinding('class') @Input() class: string = '';
  
  constructor() {
    makeAutoObservable(this, {
      tableStyles: computed,
      seatStyles: computed,
      x: observable,
      y: observable,
      radius: observable,
      seats: observable,
      openSpaces: observable,
      name: observable,
      rotation: observable,
      tableLabelVisible: observable,
      chairLabelVisible: observable
    });
  }

  ngOnInit() {
    console.log('🔄 Round table ngOnInit called. TableData:', this.tableData, 'isPreview:', this.isPreview);
    
    // Generate chairs for this table if they don't exist and this is not a preview
    if (this.tableData && this.tableData.id && !this.isPreview) {
      const existingChairs = this.store.chairStore.getChairsByTable(this.tableData.id);
      console.log('📋 Existing chairs for table', this.tableData.id, ':', existingChairs);
      
      if (existingChairs.length === 0) {
        console.log('🪑 Generating chairs for table:', this.tableData.id);
        this.store.chairStore.generateChairsForTable(
          this.tableData.id, 
          this.tableData.seats, 
          this.tableData.radius
        );
        console.log('✅ Chairs generated. Total chairs in store:', this.store.chairStore.chairs.size);
      }
    } else {
      console.log('❌ Not generating chairs. Conditions:', {
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
        width: `${this.tableData.radius * 2}px`,
        height: `${this.tableData.radius * 2}px`,
        transform: `translate(-50%, -50%) rotate(${this.rotation || this.tableData.rotation || 0}deg)`
      };
    }
    
    return {
      left: `${this.x}px`,
      top: `${this.y}px`,
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      transform: `translate(-50%, -50%) rotate(${this.rotation}deg)`
    };
  }

  get seatStyles() {
    const effectiveSeats = this.tableData ? this.tableData.seats : this.seats;
    const effectiveOpenSpaces = this.tableData ? this.tableData.openSpaces : this.openSpaces;
    const effectiveRadius = this.tableData ? this.tableData.radius : this.radius;
    const totalPositions = effectiveSeats + effectiveOpenSpaces;
    
    const seatsArray = [];
    if (totalPositions === 0) {
      return [];
      return [];
    }

    const angleStep = 360 / totalPositions;
    const distanceToItemCenter = effectiveRadius + 20; 
    
    console.log('🪑 Building seat styles for table:');
    console.log('  - tableData:', this.tableData);
    console.log('  - tableData?.id:', this.tableData?.id);
    console.log('  - isPreview:', this.isPreview);
    console.log('  - effectiveSeats:', effectiveSeats);
    console.log('  - chairs in store:', this.store.chairStore.chairs.size);
    
    for (let i = 0; i < totalPositions; i++) {
      const angleDegrees = angleStep * i;
      const angleRadians = angleDegrees * Math.PI / 180;
      
      const x = Math.cos(angleRadians) * distanceToItemCenter;
      const y = Math.sin(angleRadians) * distanceToItemCenter;
      
      const isSeat = i < effectiveSeats;
      const isOpenSpace = i >= effectiveSeats;
      
      const chairId = `${this.tableData ? this.tableData.id : 'preview'}-chair-${i}`;
      const chair = this.tableData ? this.store.chairStore.chairs.get(chairId) : null;
      
      console.log(`  Seat ${i}: chairId=${chairId}, chair found=${!!chair}, isOpenSpace=${isOpenSpace}`);
      if (this.tableData) {
        console.log(`    Looking for chair with ID: ${chairId}`);
        console.log(`    All chair IDs in store:`, Array.from(this.store.chairStore.chairs.keys()));
      }
      
      seatsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        isOpenSpace: isOpenSpace,
        label: chair ? chair.label : (isSeat ? (i + 1).toString() : null),
        isSelected: chair ? chair.isSelected : false,
        chair: chair
      });
    }
    
    console.log('📋 Final seatsArray:', seatsArray);
    return seatsArray;
  }

  onChairClick(event: Event, seat: any): void {
    console.log('🪑 CHAIR CLICK DETECTED!', event, seat);
    event.stopPropagation();
    
    if (!seat.isOpenSpace && seat.chair) {
      console.log('✅ Chair found, selecting:', seat.chair);
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(seat.chair, clickX, clickY);
    } else {
      console.log('❌ No chair found or open space. Seat chair:', seat.chair, 'isOpenSpace:', seat.isOpenSpace);
    }
  }

  onChairMouseDown(event: Event, seat: any): void {
    console.log('🖱️ Chair mousedown:', seat.label);
    event.stopPropagation();
    
    if (!seat.isOpenSpace && seat.chair) {
      console.log('✅ Chair found on mousedown, selecting:', seat.chair);
      
      // Calculate click position for panel positioning
      const mouseEvent = event as MouseEvent;
      const clickX = mouseEvent.clientX;
      const clickY = mouseEvent.clientY;
      
      this.selectChair(seat.chair, clickX, clickY);
    }
  }

  onChairHover(seat: any): void {
    console.log('👆 Chair hover:', seat.label);
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