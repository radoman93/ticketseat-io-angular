import { Injectable } from '@angular/core';
import { SegmentProperties, SeatingRowProperties } from './selection.service';

@Injectable({
  providedIn: 'root'
})
export class SegmentedSeatingRowService {

  /**
   * Calculate the end position of the last chair in a segment
   */
  calculateSegmentEndPosition(segment: SegmentProperties): { x: number, y: number } {
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const totalDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (totalDistance === 0) {
      return { x: segment.startX, y: segment.startY };
    }
    
    // Normalize direction vector
    const normalizedDx = dx / totalDistance;
    const normalizedDy = dy / totalDistance;
    
    // Calculate actual distance based on seat count and spacing
    const actualDistance = (segment.seatCount - 1) * segment.seatSpacing;
    
    return {
      x: segment.startX + normalizedDx * actualDistance,
      y: segment.startY + normalizedDy * actualDistance
    };
  }

  /**
   * Calculate the position where the next segment should start
   * (at the location of the last chair of the previous segment)
   */
  calculateNextSegmentStartPosition(segment: SegmentProperties): { x: number, y: number } {
    return this.calculateSegmentEndPosition(segment);
  }

  /**
   * Generate a unique segment ID
   */
  generateSegmentId(seatingRowId: string, segmentIndex: number): string {
    return `${seatingRowId}-segment-${segmentIndex}-${Date.now()}`;
  }

  /**
   * Create a new segment
   */
  createSegment(
    seatingRowId: string,
    segmentIndex: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    seatSpacing: number = 35
  ): SegmentProperties {
    const dx = endX - startX;
    const dy = endY - startY;
    const totalDistance = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    const seatCount = Math.max(1, Math.floor(totalDistance / seatSpacing) + 1);

    return {
      id: this.generateSegmentId(seatingRowId, segmentIndex),
      startX,
      startY,
      endX,
      endY,
      seatCount,
      seatSpacing,
      rotation,
      segmentIndex
    };
  }

  /**
   * Update segment end position based on mouse position and snap to seat spacing
   */
  updateSegmentEndPosition(
    segment: SegmentProperties,
    mouseX: number,
    mouseY: number
  ): Partial<SegmentProperties> {
    const dx = mouseX - segment.startX;
    const dy = mouseY - segment.startY;
    const totalDistance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    const seatCount = Math.max(1, Math.floor(totalDistance / segment.seatSpacing) + 1);
    
    // Calculate the end position based on the actual number of seats and direction
    const actualDistance = (seatCount - 1) * segment.seatSpacing;
    const normalizedDx = dx / totalDistance || 0;
    const normalizedDy = dy / totalDistance || 0;
    
    return {
      endX: segment.startX + (normalizedDx * actualDistance),
      endY: segment.startY + (normalizedDy * actualDistance),
      seatCount,
      rotation: angle
    };
  }

  /**
   * Calculate total metrics for a segmented seating row
   */
  calculateSegmentedRowMetrics(segments: SegmentProperties[]): {
    totalSeats: number;
    totalSegments: number;
    totalLength: number;
  } {
    if (!segments || segments.length === 0) {
      return { totalSeats: 0, totalSegments: 0, totalLength: 0 };
    }

    const totalSeats = segments.reduce((sum, segment) => sum + segment.seatCount, 0);
    const totalLength = segments.reduce((sum, segment) => {
      const dx = segment.endX - segment.startX;
      const dy = segment.endY - segment.startY;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);

    return {
      totalSeats,
      totalSegments: segments.length,
      totalLength
    };
  }

  /**
   * Validate segment data
   */
  validateSegment(segment: SegmentProperties): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!segment.id) errors.push('Segment ID is required');
    if (segment.seatCount < 1) errors.push('Seat count must be at least 1');
    if (segment.seatSpacing <= 0) errors.push('Seat spacing must be positive');
    if (segment.segmentIndex < 0) errors.push('Segment index must be non-negative');

    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < segment.seatSpacing && segment.seatCount > 1) {
      errors.push('Segment is too short for the specified seat count and spacing');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert a regular seating row to a segmented one
   */
  convertToSegmented(seatingRow: SeatingRowProperties): SeatingRowProperties {
    if (seatingRow.isSegmented) {
      return seatingRow; // Already segmented
    }

    const segment = this.createSegment(
      seatingRow.id,
      0,
      seatingRow.x,
      seatingRow.y,
      seatingRow.endX,
      seatingRow.endY,
      seatingRow.seatSpacing
    );

    return {
      ...seatingRow,
      isSegmented: true,
      segments: [segment],
      totalSegments: 1,
      totalSeats: segment.seatCount
    };
  }

  /**
   * Convert a segmented seating row back to a regular one (using first segment)
   */
  convertToRegular(seatingRow: SeatingRowProperties): SeatingRowProperties {
    if (!seatingRow.isSegmented || !seatingRow.segments || seatingRow.segments.length === 0) {
      return seatingRow; // Already regular or no segments
    }

    const firstSegment = seatingRow.segments[0];
    
    return {
      ...seatingRow,
      x: firstSegment.startX,
      y: firstSegment.startY,
      endX: firstSegment.endX,
      endY: firstSegment.endY,
      seatCount: firstSegment.seatCount,
      seatSpacing: firstSegment.seatSpacing,
      rotation: firstSegment.rotation,
      isSegmented: false,
      segments: undefined,
      totalSegments: undefined,
      totalSeats: undefined
    };
  }
} 