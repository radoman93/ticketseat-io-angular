import { action, runInAction, toJS } from 'mobx';
import { layoutStore } from './layout.store';
import { selectionStore } from './selection.store';
import { MobxErrorService } from '../services/mobx-error.service';
import { RoundTableProperties } from '../services/selection.service';
import { Injectable } from '@angular/core';
import { LoggerService } from '../services/logger.service';

export interface SavedLayout {
  id: string;
  name: string;
  timestamp: string;
  version: string;
  data: {
    tables: RoundTableProperties[];
  };
}

/**
 * PersistenceManager handles saving and loading layouts
 * from various storage mechanisms (localStorage, server, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class PersistenceManager {
  private readonly STORAGE_KEY = 'ticketseat-io-layouts';
  private readonly CURRENT_LAYOUT_KEY = 'ticketseat-io-current-layout';

  constructor(
    private mobxErrorService: MobxErrorService,
    private logger: LoggerService = new LoggerService()
  ) {
    // Nothing to observe, this is a pure action manager
  }

  /**
   * Get all saved layouts
   */
  getSavedLayouts(): { id: string, name: string, timestamp: number }[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return [];

      const layouts = JSON.parse(storedData);
      return layouts.map(({ id, name, timestamp }: any) => ({ id, name, timestamp }));
    } catch (error) {
      this.logger.error('Failed to get saved layouts', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'getSavedLayouts' });
      return [];
    }
  }

  /**
   * Save the current layout to storage
   */
  @action
  saveLayout(name: string): string {

    try {
      // Generate a unique ID for this layout
      const layoutId = `layout-${Date.now()}`;
      const timestamp = Date.now();

      // Get current layout data - use toJS to remove MobX observers
      const layoutData = toJS(layoutStore.elements);

      // Create the layout object
      const layout = {
        id: layoutId,
        name,
        timestamp,
        elements: layoutData
      };

      // Get existing layouts
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const layouts = storedData ? JSON.parse(storedData) : [];

      // Add new layout
      layouts.push(layout);

      // Save back to storage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layouts));

      return layoutId;
    } catch (error) {
      this.logger.error('Failed to save layout', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'saveLayout', layoutName: name });
      throw error;
    }
  }

  private ensureVisibilityProperties(element: any): any {
    if (element.type === 'roundTable' || element.type === 'rectangleTable') {
      return {
        ...element,
        tableLabelVisible: element.tableLabelVisible ?? true,
        chairLabelVisible: element.chairLabelVisible ?? true
      };
    } else if (element.type === 'seatingRow' || element.type === 'segmentedSeatingRow') {
      return {
        ...element,
        chairLabelVisible: element.chairLabelVisible ?? true,
        rowLabelVisible: element.rowLabelVisible ?? true
      };
    }
    return element;
  }

  /**
   * Load a layout from storage by ID
   */
  @action
  loadLayout(layoutId: string): boolean {

    try {
      // Get saved layouts
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        this.logger.warn('No saved layouts found', { store: 'PersistenceManager', action: 'loadLayout', layoutId });
        return false;
      }

      const layouts = JSON.parse(storedData);
      const layout = layouts.find((l: any) => l.id === layoutId);

      if (!layout) {
        this.logger.warn('Layout not found', { store: 'PersistenceManager', action: 'loadLayout', layoutId });
        return false;
      }

      // Load the layout data
      runInAction(() => {
        // Clear current selection
        selectionStore.deselectItem();

        // Clear current layout
        layoutStore.clearAll();

        // Add all elements from saved layout with visibility properties ensured
        layout.elements.forEach((element: any) => {
          layoutStore.addElement(this.ensureVisibilityProperties(element));
        });
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to load layout', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'loadLayout', layoutId });
      throw error;
    }
  }

  /**
   * Delete a layout from storage
   */
  deleteLayout(layoutId: string): boolean {

    try {
      // Get saved layouts
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return false;

      const layouts = JSON.parse(storedData);
      const updatedLayouts = layouts.filter((l: any) => l.id !== layoutId);

      // Save back to storage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLayouts));

      return true;
    } catch (error) {
      this.logger.error('Failed to delete layout', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'deleteLayout', layoutId });
      return false;
    }
  }

  /**
   * Export layout to a file
   */
  exportToFile(): boolean {
    try {
      // Get current layout data
      const layoutData = toJS(layoutStore.elements);

      // Create a JSON string
      const jsonData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        elements: layoutData
      }, null, 2);

      // Create a Blob from the JSON string
      const blob = new Blob([jsonData], { type: 'application/json' });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticketseat-layout-${new Date().toISOString().slice(0, 10)}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      this.logger.error('Failed to export layout to file', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'exportToFile' });
      return false;
    }
  }

  /**
   * Import layout from a file
   */
  @action
  importFromFile(fileContent: string): boolean {
    try {
      // Parse the file content
      const importedData = JSON.parse(fileContent);

      // Validate the imported data
      if (!importedData.elements || !Array.isArray(importedData.elements)) {
        this.logger.error('Invalid import file format', new Error('Missing or invalid elements array'), { store: 'PersistenceManager', action: 'importFromFile' });
        return false;
      }

      // Load the imported data
      runInAction(() => {
        // Clear current selection
        selectionStore.deselectItem();

        // Clear current layout
        layoutStore.clearAll();

        // Add all elements from imported layout with visibility properties ensured
        importedData.elements.forEach((element: any) => {
          layoutStore.addElement(this.ensureVisibilityProperties(element));
        });
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to import layout from file', error instanceof Error ? error : new Error(String(error)), { store: 'PersistenceManager', action: 'importFromFile' });
      return false;
    }
  }
}

// Create singleton instance
export const persistenceManager = new PersistenceManager(new MobxErrorService(), new LoggerService()); 