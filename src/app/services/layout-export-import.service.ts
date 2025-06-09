import { Injectable } from '@angular/core';
import { layoutStore } from '../stores/layout.store';
import { gridStore } from '../stores/grid.store';

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

@Injectable({
  providedIn: 'root'
})
export class LayoutExportImportService {

  constructor() {}

  /**
   * Export the current layout to a JSON object
   */
  exportLayout(name: string, description?: string): LayoutExportData {
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
      elements: [...layoutStore.elements]
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
  importLayout(data: LayoutExportData, mode: 'replace' | 'merge' = 'replace'): void {
    // Validate the data structure
    if (!this.validateLayoutData(data)) {
      throw new Error('Invalid layout data format');
    }

    if (mode === 'replace') {
      // Clear existing layout
      layoutStore.clearAll();
    }

    // Apply settings
    gridStore.setGridSize(data.settings.gridSize);
    if (data.settings.showGrid !== gridStore.showGrid) {
      gridStore.toggleGrid();
    }
    if (data.settings.showGuides !== gridStore.showGuides) {
      gridStore.toggleGuides();
    }

    // Add elements
    data.elements.forEach(element => {
      if (mode === 'merge') {
        // Generate new IDs for merged elements to avoid conflicts
        element.id = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      layoutStore.addElement(element);
    });
  }

  /**
   * Import layout from a file
   */
  async importLayoutFromFile(file: File, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as LayoutExportData;
      this.importLayout(data, mode);
    } catch (error) {
      throw new Error(`Failed to import layout: ${error}`);
    }
  }

  /**
   * Validate layout data structure
   */
  private validateLayoutData(data: any): data is LayoutExportData {
    return (
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