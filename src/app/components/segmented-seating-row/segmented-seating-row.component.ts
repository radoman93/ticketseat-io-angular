import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
export class SegmentedSeatingRowComponent implements OnInit, OnChanges {
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
      segmentData: computed,
      previewSegmentData: computed,
      completedSegments: computed
    });
  }

  ngOnInit() {
    // Generate chairs for this seating row if they don't exist and this is not a preview
    if (this.seatingRowData && this.seatingRowData.id && !this.isPreview) {
      if (this.seatingRowData.type === 'seatingRow') {
        this.generateChairsForRegularRow();
      } else if (this.seatingRowData.type === 'segmentedSeatingRow' && this.seatingRowData.segments) {
        this.generateChairsForAllSegments();
      }
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // We no longer need to manually update on changes, MobX will handle it.
  }

  get segmentData() {
    if (!this.seatingRowData || !this.seatingRowData.segments) {
      return [];
    }
    
    return this.seatingRowData.segments.map((segment, index) => ({
      styles: this.getSegmentStyles(segment),
      width: this.getSegmentWidth(segment),
      chairs: this.getSegmentChairStyles(segment, index)
    }));
  }

  get previewSegmentData() {
    if (!this.previewSegment) {
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
    return this.seatingRowData?.segments || [];
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
      if (this.seatingRowData.type === 'seatingRow') {
        chairId = `${this.seatingRowData.id}-chair-${i}`;
      } else {
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
        index: i,
        isPreviewChair: false
      });
    }
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
    return {
      left: `${this.previewSegment.startX}px`,
      top: `${this.previewSegment.startY}px`,
      transform: `rotate(${this.previewSegment.rotation}deg)`,
      transformOrigin: '0 0'
    };
  }

  getPreviewSegmentWidth(): number {
    if (!this.previewSegment) return 0;
    const dx = this.previewSegment.endX - this.previewSegment.startX;
    const dy = this.previewSegment.endY - this.previewSegment.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPreviewSegmentChairStyles() {
    if (!this.previewSegment) return [];
    
    const chairsArray = [];
    const isNewSegmentAfterExisting = this.seatingRowData?.segments && this.seatingRowData.segments.length > 0;
    const startOffset = isNewSegmentAfterExisting ? 1 : 0;
    const chairSpacing = this.previewSegment.seatSpacing;
    
    for (let i = startOffset; i < this.previewSegment.seatCount; i++) {
      let x = (this.previewSegment.seatCount === 1) ? 0 : i * chairSpacing;
      
      let label = (i + 1).toString();
      if (isNewSegmentAfterExisting) {
        let totalPreviousChairs = 0;
        for (let j = 0; j < this.seatingRowData.segments!.length; j++) {
          totalPreviousChairs += (j > 0) 
            ? this.seatingRowData.segments![j].seatCount - 1
            : this.seatingRowData.segments![j].seatCount;
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
    if (!this.seatingRowData?.segments) return;
    
    let globalChairCounter = 1;
    this.seatingRowData.segments.forEach((segment, segmentIndex) => {
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
        }
        globalChairCounter++;
      }
    });
  }

  // Generate chairs for regular rows (non-segmented)
  private generateChairsForRegularRow(): void {
    if (!this.seatingRowData?.segments || this.seatingRowData.segments.length === 0) return;
    
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
      }
    }
  }

  // Chair interaction methods
  onChairClick(event: Event, chairData: any, segmentIndex: number): void {
    if (this.isPreview) return;
    event.stopPropagation();
    
    const actualChair = this.store.chairStore.chairs.get(chairData.id);
    
    if (actualChair) {
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
      console.log('Selected chair:', chair.id);
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

  // Calculate the bounding box for the segmented seating row
  getBoundingBox(): { minX: number, minY: number, maxX: number, maxY: number, centerX: number, centerY: number } {
    if (!this.seatingRowData?.segments || this.seatingRowData.segments.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 };
    }

    const points: {x: number, y: number}[] = [];
    this.seatingRowData.segments.forEach(segment => {
      points.push({ x: segment.startX, y: segment.startY });
      points.push({ x: segment.endX, y: segment.endY });
    });

    let currentMinX = Infinity, currentMinY = Infinity, currentMaxX = -Infinity, currentMaxY = -Infinity;
    points.forEach(p => {
      currentMinX = Math.min(currentMinX, p.x);
      currentMinY = Math.min(currentMinY, p.y);
      currentMaxX = Math.max(currentMaxX, p.x);
      currentMaxY = Math.max(currentMaxY, p.y);
    });

    const centerX = (currentMinX + currentMaxX) / 2;
    const centerY = (currentMinY + currentMaxY) / 2;
    const rotation = this.seatingRowData.rotation || 0;
    const angle = -rotation * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const unrotatedPoints = points.map(p => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      return {
        x: dx * cosA - dy * sinA + centerX,
        y: dx * sinA + dy * cosA + centerY,
      };
    });

    let unrotatedMinX = Infinity, unrotatedMinY = Infinity, unrotatedMaxX = -Infinity, unrotatedMaxY = -Infinity;
    unrotatedPoints.forEach(p => {
      unrotatedMinX = Math.min(unrotatedMinX, p.x);
      unrotatedMinY = Math.min(unrotatedMinY, p.y);
      unrotatedMaxX = Math.max(unrotatedMaxX, p.x);
      unrotatedMaxY = Math.max(unrotatedMaxY, p.y);
    });
    
    const padding = 25;
    unrotatedMinX -= padding;
    unrotatedMinY -= padding;
    unrotatedMaxX += padding;
    unrotatedMaxY += padding;

    return { 
      minX: unrotatedMinX, 
      minY: unrotatedMinY, 
      maxX: unrotatedMaxX, 
      maxY: unrotatedMaxY,
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
      transform: `translate(-50%, -50%) rotate(${this.seatingRowData.rotation || 0}deg)`,
      transformOrigin: 'center center'
    };
  }
} 