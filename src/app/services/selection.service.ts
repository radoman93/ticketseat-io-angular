import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Selectable {
  id: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectedItemSubject = new BehaviorSubject<Selectable | null>(null);
  public selectedItem$: Observable<Selectable | null> = this.selectedItemSubject.asObservable();

  constructor() { }

  selectItem(item: Selectable): void {
    this.selectedItemSubject.next(item);
  }

  deselectItem(): void {
    this.selectedItemSubject.next(null);
  }

  getSelectedItem(): Selectable | null {
    return this.selectedItemSubject.getValue();
  }

  isItemSelected(itemId: string): boolean {
    const selectedItem = this.selectedItemSubject.getValue();
    return selectedItem?.id === itemId;
  }
} 