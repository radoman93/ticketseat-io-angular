import { Injectable } from '@angular/core';
import { layoutStore } from '../stores/layout.store';
import { gridStore } from '../stores/grid.store';
import { rootStore } from '../stores/root.store';
import { Chair } from '../models/chair.model';

export interface LayoutExportData {
  meta: {
    version: string;
    name: string;
    created: string;
    creator: string;
    description?: string;
  };
  settings: {
    gridSize: number;
    showGrid: boolean;
    showGuides: boolean;
  };
  elements: any[];
}

// Legacy format interface for backward compatibility
export interface LegacyLayoutExportData extends LayoutExportData {
  chairs: Chair[];
}

@Injectable({
  providedIn: 'root'
})
export class LayoutExportImportService {

  constructor() { }

  /**
   * Export the current layout to a JSON object
   */
  exportLayout(name: string, description?: string): LayoutExportData {
    const chairs = Array.from(rootStore.chairStore.chairs.values());

    // Group chairs by their parent element
    const chairsByElement = new Map<string, Chair[]>();
    chairs.forEach(chair => {
      if (!chairsByElement.has(chair.tableId)) {
        chairsByElement.set(chair.tableId, []);
      }
      chairsByElement.get(chair.tableId)!.push(chair);
    });

    // Create elements with their chairs nested
    const elementsWithChairs = layoutStore.elements.map(element => {
      const elementChairs = chairsByElement.get(element.id) || [];
      return {
        ...element,
        chairs: elementChairs
      };
    });

    const exportData: LayoutExportData = {
      meta: {
        version: '1.0',
        name: name,
        created: new Date().toISOString(),
        creator: 'TicketSeats v1.0',
        description: description
      },
      settings: {
        gridSize: gridStore.gridSize,
        showGrid: gridStore.showGrid,
        showGuides: gridStore.showGuides
      },
      elements: elementsWithChairs
    };

    return exportData;
  }

  /**
   * Download the layout as a .ticketseat file
   */
  downloadLayout(name: string, description?: string): void {
    const exportData = this.exportLayout(name, description);
    const jsonString = JSON.stringify(exportData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ticketseat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Import a layout from JSON data
   */
  importLayout(data: LayoutExportData | LegacyLayoutExportData, mode: 'replace' | 'merge' = 'replace'): void {
    // Validate the data structure
    if (!this.validateLayoutData(data)) {
      throw new Error('Invalid layout data format');
    }

    if (mode === 'replace') {
      // Clear existing layout
      layoutStore.clearAll();
      rootStore.chairStore.chairs.clear();
    }

    // Apply settings
    gridStore.setGridSize(data.settings.gridSize);
    if (data.settings.showGrid !== gridStore.showGrid) {
      gridStore.toggleGrid();
    }
    if (data.settings.showGuides !== gridStore.showGuides) {
      gridStore.toggleGuides();
    }

    // Handle backward compatibility: check if the old format (with separate chairs array) is used
    if ('chairs' in data && data.chairs && Array.isArray(data.chairs)) {
      // Old format: chairs are in a separate array
      console.log('Importing old format with separate chairs array');

      // Group chairs by their parent element for the old format
      const chairsByElement = new Map<string, Chair[]>();
      data.chairs.forEach((chair: Chair) => {
        if (!chairsByElement.has(chair.tableId)) {
          chairsByElement.set(chair.tableId, []);
        }
        chairsByElement.get(chair.tableId)!.push(chair);
      });

      // Process elements and associate their chairs
      data.elements.forEach((element: any) => {
        if (mode === 'merge') {
          const oldId = element.id;
          element.id = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Update chair tableIds for the new element ID
          const elementChairs = chairsByElement.get(oldId) || [];
          elementChairs.forEach(chair => {
            chair.tableId = element.id;
            chair.id = `${element.id}-chair-${chair.label}`;
          });
        }

        // Add element to layout
        layoutStore.addElement(element);

        // Add chairs to chair store
        const elementChairs = chairsByElement.get(element.id) || [];
        elementChairs.forEach(chair => {
          rootStore.chairStore.addChair(chair);
        });
      });
    } else {
      // New format: chairs are nested within elements
      console.log('Importing new format with nested chairs');

      data.elements.forEach((element: any) => {
        if (mode === 'merge') {
          // Generate new IDs for merged elements to avoid conflicts
          const oldId = element.id;
          element.id = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Update chair tableIds if chairs exist
          if (element.chairs && Array.isArray(element.chairs)) {
            element.chairs.forEach((chair: Chair) => {
              chair.tableId = element.id;
              chair.id = `${element.id}-chair-${chair.label}`;
            });
          }
        }

        // Extract chairs before adding element
        const chairs = element.chairs || [];

        // Remove chairs from element object before adding to layout
        const { chairs: _, ...elementWithoutChairs } = element;

        // Add element to layout
        layoutStore.addElement(elementWithoutChairs);

        // Add chairs to chair store
        chairs.forEach((chair: Chair) => {
          rootStore.chairStore.addChair(chair);
        });
      });
    }
  }

  /**
   * Import layout from a file
   */
  async importLayoutFromFile(file: File, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      this.importLayout(data, mode);
    } catch (error) {
      throw new Error(`Failed to import layout: ${error}`);
    }
  }

  /**
   * Validate layout data structure
   */
  private validateLayoutData(data: any): data is LayoutExportData | LegacyLayoutExportData {
    const hasBasicStructure = (
      data &&
      typeof data === 'object' &&
      data.meta &&
      typeof data.meta.version === 'string' &&
      typeof data.meta.name === 'string' &&
      data.settings &&
      typeof data.settings.gridSize === 'number' &&
      typeof data.settings.showGrid === 'boolean' &&
      typeof data.settings.showGuides === 'boolean' &&
      Array.isArray(data.elements)
    );

    // Accept both old format (with chairs array) and new format (without)
    return hasBasicStructure;
  }

  /**
   * Get layout preview information without importing
   */
  getLayoutPreview(data: LayoutExportData): {
    name: string;
    description?: string;
    created: string;
    elementCount: number;
    tableCount: number;
    rowCount: number;
  } {
    const tableCount = data.elements.filter(el =>
      el.type === 'roundTable' || el.type === 'rectangleTable'
    ).length;

    const rowCount = data.elements.filter(el =>
      el.type === 'seatingRow' || el.type === 'segmentedSeatingRow'
    ).length;

    return {
      name: data.meta.name,
      description: data.meta.description,
      created: data.meta.created,
      elementCount: data.elements.length,
      tableCount,
      rowCount
    };
  }
} 