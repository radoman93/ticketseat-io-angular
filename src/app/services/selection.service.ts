import { Injectable } from '@angular/core';
import { selectionStore } from '../stores/selection.store';
import { layoutStore } from '../stores/layout.store';

export interface Selectable {
  id: string;
  type: string;
  [key: string]: any;
}

export interface ChairProperties {
  id: string;
  label: string;
  price: number;
}

export interface RoundTableProperties extends Selectable {
  x: number;
  y: number;
  radius: number;
  seats: number;
  openSpaces: number;
  name: string;
  rotation?: number;
  tableLabelVisible: boolean;
  chairLabelVisible: boolean;
  chairs?: ChairProperties[];
}

export interface RectangleTableProperties extends Selectable {
  x: number;
  y: number;
  width: number;
  height: number;
  upChairs: number;
  downChairs: number;
  leftChairs: number;
  rightChairs: number;
  name: string;
  rotation?: number;
  tableLabelVisible: boolean;
  chairLabelVisible: boolean;
  chairs?: ChairProperties[];
}

export interface SegmentProperties {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  seatCount: number;
  seatSpacing: number;
  rotation: number;
  segmentIndex: number;
}

export interface LineProperties extends Selectable {
  type: 'line';
  points: { x: number, y: number }[];
  thickness?: number;
  color?: string;
  name?: string;
}

export interface PolygonProperties extends Selectable {
  type: 'polygon';
  points: { x: number, y: number }[];
  thickness?: number;
  strokeColor?: string;
  fillColor?: string;
  name?: string;
  label?: string;
  labelVisible?: boolean;
  closed?: boolean;
}

export interface SeatingRowProperties extends Selectable {
  x: number;
  y: number;
  endX: number;
  endY: number;
  seatCount: number;
  seatSpacing: number;
  name: string;
  rotation?: number;
  chairLabelVisible: boolean;
  rowLabelVisible: boolean;
  labelPosition?: 'left' | 'center' | 'right';
  chairs?: ChairProperties[];
  isSegmented?: boolean;
  segments?: SegmentProperties[];
  totalSegments?: number;
  totalSeats?: number;
  isPreview?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() { }

  selectItem(item: Selectable): void {
    console.log('SelectionService: selectItem called with', item);
    selectionStore.selectItem(item);
  }

  deselectItem(): void {
    console.log('SelectionService: deselectItem called');
    selectionStore.deselectItem();
  }

  getSelectedItem(): Selectable | null {
    return selectionStore.selectedItem;
  }

  isItemSelected(itemId: string): boolean {
    return selectionStore.isItemSelected(itemId);
  }

  requestDeleteItem(item: Selectable): void {
    layoutStore.deleteElement(item.id);
    selectionStore.deselectItem();
  }
}