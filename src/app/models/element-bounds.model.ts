// Remove ElementType import and use string type

/**
 * Unified interface for element boundaries including visual extents
 */
export interface ElementBounds {
  // Core boundaries
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  
  // Center points
  centerX: number;
  centerY: number;
  
  // Rotation info
  rotation: number;
  rotationOrigin: { x: number; y: number };
  
  // Visual bounds (includes chairs, labels, etc.)
  visualLeft: number;
  visualTop: number;
  visualRight: number;
  visualBottom: number;
  
  // Element reference
  elementId: string;
  elementType: string;
}

/**
 * Represents a single alignment point on an element
 */
export interface AlignmentPoint {
  x: number;
  y: number;
  type: AlignmentPointType;
  elementId: string;
}

export type AlignmentPointType = 
  | 'left' 
  | 'center-x' 
  | 'right' 
  | 'top' 
  | 'center-y' 
  | 'bottom'
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right';

/**
 * Represents a visual guide line for alignment
 */
export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  start: number;    // y for vertical, x for horizontal
  end: number;      // y for vertical, x for horizontal
  sourceElement: string;
  targetElement: string;
  alignmentType: string; // e.g., "left-to-left", "center-to-center"
}

/**
 * Result of snap detection
 */
export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
  snappedX: boolean;
  snappedY: boolean;
}

/**
 * Represents an alignment match during detection
 */
export interface AlignmentMatch {
  axis: 'x' | 'y';
  draggedPoint: AlignmentPoint;
  targetPoint: AlignmentPoint;
  distance: number;
  snapPosition: number;
  priority: number;
}

/**
 * Configuration for snapping behavior
 */
export interface SnappingConfig {
  enableSnapping: boolean;
  snapThreshold: number;
  showAlignmentGuides: boolean;
  prioritizeCenterAlignment: boolean;
  enableCornerSnapping: boolean;
}