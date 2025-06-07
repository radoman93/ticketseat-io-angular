import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties } from '../../services/selection.service';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer } from 'mobx';
import { HistoryStore } from '../../stores/history.store';
import { DeleteObjectCommand } from '../../commands/delete-object.command';

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

  private disposer: IReactionDisposer | null = null;

  constructor(private historyStore: HistoryStore) {}

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
    const selectedItem = this.selectionStore.getSelectedItem();
    if (selectedItem) {
      const command = new DeleteObjectCommand(selectedItem);
      this.historyStore.executeCommand(command);
    }
  }
  
  get selectedItem() {
    return this.selectionStore.selectedItem;
  }

  get totalChairsRect(): number {
    return this.rectangleTableProperties.upChairs + 
           this.rectangleTableProperties.downChairs + 
           this.rectangleTableProperties.leftChairs + 
           this.rectangleTableProperties.rightChairs;
  }
} 