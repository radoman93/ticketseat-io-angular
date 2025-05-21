import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionService, Selectable, RoundTableProperties } from '../../services/selection.service';
import { Subscription } from 'rxjs';

interface TablePropertiesForm {
  seats: number;
  openSpaces: number;
  rotation: number;
  name: string;
  tableVisible: boolean;
  chairsVisible: boolean;
  [key: string]: any; // Index signature to allow property access via string
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.css'
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  selectedItem: Selectable | null = null;
  private subscription: Subscription = new Subscription();

  // Copy of the properties for two-way binding
  tableProperties: TablePropertiesForm = {
    seats: 8,
    openSpaces: 0,
    rotation: 0,
    name: '1',
    tableVisible: true,
    chairsVisible: true
  };

  constructor(public selectionService: SelectionService) {}

  ngOnInit(): void {
    console.log('PropertiesPanelComponent initialized');
    
    this.subscription = this.selectionService.selectedItem$.subscribe(item => {
      console.log('Selected item changed:', item);
      this.selectedItem = item;
      
      if (item && item.type === 'roundTable') {
        console.log('Initializing properties for round table');
        const roundTable = item as RoundTableProperties;
        // Initialize the properties from the selected item
        this.tableProperties = {
          seats: roundTable.seats || 8,
          openSpaces: 0, // Default value since it's not in our current model
          rotation: roundTable.rotation || 0, // Use the item's rotation if available
          name: roundTable.name || '1',
          tableVisible: true, // Default value
          chairsVisible: true // Default value
        };
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  updateProperty(property: string, value: any): void {
    if (!this.selectedItem) return;
    
    // Update the copy
    this.tableProperties[property] = value;
    
    // Update the actual item based on its type
    if (this.selectedItem.type === 'roundTable') {
      const roundTable = this.selectedItem as RoundTableProperties;
      
      if (property === 'seats') {
        roundTable.seats = value;
      } else if (property === 'name') {
        roundTable.name = value;
      } else if (property === 'rotation') {
        roundTable.rotation = value;
      }
      
      // Other properties would be handled here
    }
  }

  deleteElement(): void {
    // Use the deletion service to request deletion
    if (this.selectedItem && confirm('Are you sure you want to delete this element?')) {
      this.selectionService.requestDeleteItem(this.selectedItem);
    }
  }
} 