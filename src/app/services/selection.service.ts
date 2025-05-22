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
  tableLabelVisible?: boolean;
  chairLabelVisible?: boolean;
  chairs: ChairProperties[];
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() { }

  selectItem(item: Selectable | ChairProperties): void {
    console.log('SelectionService: selectItem called with', item);
    selectionStore.selectItem(item);
  }

  deselectItem(): void {
    console.log('SelectionService: deselectItem called');
    selectionStore.deselectItem();
  }

  getSelectedItem(): Selectable | ChairProperties | null {
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