# Element-to-Element Snapping Feature

## Feature Overview
Implement intelligent element snapping that allows users to precisely align elements while dragging by detecting nearby elements and snapping to their alignment points. The system will provide visual feedback through dashed guide lines showing active alignments.

## Technical Specification

### Core Concepts

#### ElementBounds Interface
A unified interface for calculating element boundaries including their visual extents (e.g., chairs for tables):

```typescript
interface ElementBounds {
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
  elementType: ElementType;
}
```

#### Alignment Points
Each element will provide 5 alignment points for snapping (using visual bounds that include chairs):

```typescript
interface AlignmentPoint {
  x: number;
  y: number;
  type: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 
        'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  elementId: string;
}

interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  start: number;    // y for vertical, x for horizontal
  end: number;      // y for vertical, x for horizontal
  sourceElement: string;
  targetElement: string;
  alignmentType: string; // e.g., "left-to-left", "center-to-center"
}
```

### Snapping Behavior

1. **Detection Range**: 10px default (configurable 5-20px)
2. **Priority Order**:
   - Exact alignment (0px difference)
   - Center alignments
   - Edge alignments
   - Corner alignments
3. **Multi-axis**: Can snap on both X and Y axes simultaneously
4. **Visual Bounds**: Always use visual bounds (including chairs) for tables

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Create ElementBounds Service
**File**: `src/app/services/element-bounds.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ElementBoundsService {
  // Calculate bounds for any element type
  getElementBounds(element: TableElement): ElementBounds {
    switch (element.type) {
      case 'roundTable':
        return this.getRoundTableBounds(element);
      case 'rectangleTable':
        return this.getRectangleTableBounds(element);
      case 'seatingRow':
        return this.getSeatingRowBounds(element);
      // ... other types
    }
  }
  
  // Get all alignment points for an element
  getAlignmentPoints(bounds: ElementBounds): AlignmentPoint[] {
    return [
      // Edges
      { x: bounds.visualLeft, y: bounds.centerY, type: 'left' },
      { x: bounds.centerX, y: bounds.visualTop, type: 'top' },
      { x: bounds.visualRight, y: bounds.centerY, type: 'right' },
      { x: bounds.centerX, y: bounds.visualBottom, type: 'bottom' },
      // Centers
      { x: bounds.centerX, y: bounds.centerY, type: 'center-x' },
      { x: bounds.centerX, y: bounds.centerY, type: 'center-y' },
      // Corners
      { x: bounds.visualLeft, y: bounds.visualTop, type: 'top-left' },
      { x: bounds.visualRight, y: bounds.visualTop, type: 'top-right' },
      { x: bounds.visualLeft, y: bounds.visualBottom, type: 'bottom-left' },
      { x: bounds.visualRight, y: bounds.visualBottom, type: 'bottom-right' }
    ];
  }
  
  // Handle rotation transformations
  private applyRotation(point: {x: number, y: number}, origin: {x: number, y: number}, rotation: number): {x: number, y: number} {
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
```

#### 1.2 Create Snapping Store
**File**: `src/app/stores/snapping.store.ts`

```typescript
export class SnappingStore {
  // Configuration
  enableSnapping = true;
  snapThreshold = 10;
  showAlignmentGuides = true;
  
  // State
  activeGuides: AlignmentGuide[] = [];
  snapTargets: Map<string, ElementBounds> = new Map();
  
  // Spatial index for performance
  private spatialIndex: QuadTree<ElementBounds>;
  
  constructor(
    private elementBoundsService: ElementBoundsService,
    private layoutStore: LayoutStore
  ) {
    makeAutoObservable(this);
    this.initializeSpatialIndex();
  }
  
  // Detect snap targets for a dragged element
  detectSnapTargets(draggedElement: TableElement, proposedX: number, proposedY: number): SnapResult {
    if (!this.enableSnapping) return { x: proposedX, y: proposedY, guides: [] };
    
    // Get bounds at proposed position
    const draggedBounds = this.calculateBoundsAtPosition(draggedElement, proposedX, proposedY);
    const draggedPoints = this.elementBoundsService.getAlignmentPoints(draggedBounds);
    
    // Find nearby elements using spatial index
    const nearbyElements = this.spatialIndex.query(this.getSearchBounds(draggedBounds));
    
    // Find best alignments
    const alignments = this.findAlignments(draggedPoints, nearbyElements, draggedElement.id);
    
    // Calculate snapped position and guides
    return this.calculateSnapResult(proposedX, proposedY, alignments, draggedBounds);
  }
}
```

### Phase 2: Spatial Indexing System

#### 2.1 Implement QuadTree
**File**: `src/app/utils/quadtree.ts`

```typescript
export class QuadTree<T extends { left: number; top: number; right: number; bottom: number }> {
  private root: QuadNode<T>;
  private maxDepth = 8;
  private maxItems = 10;
  
  insert(item: T): void { /* ... */ }
  remove(item: T): void { /* ... */ }
  query(bounds: Bounds): T[] { /* ... */ }
  clear(): void { /* ... */ }
  update(item: T): void { /* ... */ }
}
```

#### 2.2 Maintain Spatial Index
- Update index when elements are added/removed/moved
- Batch updates for performance
- Clear and rebuild periodically if needed

### Phase 3: Snapping Detection Algorithm

#### 3.1 Alignment Detection Logic
```typescript
private findAlignments(
  draggedPoints: AlignmentPoint[],
  nearbyElements: ElementBounds[],
  draggedId: string
): AlignmentMatch[] {
  const matches: AlignmentMatch[] = [];
  
  for (const nearby of nearbyElements) {
    if (nearby.elementId === draggedId) continue;
    
    const nearbyPoints = this.elementBoundsService.getAlignmentPoints(nearby);
    
    // Check each dragged point against each nearby point
    for (const draggedPoint of draggedPoints) {
      for (const nearbyPoint of nearbyPoints) {
        // Check X alignment
        const xDiff = Math.abs(draggedPoint.x - nearbyPoint.x);
        if (xDiff <= this.snapThreshold) {
          matches.push({
            axis: 'x',
            draggedPoint,
            targetPoint: nearbyPoint,
            distance: xDiff,
            snapPosition: nearbyPoint.x
          });
        }
        
        // Check Y alignment
        const yDiff = Math.abs(draggedPoint.y - nearbyPoint.y);
        if (yDiff <= this.snapThreshold) {
          matches.push({
            axis: 'y',
            draggedPoint,
            targetPoint: nearbyPoint,
            distance: yDiff,
            snapPosition: nearbyPoint.y
          });
        }
      }
    }
  }
  
  // Sort by distance and priority
  return this.prioritizeAlignments(matches);
}
```

### Phase 4: Drag System Integration

#### 4.1 Modify DragStore
**File**: `src/app/stores/drag.store.ts`

```typescript
// In updateDragPosition method
updateDragPosition = action('updateDragPosition', (mouseX: number, mouseY: number) => {
  if (!this.isDragging || !this.draggedItem) return;
  
  // Calculate base position (existing code)
  const dx = mouseX - this.startMouseX;
  const dy = mouseY - this.startMouseY;
  const zoomFactor = gridStore.zoomLevel / 100;
  const canvasDx = dx / zoomFactor;
  const canvasDy = dy / zoomFactor;
  
  let newX = this.startElementX + canvasDx;
  let newY = this.startElementY + canvasDy;
  
  // Apply element-to-element snapping (NEW)
  if (snappingStore.enableSnapping) {
    const snapResult = snappingStore.detectSnapTargets(this.draggedItem, newX, newY);
    newX = snapResult.x;
    newY = snapResult.y;
    snappingStore.setActiveGuides(snapResult.guides);
  } 
  // Apply grid snapping only if element snapping didn't occur
  else if (gridStore.snapToGrid) {
    const snapped = gridStore.snapCoordinateToGrid(newX, newY);
    newX = snapped.x;
    newY = snapped.y;
  }
  
  // Update position (existing code continues...)
});
```

### Phase 5: Visual Alignment Guides

#### 5.1 Create Guide Renderer
**File**: `src/app/services/alignment-guide-renderer.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AlignmentGuideRenderer {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  
  // Visual configuration
  private config = {
    lineColor: '#3498db',
    lineWidth: 1,
    dashPattern: [5, 5],
    opacity: 0.8,
    extendBeyondElements: 20, // px beyond element bounds
  };
  
  renderGuides(guides: AlignmentGuide[], zoom: number, pan: { x: number; y: number }): void {
    if (!this.ctx || !this.canvas) return;
    
    // Clear previous guides
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set line style
    this.ctx.strokeStyle = this.config.lineColor;
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.setLineDash(this.config.dashPattern);
    this.ctx.globalAlpha = this.config.opacity;
    
    // Render each guide
    for (const guide of guides) {
      this.renderGuide(guide, zoom, pan);
    }
    
    // Reset line dash
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;
  }
  
  private renderGuide(guide: AlignmentGuide, zoom: number, pan: { x: number; y: number }): void {
    const ctx = this.ctx!;
    
    ctx.beginPath();
    
    if (guide.type === 'vertical') {
      const x = (guide.position * zoom) + pan.x;
      const startY = (guide.start * zoom) + pan.y - this.config.extendBeyondElements;
      const endY = (guide.end * zoom) + pan.y + this.config.extendBeyondElements;
      
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    } else {
      const y = (guide.position * zoom) + pan.y;
      const startX = (guide.start * zoom) + pan.x - this.config.extendBeyondElements;
      const endX = (guide.end * zoom) + pan.x + this.config.extendBeyondElements;
      
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    
    ctx.stroke();
  }
}
```

#### 5.2 Add Guide Canvas Layer
**File**: `src/app/components/grid/grid.component.html`

```html
<!-- Add after selection canvas -->
<canvas 
  #alignmentCanvas
  class="alignment-canvas"
  [style.width.px]="gridContainerRef?.nativeElement?.clientWidth || 0"
  [style.height.px]="gridContainerRef?.nativeElement?.clientHeight || 0">
</canvas>
```

### Phase 6: UI Controls and Settings

#### 6.1 Toolbar Integration
**File**: `src/app/components/toolbars/main-toolbar/main-toolbar.component.html`

```html
<!-- Add snapping toggle -->
<button 
  class="btn btn-sm"
  [class.btn-primary]="snappingStore.enableSnapping"
  (click)="snappingStore.toggleSnapping()"
  title="Snap to Objects (Hold Alt to disable temporarily)">
  <i class="fas fa-magnet"></i>
</button>
```

#### 6.2 Keyboard Shortcuts
- **Alt key**: Temporarily disable snapping while held
- **Shift key**: Constrain to single axis
- **Ctrl/Cmd**: Increase snap threshold temporarily

### Phase 7: Performance Optimizations

1. **Throttle Detection**: Run snap detection every 2-3 frames max
2. **Viewport Culling**: Only check elements within extended viewport
3. **Cache Bounds**: Until element properties change
4. **Batch Updates**: Group spatial index updates
5. **Early Exit**: Stop searching after finding perfect alignment

### Phase 8: Advanced Features

#### 8.1 Smart Spacing Detection
- Detect equal spacing between multiple elements
- Suggest alignment to maintain consistent gaps
- Show spacing measurements

#### 8.2 Multi-Select Snapping
- Maintain relative positions of selected group
- Snap group as a whole
- Align group edges/centers

#### 8.3 Distribution Helpers
- Distribute elements evenly
- Align to center of multiple elements
- Match existing spacing patterns

## Testing Strategy

### Unit Tests
1. **ElementBoundsService**: Verify bounds calculation for all element types
2. **Alignment Detection**: Test point matching logic
3. **Snap Calculation**: Verify position adjustments
4. **Spatial Index**: Test insertion, removal, querying

### Integration Tests
1. **Drag + Snap Flow**: Complete user interaction
3. **Performance**: Large layout handling (1000+ elements)
4. **Edge Cases**: Rotated elements, nested groups

### Visual Tests
1. **Guide Rendering**: Accuracy and appearance
2. **Alignment Precision**: Pixel-perfect positioning
3. **Performance**: Smooth dragging experience

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create ElementBounds interface
- [ ] Implement ElementBoundsService
- [ ] Create SnappingStore with MobX
- [ ] Add ElementBounds calculation for all 7 element types

### Phase 2: Spatial Indexing
- [ ] Implement QuadTree data structure
- [ ] Integrate with LayoutStore
- [ ] Update index on element changes

### Phase 3: Detection Algorithm
- [ ] Implement alignment point detection
- [ ] Add distance calculations
- [ ] Create alignment prioritization

### Phase 4: Drag Integration
- [ ] Modify DragStore.updateDragPosition
- [ ] Add snap result application
- [ ] Maintain smooth drag feel

### Phase 5: Visual Guides
- [ ] Create AlignmentGuideRenderer service
- [ ] Add guide canvas to GridComponent
- [ ] Implement guide rendering logic

### Phase 6: UI Controls
- [ ] Add toolbar toggle button
- [ ] Implement keyboard shortcuts
- [ ] Add settings panel

### Phase 7: Optimization
- [ ] Add detection throttling
- [ ] Implement viewport culling
- [ ] Add caching strategy

### Phase 8: Advanced Features
- [ ] Smart spacing detection
- [ ] Multi-select support
- [ ] Distribution helpers

## Success Metrics

1. **Performance**: < 5ms snap detection per frame
2. **Accuracy**: Pixel-perfect alignment (< 1px error)
3. **UX**: Smooth, responsive dragging
4. **Visual**: Guide lines render within 1 frame
5. **Adoption**: 80%+ users enable snapping

## Future Enhancements

1. **Magnetic Guides**: Elements "pull" towards alignment
2. **Text Baseline**: Align text elements by baseline
3. **Custom Guides**: User-defined alignment lines
4. **Smart Layout**: AI-suggested optimal arrangements
5. **Alignment Templates**: Predefined layout patterns