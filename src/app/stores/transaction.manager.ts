import { action, runInAction } from 'mobx';
import { layoutStore } from './layout.store';
import { selectionStore } from './selection.store';

/**
 * TransactionManager handles complex multi-step operations
 * that need to be treated as a single transaction.
 */
export class TransactionManager {
  constructor() {
    // Nothing to observe, this is a pure action manager
  }

  /**
   * Add multiple tables at once in a single transaction
   */
  @action
  bulkAddTables(tables: any[]) {
    console.log(`TransactionManager: Adding ${tables.length} tables in bulk`);
    
    try {
      // Start transaction by suspending observers
      const addedTables: any[] = [];
      
      runInAction(() => {
        // Add all tables at once
        for (const tableData of tables) {
          const newTable = layoutStore.addElement(tableData);
          addedTables.push(newTable);
        }
      });
      
      console.log(`TransactionManager: Successfully added ${addedTables.length} tables`);
      return addedTables;
    } catch (error) {
      console.error('TransactionManager: Failed to add tables in bulk', error);
      throw error;
    }
  }

  /**
   * Move multiple elements at once
   */
  @action
  moveMultipleElements(elementsWithNewPositions: { id: string, x: number, y: number }[]) {
    console.log(`TransactionManager: Moving ${elementsWithNewPositions.length} elements at once`);
    
    try {
      runInAction(() => {
        for (const { id, x, y } of elementsWithNewPositions) {
          layoutStore.updateElement(id, { x, y });
        }
      });
      
      return true;
    } catch (error) {
      console.error('TransactionManager: Failed to move multiple elements', error);
      throw error;
    }
  }

  /**
   * Duplicate selection with offset
   */
  @action
  duplicateSelection(offsetX: number = 50, offsetY: number = 50) {
    const selectedItem = selectionStore.selectedItem;
    if (!selectedItem) {
      console.warn('TransactionManager: Nothing selected to duplicate');
      return null;
    }
    
    try {
      let newElement;
      
      runInAction(() => {
        // Clone the selected item
        const clone: Record<string, any> = { ...selectedItem };
        
        // Remove the id so a new one is generated
        if ('id' in clone) {
          delete clone['id'];
        }
        
        // Apply offset
        clone['x'] = (clone['x'] || 0) + offsetX;
        clone['y'] = (clone['y'] || 0) + offsetY;
        
        // Add the clone
        newElement = layoutStore.addElement(clone as any);
        
        // Select the new element
        selectionStore.selectItem(newElement);
      });
      
      return newElement;
    } catch (error) {
      console.error('TransactionManager: Failed to duplicate selection', error);
      throw error;
    }
  }

  /**
   * Delete multiple elements at once
   */
  @action
  deleteMultipleElements(ids: string[]) {
    console.log(`TransactionManager: Deleting ${ids.length} elements at once`);
    
    try {
      runInAction(() => {
        for (const id of ids) {
          layoutStore.deleteElement(id);
        }
        
        // Deselect if the current selection was deleted
        if (selectionStore.selectedItem && ids.includes(selectionStore.selectedItem['id'])) {
          selectionStore.deselectItem();
        }
      });
      
      return true;
    } catch (error) {
      console.error('TransactionManager: Failed to delete multiple elements', error);
      throw error;
    }
  }

  /**
   * Align multiple elements to a grid
   */
  @action
  alignElementsToGrid(gridSize: number) {
    console.log(`TransactionManager: Aligning elements to grid of size ${gridSize}`);
    
    try {
      const elements = layoutStore.elements;
      
      runInAction(() => {
        for (const element of elements) {
          // Round to nearest grid point
          const newX = Math.round(element.x / gridSize) * gridSize;
          const newY = Math.round(element.y / gridSize) * gridSize;
          
          layoutStore.updateElement(element['id'], { x: newX, y: newY });
        }
      });
      
      return true;
    } catch (error) {
      console.error('TransactionManager: Failed to align elements to grid', error);
      throw error;
    }
  }
}

// Create singleton instance
export const transactionManager = new TransactionManager(); 