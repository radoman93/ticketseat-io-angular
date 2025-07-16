import { action, runInAction } from 'mobx';
import { layoutStore } from './layout.store';
import { selectionStore } from './selection.store';
import { LoggerService } from '../services/logger.service';

/**
 * TransactionManager handles complex multi-step operations
 * that need to be treated as a single transaction.
 */
export class TransactionManager {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
  }

  /**
   * Add multiple tables at once in a single transaction
   */
  @action
  bulkAddTables(tables: any[]) {

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

      return addedTables;
    } catch (error) {
      this.logger.error('Failed to add tables in bulk', error instanceof Error ? error : new Error(String(error)), { store: 'TransactionManager', action: 'bulkAddTables', tableCount: tables.length });
      throw error;
    }
  }

  /**
   * Move multiple elements at once
   */
  @action
  moveMultipleElements(elementsWithNewPositions: { id: string, x: number, y: number }[]) {

    try {
      runInAction(() => {
        for (const { id, x, y } of elementsWithNewPositions) {
          layoutStore.updateElement(id, { x, y });
        }
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to move multiple elements', error instanceof Error ? error : new Error(String(error)), { store: 'TransactionManager', action: 'moveMultipleElements', elementCount: elementsWithNewPositions.length });
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
      this.logger.warn('Nothing selected to duplicate', { store: 'TransactionManager', action: 'duplicateSelection' });
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
      this.logger.error('Failed to duplicate selection', error instanceof Error ? error : new Error(String(error)), { store: 'TransactionManager', action: 'duplicateSelection', selectedItemId: selectedItem ? (selectedItem as any).id : null });
      throw error;
    }
  }

  /**
   * Delete multiple elements at once
   */
  @action
  deleteMultipleElements(ids: string[]) {

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
      this.logger.error('Failed to delete multiple elements', error instanceof Error ? error : new Error(String(error)), { store: 'TransactionManager', action: 'deleteMultipleElements', elementCount: ids.length });
      throw error;
    }
  }

  /**
   * Align multiple elements to a grid
   */
  @action
  alignElementsToGrid(gridSize: number) {

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
      this.logger.error('Failed to align elements to grid', error instanceof Error ? error : new Error(String(error)), { store: 'TransactionManager', action: 'alignElementsToGrid', gridSize, elementCount: layoutStore.elements.length });
      throw error;
    }
  }
}

// Create singleton instance
export const transactionManager = new TransactionManager(); 