# Testing Infrastructure Roadmap

## ✅ Phase 1: Infrastructure Setup (COMPLETED)

### Test Configuration
- ✅ Karma configuration with coverage reporting
- ✅ TypeScript test configuration
- ✅ MobX test helpers and utilities
- ✅ Component test helpers

### Coverage Targets
- **Unit Tests**: 70% coverage
- **Integration Tests**: 60% coverage
- **Critical Paths**: 100% coverage

---

## 🔄 Phase 2: MobX Store Unit Tests (IN PROGRESS)

### Completed Store Tests
1. ✅ **LayoutStore** - CRUD operations, computed properties
2. ✅ **SelectionStore** - Selection management, delete handlers
3. ✅ **GridStore** - Pan/zoom, grid settings, snapping

### Remaining Store Tests (10 stores)
4. ⏳ **ChairStore** - Chair state management, reservations
5. ⏳ **ToolStore** - Active tool management
6. ⏳ **HistoryStore** - Undo/redo, command execution
7. ⏳ **DragStore** - Drag operations
8. ⏳ **ViewerStore** - Seat selection, reservations, limits
9. ⏳ **RootStore** - Store aggregation, initialization
10. ⏳ **SnappingStore** - Element snapping logic
11. ⏳ **TransactionManager** - Transaction handling
12. ⏳ **PersistenceManager** - State persistence
13. ⏳ **LayoutMetricsStore** - Derived metrics

### Test Coverage Requirements
- All actions tested
- All computed properties validated
- Error handling verified
- MobX reactions tested
- State mutations isolated

---

## 📋 Phase 3: Component Integration Tests

### Critical Components
1. **EventEditorComponent**
   - Layout creation/editing
   - Element interactions
   - Export functionality

2. **EventViewerComponent**
   - Layout viewing
   - Seat selection
   - Reservation limits

3. **GridComponent**
   - Canvas rendering
   - Pan/zoom interactions
   - Element creation

4. **Seating Element Components**
   - RoundTable rendering
   - RectangleTable rendering
   - SeatingRow rendering
   - SegmentedSeatingRow rendering

### Integration Test Scenarios
- Store → Component integration
- Component → Component communication
- User interaction flows
- State synchronization

---

## 🔬 Phase 4: E2E Testing

### Test Framework Setup
- Install Playwright (`npm install -D @playwright/test`)
- Configure Playwright for Angular
- Set up test fixtures

### Core Workflow Tests

#### Workflow 1: Create Layout
```typescript
test('should create seating layout', async ({ page }) => {
  // Navigate to editor
  // Select round table tool
  // Click to create table
  // Verify table appears
  // Add chairs to table
  // Verify chair count
});
```

#### Workflow 2: Export/Import Layout
```typescript
test('should export and import layout', async ({ page }) => {
  // Create layout
  // Export to JSON
  // Clear layout
  // Import JSON
  // Verify layout matches
});
```

#### Workflow 3: Viewer Selection
```typescript
test('should select seats in viewer', async ({ page }) => {
  // Load layout in viewer
  // Click seats to select
  // Verify selection state
  // Test seat limits
  // Verify reservation events
});
```

### Performance Tests
- Layout with 100+ elements
- Rapid pan/zoom operations
- Large-scale seat selection

---

## 📸 Phase 5: Visual Regression Testing

### Setup
```bash
npm install -D @playwright/test
npm install -D pixelmatch
```

### Visual Test Scenarios
1. **Element Rendering**
   - Round tables at various sizes
   - Rectangle tables with different chair counts
   - Rotated seating rows
   - Complex segmented rows

2. **Selection States**
   - Selected vs unselected
   - Hover states
   - Reserved seats
   - Disabled seats

3. **Grid Rendering**
   - Grid at different zoom levels
   - Pan offset rendering
   - Snap-to-grid alignment

### Visual Test Configuration
```typescript
// playwright.config.ts
export default {
  use: {
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
};
```

---

## 🚀 Phase 6: CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --watch=false --code-coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:visual
```

### Coverage Gates
- **PR Check**: Block merge if coverage < 70%
- **Coverage Report**: Comment on PR with coverage diff
- **Badge**: Display coverage in README

---

## 📊 Success Metrics

### Current State
- ❌ **Test Files**: 5/91 TypeScript files
- ❌ **Coverage**: ~5%
- ❌ **E2E Tests**: 0
- ❌ **CI/CD**: Not configured

### Target State
- ✅ **Test Files**: 91+ test files
- ✅ **Unit Coverage**: 70%+
- ✅ **Integration Coverage**: 60%+
- ✅ **E2E Tests**: 10+ core workflows
- ✅ **Visual Tests**: 20+ scenarios
- ✅ **CI/CD**: Automated on every commit

---

## 🔧 Quick Commands

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm test -- --code-coverage

# Run specific test file
npm test -- --include='**/*.store.spec.ts'

# Run E2E tests (once configured)
npm run e2e

# Run visual regression tests (once configured)
npm run test:visual

# Watch mode for development
npm test -- --watch

# Update test snapshots
npm test -- --update-snapshots
```

---

## 🎯 Next Steps

### Immediate (Today)
1. Complete remaining store tests (10 stores)
2. Add component integration tests for EventEditor
3. Set up Playwright for E2E

### This Week
4. Complete E2E core workflow tests
5. Set up visual regression testing
6. Configure GitHub Actions CI/CD

### This Month
7. Achieve 70% unit test coverage
8. Achieve 60% integration coverage
9. Document testing patterns and best practices
10. Team training on testing infrastructure
