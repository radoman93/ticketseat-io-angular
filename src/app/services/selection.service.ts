import { Injectable } from '@angular/core';
import { selectionStore } from '../stores/selection.store';
import { layoutStore } from '../stores/layout.store';

export interface Selectable {
  id: string;
  type: string;
  [key: string]: any; // Index signature to allow for additional properties
}

export interface RoundTableProperties extends Selectable {
  x: number;
  y: number;
  radius: number;
  seats: number;
  openSpaces: number;
  name: string;
  rotation?: number;
}

/**
 * Selection service that acts as a bridge to the MobX selection store
 * This allows for a smoother transition from RxJS to MobX
 */
@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() { }

  /**
   * Select an item - delegates to MobX store
   */
  selectItem(item: Selectable): void {
    console.log('SelectionService: selectItem called with', item);
    selectionStore.selectItem(item);
  }

  /**
   * Deselect the current item - delegates to MobX store
   */
  deselectItem(): void {
    console.log('SelectionService: deselectItem called');
    selectionStore.deselectItem();
  }

  /**
   * Get the currently selected item - delegates to MobX store
   */
  getSelectedItem(): Selectable | null {
    return selectionStore.selectedItem;
  }

  /**
   * Check if a specific item is selected - delegates to MobX store
   */
  isItemSelected(itemId: string): boolean {
    return selectionStore.isItemSelected(itemId);
  }
  
  /**
   * Request to delete the currently selected item - now uses MobX directly
   */
  requestDeleteItem(item: Selectable): void {
    // Delete the item and deselect it
    layoutStore.deleteElement(item.id);
    selectionStore.deselectItem();
  }
} 