import { Injectable } from '@angular/core';
import { ElementBounds, AlignmentPoint, AlignmentPointType } from '../models/element-bounds.model';
import { TableElement } from '../stores/layout.store';
import { 
  RoundTableProperties, 
  RectangleTableProperties, 
  SeatingRowProperties
} from '../services/selection.service';
import { 
  LineElement,
  PolygonElement,
  TextElement
} from '../models/elements.model';

@Injectable({ providedIn: 'root' })
export class ElementBoundsService {
  
  /**
   * Calculate bounds for any element type
   */
  getElementBounds(element: TableElement): ElementBounds {
    switch (element.type) {
      case 'roundTable':
        return this.getRoundTableBounds(element as RoundTableProperties);
      case 'rectangleTable':
        return this.getRectangleTableBounds(element as RectangleTableProperties);
      case 'seatingRow':
        return this.getSeatingRowBounds(element as SeatingRowProperties);
      case 'segmentedSeatingRow':
        return this.getSegmentedSeatingRowBounds(element as any);
      case 'line':
        return this.getLineBounds(element as LineElement);
      case 'polygon':
        return this.getPolygonBounds(element as PolygonElement);
      case 'text':
        return this.getTextBounds(element as TextElement);
      default:
        throw new Error(`Unknown element type: ${(element as any).type}`);
    }
  }
  
  /**
   * Get all alignment points for an element
   * Only returns outermost edge points and center point
   */
  getAlignmentPoints(bounds: ElementBounds): AlignmentPoint[] {
    const points: AlignmentPoint[] = [];
    
    // Edge points (outermost bounds including chairs)
    points.push(
      { x: bounds.visualLeft, y: bounds.centerY, type: 'left', elementId: bounds.elementId },
      { x: bounds.centerX, y: bounds.visualTop, type: 'top', elementId: bounds.elementId },
      { x: bounds.visualRight, y: bounds.centerY, type: 'right', elementId: bounds.elementId },
      { x: bounds.centerX, y: bounds.visualBottom, type: 'bottom', elementId: bounds.elementId }
    );
    
    // Center points (for both horizontal and vertical center alignment)
    points.push(
      { x: bounds.centerX, y: bounds.centerY, type: 'center-x', elementId: bounds.elementId },
      { x: bounds.centerX, y: bounds.centerY, type: 'center-y', elementId: bounds.elementId }
    );
    
    // No corner points - we only snap to edges and center
    
    // Apply rotation if needed
    if (bounds.rotation !== 0) {
      return points.map(point => ({
        ...point,
        ...this.rotatePoint(
          { x: point.x, y: point.y },
          bounds.rotationOrigin,
          bounds.rotation
        )
      }));
    }
    
    return points;
  }
  
  /**
   * Calculate bounds at a specific position (for preview during drag)
   */
  calculateBoundsAtPosition(element: TableElement, x: number, y: number): ElementBounds {
    // Get current bounds
    const currentBounds = this.getElementBounds(element);
    
    // Calculate offset
    const dx = x - element.x;
    const dy = y - element.y;
    
    // Apply offset to all coordinates
    return {
      ...currentBounds,
      left: currentBounds.left + dx,
      top: currentBounds.top + dy,
      right: currentBounds.right + dx,
      bottom: currentBounds.bottom + dy,
      centerX: currentBounds.centerX + dx,
      centerY: currentBounds.centerY + dy,
      visualLeft: currentBounds.visualLeft + dx,
      visualTop: currentBounds.visualTop + dy,
      visualRight: currentBounds.visualRight + dx,
      visualBottom: currentBounds.visualBottom + dy,
      rotationOrigin: {
        x: currentBounds.rotationOrigin.x + dx,
        y: currentBounds.rotationOrigin.y + dy
      }
    };
  }
  
  /**
   * Round table bounds calculation
   */
  private getRoundTableBounds(element: RoundTableProperties): ElementBounds {
    const chairOffset = 25; // Distance from table edge  
    const chairRadius = 10; // Approximate chair radius
    const chairPadding = chairOffset + chairRadius + 10; // Total padding needed
    const visualRadius = element.radius + chairPadding;
    
    return {
      // Core bounds (table only)
      left: element.x - element.radius,
      top: element.y - element.radius,
      right: element.x + element.radius,
      bottom: element.y + element.radius,
      width: element.radius * 2,
      height: element.radius * 2,
      
      // Center
      centerX: element.x,
      centerY: element.y,
      
      // Rotation
      rotation: element.rotation || 0,
      rotationOrigin: { x: element.x, y: element.y },
      
      // Visual bounds (including chairs)
      visualLeft: element.x - visualRadius,
      visualTop: element.y - visualRadius,
      visualRight: element.x + visualRadius,
      visualBottom: element.y + visualRadius,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Rectangle table bounds calculation
   */
  private getRectangleTableBounds(element: RectangleTableProperties): ElementBounds {
    const chairOffset = 25; // Distance from table edge (from rectangle-table.component.ts)
    const chairRadius = 10; // Approximate chair radius
    const chairPadding = chairOffset + chairRadius + 10; // Total padding needed
    const halfWidth = element.width / 2;
    const halfHeight = element.height / 2;
    const visualHalfWidth = halfWidth + chairPadding;
    const visualHalfHeight = halfHeight + chairPadding;
    
    return {
      // Core bounds
      left: element.x - halfWidth,
      top: element.y - halfHeight,
      right: element.x + halfWidth,
      bottom: element.y + halfHeight,
      width: element.width,
      height: element.height,
      
      // Center
      centerX: element.x,
      centerY: element.y,
      
      // Rotation
      rotation: element.rotation || 0,
      rotationOrigin: { x: element.x, y: element.y },
      
      // Visual bounds
      visualLeft: element.x - visualHalfWidth,
      visualTop: element.y - visualHalfHeight,
      visualRight: element.x + visualHalfWidth,
      visualBottom: element.y + visualHalfHeight,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Seating row bounds calculation
   */
  private getSeatingRowBounds(element: SeatingRowProperties): ElementBounds {
    const labelOffset = 60;
    const chairWidth = 20;
    const chairHeight = 20;
    const padding = 20;

    // Calculate actual row dimensions in LOCAL coordinate system (relative to start point)
    // The row rotates around (element.x, element.y), which is treated as origin (0, 0) locally
    const rowLength = element.seatCount > 0
      ? (element.seatCount - 1) * element.seatSpacing + chairWidth
      : chairWidth;

    // Local bounds (in the row's coordinate system where start point is 0,0)
    const localLeft = -labelOffset - padding;
    const localRight = rowLength + padding;
    const localTop = -chairHeight / 2 - padding;
    const localBottom = chairHeight / 2 + padding;

    // Center in local coordinate system
    const localCenterX = (localLeft + localRight) / 2;
    const localCenterY = (localTop + localBottom) / 2;

    // Convert to world coordinates by adding the rotation origin
    const left = element.x + localLeft;
    const right = element.x + localRight;
    const top = element.y + localTop;
    const bottom = element.y + localBottom;
    const centerX = element.x + localCenterX;
    const centerY = element.y + localCenterY;

    return {
      // Core bounds
      left: element.x - labelOffset,
      top: element.y - chairHeight / 2,
      right: element.x + rowLength,
      bottom: element.y + chairHeight / 2,
      width: rowLength + labelOffset,
      height: chairHeight,

      // Center (in world coordinates, but represents center of unrotated box)
      centerX,
      centerY,

      // Rotation
      rotation: element.rotation || 0,
      rotationOrigin: { x: element.x, y: element.y },

      // Visual bounds (in world coordinates, unrotated)
      visualLeft: left,
      visualTop: top,
      visualRight: right,
      visualBottom: bottom,

      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Segmented seating row bounds calculation
   */
  private getSegmentedSeatingRowBounds(element: any): ElementBounds {
    if (!element.segments || element.segments.length === 0) {
      // Return default bounds if no segments
      return this.getDefaultBounds(element);
    }
    
    // Find bounding box of all segments
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const segment of element.segments) {
      minX = Math.min(minX, segment.startX, segment.endX);
      minY = Math.min(minY, segment.startY, segment.endY);
      maxX = Math.max(maxX, segment.startX, segment.endX);
      maxY = Math.max(maxY, segment.startY, segment.endY);
    }
    
    const padding = 20;
    const chairHeight = 20;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    return {
      // Core bounds
      left: minX,
      top: minY - chairHeight / 2,
      right: maxX,
      bottom: maxY + chairHeight / 2,
      width: maxX - minX,
      height: (maxY - minY) + chairHeight,
      
      // Center
      centerX,
      centerY,
      
      // Rotation
      rotation: element.rotation || 0,
      rotationOrigin: { x: centerX, y: centerY },
      
      // Visual bounds
      visualLeft: minX - padding,
      visualTop: minY - chairHeight / 2 - padding,
      visualRight: maxX + padding,
      visualBottom: maxY + chairHeight / 2 + padding,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Line bounds calculation
   */
  private getLineBounds(element: LineElement): ElementBounds {
    const padding = 10;
    const minX = Math.min(element.startX, element.endX);
    const maxX = Math.max(element.startX, element.endX);
    const minY = Math.min(element.startY, element.endY);
    const maxY = Math.max(element.startY, element.endY);
    
    const centerX = (element.startX + element.endX) / 2;
    const centerY = (element.startY + element.endY) / 2;
    
    const angle = Math.atan2(
      element.endY - element.startY,
      element.endX - element.startX
    ) * 180 / Math.PI;
    
    return {
      // Core bounds
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX || 1,
      height: maxY - minY || 1,
      
      // Center
      centerX,
      centerY,
      
      // Rotation
      rotation: angle,
      rotationOrigin: { x: centerX, y: centerY },
      
      // Visual bounds
      visualLeft: minX - padding,
      visualTop: minY - padding,
      visualRight: maxX + padding,
      visualBottom: maxY + padding,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Polygon bounds calculation
   */
  private getPolygonBounds(element: PolygonElement): ElementBounds {
    if (!element.points || element.points.length === 0) {
      return this.getDefaultBounds(element);
    }
    
    const xs = element.points.map(p => p.x);
    const ys = element.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 10;
    
    return {
      // Core bounds
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY,
      
      // Center
      centerX: element.x,
      centerY: element.y,
      
      // Rotation
      rotation: 0,
      rotationOrigin: { x: element.x, y: element.y },
      
      // Visual bounds
      visualLeft: minX - padding,
      visualTop: minY - padding,
      visualRight: maxX + padding,
      visualBottom: maxY + padding,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Text bounds calculation
   */
  private getTextBounds(element: TextElement): ElementBounds {
    // Estimate text dimensions (this could be improved with actual measurement)
    const estimatedWidth = element.text.length * 8;
    const estimatedHeight = 20;
    const padding = 5;
    
    const halfWidth = estimatedWidth / 2;
    const halfHeight = estimatedHeight / 2;
    
    return {
      // Core bounds
      left: element.x - halfWidth,
      top: element.y - halfHeight,
      right: element.x + halfWidth,
      bottom: element.y + halfHeight,
      width: estimatedWidth,
      height: estimatedHeight,
      
      // Center
      centerX: element.x,
      centerY: element.y,
      
      // Rotation
      rotation: element.rotation || 0,
      rotationOrigin: { x: element.x, y: element.y },
      
      // Visual bounds
      visualLeft: element.x - halfWidth - padding,
      visualTop: element.y - halfHeight - padding,
      visualRight: element.x + halfWidth + padding,
      visualBottom: element.y + halfHeight + padding,
      
      // Reference
      elementId: element.id,
      elementType: element.type as any
    };
  }
  
  /**
   * Default bounds for elements without specific calculation
   */
  private getDefaultBounds(element: TableElement): ElementBounds {
    return {
      left: element.x - 50,
      top: element.y - 50,
      right: element.x + 50,
      bottom: element.y + 50,
      width: 100,
      height: 100,
      centerX: element.x,
      centerY: element.y,
      rotation: 0,
      rotationOrigin: { x: element.x, y: element.y },
      visualLeft: element.x - 50,
      visualTop: element.y - 50,
      visualRight: element.x + 50,
      visualBottom: element.y + 50,
      elementId: element.id,
      elementType: element.type
    };
  }
  
  /**
   * Apply rotation transformation to a point
   */
  private rotatePoint(
    point: { x: number; y: number },
    origin: { x: number; y: number },
    rotation: number
  ): { x: number; y: number } {
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    
    return {
      x: origin.x + (dx * cos - dy * sin),
      y: origin.y + (dx * sin + dy * cos)
    };
  }
}