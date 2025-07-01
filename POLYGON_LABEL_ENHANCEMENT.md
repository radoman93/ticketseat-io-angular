# Polygon Label Visibility and Centroid Positioning

## Features Implemented

### 1. Label Visibility Toggle
Added a toggle control in the polygon properties panel to show/hide the polygon label.

### 2. Improved Centroid Calculation
Implemented proper geometric centroid calculation for accurate label positioning on polygon center of mass.

## Changes Made

### 1. PolygonProperties Interface Update
**File**: `src/app/services/selection.service.ts`

Added `labelVisible` property:
```typescript
export interface PolygonProperties extends Selectable {
  type: 'polygon';
  points: {x: number, y: number}[];
  thickness?: number;
  strokeColor?: string;
  fillColor?: string;
  name?: string;
  label?: string;
  labelVisible?: boolean;  // NEW: Controls label visibility
  closed?: boolean;
}
```

### 2. Enhanced PolygonService
**File**: `src/app/services/polygon.service.ts`

#### Default Property Addition
- Added `labelVisible: true` to `createPolygon()` method for new polygons

#### Improved Centroid Calculation
- **Simple Cases**: Single point returns that point, two points return midpoint
- **Open Polygons**: Uses simple average of all points
- **Closed Polygons**: Uses geometric centroid (center of mass) calculation
- **Shoelace Formula**: Implements proper polygon centroid algorithm for irregular shapes

```typescript
calculateCenter(polygon: PolygonProperties): {x: number, y: number} {
  // Handles different cases based on point count and polygon state
  if (polygon.closed && polygon.points.length >= 3) {
    return this.calculatePolygonCentroid(polygon.points);
  }
  // Fallback to simple average for open polygons
}

private calculatePolygonCentroid(points): {x: number, y: number} {
  // Uses shoelace formula for accurate geometric centroid
  // Handles degenerate cases with fallback to simple average
}
```

### 3. Properties Panel Enhancement
**File**: `src/app/components/properties-panel/properties-panel.component.html`

#### Added Label Visibility Toggle
```html
<!-- Label Visibility -->
<div class="flex items-center justify-between mb-2">
  <label class="text-sm text-gray-600">Show Label:</label>
  <input 
    type="checkbox" 
    class="toggle toggle-sm"
    [ngModel]="polygonProperties.labelVisible !== false" 
    (ngModelChange)="updateProperty('labelVisible', $event)">
</div>
```

#### Default Property Initialization
**File**: `src/app/components/properties-panel/properties-panel.component.ts`

Added automatic initialization of `labelVisible` property:
```typescript
else if (freshItem.type === 'polygon') {
  if (freshItem.labelVisible === undefined) {
    this.updateProperty('labelVisible', true);
  }
}
```

### 4. Enhanced Polygon Component
**File**: `src/app/components/polygon/polygon.component.ts`

#### Service Integration
- Injected `PolygonService` for centroid calculations
- Updated `centerX` and `centerY` getters to use service methods

#### Improved Label Rendering
```html
<!-- Label in the center -->
<text
  *ngIf="polygon.label && polygon.labelVisible !== false && polygon.points.length >= 2"
  [attr.x]="centerX - svgLeft"
  [attr.y]="centerY - svgTop"
  text-anchor="middle"
  alignment-baseline="middle"
  [style.pointer-events]="'none'"
  fill="#000000"
  font-size="14px"
  font-family="Arial, sans-serif">
  {{polygon.label}}
</text>
```

#### Key Improvements
- **Visibility Control**: Respects `labelVisible` property
- **Extended Support**: Shows labels for polygons with 2+ points (not just closed polygons)
- **Accurate Positioning**: Uses geometric centroid instead of bounding box center
- **Better Typography**: Added font-family for consistent rendering

## User Experience

### Properties Panel
1. **Label Text**: Editable text field for custom label content
2. **Show Label Toggle**: DaisyUI toggle switch to control visibility
3. **Visual Feedback**: Toggle reflects current state accurately

### Label Positioning
1. **Single Point**: Label at the point location
2. **Two Points**: Label at midpoint between points
3. **Open Polygons**: Label at average position of all points
4. **Closed Polygons**: Label at geometric centroid (center of mass)

### Label Visibility States
- **Default**: New polygons have labels visible by default
- **Toggle Off**: Label disappears but text remains editable
- **Toggle On**: Label reappears at calculated centroid position
- **Existing Polygons**: Automatically get `labelVisible: true` when selected

## Mathematical Accuracy

### Geometric Centroid Formula
For closed polygons, uses the shoelace formula:
```
Cx = (1/6A) * Σ(xi + xi+1)(xi*yi+1 - xi+1*yi)
Cy = (1/6A) * Σ(yi + yi+1)(xi*yi+1 - xi+1*yi)
A = (1/2) * Σ(xi*yi+1 - xi+1*yi)
```

### Benefits
- **Accurate for Irregular Shapes**: Works correctly for non-convex polygons
- **Center of Mass**: Labels appear at the true geometric center
- **Degeneracy Handling**: Falls back to simple average for edge cases
- **Performance**: Efficient O(n) calculation

## Backward Compatibility

- **Existing Polygons**: Automatically get `labelVisible: true` when selected
- **Default Behavior**: New polygons have labels visible by default
- **No Breaking Changes**: All existing functionality preserved
- **Graceful Fallbacks**: Handles missing properties appropriately

## Technical Quality

- **Type Safety**: Full TypeScript support with proper interfaces
- **Service Architecture**: Separation of concerns with dedicated calculation methods
- **Reactive Updates**: MobX integration for immediate visual feedback
- **Error Handling**: Robust handling of edge cases and degenerate polygons
- **Performance**: Efficient centroid calculation with minimal overhead

The polygon labeling system now provides professional-grade functionality with accurate positioning and intuitive user controls.
