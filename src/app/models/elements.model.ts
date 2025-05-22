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

export interface PolygonElement extends LayoutElement {
  type: ElementType.POLYGON;
  points: {x: number, y: number}[];
}

export interface LineElement extends LayoutElement {
  type: ElementType.LINE;
  points: {x: number, y: number}[];
  thickness?: number;
}
