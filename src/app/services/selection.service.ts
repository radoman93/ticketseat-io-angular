import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface Selectable {
  id: string;
  type: string;
  [key: string]: any; // Index signature to allow for additional properties
}

export interface RoundTableProperties extends Selectable {
  x: number;
  y: number;
  radius: number;
  seats: number;
  name: string;
  rotation?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectedItemSubject = new BehaviorSubject<Selectable | null>(null);
  public selectedItem$: Observable<Selectable | null> = this.selectedItemSubject.asObservable();
  
  // Event emitter for deletion requests
  private deleteItemSubject = new Subject<Selectable>();
  public deleteItem$: Observable<Selectable> = this.deleteItemSubject.asObservable();

  constructor() { }

  selectItem(item: Selectable): void {
    console.log('SelectionService: selectItem called with', item);
    this.selectedItemSubject.next(item);
  }

  deselectItem(): void {
    console.log('SelectionService: deselectItem called');
    this.selectedItemSubject.next(null);
  }

  getSelectedItem(): Selectable | null {
    return this.selectedItemSubject.getValue();
  }

  isItemSelected(itemId: string): boolean {
    const selectedItem = this.selectedItemSubject.getValue();
    return selectedItem?.id === itemId;
  }
  
  // Request to delete the currently selected item
  requestDeleteItem(item: Selectable): void {
    this.deleteItemSubject.next(item);
  }
} 