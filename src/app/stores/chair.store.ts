import { makeAutoObservable, action, computed } from 'mobx';
import { Chair } from '../models/chair.model';

export class ChairStore {
  chairs = new Map<string, Chair>();
  selectedChairId: string | null = null;
  panelPosition: { x: number; y: number } | null = null;
  
  constructor() {
    makeAutoObservable(this, {
      selectChair: action,
      deselectChair: action,
      updateChair: action,
      addChair: action,
      removeChair: action,
      setPanelPosition: action,
      selectedChair: computed
    });
  }
  
  // Actions
  selectChair = action('selectChair', (chairId: string) => {
    // Deselect previously selected chair
    if (this.selectedChairId) {
      const prevChair = this.chairs.get(this.selectedChairId);
      if (prevChair) {
        prevChair.isSelected = false;
      }
    }
    
    // Select new chair
    this.selectedChairId = chairId;
    const chair = this.chairs.get(chairId);
    if (chair) {
      chair.isSelected = true;
    }
  });
  
  deselectChair = action('deselectChair', () => {
    if (this.selectedChairId) {
      const chair = this.chairs.get(this.selectedChairId);
      if (chair) {
        chair.isSelected = false;
      }
    }
    this.selectedChairId = null;
    this.panelPosition = null;
  });
  
  setPanelPosition = action('setPanelPosition', (x: number, y: number) => {
    this.panelPosition = { x, y };
  });
  
  updateChair = action('updateChair', (chairId: string, updates: Partial<Chair>) => {
    const chair = this.chairs.get(chairId);
    if (chair) {
      Object.assign(chair, updates);
    }
  });
  
  addChair = action('addChair', (chair: Chair) => {
    this.chairs.set(chair.id, chair);
  });
  
  removeChair = action('removeChair', (chairId: string) => {
    this.chairs.delete(chairId);
    if (this.selectedChairId === chairId) {
      this.selectedChairId = null;
      this.panelPosition = null;
    }
  });
  
  // Computed
  get selectedChair(): Chair | null {
    return this.selectedChairId ? this.chairs.get(this.selectedChairId) || null : null;
  }
  
  // Methods (not computed since they take parameters)
  getChairsByTable(tableId: string): Chair[] {
    return Array.from(this.chairs.values()).filter(chair => chair.tableId === tableId);
  }
  
  isChairSelected(chairId: string): boolean {
    return this.selectedChairId === chairId;
  }
  
  // Helper to generate chairs for a table
  generateChairsForTable(tableId: string, seatCount: number, radius: number): Chair[] {
    console.log('Generating chairs for table:', tableId, 'seatCount:', seatCount, 'radius:', radius);
    const chairs: Chair[] = [];
    const angleStep = 360 / seatCount;
    const distanceToChairCenter = radius + 20;
    
    for (let i = 0; i < seatCount; i++) {
      const chair: Chair = {
        id: `${tableId}-chair-${i}`,
        tableId: tableId,
        label: (i + 1).toString(),
        price: 25.00, // Default price
        position: {
          angle: angleStep * i,
          distance: distanceToChairCenter
        },
        isSelected: false,
        reservationStatus: 'free' // Default to free (matches Chair model)
      };
      chairs.push(chair);
      this.addChair(chair);
      console.log('Added chair:', chair.id);
    }
    
    console.log('Generated', chairs.length, 'chairs for table', tableId);
    return chairs;
  }
  
  // Helper method to remove all chairs for a table
  removeChairsForTable = action('removeChairsForTable', (tableId: string) => {
    const chairsToRemove = this.getChairsByTable(tableId);
    chairsToRemove.forEach(chair => {
      this.removeChair(chair.id);
    });
    console.log(`Removed ${chairsToRemove.length} chairs for table ${tableId}`);
  });
}

// Create singleton instance
export const chairStore = new ChairStore(); 