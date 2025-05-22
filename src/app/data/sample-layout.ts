import { LayoutData, ElementType } from '../models/layout.model';
import { RoundTableElement, RectangleTableElement, SeatingRowElement } from '../models/elements.model';

export const SAMPLE_LAYOUT: LayoutData = {
  version: "1.0",
  name: "Sample Layout",
  elements: [
    {
      id: "table-1",
      type: ElementType.ROUND_TABLE,
      x: 100,
      y: 150,
      radius: 40,
      seats: 8,
      rotation: 0,
      label: "Table 1"
    } as RoundTableElement,
    {
      id: "table-2",
      type: ElementType.RECTANGLE_TABLE,
      x: 300,
      y: 150,
      width: 120,
      height: 80,
      upChairs: 4,
      downChairs: 4,
      leftChairs: 0,
      rightChairs: 0,
      rotation: 0,
      label: "Table 2"
    } as RectangleTableElement,
    {
      id: "row-1",
      type: ElementType.SEATING_ROW,
      x: 500,
      y: 200,
      length: 150,
      seats: 4,
      spacing: 40,
      rotation: 0,
      label: "Row A"
    } as SeatingRowElement
  ]
};
