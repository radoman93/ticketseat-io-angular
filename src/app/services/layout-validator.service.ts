import { Injectable } from '@angular/core';
import { LayoutData, ElementType } from '../models/layout.model';
import {
  RoundTableElement,
  RectangleTableElement,
  SeatingRowElement
} from '../models/elements.model';

@Injectable({
  providedIn: 'root'
})
export class LayoutValidatorService {

  validateLayout(layout: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!layout) {
      errors.push('Layout data is empty');
      return { valid: false, errors };
    }

    if (!layout.version) errors.push('Layout version is missing');
    if (!layout.name) errors.push('Layout name is missing');
    if (!Array.isArray(layout.elements)) errors.push('Layout elements must be an array');

    // Validate each element
    if (layout.elements && Array.isArray(layout.elements)) {
      layout.elements.forEach((element, index) => {
        const elementErrors = this.validateElement(element);
        if (elementErrors.length > 0) {
          errors.push(`Element at index ${index} has errors: ${elementErrors.join(', ')}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  private validateElement(element: any): string[] {
    const errors: string[] = [];

    // Check common required properties
    if (!element.id) errors.push('Missing id');
    if (!element.type) errors.push('Missing type');
    if (element.x === undefined) errors.push('Missing x coordinate');
    if (element.y === undefined) errors.push('Missing y coordinate');
    if (element.rotation === undefined) errors.push('Missing rotation');

    // Type-specific validation
    switch (element.type) {
      case ElementType.ROUND_TABLE:
        if (!element.radius) errors.push('Round table missing radius');
        if (!element.seats) errors.push('Round table missing seats count');
        break;
      case ElementType.RECTANGLE_TABLE:
        if (!element.width) errors.push('Rectangle table missing width');
        if (!element.height) errors.push('Rectangle table missing height');
        if (element.upChairs === undefined) errors.push('Rectangle table missing upChairs count');
        if (element.downChairs === undefined) errors.push('Rectangle table missing downChairs count');
        if (element.leftChairs === undefined) errors.push('Rectangle table missing leftChairs count');
        if (element.rightChairs === undefined) errors.push('Rectangle table missing rightChairs count');
        break;
      case ElementType.SEATING_ROW:
        if (!element.length) errors.push('Seating row missing length');
        if (!element.seats) errors.push('Seating row missing seats count');
        if (!element.spacing) errors.push('Seating row missing spacing');
        break;
      default:
        errors.push(`Unknown element type: ${element.type}`);
    }

    return errors;
  }
}
