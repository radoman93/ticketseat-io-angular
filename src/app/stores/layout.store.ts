import { makeAutoObservable, action } from 'mobx';
import { RoundTableProperties } from '../services/selection.service';

export class LayoutStore {
  elements: RoundTableProperties[] = [];
  lastAddedId: string | null = null;
  
  constructor() {
    makeAutoObservable(this, {
      // Specify computed properties
      tableCount: true,
      roundTableCount: true,
      lastAddedElement: true,
      // Explicitly mark actions
      addElement: action,
      updateElement: action,
      deleteElement: action,
      clearAll: action
    });
  }
  
  addElement = action('addElement', (element: RoundTableProperties) => {
    console.log('MobX Layout Store: addElement', element);
    // Create a copy to ensure we don't mutate the original object
    const newElement = {...element};
    this.elements.push(newElement);
    this.lastAddedId = newElement.id;
    return newElement;
  });
  
  updateElement = action('updateElement', (id: string, updates: Partial<RoundTableProperties>) => {
    const index = this.elements.findIndex(el => el.id === id);
    if (index !== -1) {
      this.elements[index] = { ...this.elements[index], ...updates };
      console.log('MobX Layout Store: updateElement', this.elements[index]);
      return this.elements[index];
    }
    return null;
  });
  
  deleteElement = action('deleteElement', (id: string): boolean => {
    const index = this.elements.findIndex(el => el.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      console.log('MobX Layout Store: deleteElement', id);
      return true;
    }
    return false;
  });
  
  getElements(): RoundTableProperties[] {
    return this.elements;
  }
  
  getElementById(id: string): RoundTableProperties | undefined {
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
  
  // Computed property to get the last added element
  get lastAddedElement(): RoundTableProperties | null {
    if (!this.lastAddedId) return null;
    return this.elements.find(el => el.id === this.lastAddedId) || null;
  }
  
  // Method to clear all elements
  clearAll = action('clearAll', () => {
    this.elements = [];
    this.lastAddedId = null;
    console.log('MobX Layout Store: clearAll');
  });
  
  // Method to check if an element exists
  hasElement(id: string): boolean {
    return this.elements.some(el => el.id === id);
  }
}

// Create singleton instance
export const layoutStore = new LayoutStore(); 