# Task: Fix Selection Box Positioning at Different Zoom Levels

## Problem Analysis
Selection boxes were misaligned at different zoom levels (85%, 90%, etc.) due to using `translate(-50%, -50%)` CSS transform within a scaled container. The percentage-based transform is calculated after scaling, causing incorrect positioning.

## Implementation Roadmap

### Phase 1: Update Selection Positioning Logic ✅
**Task**: Modify selection box positioning to use center coordinates
**Subtasks**:
- [x] Update `getSelectionLeft()` to return `bounds.centerX`
- [x] Update `getSelectionTop()` to return `bounds.centerY`
- [x] Keep `translate(-50%, -50%)` transform for proper centering

**Implementation Details**:
```typescript
// Before: Attempting top-left positioning with offset
getSelectionLeft(table: any): number {
  return bounds.visualLeft - 10; // Inconsistent approach
}

// After: Center-based positioning
getSelectionLeft(table: any): number {
  return bounds.centerX; // Works with translate(-50%, -50%)
}
```

### Phase 2: Verify ElementBoundsService Calculations
**Task**: Ensure bounds calculations are accurate for all element types
**Subtasks**:
- [x] Review round table bounds (includes chair padding)
- [x] Review rectangle table bounds (includes chair padding)
- [x] Review line bounds (uses min/max coordinates)
- [x] Review polygon bounds (uses point extents)
- [x] Review text bounds (estimates based on content)

### Phase 3: Test at Multiple Zoom Levels
**Task**: Verify selection boxes align correctly at various zoom levels
**Test Cases**:
- [ ] 50% zoom - selection box should encompass entire element
- [ ] 75% zoom - selection box should remain centered
- [ ] 85% zoom - no overlap with table elements
- [ ] 90% zoom - chairs fully included in selection
- [ ] 100% zoom - baseline positioning correct
- [ ] 125% zoom - selection scales properly
- [ ] 150% zoom - no positioning drift

### Phase 4: Handle Edge Cases
**Task**: Address special cases and element-specific requirements
**Subtasks**:
- [ ] Lines without rotation property
- [ ] Segmented seating rows with custom selection logic
- [ ] Polygons with irregular shapes
- [ ] Text elements with dynamic sizing

## Technical Decisions

### Why Center-Based Positioning?
1. **Consistency**: All elements use the same positioning logic
2. **Zoom Independence**: Center point remains stable during scaling
3. **Rotation Support**: Transform origin at center simplifies rotation
4. **CSS Simplicity**: `translate(-50%, -50%)` is a standard centering technique

### Alternative Approaches Considered:
1. **Top-left positioning**: Would require removing transforms and calculating exact positions
2. **Canvas-based selection**: Already implemented as option but adds complexity
3. **SVG overlays**: Would require significant refactoring

## Debug Steps if Issues Persist:
1. Add console logs to track bounds calculations:
   ```typescript
   console.log('Selection bounds:', {
     element: table.id,
     zoom: this.store.zoomLevel,
     bounds: bounds,
     position: { x: bounds.centerX, y: bounds.centerY }
   });
   ```

2. Verify parent container scaling:
   - Check `.table-container` transform
   - Ensure zoom is applied consistently

3. Test with browser dev tools:
   - Inspect computed styles
   - Check actual vs expected positions
   - Verify transform chain order

## Success Criteria:
- Selection boxes properly encompass elements at all zoom levels
- No visual "jumping" when zooming
- Consistent padding around elements
- Rotation transforms work correctly
- Performance remains smooth during zoom operations

## Next Steps:
1. Run visual regression tests
2. Get user confirmation on fix
3. Consider adding automated tests for zoom scenarios
4. Document zoom behavior in component README