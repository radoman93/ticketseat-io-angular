import { Injectable } from '@angular/core';
import { PolygonProperties } from './selection.service';

@Injectable({
  providedIn: 'root'
})
export class PolygonService {
  private readonly SNAP_THRESHOLD = 10; // 10px snap threshold

  createPolygon(x: number, y: number): PolygonProperties {
    return {
      id: `polygon-${Date.now()}`,
      type: 'polygon',
      points: [{x, y}], // Start with a single point at the exact position
      thickness: 2,
      strokeColor: '#000000',
      fillColor: '#E5E5E5',
      name: 'New Polygon',
      label: 'New Polygon',
      closed: false
    };
  }

  addPoint(polygon: PolygonProperties, x: number, y: number, shouldSnap: boolean = true): PolygonProperties {
    if (shouldSnap && polygon.points.length > 2) {
      // Check if we're near the first point to close the polygon
      const firstPoint = polygon.points[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );

      if (distance <= this.SNAP_THRESHOLD) {
        // Close the polygon by marking it as closed
        console.log('Polygon closed by snapping to first point');
        polygon.closed = true;
        
        // Important: Don't add another point, use the exact coordinates of the first point
        // This creates a perfect connection
        return polygon;
      }
    }

    // Add the new point directly to the existing array
    polygon.points.push({x, y});

    console.log('Added point to polygon. Total points:', polygon.points.length);
    return polygon;
  }

  updateLastPoint(polygon: PolygonProperties, x: number, y: number, shouldSnap: boolean = true): PolygonProperties {
    if (!polygon.points.length) return polygon;

    let newX = x;
    let newY = y;

    if (shouldSnap && polygon.points.length > 1) {
      // Check if we're near the first point
      const firstPoint = polygon.points[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );

      if (distance <= this.SNAP_THRESHOLD) {
        // Snap to first point
        newX = firstPoint.x;
        newY = firstPoint.y;
        
        // Mark the polygon as closed when snapping to first point
        if (polygon.points.length >= 3 && !polygon.closed) {
          polygon.closed = true;
        }
      }
    }

    // Direct update mode - only modifies the last point directly
    // This creates a stable reference for all other points
    const lastPointIndex = polygon.points.length - 1;
    
    // Create a fresh points array with all but the last point preserved
    // This ensures we don't modify any existing point references
    if (lastPointIndex > 0) {
      // Use slice to copy all points except the last one
      // Then add the updated last point
      const updatedPoints = polygon.points.slice(0, lastPointIndex);
      updatedPoints.push({x: newX, y: newY});
      polygon.points = updatedPoints;
    } else {
      // If there's only one point, simply update it
      polygon.points[lastPointIndex] = {x: newX, y: newY};
    }
    
    // Return the same object reference
    return polygon;
  }

  isPointNearPolygon(polygon: PolygonProperties, x: number, y: number, tolerance: number = 5): boolean {
    if (polygon.points.length < 2) return false;

    // Check each edge of the polygon
    for (let i = 0; i < polygon.points.length; i++) {
      const point1 = polygon.points[i];
      const point2 = polygon.points[(i + 1) % polygon.points.length];
      
      const distance = this.pointToLineDistance(x, y, point1.x, point1.y, point2.x, point2.y);
      if (distance <= tolerance) return true;
    }

    return false;
  }

  private pointToLineDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

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

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  isNearFirstPoint(polygon: PolygonProperties, x: number, y: number): boolean {
    if (polygon.points.length < 3) return false;
    
    const firstPoint = polygon.points[0];
    const distance = Math.sqrt(
      Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
    );
    
    return distance <= this.SNAP_THRESHOLD;
  }

  calculateCenter(polygon: PolygonProperties): {x: number, y: number} {
    if (!polygon.points.length) return {x: 0, y: 0};

    const sumX = polygon.points.reduce((sum, point) => sum + point.x, 0);
    const sumY = polygon.points.reduce((sum, point) => sum + point.y, 0);

    return {
      x: sumX / polygon.points.length,
      y: sumY / polygon.points.length
    };
  }
} 