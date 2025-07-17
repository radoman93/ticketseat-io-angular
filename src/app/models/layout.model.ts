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
  SEGMENTED_SEATING_ROW = 'segmentedSeatingRow',
  LINE = 'line',
  POLYGON = 'polygon',
  TEXT = 'text'
}

// Complete layout schema
export interface LayoutData {
  version: string;
  name: string;
  elements: LayoutElement[];
}
