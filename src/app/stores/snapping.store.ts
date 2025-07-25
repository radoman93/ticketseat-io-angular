import { makeAutoObservable, action, runInAction } from 'mobx';
import { ElementBoundsService } from '../services/element-bounds.service';
import { layoutStore, TableElement } from './layout.store';
import { QuadTree, Bounds, SpatialItem } from '../utils/quadtree';
import { 
  ElementBounds, 
  AlignmentPoint, 
  AlignmentGuide, 
  SnapResult, 
  AlignmentMatch,
  SnappingConfig 
} from '../models/element-bounds.model';

interface SpatialElement extends SpatialItem {
  element: TableElement;
  bounds: ElementBounds;
}

export class SnappingStore {
  // Configuration
  config: SnappingConfig = {
    enableSnapping: false, // Disabled by default - user must enable
    snapThreshold: 10,
    showAlignmentGuides: true,
    prioritizeCenterAlignment: true,
    enableCornerSnapping: false // Disabled - we only snap to edges and center
  };
  
  // State
  activeGuides: AlignmentGuide[] = [];
  private spatialIndex: QuadTree<SpatialElement> | null = null;
  private boundsCache: Map<string, ElementBounds> = new Map();
  
  // Performance optimization
  private lastDetectionTime = 0;
  private detectionThrottle = 16; // ~60fps
  
  // Hysteresis state to prevent flickering
  lastSnapState = {
    x: { snapped: false, targetId: '', alignmentType: '' },
    y: { snapped: false, targetId: '', alignmentType: '' }
  };
  private hysteresisThreshold = 1.5; // Multiplier for snap-out threshold
  
  constructor(private elementBoundsService: ElementBoundsService) {
    makeAutoObservable(this, {
      toggleSnapping: action,
      setSnapThreshold: action,
      setActiveGuides: action,
      updateSpatialIndex: action,
      clearCache: action
    });
    
    this.initializeSpatialIndex();
  }
  
  /**
   * Toggle snapping on/off
   */
  toggleSnapping = () => {
    this.config.enableSnapping = !this.config.enableSnapping;
    if (!this.config.enableSnapping) {
      this.activeGuides = [];
    }
  };
  
  /**
   * Set snap threshold
   */
  setSnapThreshold = (threshold: number) => {
    this.config.snapThreshold = Math.max(5, Math.min(20, threshold));
  };
  
  /**
   * Set active alignment guides
   */
  setActiveGuides = (guides: AlignmentGuide[]) => {
    this.activeGuides = guides;
  };
  
  /**
   * Initialize spatial index
   */
  private initializeSpatialIndex(): void {
    // Create a spatial index covering a large area
    const worldBounds: Bounds = {
      x: -10000,
      y: -10000,
      width: 20000,
      height: 20000
    };
    
    this.spatialIndex = new QuadTree<SpatialElement>(worldBounds, 10, 8);
    this.rebuildSpatialIndex();
  }
  
  /**
   * Rebuild spatial index with all current elements
   */
  rebuildSpatialIndex = () => {
    if (!this.spatialIndex) return;
    
    this.spatialIndex.clear();
    this.boundsCache.clear();
    
    for (const element of layoutStore.elements) {
      const bounds = this.elementBoundsService.getElementBounds(element);
      this.boundsCache.set(element.id, bounds);
      
      const spatialElement: SpatialElement = {
        id: element.id,
        left: bounds.visualLeft,
        top: bounds.visualTop,
        right: bounds.visualRight,
        bottom: bounds.visualBottom,
        element,
        bounds
      };
      
      this.spatialIndex.insert(spatialElement);
    }
  };
  
  /**
   * Update spatial index for a specific element
   */
  updateSpatialIndex = (elementId: string) => {
    if (!this.spatialIndex) return;
    
    const element = layoutStore.elements.find(e => e.id === elementId);
    if (!element) return;
    
    // Remove old bounds
    const oldBounds = this.boundsCache.get(elementId);
    if (oldBounds) {
      this.spatialIndex.remove({
        id: elementId,
        left: oldBounds.visualLeft,
        top: oldBounds.visualTop,
        right: oldBounds.visualRight,
        bottom: oldBounds.visualBottom
      } as SpatialElement);
    }
    
    // Add new bounds
    const newBounds = this.elementBoundsService.getElementBounds(element);
    this.boundsCache.set(elementId, newBounds);
    
    const spatialElement: SpatialElement = {
      id: element.id,
      left: newBounds.visualLeft,
      top: newBounds.visualTop,
      right: newBounds.visualRight,
      bottom: newBounds.visualBottom,
      element,
      bounds: newBounds
    };
    
    this.spatialIndex.insert(spatialElement);
  };
  
  /**
   * Clear bounds cache
   */
  clearCache = () => {
    this.boundsCache.clear();
  };
  
  /**
   * Clear snap state (call when drag ends)
   */
  clearSnapState = () => {
    this.lastSnapState = {
      x: { snapped: false, targetId: '', alignmentType: '' },
      y: { snapped: false, targetId: '', alignmentType: '' }
    };
  };
  
  /**
   * Detect snap targets for a dragged element
   */
  detectSnapTargets(draggedElement: TableElement, proposedX: number, proposedY: number): SnapResult {
    // Check if snapping is enabled
    if (!this.config.enableSnapping || !this.spatialIndex) {
      return { 
        x: proposedX, 
        y: proposedY, 
        guides: [],
        snappedX: false,
        snappedY: false
      };
    }
    
    // Throttle detection for performance
    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionThrottle) {
      return { 
        x: proposedX, 
        y: proposedY, 
        guides: this.activeGuides,
        snappedX: false,
        snappedY: false
      };
    }
    this.lastDetectionTime = now;
    
    // Get bounds at proposed position
    const draggedBounds = this.elementBoundsService.calculateBoundsAtPosition(
      draggedElement, 
      proposedX, 
      proposedY
    );
    
    // Get alignment points for dragged element
    const draggedPoints = this.elementBoundsService.getAlignmentPoints(draggedBounds);
    
    // Find nearby elements using spatial index
    const searchBounds = QuadTree.createSearchBounds(
      draggedBounds.visualLeft,
      draggedBounds.visualTop,
      draggedBounds.visualRight - draggedBounds.visualLeft,
      draggedBounds.visualBottom - draggedBounds.visualTop,
      this.config.snapThreshold * 2
    );
    
    const nearbyElements = this.spatialIndex.query(searchBounds);
    
    // Find alignments
    const alignments = this.findAlignments(
      draggedPoints, 
      nearbyElements, 
      draggedElement.id,
      draggedBounds
    );
    
    // Calculate snap result
    const result = this.calculateSnapResult(proposedX, proposedY, alignments, draggedBounds);
    
    
    return result;
  }
  
  /**
   * Find alignment matches
   */
  private findAlignments(
    draggedPoints: AlignmentPoint[],
    nearbyElements: SpatialElement[],
    draggedId: string,
    draggedBounds: ElementBounds
  ): AlignmentMatch[] {
    const matches: AlignmentMatch[] = [];
    
    for (const nearby of nearbyElements) {
      if (nearby.element.id === draggedId) continue;
      
      const nearbyPoints = this.elementBoundsService.getAlignmentPoints(nearby.bounds);
      
      // Check each dragged point against each nearby point
      for (const draggedPoint of draggedPoints) {
        for (const nearbyPoint of nearbyPoints) {
          // Check X alignment
          if (this.shouldCheckAxis(draggedPoint.type, 'x')) {
            const xDiff = Math.abs(draggedPoint.x - nearbyPoint.x);
            const threshold = this.getEffectiveThreshold('x', nearbyPoint.elementId, 
              `${draggedPoint.type}-to-${nearbyPoint.type}`);
            
            if (xDiff <= threshold) {
              matches.push({
                axis: 'x',
                draggedPoint,
                targetPoint: nearbyPoint,
                distance: xDiff,
                snapPosition: nearbyPoint.x,
                priority: this.getAlignmentPriority(draggedPoint.type, nearbyPoint.type, xDiff)
              });
            }
          }
          
          // Check Y alignment
          if (this.shouldCheckAxis(draggedPoint.type, 'y')) {
            const yDiff = Math.abs(draggedPoint.y - nearbyPoint.y);
            const threshold = this.getEffectiveThreshold('y', nearbyPoint.elementId,
              `${draggedPoint.type}-to-${nearbyPoint.type}`);
            
            if (yDiff <= threshold) {
              matches.push({
                axis: 'y',
                draggedPoint,
                targetPoint: nearbyPoint,
                distance: yDiff,
                snapPosition: nearbyPoint.y,
                priority: this.getAlignmentPriority(draggedPoint.type, nearbyPoint.type, yDiff)
              });
            }
          }
        }
      }
    }
    
    // Sort by priority (lower is better)
    return matches.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Get effective threshold with hysteresis
   */
  private getEffectiveThreshold(axis: 'x' | 'y', targetId: string, alignmentType: string): number {
    const lastState = this.lastSnapState[axis];
    
    // If we're currently snapped to this target with same alignment type, 
    // use a larger threshold to maintain the snap
    if (lastState.snapped && 
        lastState.targetId === targetId && 
        lastState.alignmentType === alignmentType) {
      return this.config.snapThreshold * this.hysteresisThreshold;
    }
    
    return this.config.snapThreshold;
  }
  
  /**
   * Check if axis should be checked for given point type
   */
  private shouldCheckAxis(pointType: string, axis: 'x' | 'y'): boolean {
    if (axis === 'x') {
      return ['left', 'center-x', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(pointType);
    } else {
      return ['top', 'center-y', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(pointType);
    }
  }
  
  /**
   * Calculate alignment priority
   */
  private getAlignmentPriority(draggedType: string, targetType: string, distance: number): number {
    let priority = distance * 10; // Base priority on distance
    
    // Exact alignment gets highest priority
    if (distance === 0) {
      priority = 0;
    }
    
    // Center alignments get higher priority
    if (this.config.prioritizeCenterAlignment) {
      if (draggedType.includes('center') && targetType.includes('center')) {
        priority -= 5;
      }
    }
    
    // Same type alignments get higher priority
    if (draggedType === targetType) {
      priority -= 3;
    }
    
    // Corner alignments get lower priority if disabled
    if (!this.config.enableCornerSnapping) {
      if (draggedType.includes('left') || draggedType.includes('right')) {
        if (draggedType.includes('top') || draggedType.includes('bottom')) {
          priority += 10;
        }
      }
    }
    
    return priority;
  }
  
  /**
   * Calculate final snap position and guides
   */
  private calculateSnapResult(
    originalX: number,
    originalY: number,
    alignments: AlignmentMatch[],
    draggedBounds: ElementBounds
  ): SnapResult {
    let snapX = originalX;
    let snapY = originalY;
    let snappedX = false;
    let snappedY = false;
    const guides: AlignmentGuide[] = [];
    
    // Filter alignments to avoid ugly multi-edge snapping
    const filteredAlignments = this.filterConflictingAlignments(alignments);
    
    // Find best X alignment
    const xAlignments = filteredAlignments.filter(a => a.axis === 'x');
    if (xAlignments.length > 0) {
      const bestX = xAlignments[0];
      const offset = bestX.snapPosition - bestX.draggedPoint.x;
      snapX = originalX + offset;
      snappedX = true;
      
      // Update snap state for hysteresis
      this.lastSnapState.x = {
        snapped: true,
        targetId: bestX.targetPoint.elementId,
        alignmentType: `${bestX.draggedPoint.type}-to-${bestX.targetPoint.type}`
      };
      
      // Create vertical guide
      guides.push({
        type: 'vertical',
        position: bestX.snapPosition,
        start: Math.min(draggedBounds.visualTop, bestX.targetPoint.y - 50),
        end: Math.max(draggedBounds.visualBottom, bestX.targetPoint.y + 50),
        sourceElement: draggedBounds.elementId,
        targetElement: bestX.targetPoint.elementId,
        alignmentType: `${bestX.draggedPoint.type}-to-${bestX.targetPoint.type}`
      });
    } else {
      // Clear snap state when not snapping
      this.lastSnapState.x = { snapped: false, targetId: '', alignmentType: '' };
    }
    
    // Find best Y alignment
    const yAlignments = filteredAlignments.filter(a => a.axis === 'y');
    if (yAlignments.length > 0) {
      const bestY = yAlignments[0];
      const offset = bestY.snapPosition - bestY.draggedPoint.y;
      snapY = originalY + offset;
      snappedY = true;
      
      // Update snap state for hysteresis
      this.lastSnapState.y = {
        snapped: true,
        targetId: bestY.targetPoint.elementId,
        alignmentType: `${bestY.draggedPoint.type}-to-${bestY.targetPoint.type}`
      };
      
      // Create horizontal guide
      guides.push({
        type: 'horizontal',
        position: bestY.snapPosition,
        start: Math.min(draggedBounds.visualLeft, bestY.targetPoint.x - 50),
        end: Math.max(draggedBounds.visualRight, bestY.targetPoint.x + 50),
        sourceElement: draggedBounds.elementId,
        targetElement: bestY.targetPoint.elementId,
        alignmentType: `${bestY.draggedPoint.type}-to-${bestY.targetPoint.type}`
      });
    } else {
      // Clear snap state when not snapping
      this.lastSnapState.y = { snapped: false, targetId: '', alignmentType: '' };
    }
    
    return { x: snapX, y: snapY, guides, snappedX, snappedY };
  }
  
  /**
   * Filter conflicting alignments to prevent ugly multi-edge snapping
   */
  private filterConflictingAlignments(alignments: AlignmentMatch[]): AlignmentMatch[] {
    const filtered: AlignmentMatch[] = [];
    const processedAxes = new Map<string, AlignmentMatch>();
    
    // Group alignments by axis and target element
    const groupedAlignments = new Map<string, AlignmentMatch[]>();
    
    for (const alignment of alignments) {
      const key = `${alignment.axis}-${alignment.targetPoint.elementId}`;
      if (!groupedAlignments.has(key)) {
        groupedAlignments.set(key, []);
      }
      groupedAlignments.get(key)!.push(alignment);
    }
    
    // Process each group to select best alignment
    for (const [key, group] of groupedAlignments) {
      if (group.length === 1) {
        // No conflict, use the single alignment
        filtered.push(group[0]);
      } else {
        // Multiple alignments on same axis to same element - choose wisely
        const bestAlignment = this.selectBestAlignment(group);
        if (bestAlignment) {
          filtered.push(bestAlignment);
        }
      }
    }
    
    // Further filter to ensure only one alignment per axis across all elements
    const finalFiltered: AlignmentMatch[] = [];
    const axisMap = new Map<string, AlignmentMatch[]>();
    
    for (const alignment of filtered) {
      if (!axisMap.has(alignment.axis)) {
        axisMap.set(alignment.axis, []);
      }
      axisMap.get(alignment.axis)!.push(alignment);
    }
    
    // Select best alignment per axis
    for (const [axis, axisAlignments] of axisMap) {
      if (axisAlignments.length === 1) {
        finalFiltered.push(axisAlignments[0]);
      } else {
        // Multiple elements align on same axis - pick closest
        const best = axisAlignments.reduce((prev, curr) => 
          curr.distance < prev.distance ? curr : prev
        );
        finalFiltered.push(best);
      }
    }
    
    return finalFiltered;
  }
  
  /**
   * Select best alignment from a group of conflicting alignments
   */
  private selectBestAlignment(group: AlignmentMatch[]): AlignmentMatch | null {
    if (group.length === 0) return null;
    if (group.length === 1) return group[0];
    
    // Check if we have both center and edge alignments
    const centerAlignments = group.filter(a => 
      a.draggedPoint.type.includes('center') || a.targetPoint.type.includes('center')
    );
    const edgeAlignments = group.filter(a => 
      !a.draggedPoint.type.includes('center') && !a.targetPoint.type.includes('center')
    );
    
    // If we have both center and edge alignments, prefer center if it's close enough
    if (centerAlignments.length > 0 && edgeAlignments.length > 0) {
      const bestCenter = centerAlignments.reduce((prev, curr) => 
        curr.distance < prev.distance ? curr : prev
      );
      const bestEdge = edgeAlignments.reduce((prev, curr) => 
        curr.distance < prev.distance ? curr : prev
      );
      
      // Prefer center alignment if it's within 60% of the threshold
      if (bestCenter.distance <= this.config.snapThreshold * 0.6) {
        return bestCenter;
      }
      
      // Otherwise, choose based on distance
      return bestCenter.distance < bestEdge.distance ? bestCenter : bestEdge;
    }
    
    // If all alignments are of the same type, choose closest
    return group.reduce((prev, curr) => 
      curr.distance < prev.distance ? curr : prev
    );
  }
}

// Create singleton instance
export const snappingStore = new SnappingStore(new ElementBoundsService());