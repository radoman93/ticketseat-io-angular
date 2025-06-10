import { Injectable } from '@angular/core';
import { LineProperties } from './selection.service';

@Injectable({
  providedIn: 'root'
})
export class LineService {

  /**
   * Create a new line with an initial point
   */
  createLine(startX: number, startY: number): LineProperties {
    return {
      id: `line-${Date.now()}`,
      type: 'line',
      points: [{ x: startX, y: startY }],
      thickness: 2,
      color: '#000000',
      name: `Line ${Date.now()}`
    };
  }

  /**
   * Add a point to an existing line
   */
  addPoint(line: LineProperties, x: number, y: number): LineProperties {
    return {
      ...line,
      points: [...line.points, { x, y }]
    };
  }

  /**
   * Update the last point of a line (for live preview while drawing)
   */
  updateLastPoint(line: LineProperties, x: number, y: number): LineProperties {
    if (line.points.length === 0) {
      return { ...line, points: [{ x, y }] };
    }

    const updatedPoints = [...line.points];
    updatedPoints[updatedPoints.length - 1] = { x, y };

    return {
      ...line,
      points: updatedPoints
    };
  }

  /**
   * Calculate the total length of a line
   */
  calculateLineLength(line: LineProperties): number {
    if (line.points.length < 2) return 0;

    let totalLength = 0;
    for (let i = 1; i < line.points.length; i++) {
      const prevPoint = line.points[i - 1];
      const currentPoint = line.points[i];
      const dx = currentPoint.x - prevPoint.x;
      const dy = currentPoint.y - prevPoint.y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    return totalLength;
  }

  /**
   * Check if a point is near the line (for selection)
   */
  isPointNearLine(line: LineProperties, x: number, y: number, tolerance: number = 5): boolean {
    if (line.points.length < 2) return false;

    for (let i = 1; i < line.points.length; i++) {
      const point1 = line.points[i - 1];
      const point2 = line.points[i];
      
      const distance = this.pointToLineDistance(x, y, point1.x, point1.y, point2.x, point2.y);
      if (distance <= tolerance) return true;
    }

    return false;
  }

  /**
   * Calculate distance from a point to a line segment
   */
  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Point case
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Validate line data
   */
  validateLine(line: LineProperties): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!line.id) errors.push('Line ID is required');
    if (!line.points || line.points.length < 2) errors.push('Line must have at least 2 points');
    if (line.thickness && line.thickness <= 0) errors.push('Line thickness must be positive');

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 