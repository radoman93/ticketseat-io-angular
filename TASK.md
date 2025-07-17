# MobX Performance Audit: Implementation Plan

## Executive Summary

After conducting a comprehensive analysis of the MobX stores in the ticketseat-io-angular codebase, I've identified several critical performance issues and optimization opportunities. This report provides specific recommendations with code examples and a prioritized implementation roadmap.

## Critical Findings

### 🚨 High Priority Issues

#### 1. Memory Leaks from Undisposed Reactions
**Impact**: HIGH - Potential memory leaks in production
**Files**: Multiple component files

**Problem**: Several components create MobX reactions but don't properly dispose them:

```typescript
// grid.component.ts - Lines 1370, 1375, 1391
const selectionDisposer = autorun(() => {
  this.updateCanvasSelections();
});
// These disposers are stored but never called on ngOnDestroy
```

**Solution**: Implement proper cleanup in all components:
```typescript
ngOnDestroy(): void {
  if (this.selectionWatcherDisposers) {
    this.selectionWatcherDisposers.forEach(dispose => dispose());
    this.selectionWatcherDisposers = [];
  }
}
```

#### 2. Inefficient Computed Dependencies in LayoutMetricsStore
**Impact**: HIGH - Performance bottleneck with frequent recalculations
**File**: `layout-metrics.store.ts`

**Problem**: Multiple computed values perform expensive array operations:

```typescript
// Lines 64-77: Inefficient totalSeats calculation
get totalSeats() {
  return layoutStore.elements
    .filter(e => e.type.includes('Table') || e.type === 'seatingRow')
    .reduce((sum, element) => {
      // Complex calculations for each element type
    }, 0);
}
```

**Solution**: Cache intermediate results and reduce redundant filtering:
```typescript
@computed
get seatingElements() {
  return layoutStore.elements.filter(e => 
    e.type.includes('Table') || e.type === 'seatingRow'
  );
}

@computed
get totalSeats() {
  return this.seatingElements.reduce((sum, element) => {
    // Reuse filtered array
  }, 0);
}
```

#### 3. Over-observing in DragStore
**Impact**: MEDIUM - Unnecessary re-renders during drag operations
**File**: `drag.store.ts`

**Problem**: Complex drag calculations trigger too many observable updates:

```typescript
// Lines 155-251: updateDragPosition triggers multiple store updates
updateDragPosition = action('updateDragPosition', (mouseX, mouseY) => {
  // Multiple Object.assign calls and layoutStore.updateElement calls
  Object.assign(this.draggedItem, update);
  layoutStore.updateElement(this.draggedItem.id, update);
});
```

**Solution**: Batch updates using runInAction:
```typescript
updateDragPosition = action('updateDragPosition', (mouseX, mouseY) => {
  if (!this.isDragging || !this.draggedItem) return;
  
  runInAction(() => {
    // Batch all position updates
    const update = this.calculateNewPosition(mouseX, mouseY);
    Object.assign(this.draggedItem, update);
    layoutStore.updateElement(this.draggedItem.id, update);
  });
});
```

### ⚠️ Medium Priority Issues

#### 4. Redundant Computed Values in LayoutStore
**Impact**: MEDIUM - Redundant calculations
**File**: `layout.store.ts`

**Problem**: Multiple computed properties perform similar filtering operations:

```typescript
get roundTableCount(): number {
  return this.elements.filter(el => el.type === 'roundTable').length;
}
get rectangleTableCount(): number {
  return this.elements.filter(el => el.type === 'rectangleTable').length;
}
```

**Solution**: Create a single computed cache for type counts:
```typescript
@computed
get elementsByType() {
  const counts = new Map<string, number>();
  this.elements.forEach(el => {
    counts.set(el.type, (counts.get(el.type) || 0) + 1);
  });
  return counts;
}

get roundTableCount(): number {
  return this.elementsByType.get('roundTable') || 0;
}
```

#### 5. Inefficient Proximity Calculations
**Impact**: MEDIUM - O(n²) complexity in getCloseProximityTables
**File**: `layout-metrics.store.ts`

**Problem**: Nested loops for proximity detection (lines 347-390):

```typescript
getCloseProximityTables(proximityThreshold: number = 10): TableElement[][] {
  const elements = layoutStore.elements.filter(e => e.type.includes('Table'));
  // O(n²) nested loop
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      // Distance calculations for every pair
    }
  }
}
```

**Solution**: Implement spatial indexing or limit calculations:
```typescript
@computed
get spatialIndex() {
  // Implement quadtree or grid-based spatial index
  return this.buildSpatialIndex(this.seatingElements);
}

getCloseProximityTables(proximityThreshold: number = 10): TableElement[][] {
  // Use spatial index for efficient proximity queries
  return this.spatialIndex.findCloseProximityPairs(proximityThreshold);
}
```

### 💡 Low Priority Optimizations

#### 6. ViewerStore Notification Cleanup
**Impact**: LOW - Minor memory usage
**File**: `viewer.store.ts`

**Problem**: setTimeout references aren't stored for cleanup:

```typescript
addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
  // Auto-remove after 3 seconds
  setTimeout(() => {
    this.removeNotification(newNotification.id);
  }, 3000);
}
```

**Solution**: Store timeout references for cleanup.

## Implementation Roadmap

### Phase 1: Critical Memory Leak Fixes (Week 1)
1. **Audit all components** using autorun/reaction
2. **Implement proper disposal** in ngOnDestroy
3. **Add disposal tracking** to prevent leaks
4. **Create reusable cleanup mixin** for components

### Phase 2: Store Performance Optimization (Week 2)
1. **Refactor LayoutMetricsStore** computed dependencies
2. **Optimize DragStore** update batching
3. **Implement caching** for expensive calculations
4. **Add performance monitoring** to critical paths

### Phase 3: Algorithm Improvements (Week 3)
1. **Implement spatial indexing** for proximity calculations
2. **Optimize filtering operations** in layout store
3. **Add memoization** to complex computeds
4. **Performance testing** and benchmarking

### Phase 4: Monitoring and Maintenance (Week 4)
1. **Add MobX performance devtools** integration
2. **Create performance regression tests**
3. **Document performance best practices**
4. **Set up automated performance monitoring**

## Specific Code Changes Required

### Files to Modify:
1. `/src/app/components/grid/grid.component.ts` - Fix reaction disposal
2. `/src/app/components/event-editor/event-editor.component.ts` - Fix reaction disposal
3. `/src/app/components/layout-stats/layout-stats.component.ts` - Fix reaction disposal
4. `/src/app/stores/derived/layout-metrics.store.ts` - Optimize computeds
5. `/src/app/stores/drag.store.ts` - Batch updates
6. `/src/app/stores/layout.store.ts` - Cache type counts
7. `/src/app/stores/viewer.store.ts` - Cleanup timeouts

### New Files to Create:
1. `/src/app/mixins/mobx-cleanup.mixin.ts` - Reusable cleanup logic
2. `/src/app/utils/spatial-index.ts` - Spatial indexing utilities
3. `/src/app/services/performance-monitor.service.ts` - Performance tracking

## Testing Strategy

### Performance Benchmarks
1. **Memory usage** tracking with 1000+ elements
2. **Render time** measurements during drag operations
3. **Computed recalculation** frequency monitoring
4. **Reaction disposal** verification tests

### Load Testing Scenarios
1. Create layout with 500+ tables
2. Perform 100 consecutive drag operations
3. Rapidly switch between tools
4. Stress test proximity calculations

## Success Metrics

### Performance Targets
- **Memory growth**: < 10MB over 30-minute session
- **Drag operation latency**: < 16ms (60fps)
- **Computed recalculations**: < 50% reduction
- **Bundle size impact**: No increase

### Quality Metrics
- Zero memory leaks in production
- 100% reaction disposal coverage
- Performance regression test coverage
- Documentation completeness

## Risk Assessment

### High Risks
- **Breaking changes** to computed dependencies
- **Performance regressions** during optimization
- **Memory issues** if disposal patterns aren't followed

### Mitigation Strategies
- Incremental rollout with feature flags
- Comprehensive performance test suite
- Rollback procedures for each phase
- Performance monitoring alerts

## Conclusion

The codebase shows good MobX patterns overall but has several critical performance issues that need immediate attention. The memory leak issues are the highest priority, followed by computed optimization and algorithm improvements. With proper implementation of this plan, we can achieve significant performance improvements while maintaining code quality and functionality.