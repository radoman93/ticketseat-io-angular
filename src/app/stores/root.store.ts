import { makeAutoObservable, action } from 'mobx';
import { LayoutStore, layoutStore } from './layout.store';
import { SelectionStore, selectionStore } from './selection.store';
import { ToolStore, toolStore } from './tool.store';
import { GridStore, gridStore } from './grid.store';
import { ChairStore, chairStore } from './chair.store';
import { LayoutMetricsStore, layoutMetricsStore } from './derived/layout-metrics.store';
import { TransactionManager, transactionManager } from './transaction.manager';
import { PersistenceManager, persistenceManager } from './persistence.manager';

/**
 * RootStore combines all the individual stores and provides
 * a single access point for cross-store operations.
 */
export class RootStore {
  // Core stores
  layoutStore: LayoutStore;
  selectionStore: SelectionStore;
  toolStore: ToolStore;
  gridStore: GridStore;
  chairStore: ChairStore;
  
  // Derived stores
  layoutMetricsStore: LayoutMetricsStore;
  
  // Managers
  transactionManager: TransactionManager;
  persistenceManager: PersistenceManager;
  
  constructor() {
    // Use existing singleton stores
    this.layoutStore = layoutStore;
    this.selectionStore = selectionStore;
    this.toolStore = toolStore;
    this.gridStore = gridStore;
    this.chairStore = chairStore;
    
    // Derived stores
    this.layoutMetricsStore = layoutMetricsStore;
    
    // Managers
    this.transactionManager = transactionManager;
    this.persistenceManager = persistenceManager;
    
    makeAutoObservable(this, {
      // Explicitly mark actions
      resetState: action,
      addAndSelectElement: action,
      
      // Mark managers as non-observable (they handle their own state)
      transactionManager: false,
      persistenceManager: false
    });
    
    // Set up cross-store interactions
    this.setupInteractions();
  }
  
  private setupInteractions() {
    // When selection changes, update the UI
    this.selectionStore.registerDeleteHandler((item) => {
      this.layoutStore.deleteElement(item.id);
    });
  }
  
  // Helper method to reset application state
  resetState = action('resetState', () => {
    console.log('RootStore: Resetting application state');
    this.selectionStore.deselectItem();
    this.toolStore.setActiveTool('select' as any); // Use 'select' instead of 'none'
    this.layoutStore.clearAll();
  });
  
  // Add a new element and select it
  addAndSelectElement = action('addAndSelectElement', (element: any) => {
    const newElement = this.layoutStore.addElement(element);
    this.selectionStore.selectItem(newElement);
    return newElement;
  });
  
  // Create multiple tables in a grid layout
  createTableGrid = action('createTableGrid', (rows: number, columns: number, spacing: number = 100) => {
    // First, create the tables
    const tables = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        tables.push({
          type: 'roundTable',
          x: c * spacing,
          y: r * spacing,
          radius: 40,
          seats: 8,
          name: `Table ${r * columns + c + 1}`
        });
      }
    }
    
    // Use transaction manager to add all tables at once
    return this.transactionManager.bulkAddTables(tables);
  });
  
  // Save the current layout
  saveCurrentLayout = action('saveCurrentLayout', (name: string) => {
    return this.persistenceManager.saveLayout(name);
  });
  
  // Load a saved layout
  loadLayout = action('loadLayout', (layoutId: string) => {
    return this.persistenceManager.loadLayout(layoutId);
  });
}

// Create singleton instance
export const rootStore = new RootStore(); 