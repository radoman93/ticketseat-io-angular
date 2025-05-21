import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum ToolType {
  None = 'none',
  RoundTable = 'roundTable'
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private activeToolSubject = new BehaviorSubject<ToolType>(ToolType.None);
  public activeTool$: Observable<ToolType> = this.activeToolSubject.asObservable();

  constructor() { }

  setActiveTool(tool: ToolType): void {
    this.activeToolSubject.next(tool);
  }

  getActiveTool(): ToolType {
    return this.activeToolSubject.getValue();
  }
} 