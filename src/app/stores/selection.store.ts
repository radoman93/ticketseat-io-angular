import { makeAutoObservable, action } from 'mobx';
import { Selectable } from '../services/selection.service';

export class SelectionStore {
  selectedItem: Selectable | null = null;
  private deleteHandlers: ((item: Selectable) => void)[] = [];
  
  constructor() {
    makeAutoObservable(this, {
      // Specify computed properties explicitly
      hasSelection: true,
      registerDeleteHandler: false,
      unregisterDeleteHandler: false,
      // Explicitly mark actions
      selectItem: action,
      deselectItem: action,
      requestDeleteItem: action,
      deleteSelectedItem: action
    });
  }
  
  selectItem = action('selectItem', (item: Selectable) => {
    this.selectedItem = item;
  });
  
  deselectItem = action('deselectItem', () => {
    this.selectedItem = null;
  });
  
  isItemSelected(itemId: string): boolean {
    return this.selectedItem?.id === itemId;
  }
  
  getSelectedItem(): Selectable | null {
    return this.selectedItem;
  }
  
  // Computed property to check if there's a selection
  get hasSelection(): boolean {
    return this.selectedItem !== null;
  }
  
  // Delete functionality
  requestDeleteItem = action('requestDeleteItem', (item: Selectable) => {
    // Notify all registered handlers
    this.deleteHandlers.forEach(handler => handler(item));
    
    // Deselect after delete
    this.deselectItem();
  });
  
  // Method to delete currently selected item
  deleteSelectedItem = action('deleteSelectedItem', () => {
    if (this.selectedItem) {
      this.requestDeleteItem(this.selectedItem);
    }
  });
  
  // Allow components to register delete handlers
  registerDeleteHandler(handler: (item: Selectable) => void): void {
    this.deleteHandlers.push(handler);
  }
  
  // Allow components to unregister delete handlers
  unregisterDeleteHandler(handler: (item: Selectable) => void): void {
    const index = this.deleteHandlers.indexOf(handler);
    if (index !== -1) {
      this.deleteHandlers.splice(index, 1);
    }
  }
}

// Create singleton instance
export const selectionStore = new SelectionStore(); 