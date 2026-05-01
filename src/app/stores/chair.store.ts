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

  // Helper to generate chairs for a table.
  // chairLabels override is applied when its length matches seatCount; otherwise sequential.
  generateChairsForTable(tableId: string, seatCount: number, radius: number, chairLabels?: string[]): Chair[] {
    const chairs: Chair[] = [];
    const angleStep = 360 / seatCount;
    const distanceToChairCenter = radius + 20;
    const useOverride = !!chairLabels && chairLabels.length === seatCount;

    if (chairLabels && !useOverride) {
      console.warn(`[ChairStore] chairLabels length ${chairLabels.length} != seatCount ${seatCount} for ${tableId}; falling back to sequential`);
    }

    for (let i = 0; i < seatCount; i++) {
      const chair: Chair = {
        id: `${tableId}-chair-${i}`,
        tableId: tableId,
        label: useOverride ? chairLabels![i] : (i + 1).toString(),
        price: 25.00, // Default price
        position: {
          angle: angleStep * i,
          distance: distanceToChairCenter
        },
        isSelected: false,
        reservationStatus: 'free'
      };
      chairs.push(chair);
      this.addChair(chair);
    }

    return chairs;
  }

  // Helper to generate chairs for an arc-seating-row.
  // Distributes chairs evenly along an arc segment from startAngle to endAngle (degrees, CCW).
  // Position is stored as polar coordinates relative to the element's anchor (centerX, centerY).
  generateChairsForArcRow(
    tableId: string,
    seatCount: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    chairLabels?: string[]
  ): Chair[] {
    const chairs: Chair[] = [];
    if (seatCount <= 0) return chairs;

    const useOverride = !!chairLabels && chairLabels.length === seatCount;
    if (chairLabels && !useOverride) {
      console.warn(`[ChairStore] chairLabels length ${chairLabels.length} != seatCount ${seatCount} for ${tableId}; falling back to sequential`);
    }

    // Distribute N chairs along arc; for N=1 place at midpoint, else N points evenly spaced inclusive of endpoints
    const arcSpan = endAngle - startAngle;
    const step = seatCount === 1 ? 0 : arcSpan / (seatCount - 1);
    const baseAngle = seatCount === 1 ? startAngle + arcSpan / 2 : startAngle;

    for (let i = 0; i < seatCount; i++) {
      const angle = baseAngle + step * i;
      const chair: Chair = {
        id: `${tableId}-chair-${i}`,
        tableId: tableId,
        label: useOverride ? chairLabels![i] : (i + 1).toString(),
        price: 25.00,
        position: {
          angle: angle,
          distance: radius
        },
        isSelected: false,
        reservationStatus: 'free'
      };
      chairs.push(chair);
      this.addChair(chair);
    }

    return chairs;
  }

  // Helper method to remove all chairs for a table
  removeChairsForTable = action('removeChairsForTable', (tableId: string) => {
    const chairsToRemove = this.getChairsByTable(tableId);
    chairsToRemove.forEach(chair => {
      this.removeChair(chair.id);
    });
  });
}

// Create singleton instance
export const chairStore = new ChairStore(); 