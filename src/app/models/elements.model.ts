import { ElementType, LayoutElement } from './layout.model';

export interface RoundTableElement extends LayoutElement {
  type: ElementType.ROUND_TABLE;
  radius: number;
  seats: number;
  seatRadius?: number;
}

export interface RectangleTableElement extends LayoutElement {
  type: ElementType.RECTANGLE_TABLE;
  width: number;
  height: number;
  upChairs: number;
  downChairs: number;
  leftChairs: number;
  rightChairs: number;
  seatRadius?: number;
}

export interface SeatingRowElement extends LayoutElement {
  type: ElementType.SEATING_ROW;
  length: number;
  seats: number;
  spacing: number;
  seatRadius?: number;
}

export interface SegmentedSeatingRowElement extends LayoutElement {
  type: ElementType.SEGMENTED_SEATING_ROW;
  segments: SegmentProperties[];
}

export interface SegmentProperties {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  seats: number;
  chairs: any[];
}

export interface LineElement extends LayoutElement {
  type: ElementType.LINE;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  color: string;
  name: string;
}

export interface PolygonElement extends LayoutElement {
  type: ElementType.POLYGON;
  points: Array<{x: number, y: number}>;
  fillColor: string;
  fillOpacity: number;
  borderColor: string;
  borderThickness: number;
  showBorder: boolean;
  name: string;
}

export type TableElement = RoundTableElement | RectangleTableElement | SeatingRowElement | SegmentedSeatingRowElement | LineElement | PolygonElement;
