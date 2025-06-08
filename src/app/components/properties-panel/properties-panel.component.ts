import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties, SegmentProperties } from '../../services/selection.service';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer } from 'mobx';
import { HistoryStore } from '../../stores/history.store';
import { DeleteObjectCommand } from '../../commands/delete-object.command';
import { SegmentedSeatingRowService } from '../../services/segmented-seating-row.service';

interface RoundTablePropertiesForm {
  seats: number;
  openSpaces: number;
  radius: number;
  rotation: number;
  name: string;
  tableLabelVisible: boolean;
  chairLabelVisible: boolean;
}

interface RectangleTablePropertiesForm {
  width: number;
  height: number;
  upChairs: number;
  downChairs: number;
  leftChairs: number;
  rightChairs: number;
  rotation: number;
  name: string;
  tableLabelVisible: boolean;
  chairLabelVisible: boolean;
}

interface SeatingRowPropertiesForm {
  seatCount: number;
  seatSpacing: number;
  name: string;
  chairLabelVisible: boolean;
  rowLabelVisible: boolean;
  labelPosition: 'left' | 'center' | 'right';
}

interface SegmentedSeatingRowPropertiesForm {
  seatSpacing: number;
  name: string;
  chairLabelVisible: boolean;
  rowLabelVisible: boolean;
  labelPosition: 'left' | 'center' | 'right';
  totalSegments: number;
  totalSeats: number;
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MobxAngularModule],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.css'
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  
  roundTableProperties: RoundTablePropertiesForm = {
    seats: 8,
    openSpaces: 0,
    radius: 50,
    rotation: 0,
    name: '1',
    tableLabelVisible: true,
    chairLabelVisible: true
  };

  rectangleTableProperties: RectangleTablePropertiesForm = {
    width: 120,
    height: 80,
    upChairs: 4,
    downChairs: 4,
    leftChairs: 0,
    rightChairs: 0,
    rotation: 0,
    name: '1',
    tableLabelVisible: true,
    chairLabelVisible: true
  };

  seatingRowProperties: SeatingRowPropertiesForm = {
    seatCount: 1,
    seatSpacing: 35,
    name: '1',
    chairLabelVisible: true,
    rowLabelVisible: true,
    labelPosition: 'left'
  };
  
  segmentedSeatingRowProperties: SegmentedSeatingRowPropertiesForm = {
    seatSpacing: 35,
    name: '1',
    chairLabelVisible: true,
    rowLabelVisible: true,
    labelPosition: 'left',
    totalSegments: 0,
    totalSeats: 0
  };
  
  // Store segments for the selected segmented row
  segmentsList: SegmentProperties[] = [];

  private disposer: IReactionDisposer | null = null;

  constructor(
    private historyStore: HistoryStore,
    private segmentedSeatingRowService: SegmentedSeatingRowService
  ) {}

  ngOnInit(): void {
    this.disposer = autorun(() => {
      const selectedItem = this.selectionStore.selectedItem;
      
      if (selectedItem?.type === 'roundTable') {
        const roundTable = selectedItem as RoundTableProperties;
        this.roundTableProperties = {
          seats: roundTable.seats || 8,
          openSpaces: roundTable.openSpaces || 0,
          radius: roundTable.radius || 50,
          rotation: roundTable.rotation || 0,
          name: roundTable.name || '1',
          tableLabelVisible: roundTable.tableLabelVisible !== undefined ? roundTable.tableLabelVisible : true,
          chairLabelVisible: roundTable.chairLabelVisible !== undefined ? roundTable.chairLabelVisible : true
        };
      } else if (selectedItem?.type === 'rectangleTable') {
        const rectangleTable = selectedItem as RectangleTableProperties;
        this.rectangleTableProperties = {
          width: rectangleTable.width || 120,
          height: rectangleTable.height || 80,
          upChairs: rectangleTable.upChairs || 4,
          downChairs: rectangleTable.downChairs || 4,
          leftChairs: rectangleTable.leftChairs || 0,
          rightChairs: rectangleTable.rightChairs || 0,
          rotation: rectangleTable.rotation || 0,
          name: rectangleTable.name || '1',
          tableLabelVisible: rectangleTable.tableLabelVisible !== undefined ? rectangleTable.tableLabelVisible : true,
          chairLabelVisible: rectangleTable.chairLabelVisible !== undefined ? rectangleTable.chairLabelVisible : true
        };
      } else if (selectedItem?.type === 'seatingRow') {
        const seatingRow = selectedItem as SeatingRowProperties;
        this.seatingRowProperties = {
          seatCount: seatingRow.seatCount,
          seatSpacing: seatingRow.seatSpacing,
          name: seatingRow.name,
          chairLabelVisible: seatingRow.chairLabelVisible !== undefined ? seatingRow.chairLabelVisible : true,
          rowLabelVisible: seatingRow.rowLabelVisible !== undefined ? seatingRow.rowLabelVisible : true,
          labelPosition: seatingRow.labelPosition || 'left'
        };
      } else if (selectedItem?.type === 'segmentedSeatingRow') {
        const segmentedRow = selectedItem as SeatingRowProperties;
        this.segmentedSeatingRowProperties = {
          seatSpacing: segmentedRow.seatSpacing,
          name: segmentedRow.name,
          chairLabelVisible: segmentedRow.chairLabelVisible !== undefined ? segmentedRow.chairLabelVisible : true,
          rowLabelVisible: segmentedRow.rowLabelVisible !== undefined ? segmentedRow.rowLabelVisible : true,
          labelPosition: segmentedRow.labelPosition || 'left',
          totalSegments: segmentedRow.totalSegments || 0,
          totalSeats: segmentedRow.totalSeats || 0
        };
        
        // Store segments for display in the UI
        this.segmentsList = segmentedRow.segments || [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.disposer) {
      this.disposer();
    }
  }

  updateProperty(property: string, value: any): void {
    if (!this.selectionStore.selectedItem) return;
    
    // Validate numeric inputs
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }

    // Apply min/max constraints for specific properties
    if (property === 'seatCount') {
      value = Math.max(1, Math.min(50, value));
    } else if (property === 'seatSpacing') {
      value = Math.max(20, Math.min(100, value));
    }
    
    const updates: any = {};
    updates[property] = value;
    this.layoutStore.updateElement(this.selectionStore.selectedItem.id, updates);
  }
  
  // Update segment property
  updateSegmentProperty(segmentIndex: number, property: string, value: any): void {
    if (!this.selectionStore.selectedItem) return;
    
    // Validate numeric inputs
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }
    
    // Get current segments
    const selectedItem = this.selectionStore.selectedItem as SeatingRowProperties;
    if (!selectedItem.segments) return;
    
    // Create a copy of the segments array
    const updatedSegments = [...selectedItem.segments];
    
    // Update the specific segment property
    updatedSegments[segmentIndex] = {
      ...updatedSegments[segmentIndex],
      [property]: value
    };
    
    // Update the total seats count if needed
    if (property === 'seatCount') {
      const metrics = this.segmentedSeatingRowService.calculateSegmentedRowMetrics(updatedSegments);
      
      // Update the element with both segments and the new metrics
      this.layoutStore.updateElement(selectedItem.id, {
        segments: updatedSegments,
        totalSeats: metrics.totalSeats
      });
    } else {
      // Just update the segments
      this.layoutStore.updateElement(selectedItem.id, { segments: updatedSegments });
    }
  }

  // Add a new segment to the end of the segmented row
  addSegment(): void {
    if (!this.selectionStore.selectedItem) return;
    const segmentedRow = this.selectionStore.selectedItem as SeatingRowProperties;
    
    if (!segmentedRow.segments || segmentedRow.segments.length === 0) return;
    
    // Get the last segment
    const lastSegment = segmentedRow.segments[segmentedRow.segments.length - 1];
    
    // Calculate the end position of the last segment
    const lastSegmentEnd = this.segmentedSeatingRowService.calculateSegmentEndPosition(lastSegment);
    
    // Create a new segment starting from the end of the last segment
    const newSegment = this.segmentedSeatingRowService.createSegment(
      segmentedRow.id,
      segmentedRow.segments.length,
      lastSegmentEnd.x,
      lastSegmentEnd.y,
      lastSegmentEnd.x + 100, // Add some distance in x direction
      lastSegmentEnd.y + 50,  // Add some distance in y direction
      segmentedRow.seatSpacing || 35
    );
    
    // Add the new segment to the array
    const updatedSegments = [...segmentedRow.segments, newSegment];
    
    // Update metrics
    const metrics = this.segmentedSeatingRowService.calculateSegmentedRowMetrics(updatedSegments);
    
    // Update the element
    this.layoutStore.updateElement(segmentedRow.id, {
      segments: updatedSegments,
      totalSegments: metrics.totalSegments,
      totalSeats: metrics.totalSeats
    });
  }
  
  // Remove a segment
  removeSegment(segmentIndex: number): void {
    if (!this.selectionStore.selectedItem) return;
    const segmentedRow = this.selectionStore.selectedItem as SeatingRowProperties;
    
    if (!segmentedRow.segments || segmentedRow.segments.length <= 1) {
      // Don't allow removing the only segment
      return;
    }
    
    // Remove the segment and update indices
    const updatedSegments = segmentedRow.segments.filter((_, index) => index !== segmentIndex)
      .map((segment, newIndex) => ({
        ...segment,
        segmentIndex: newIndex
      }));
    
    // Update metrics
    const metrics = this.segmentedSeatingRowService.calculateSegmentedRowMetrics(updatedSegments);
    
    // Update the element
    this.layoutStore.updateElement(segmentedRow.id, {
      segments: updatedSegments,
      totalSegments: metrics.totalSegments,
      totalSeats: metrics.totalSeats
    });
  }
  
  // Convert segmented row to regular seating row
  convertToRegular(): void {
    if (!this.selectionStore.selectedItem) return;
    const segmentedRow = this.selectionStore.selectedItem as SeatingRowProperties;
    
    // Use the service to convert to regular row
    const regularRow = this.segmentedSeatingRowService.convertToRegular(segmentedRow);
    
    // Update element with the converted properties
    this.layoutStore.updateElement(segmentedRow.id, {
      ...regularRow,
      type: 'seatingRow' // Change the type
    });
  }

  // Round Table Methods
  incrementChairs(): void {
    if (this.roundTableProperties.seats < 20) {
      this.roundTableProperties.seats++;
      this.updateProperty('seats', this.roundTableProperties.seats);
    }
  }

  decrementChairs(): void {
    if (this.roundTableProperties.seats > 4) {
      this.roundTableProperties.seats--;
      this.updateProperty('seats', this.roundTableProperties.seats);
    }
  }

  incrementOpenSpaces(): void {
    if (this.roundTableProperties.openSpaces < 20) {
      this.roundTableProperties.openSpaces++;
      this.updateProperty('openSpaces', this.roundTableProperties.openSpaces);
    }
  }

  decrementOpenSpaces(): void {
    if (this.roundTableProperties.openSpaces > 0) {
      this.roundTableProperties.openSpaces--;
      this.updateProperty('openSpaces', this.roundTableProperties.openSpaces);
    }
  }

  incrementRadius(): void {
    if (this.roundTableProperties.radius < 100) {
      this.roundTableProperties.radius += 5;
      this.updateProperty('radius', this.roundTableProperties.radius);
    }
  }

  decrementRadius(): void {
    if (this.roundTableProperties.radius > 20) {
      this.roundTableProperties.radius -= 5;
      this.updateProperty('radius', this.roundTableProperties.radius);
    }
  }

  // Rectangle Table Methods
  incrementWidth(): void {
    if (this.rectangleTableProperties.width < 300) {
      this.rectangleTableProperties.width += 10;
      this.updateProperty('width', this.rectangleTableProperties.width);
    }
  }

  decrementWidth(): void {
    if (this.rectangleTableProperties.width > 60) {
      this.rectangleTableProperties.width -= 10;
      this.updateProperty('width', this.rectangleTableProperties.width);
    }
  }

  incrementHeight(): void {
    if (this.rectangleTableProperties.height < 200) {
      this.rectangleTableProperties.height += 10;
      this.updateProperty('height', this.rectangleTableProperties.height);
    }
  }

  decrementHeight(): void {
    if (this.rectangleTableProperties.height > 40) {
      this.rectangleTableProperties.height -= 10;
      this.updateProperty('height', this.rectangleTableProperties.height);
    }
  }

  incrementUpChairs(): void {
    if (this.rectangleTableProperties.upChairs < 20) {
      this.rectangleTableProperties.upChairs++;
      this.updateProperty('upChairs', this.rectangleTableProperties.upChairs);
    }
  }

  decrementUpChairs(): void {
    if (this.rectangleTableProperties.upChairs > 0) {
      this.rectangleTableProperties.upChairs--;
      this.updateProperty('upChairs', this.rectangleTableProperties.upChairs);
    }
  }

  incrementDownChairs(): void {
    if (this.rectangleTableProperties.downChairs < 20) {
      this.rectangleTableProperties.downChairs++;
      this.updateProperty('downChairs', this.rectangleTableProperties.downChairs);
    }
  }

  decrementDownChairs(): void {
    if (this.rectangleTableProperties.downChairs > 0) {
      this.rectangleTableProperties.downChairs--;
      this.updateProperty('downChairs', this.rectangleTableProperties.downChairs);
    }
  }

  incrementLeftChairs(): void {
    if (this.rectangleTableProperties.leftChairs < 20) {
      this.rectangleTableProperties.leftChairs++;
      this.updateProperty('leftChairs', this.rectangleTableProperties.leftChairs);
    }
  }

  decrementLeftChairs(): void {
    if (this.rectangleTableProperties.leftChairs > 0) {
      this.rectangleTableProperties.leftChairs--;
      this.updateProperty('leftChairs', this.rectangleTableProperties.leftChairs);
    }
  }

  incrementRightChairs(): void {
    if (this.rectangleTableProperties.rightChairs < 20) {
      this.rectangleTableProperties.rightChairs++;
      this.updateProperty('rightChairs', this.rectangleTableProperties.rightChairs);
    }
  }

  decrementRightChairs(): void {
    if (this.rectangleTableProperties.rightChairs > 0) {
      this.rectangleTableProperties.rightChairs--;
      this.updateProperty('rightChairs', this.rectangleTableProperties.rightChairs);
    }
  }

  // Common Methods
  incrementRotation(): void {
    const currentRotation = this.selectedItem?.type === 'roundTable' 
      ? this.roundTableProperties.rotation 
      : this.rectangleTableProperties.rotation;
    
    const newRotation = (currentRotation + 15) % 360;
    
    if (this.selectedItem?.type === 'roundTable') {
      this.roundTableProperties.rotation = newRotation;
    } else {
      this.rectangleTableProperties.rotation = newRotation;
    }
    
    this.updateProperty('rotation', newRotation);
  }

  decrementRotation(): void {
    const currentRotation = this.selectedItem?.type === 'roundTable' 
      ? this.roundTableProperties.rotation 
      : this.rectangleTableProperties.rotation;
    
    const newRotation = (currentRotation - 15 + 360) % 360;
    
    if (this.selectedItem?.type === 'roundTable') {
      this.roundTableProperties.rotation = newRotation;
    } else {
      this.rectangleTableProperties.rotation = newRotation;
    }
    
    this.updateProperty('rotation', newRotation);
  }

  deleteElement(): void {
    if (this.selectionStore.selectedItem) {
      const cmd = new DeleteObjectCommand(this.selectionStore.selectedItem);
      this.historyStore.executeCommand(cmd);
    }
  }
  
  get selectedItem() {
    return this.selectionStore.selectedItem;
  }

  get totalChairsRect(): number {
    return this.rectangleTableProperties.upChairs + this.rectangleTableProperties.downChairs + 
           this.rectangleTableProperties.leftChairs + this.rectangleTableProperties.rightChairs;
  }

  // Helper method to safely handle input event
  handleInputChange(segmentIndex: number, property: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      this.updateSegmentProperty(segmentIndex, property, inputElement.value);
    }
  }
} 