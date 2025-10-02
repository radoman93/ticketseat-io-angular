# Testing Guide

Comprehensive testing infrastructure for ticketseat-io-angular library.

## 📋 Table of Contents

- [Test Coverage](#test-coverage)
- [Quick Start](#quick-start)
- [Unit Tests](#unit-tests)
- [E2E Tests](#e2e-tests)
- [Visual Regression Tests](#visual-regression-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

---

## 📊 Test Coverage

### Coverage Targets
- **Unit Tests**: 70% minimum
- **Integration Tests**: 60% minimum
- **Critical Paths**: 100% coverage

### Current Status
- ✅ MobX Store Tests: 6+ stores covered
- ✅ E2E Core Workflows: 3 main workflows
- ✅ Visual Regression: 20+ scenarios
- ✅ CI/CD: Automated on every commit

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm run test:all
```

### Run Unit Tests
```bash
# Watch mode (development)
npm run test:watch

# Single run with coverage
npm run test:coverage

# Headless mode
npm test -- --watch=false --browsers=ChromeHeadlessCI
```

### Run E2E Tests
```bash
# Run all E2E tests
npm run e2e

# Run with UI mode
npm run e2e:ui

# Debug mode
npm run e2e:debug

# Run specific test file
npx playwright test core-workflows.spec.ts
```

### Run Visual Regression Tests
```bash
# Run visual tests
npm run test:visual

# Update snapshots
npx playwright test visual-regression.spec.ts --update-snapshots
```

---

## 🧪 Unit Tests

### Test Structure

Unit tests are located alongside their source files with `.spec.ts` extension:

```
src/
├── app/
│   ├── stores/
│   │   ├── layout.store.ts
│   │   └── layout.store.spec.ts
│   ├── components/
│   │   ├── grid/
│   │   │   ├── grid.component.ts
│   │   │   └── grid.component.spec.ts
```

### MobX Store Testing

Test helpers are available in `src/test-helpers/mobx-test.helpers.ts`:

```typescript
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('MyStore', () => {
  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  // Tests...
});
```

### Component Testing

Component test helpers in `src/test-helpers/component-test.helpers.ts`:

```typescript
import { query, click, setInputValue } from '../../test-helpers/component-test.helpers';

it('should handle user interaction', () => {
  const button = query(fixture, '.my-button');
  click(button);
  // Assertions...
});
```

### Running Specific Tests

```bash
# Run specific test file
npm test -- --include='**/layout.store.spec.ts'

# Run tests matching pattern
npm test -- --include='**/*.store.spec.ts'

# Run tests in specific directory
npm test -- --include='src/app/stores/**/*.spec.ts'
```

---

## 🎭 E2E Tests

### Test Files

E2E tests are in the `e2e/` directory:

```
e2e/
├── core-workflows.spec.ts      # Main user workflows
└── visual-regression.spec.ts   # Visual regression tests
```

### Core Workflows Covered

1. **Create Seating Layout**
   - Create round tables
   - Create rectangle tables
   - Create seating rows
   - Modify element properties
   - Drag and move elements

2. **Export and Import Layout**
   - Export to JSON
   - Import from JSON
   - Layout persistence

3. **Viewer Seat Selection**
   - Select/deselect seats
   - Enforce seat limits
   - Pre-reserved seats
   - Complete reservation

### Running E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "should create a round table"
```

### Debugging E2E Tests

```bash
# Debug mode with Playwright Inspector
npm run e2e:debug

# Generate trace
npx playwright test --trace on

# Show report
npx playwright show-report
```

---

## 📸 Visual Regression Tests

### Visual Test Categories

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
   - Different zoom levels
   - Pan offset rendering
   - Snap-to-grid alignment

4. **Responsive Design**
   - Mobile viewports
   - Tablet viewports
   - Desktop viewports

### Updating Snapshots

```bash
# Update all snapshots
npx playwright test visual-regression.spec.ts --update-snapshots

# Update specific test snapshots
npx playwright test -g "round table rendering" --update-snapshots
```

### Reviewing Visual Diffs

When visual tests fail, diffs are saved to `test-results/`:

```bash
# View the Playwright report with visual diffs
npx playwright show-report
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The test suite runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Workflow Jobs

1. **Unit Tests**
   - Runs on Node 18.x and 20.x
   - Generates coverage reports
   - Uploads to Codecov
   - Blocks merge if coverage < 70%

2. **E2E Tests**
   - Runs on all browsers (Chromium, Firefox, WebKit)
   - Mobile and desktop viewports
   - Uploads test reports and videos

3. **Visual Regression**
   - Runs on Chromium only
   - Compares screenshots with baseline
   - Uploads diff artifacts on failure

4. **Build Library**
   - Verifies library builds successfully
   - Archives build artifacts

5. **Coverage Report**
   - Comments on PRs with coverage summary
   - Shows pass/fail for each metric

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### Coverage Badge

Add to README.md:
```markdown
[![codecov](https://codecov.io/gh/radoman93/ticketseat-io-angular/branch/main/graph/badge.svg)](https://codecov.io/gh/radoman93/ticketseat-io-angular)
```

---

## ✍️ Writing Tests

### Unit Test Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct initial state', () => {
    // Test implementation
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform action', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="tool-round-table"]');

    // Act
    await page.click('[data-testid="grid-canvas"]', {
      position: { x: 400, y: 300 }
    });

    // Assert
    const table = page.locator('[data-element-type="roundTable"]').first();
    await expect(table).toBeVisible();
  });
});
```

### Visual Regression Test Template

```typescript
import { test, expect } from '@playwright/test';

test('visual test name', async ({ page }) => {
  await page.goto('/');

  // Setup state
  await page.evaluate(() => {
    // Programmatically create test scenario
  });

  // Take screenshot
  await expect(page).toHaveScreenshot('test-name.png', {
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting (Playwright auto-waits)
3. **Isolate tests** - each test should be independent
4. **Clean up** - reset state in beforeEach/afterEach
5. **Mock external dependencies** in unit tests
6. **Test user workflows**, not implementation details

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Tests Fail Locally but Pass in CI

**Problem**: Different environments
**Solution**:
```bash
# Run tests in CI mode locally
CI=true npm run e2e
```

#### 2. MobX Strict Mode Errors

**Problem**: State mutations outside actions
**Solution**: Use `setupMobXForTesting()` helper

```typescript
beforeAll(() => {
  setupMobXForTesting();
});
```

#### 3. Playwright Browser Installation

**Problem**: Browsers not installed
**Solution**:
```bash
npx playwright install --with-deps
```

#### 4. Visual Test Failures

**Problem**: Screenshot mismatch
**Solution**:
```bash
# Review diffs
npx playwright show-report

# Update if legitimate change
npx playwright test visual-regression.spec.ts --update-snapshots
```

#### 5. Coverage Below Threshold

**Problem**: Coverage < 70%
**Solution**:
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# Identify uncovered code
```

#### 6. Timeout Errors in E2E Tests

**Problem**: Test timeout
**Solution**:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds

  // Test implementation
});
```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --reporters=verbose

# Run Playwright with trace
npx playwright test --trace on

# Generate and view trace
npx playwright show-trace trace.zip

# Run single test file in watch mode
npm test -- --include='**/my-test.spec.ts' --watch

# Playwright UI mode for debugging
npm run e2e:ui
```

### Performance Optimization

```bash
# Run tests in parallel
npx playwright test --workers=4

# Run only changed tests
npm test -- --onlyChanged

# Skip slow tests
npx playwright test --grep-invert @slow
```

---

## 📚 Resources

- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [MobX Testing Guide](https://mobx.js.org/api.html)

---

## 🎯 Next Steps

1. **Achieve 70% Unit Coverage**
   - Add tests for remaining stores
   - Add component integration tests
   - Test edge cases and error handling

2. **Expand E2E Coverage**
   - Add more complex workflows
   - Test error scenarios
   - Add performance benchmarks

3. **Enhance Visual Tests**
   - Add accessibility checks
   - Test dark theme
   - Add animation tests

4. **Improve CI/CD**
   - Add parallel test execution
   - Implement test sharding
   - Add performance monitoring

---

## 📝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure tests pass** locally before committing
3. **Maintain coverage** above 70%
4. **Add E2E tests** for user-facing features
5. **Update visual snapshots** if UI changes

---

**Happy Testing! 🚀**
