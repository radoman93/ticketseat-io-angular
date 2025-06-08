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
  @Input() maxSegments: number = -1; // -1 = unlimited, 1 = regular row, >1 = limited segments
  
  store = rootStore;
  
  constructor() {
    makeAutoObservable(this, {
      completedSegments: computed
    });
    console.log('[SegmentedSeatingRowComponent] Constructor called');
  }

  ngOnInit() {
    console.log('[SegmentedSeatingRowComponent] ngOnInit called. SeatingRowData:', this.seatingRowData, 'isPreview:', this.isPreview);
    
    // Generate chairs for this seating row if they don't exist and this is not a preview
    if (this.seatingRowData && this.seatingRowData.id && !this.isPreview) {
      // Check if this is a regular row (type 'seatingRow') or segmented row (type 'segmentedSeatingRow')
      if (this.seatingRowData.type === 'seatingRow') {
        // For regular rows, generate chairs based on the row properties
        this.generateChairsForRegularRow();
      } else if (this.seatingRowData.type === 'segmentedSeatingRow' && this.seatingRowData.segments) {
        // For segmented rows, generate chairs for all segments
        this.generateChairsForAllSegments();
      }
    } else {
      console.log('[SegmentedSeatingRowComponent] Not generating chairs. Conditions:', {
        hasSeatingRowData: !!this.seatingRowData,
        hasId: this.seatingRowData?.id,
        isPreview: this.isPreview,
        type: this.seatingRowData?.type
      });
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
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    console.log('[SegmentedSeatingRowComponent] Getting segment chair styles for', segment.seatCount, 'seats', 'on segment', segmentIndex);
    
    const chairsArray = [];
    
    // For segments after the first one, skip the first chair to avoid overlap
    const startIndex = (segmentIndex > 0) ? 1 : 0;
    
    for (let i = startIndex; i < segment.seatCount; i++) {
      // Generate chairId based on the row type
      let chairId: string;
      if (this.seatingRowData.type === 'seatingRow') {
        // Regular row: simpler ID pattern
        chairId = `${this.seatingRowData.id}-chair-${i}`;
      } else {
        // Segmented row: include segment info
        chairId = `${this.seatingRowData.id}-seg${segmentIndex}-chair-${i}`;
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
        index: i
      });
    }
    
    console.log('[SegmentedSeatingRowComponent] Generated', chairsArray.length, 'chair styles for segment', segmentIndex);
    return chairsArray;
  }
  
  // Calculate a global chair label across all segments
  private calculateGlobalChairLabel(currentSegmentIndex: number, chairIndexInSegment: number): string {
    // For regular rows, just use the chair index + 1
    if (this.seatingRowData.type === 'seatingRow') {
      return (chairIndexInSegment + 1).toString();
    }
    
    // For segmented rows, calculate across all segments
    let globalIndex = chairIndexInSegment + 1; // Make it 1-indexed
    
    // For each previous segment, add its chair count
    for (let i = 0; i < currentSegmentIndex; i++) {
      // For segments after the first one, we count one less chair to account for the overlap
      const adjustedChairCount = i > 0 ? 
        this.seatingRowData.segments![i].seatCount - 1 :
        this.seatingRowData.segments![i].seatCount;
      
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
    
    // Check if this is a continuation from existing segments
    const isNewSegmentAfterExisting = this.seatingRowData?.segments && this.seatingRowData.segments.length > 0;
    const startOffset = isNewSegmentAfterExisting ? 1 : 0; // Skip the first chair if continuing from existing segments
    
    // Calculate the consistent chair spacing
    const chairSpacing = this.previewSegment.seatSpacing;
    const totalDistanceNeeded = (this.previewSegment.seatCount - 1) * chairSpacing;
    
    // Create chairs with consistent spacing
    for (let i = startOffset; i < this.previewSegment.seatCount; i++) {
      let x: number;
      if (this.previewSegment.seatCount === 1) {
        x = 0;
      } else if (totalDistanceNeeded > 0) {
        // Calculate position using consistent chair spacing rather than dividing segment length
        x = i * chairSpacing;
      } else {
        x = 0;
      }
      
      // Calculate chair label, accounting for existing segments
      let label = (i + 1).toString();
      if (isNewSegmentAfterExisting) {
        let totalPreviousChairs = 0;
        for (let j = 0; j < this.seatingRowData.segments!.length; j++) {
          if (j === 0) {
            totalPreviousChairs += this.seatingRowData.segments![j].seatCount;
          } else {
            totalPreviousChairs += this.seatingRowData.segments![j].seatCount - 1;
          }
        }
        // Account for the skipped first chair in the preview segment
        label = (totalPreviousChairs + i).toString();
      }
      
      chairsArray.push({
        id: `preview-chair-${i}`,
        transform: `translate(${x}px, 0px)`,
        label: label,
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
      
      // For segments after the first one, skip the first chair to avoid overlap
      const startIndex = (segmentIndex > 0) ? 1 : 0;
      
      for (let i = startIndex; i < segment.seatCount; i++) {
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

  // Generate chairs for regular rows (non-segmented)
  private generateChairsForRegularRow(): void {
    if (!this.seatingRowData?.segments || this.seatingRowData.segments.length === 0) return;
    
    console.log('[SegmentedSeatingRowComponent] Generating chairs for regular row');
    
    const segment = this.seatingRowData.segments[0]; // Regular rows only have one segment
    
    for (let i = 0; i < segment.seatCount; i++) {
      const chairId = `${this.seatingRowData.id}-chair-${i}`;
      
      if (!this.store.chairStore.chairs.has(chairId)) {
        const chair: Chair = {
          id: chairId,
          tableId: this.seatingRowData.id!,
          label: (i + 1).toString(),
          price: 0,
          position: { angle: segment.rotation, distance: 0 },
          isSelected: false
        };
        this.store.chairStore.addChair(chair);
        console.log('[SegmentedSeatingRowComponent] Added chair:', chairId);
      }
    }
  }

  // Chair interaction methods
  onChairClick(event: Event, chairData: any, segmentIndex: number): void {
    if (this.isPreview) return;
    event.stopPropagation();
    console.log('[SegmentedSeatingRowComponent] Chair clicked:', chairData, 'in segment', segmentIndex);
    
    const actualChair = this.store.chairStore.chairs.get(chairData.id);
    console.log('[SegmentedSeatingRowComponent] Found chair in store:', actualChair);
    
    if (actualChair) {
      console.log('[SegmentedSeatingRowComponent] Selecting chair with ID:', actualChair.id);
      this.selectChair(actualChair, (event as MouseEvent).clientX, (event as MouseEvent).clientY);
    } else {
      console.warn('[SegmentedSeatingRowComponent] Chair not found in store with ID:', chairData.id);
      console.log('[SegmentedSeatingRowComponent] Available chairs:', Array.from(this.store.chairStore.chairs.keys()));
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