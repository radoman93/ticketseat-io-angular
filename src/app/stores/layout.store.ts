import { makeAutoObservable, action } from 'mobx';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties } from '../services/selection.service';

// Union type for all table types
export type TableElement = RoundTableProperties | RectangleTableProperties | SeatingRowProperties;

export class LayoutStore {
  elements: TableElement[] = [];
  lastAddedId: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      elements: true, // Make elements observable, using default deep observation
      tableCount: true,
      roundTableCount: true,
      rectangleTableCount: true,
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

  // Computed property to get the total count of elements
  get tableCount(): number {
    return this.elements.length;
  }

  // Computed property to get count of round tables
  get roundTableCount(): number {
    return this.elements.filter(el => el.type === 'roundTable').length;
  }

  // Computed property to get count of rectangle tables
  get rectangleTableCount(): number {
    return this.elements.filter(el => el.type === 'rectangleTable').length;
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
}

// Create singleton instance
export const layoutStore = new LayoutStore(); 