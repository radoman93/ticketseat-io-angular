import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { SeatingRowProperties, SegmentProperties } from '../../services/selection.service';
import { makeAutoObservable, computed } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';

@Component({
  selector: 'app-segmented-seating-row',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './segmented-seating-row.component.html',
  styleUrls: []
})
export class SegmentedSeatingRowComponent implements OnInit {
  @Input() seatingRowData!: SeatingRowProperties;
  @Input() isSelected: boolean = false;
  @Input() isPreview: boolean = false;
  @Input() previewSegment: SegmentProperties | null = null;
  @Input() chairLabelVisible: boolean = true;
  @Input() rowLabelVisible: boolean = true;
  
  store = rootStore;
  
  constructor() {
    makeAutoObservable(this, {
      completedSegments: computed
    });
    console.log('[SegmentedSeatingRowComponent] Constructor called');
  }

  ngOnInit() {
    console.log('[SegmentedSeatingRowComponent] ngOnInit called with data:', {
      seatingRowData: this.seatingRowData,
      isPreview: this.isPreview,
      previewSegment: this.previewSegment,
      chairLabelVisible: this.chairLabelVisible,
      rowLabelVisible: this.rowLabelVisible
    });
    
    if (this.seatingRowData && this.seatingRowData.id && !this.isPreview && this.seatingRowData.segments) {
      console.log('[SegmentedSeatingRowComponent] Generating chairs for', this.seatingRowData.segments.length, 'segments');
      this.generateChairsForAllSegments();
    }
  }

  // Get completed segments from seatingRowData
  get completedSegments(): SegmentProperties[] {
    const segments = this.seatingRowData?.segments || [];
    console.log('[SegmentedSeatingRowComponent] Getting completed segments:', segments.length);
    return segments;
  }

  // Calculate styles for a segment (position, rotation)
  getSegmentStyles(segment: SegmentProperties) {
    const styles = {
      left: `${segment.startX}px`,
      top: `${segment.startY}px`,
      transform: `rotate(${segment.rotation}deg)`,
      transformOrigin: '0 0'
    };
    console.log('[SegmentedSeatingRowComponent] Segment styles for segment', segment.segmentIndex, ':', styles);
    return styles;
  }

  // Calculate the visual width of a segment line
  getSegmentWidth(segment: SegmentProperties): number {
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const width = Math.sqrt(dx * dx + dy * dy);
    console.log('[SegmentedSeatingRowComponent] Segment width for segment', segment.segmentIndex, ':', width);
    return width;
  }

  // Get chair styles for a specific segment
  getSegmentChairStyles(segment: SegmentProperties, segmentIndex: number) {
    console.log('[SegmentedSeatingRowComponent] Getting chair styles for segment', segmentIndex, 'with', segment.seatCount, 'seats');
    const chairsArray = [];
    const segmentLength = this.getSegmentWidth(segment);

    for (let i = 0; i < segment.seatCount; i++) {
      let x: number;
      if (segment.seatCount === 1) {
        x = 0;
      } else {
        x = (i * segmentLength) / (segment.seatCount - 1);
      }
      const y = 0;
      
      const chairId = `${this.seatingRowData.id}-seg${segmentIndex}-chair-${i}`;
      const chair = this.store.chairStore.chairs.get(chairId);

      chairsArray.push({
        id: chairId,
        transform: `translate(${x}px, ${y}px)`,
        label: chair ? chair.label : this.calculateGlobalChairLabel(segmentIndex, i),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        index: i
      });
    }
    
    console.log('[SegmentedSeatingRowComponent] Generated', chairsArray.length, 'chair styles for segment', segmentIndex);
    return chairsArray;
  }
  
  // Calculate a global chair label across all segments
  private calculateGlobalChairLabel(currentSegmentIndex: number, chairIndexInSegment: number): string {
    let label = chairIndexInSegment + 1;
    for (let i = 0; i < currentSegmentIndex; i++) {
      label += this.seatingRowData.segments![i].seatCount;
    }
    return label.toString();
  }

  // --- Preview segment methods ---
  getPreviewSegmentStyles() {
    if (!this.previewSegment) return {};
    const styles = {
      left: `${this.previewSegment.startX}px`,
      top: `${this.previewSegment.startY}px`,
      transform: `rotate(${this.previewSegment.rotation}deg)`,
      transformOrigin: '0 0'
    };
    console.log('[SegmentedSeatingRowComponent] Preview segment styles:', styles);
    return styles;
  }

  getPreviewSegmentWidth(): number {
    if (!this.previewSegment) return 0;
    const dx = this.previewSegment.endX - this.previewSegment.startX;
    const dy = this.previewSegment.endY - this.previewSegment.startY;
    const width = Math.sqrt(dx * dx + dy * dy);
    console.log('[SegmentedSeatingRowComponent] Preview segment width:', width);
    return width;
  }

  getPreviewSegmentChairStyles() {
    if (!this.previewSegment) return [];
    console.log('[SegmentedSeatingRowComponent] Getting preview segment chair styles for', this.previewSegment.seatCount, 'seats');
    
    const chairsArray = [];
    const segmentLength = this.getPreviewSegmentWidth();
    
    for (let i = 0; i < this.previewSegment.seatCount; i++) {
      let x: number;
      if (this.previewSegment.seatCount === 1) {
        x = 0;
      } else {
        x = (i * segmentLength) / (this.previewSegment.seatCount - 1);
      }
      
      chairsArray.push({
        id: `preview-chair-${i}`,
        transform: `translate(${x}px, 0px)`,
        label: (i + 1).toString(),
        isPreviewChair: true
      });
    }
    
    console.log('[SegmentedSeatingRowComponent] Generated', chairsArray.length, 'preview chair styles');
    return chairsArray;
  }

  // Generate chairs for all committed segments
  private generateChairsForAllSegments(): void {
    if (!this.seatingRowData?.segments) return;
    console.log('[SegmentedSeatingRowComponent] Generating chairs for all segments');

    let globalChairCounter = 1;
    this.seatingRowData.segments.forEach((segment, segmentIndex) => {
      console.log('[SegmentedSeatingRowComponent] Processing segment', segmentIndex, 'with', segment.seatCount, 'seats');
      
      for (let i = 0; i < segment.seatCount; i++) {
        const chairId = `${this.seatingRowData.id}-seg${segmentIndex}-chair-${i}`;
        
        if (!this.store.chairStore.chairs.has(chairId)) {
          const chair: Chair = {
            id: chairId,
            tableId: this.seatingRowData.id!,
            label: globalChairCounter.toString(),
            price: 0,
            position: { angle: segment.rotation, distance: 0 },
            isSelected: false
          };
          this.store.chairStore.addChair(chair);
          console.log('[SegmentedSeatingRowComponent] Added chair:', chairId);
        }
        globalChairCounter++;
      }
    });
  }

  // Chair interaction methods
  onChairClick(event: Event, chairData: any, segmentIndex: number): void {
    if (this.isPreview) return;
    event.stopPropagation();
    console.log('[SegmentedSeatingRowComponent] Chair clicked:', chairData, 'in segment', segmentIndex);
    
    const actualChair = this.store.chairStore.chairs.get(chairData.id);
    if (actualChair) {
      this.selectChair(actualChair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
    }
  }
  
  onChairMouseDown(event: Event, chairData: any): void {
    if (this.isPreview) return;
    event.stopPropagation();
  }

  onChairHover(chairData: any): void {
    // Optional: Add hover effects here
  }

  getChairClasses(chairData: any): string {
    if (chairData.isPreviewChair) {
      return 'w-5 h-5 bg-blue-100 border-2 border-blue-400 opacity-80 rounded-full';
    }
    if (chairData.isSelected) {
      return 'w-6 h-6 bg-blue-500 border-2 border-blue-600 shadow-lg rounded-full';
    }
    return 'w-5 h-5 bg-white border-2 border-blue-400 hover:bg-blue-50 rounded-full';
  }

  private selectChair(chair: Chair, clickX?: number, clickY?: number): void {
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
    if (!this.seatingRowData || !this.seatingRowData.segments || this.seatingRowData.segments.length === 0) {
      return { display: 'none' };
    }
    
    const firstSegment = this.seatingRowData.segments[0];
    return {
      left: `${firstSegment.startX - 60}px`,
      top: `${firstSegment.startY - 15}px`,
      position: 'absolute'
    };
  }
} 