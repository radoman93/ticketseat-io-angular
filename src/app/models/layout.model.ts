// Base element interface that all elements will extend
export interface LayoutElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  label?: string;
}

// Enum for all possible element types
export enum ElementType {
  ROUND_TABLE = 'roundTable',
  RECTANGLE_TABLE = 'rectangleTable',
  SEATING_ROW = 'seatingRow',
  POLYGON = 'polygon',
  LINE = 'line'
}

// Complete layout schema
export interface LayoutData {
  version: string;
  name: string;
  elements: LayoutElement[];
}
