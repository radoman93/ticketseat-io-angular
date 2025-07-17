import { makeAutoObservable, action } from 'mobx';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties } from '../services/selection.service';
import { LineElement, PolygonElement, TextElement } from '../models/elements.model';

// Union type for all table types
export type TableElement = RoundTableProperties | RectangleTableProperties | SeatingRowProperties | LineElement | PolygonElement | TextElement;

export class LayoutStore {
  elements: TableElement[] = [];
  lastAddedId: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      elements: true, // Make elements observable, using default deep observation
      elementCount: true,
      tableCount: true,
      roundTableCount: true,
      rectangleTableCount: true,
      seatingRowCount: true,
      lineCount: true,
      polygonCount: true,
      textCount: true,
      lastAddedElement: true,
      // Explicitly mark actions
      addElement: action,
      updateElement: action,
      deleteElement: action,
      clearAll: action
    });
  }

  addElement = action('addElement', (element: TableElement) => {
    // Create a copy to ensure we don't mutate the original object
    const newElement = { ...element };

    // Ensure visibility properties are set to true by default
    if (newElement.type === 'roundTable' || newElement.type === 'rectangleTable') {
      newElement.tableLabelVisible = newElement.tableLabelVisible ?? true;
      newElement.chairLabelVisible = newElement.chairLabelVisible ?? true;
    } else if (newElement.type === 'seatingRow' || newElement.type === 'segmentedSeatingRow') {
      newElement.rowLabelVisible = newElement.rowLabelVisible ?? true;
      newElement.chairLabelVisible = newElement.chairLabelVisible ?? true;
    } else if (newElement.type === 'line') {
      // Lines don't have visibility properties, but ensure required properties exist
      newElement.thickness = newElement.thickness ?? 2;
      newElement.color = newElement.color ?? '#000000';
    } else if (newElement.type === 'polygon') {
      // Ensure polygon has default properties
      newElement.fillColor = newElement.fillColor ?? '#0000ff';
      newElement.fillOpacity = newElement.fillOpacity ?? 0.3;
      newElement.borderColor = newElement.borderColor ?? '#000000';
      newElement.borderThickness = newElement.borderThickness ?? 2;
      newElement.showBorder = newElement.showBorder ?? true;
      newElement.points = newElement.points ?? [];
    } else if (newElement.type === 'text') {
      // Ensure text has default properties
      newElement.text = newElement.text ?? 'Text Label';
      newElement.fontSize = newElement.fontSize ?? 14;
      newElement.fontFamily = newElement.fontFamily ?? 'Arial';
      newElement.fontWeight = newElement.fontWeight ?? 'normal';
      newElement.fontStyle = newElement.fontStyle ?? 'normal';
      newElement.textAlign = newElement.textAlign ?? 'left';
      newElement.color = newElement.color ?? '#000000';
      newElement.backgroundColor = newElement.backgroundColor ?? 'transparent';
      newElement.borderColor = newElement.borderColor ?? 'transparent';
      newElement.borderWidth = newElement.borderWidth ?? 0;
      newElement.padding = newElement.padding ?? 4;
    }

    this.elements.push(newElement);

    this.lastAddedId = newElement.id;
    return newElement;
  });

  updateElement = action('updateElement', (id: string, updates: Partial<any>) => {
    const index = this.elements.findIndex(el => el.id === id);
    if (index !== -1) {
      // To ensure change detection is triggered in Angular components,
      // replace the element with a new object.
      this.elements[index] = { ...this.elements[index], ...updates } as TableElement;
      return this.elements[index];
    }
    return null;
  });

  deleteElement = action('deleteElement', (id: string): boolean => {
    const index = this.elements.findIndex(el => el.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      return true;
    }
    return false;
  });

  getElements(): TableElement[] {
    return this.elements;
  }

  getElementById(id: string): TableElement | undefined {
    return this.elements.find(el => el.id === id);
  }

  // Computed property to get the total count of all elements
  get elementCount(): number {
    return this.elements.length;
  }

  // Computed property to get the total count of table elements (excluding lines)
  get tableCount(): number {
    return this.elements.filter(el => 
      el.type === 'roundTable' || 
      el.type === 'rectangleTable' || 
      el.type === 'seatingRow' || 
      el.type === 'segmentedSeatingRow'
    ).length;
  }

  // Computed property to get count of round tables
  get roundTableCount(): number {
    return this.elements.filter(el => el.type === 'roundTable').length;
  }

  // Computed property to get count of rectangle tables
  get rectangleTableCount(): number {
    return this.elements.filter(el => el.type === 'rectangleTable').length;
  }

  // Computed property to get count of seating rows (both regular and segmented)
  get seatingRowCount(): number {
    return this.elements.filter(el => 
      el.type === 'seatingRow' || el.type === 'segmentedSeatingRow'
    ).length;
  }

  // Computed property to get count of lines
  get lineCount(): number {
    return this.elements.filter(el => el.type === 'line').length;
  }

  // Computed property to get count of polygons
  get polygonCount(): number {
    return this.elements.filter(el => el.type === 'polygon').length;
  }

  // Computed property to get count of text elements
  get textCount(): number {
    return this.elements.filter(el => el.type === 'text').length;
  }

  // Computed property to get the last added element
  get lastAddedElement(): TableElement | null {
    if (!this.lastAddedId) return null;
    return this.elements.find(el => el.id === this.lastAddedId) || null;
  }

  // Method to clear all elements
  clearAll = action('clearAll', () => {
    this.elements = [];
    this.lastAddedId = null;
  });

  // Method to check if an element exists
  hasElement(id: string): boolean {
    return this.elements.some(el => el.id === id);
  }

  // Line-specific utility methods
  getLines(): LineElement[] {
    return this.elements.filter(el => el.type === 'line') as LineElement[];
  }

  // Polygon-specific utility methods
  getPolygons(): PolygonElement[] {
    return this.elements.filter(el => el.type === 'polygon') as PolygonElement[];
  }

  // Text-specific utility methods
  getTexts(): TextElement[] {
    return this.elements.filter(el => el.type === 'text') as TextElement[];
  }

  getTables(): TableElement[] {
    return this.elements.filter(el => 
      el.type === 'roundTable' || 
      el.type === 'rectangleTable' || 
      el.type === 'seatingRow' || 
      el.type === 'segmentedSeatingRow'
    );
  }

  getElementsByType(type: string): TableElement[] {
    return this.elements.filter(el => el.type === type);
  }

  // Method to get elements within a bounding box (useful for selection)
  getElementsInBounds(x1: number, y1: number, x2: number, y2: number): TableElement[] {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return this.elements.filter(el => {
      if (el.type === 'line') {
        // For lines, check if any part is within bounds
        const line = el as LineElement;
        return (
          (line.startX >= minX && line.startX <= maxX && line.startY >= minY && line.startY <= maxY) ||
          (line.endX >= minX && line.endX <= maxX && line.endY >= minY && line.endY <= maxY)
        );
      } else {
        // For other elements, check x/y position
        return el.x >= minX && el.x <= maxX && el.y >= minY && el.y <= maxY;
      }
    });
  }
}

// Create singleton instance
export const layoutStore = new LayoutStore(); 