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

export type TableElement = RoundTableElement | RectangleTableElement | SeatingRowElement | SegmentedSeatingRowElement;
