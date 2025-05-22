import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoundTableProperties, ChairProperties } from '../../services/selection.service';
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
  chairLabelVisible: boolean;
  [key: string]: any;
}

interface ChairPropertiesForm {
  label: string;
  price: number;
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
  
  tableProperties: TablePropertiesForm = {
    seats: 8,
    openSpaces: 0,
    rotation: 0,
    name: '1',
    tableLabelVisible: true,
    chairLabelVisible: true
  };

  chairProperties: ChairPropertiesForm = {
    label: '1',
    price: 0
  };

  private disposer: IReactionDisposer | null = null;

  constructor() {}

  ngOnInit(): void {
    this.disposer = autorun(() => {
      const selectedItem = this.selectionStore.selectedItem;
      
      if (selectedItem?.type === 'roundTable') {
        const roundTable = selectedItem as RoundTableProperties;
        this.tableProperties = {
          seats: roundTable.seats || 8,
          openSpaces: roundTable.openSpaces || 0, 
          rotation: roundTable.rotation || 0,
          name: roundTable.name || '1',
          tableLabelVisible: roundTable.tableLabelVisible !== undefined ? roundTable.tableLabelVisible : true,
          chairLabelVisible: roundTable.chairLabelVisible !== undefined ? roundTable.chairLabelVisible : true
        };
      } else if (selectedItem?.type === 'chair') {
        this.chairProperties = {
          label: selectedItem.label || '1',
          price: selectedItem.price || 0
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
    
    if (this.selectionStore.selectedItem.type === 'roundTable') {
      const updates: any = {};
      updates[property] = value;
      this.layoutStore.updateElement(this.selectionStore.selectedItem.id, updates);
    }
  }

  updateChairProperty(property: string, value: any): void {
    const selectedItem = this.selectionStore.selectedItem;
    if (!selectedItem || selectedItem.type !== 'chair') return;

    const table = this.layoutStore.elements.find(t => t.id === selectedItem.tableId);
    if (!table) return;

    const chairIndex = table.chairs.findIndex(c => c.id === selectedItem.id);
    if (chairIndex === -1) return;

    const updatedChairs = [...table.chairs];
    updatedChairs[chairIndex] = {
      ...updatedChairs[chairIndex],
      [property]: value
    };

    this.layoutStore.updateElement(table.id, { chairs: updatedChairs });
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
    this.tableProperties.rotation = (this.tableProperties.rotation + 15) % 360;
    this.updateProperty('rotation', this.tableProperties.rotation);
  }

  decrementRotation(): void {
    this.tableProperties.rotation = (this.tableProperties.rotation - 15 + 360) % 360;
    this.updateProperty('rotation', this.tableProperties.rotation);
  }

  deleteElement(): void {
    if (this.selectionStore.selectedItem && confirm('Are you sure you want to delete this element?')) {
      const itemId = this.selectionStore.selectedItem.id;
      this.layoutStore.deleteElement(itemId);
      this.selectionStore.deselectItem();
    }
  }
  
  get selectedItem() {
    return this.selectionStore.selectedItem;
  }
}