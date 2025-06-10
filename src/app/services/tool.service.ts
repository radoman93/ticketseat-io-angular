import { Injectable } from '@angular/core';
import { toolStore } from '../stores/tool.store';

export enum ToolType {
  None = 'none',
  Select = 'select',
  RoundTable = 'roundTable',
  RectangleTable = 'rectangleTable',
  SeatingRow = 'seatingRow',
  SegmentedSeatingRow = 'segmentedSeatingRow',
  Line = 'line'
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  constructor() { }

  setActiveTool(tool: ToolType): void {
    toolStore.setActiveTool(tool);
  }

  getActiveTool(): ToolType {
    return toolStore.activeTool;
  }
} 