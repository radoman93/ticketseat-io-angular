import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoundTableProperties } from '../../services/selection.service';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer } from 'mobx';

interface TablePropertiesForm {
  seats: number;
  openSpaces: number;
  rotation: number;
  name: string;
  tableLabelVisible: boolean;
  chairsVisible: boolean;
  [key: string]: any; // Index signature to allow property access via string
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MobxAngularModule],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.css'
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  // Reference to MobX stores
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  
  // Copy of the properties for two-way binding
  tableProperties: TablePropertiesForm = {
    seats: 8,
    openSpaces: 0,
    rotation: 0,
    name: '1',
    tableLabelVisible: true,
    chairsVisible: true
  };

  // MobX reaction disposer
  private disposer: IReactionDisposer | null = null;

  constructor() {}

  ngOnInit(): void {
    console.log('PropertiesPanelComponent initialized');
    
    // Use MobX autorun to react to selection changes
    this.disposer = autorun(() => {
      const selectedItem = this.selectionStore.selectedItem;
      console.log('Selected item changed:', selectedItem);
      
      if (selectedItem && selectedItem.type === 'roundTable') {
        console.log('Initializing properties for round table');
        const roundTable = selectedItem as RoundTableProperties;
        // Initialize the properties from the selected item
        this.tableProperties = {
          seats: roundTable.seats || 8,
          openSpaces: 0, // Default value since it's not in our current model
          rotation: roundTable.rotation || 0, // Use the item's rotation if available
          name: roundTable.name || '1',
          tableLabelVisible: roundTable.tableLabelVisible !== undefined ? roundTable.tableLabelVisible : true,
          chairsVisible: true // Default value
        };
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up MobX reactions
    if (this.disposer) {
      this.disposer();
    }
  }

  updateProperty(property: string, value: any): void {
    if (!this.selectionStore.selectedItem) return;
    
    // Update the copy
    this.tableProperties[property] = value;
    
    // Update the actual item using MobX store
    if (this.selectionStore.selectedItem.type === 'roundTable') {
      const updates: any = {};
      updates[property] = value;
      
      // Use the layout store to update the element
      this.layoutStore.updateElement(this.selectionStore.selectedItem.id, updates);
    }
  }

  incrementChairs(): void {
    if (this.tableProperties.seats < 20) {
      this.tableProperties.seats++;
      this.updateProperty('seats', this.tableProperties.seats);
    }
  }

  decrementChairs(): void {
    if (this.tableProperties.seats > 4) {
      this.tableProperties.seats--;
      this.updateProperty('seats', this.tableProperties.seats);
    }
  }

  incrementOpenSpaces(): void {
    if (this.tableProperties.openSpaces < 20) {
      this.tableProperties.openSpaces++;
      this.updateProperty('openSpaces', this.tableProperties.openSpaces);
    }
  }

  decrementOpenSpaces(): void {
    if (this.tableProperties.openSpaces > 0) {
      this.tableProperties.openSpaces--;
      this.updateProperty('openSpaces', this.tableProperties.openSpaces);
    }
  }

  incrementRotation(): void {
    // Increment by 15 degrees
    this.tableProperties.rotation = (this.tableProperties.rotation + 15) % 360;
    this.updateProperty('rotation', this.tableProperties.rotation);
  }

  decrementRotation(): void {
    // Decrement by 15 degrees, keeping it within 0-359
    this.tableProperties.rotation = (this.tableProperties.rotation - 15 + 360) % 360;
    this.updateProperty('rotation', this.tableProperties.rotation);
  }

  deleteElement(): void {
    // Use MobX store to delete the element
    if (this.selectionStore.selectedItem && confirm('Are you sure you want to delete this element?')) {
      const itemId = this.selectionStore.selectedItem.id;
      this.layoutStore.deleteElement(itemId);
      this.selectionStore.deselectItem();
    }
  }
  
  // Getter for template
  get selectedItem() {
    return this.selectionStore.selectedItem;
  }
} 