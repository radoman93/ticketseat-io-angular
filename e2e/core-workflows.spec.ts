import { test, expect } from '@playwright/test';

/**
 * E2E tests for core seating layout workflows
 */

test.describe('Core Workflow 1: Create Seating Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a round table with chairs', async ({ page }) => {
    // Select round table tool
    await page.click('[data-testid="tool-round-table"]');

    // Click on grid to create table
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // Verify table appears
    const table = page.locator('[data-element-type="roundTable"]').first();
    await expect(table).toBeVisible();

    // Verify chairs are created
    const chairs = page.locator('[data-element-type="chair"]');
    await expect(chairs).toHaveCount(8); // Default 8 chairs
  });

  test('should create a rectangle table', async ({ page }) => {
    await page.click('[data-testid="tool-rectangle-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    const table = page.locator('[data-element-type="rectangleTable"]').first();
    await expect(table).toBeVisible();
  });

  test('should create a seating row', async ({ page }) => {
    await page.click('[data-testid="tool-seating-row"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    const row = page.locator('[data-element-type="seatingRow"]').first();
    await expect(row).toBeVisible();
  });

  test('should modify table properties', async ({ page }) => {
    // Create table
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // Select table
    const table = page.locator('[data-element-type="roundTable"]').first();
    await table.click();

    // Verify properties panel opens
    const propertiesPanel = page.locator('[data-testid="properties-panel"]');
    await expect(propertiesPanel).toBeVisible();

    // Change chair count
    await page.fill('[data-testid="chair-count-input"]', '12');
    await page.press('[data-testid="chair-count-input"]', 'Enter');

    // Verify chair count updated
    const chairs = page.locator('[data-element-type="chair"]');
    await expect(chairs).toHaveCount(12);
  });

  test('should drag and move elements', async ({ page }) => {
    // Create table
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 200, y: 200 } });

    const table = page.locator('[data-element-type="roundTable"]').first();
    const initialBox = await table.boundingBox();

    // Drag table to new position
    await table.dragTo(page.locator('[data-testid="grid-canvas"]'), {
      targetPosition: { x: 400, y: 400 }
    });

    // Verify position changed
    const newBox = await table.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
    expect(newBox?.y).not.toBe(initialBox?.y);
  });
});

test.describe('Core Workflow 2: Export and Import Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should export layout to JSON', async ({ page }) => {
    // Create some elements
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // Open export dialog
    await page.click('[data-testid="export-button"]');

    // Verify JSON is displayed
    const jsonContent = page.locator('[data-testid="export-json-content"]');
    await expect(jsonContent).toBeVisible();

    const json = await jsonContent.textContent();
    expect(json).toContain('roundTable');
    expect(json).toContain('chairs');
  });

  test('should import layout from JSON', async ({ page }) => {
    // Create and export layout
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    await page.click('[data-testid="export-button"]');
    const jsonContent = await page.locator('[data-testid="export-json-content"]').textContent();

    // Clear layout
    await page.click('[data-testid="clear-all-button"]');
    await page.click('[data-testid="confirm-clear"]');

    // Verify layout is empty
    await expect(page.locator('[data-element-type="roundTable"]')).toHaveCount(0);

    // Import layout
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-json-input"]', jsonContent || '');
    await page.click('[data-testid="import-confirm-button"]');

    // Verify layout is restored
    await expect(page.locator('[data-element-type="roundTable"]')).toHaveCount(1);
    await expect(page.locator('[data-element-type="chair"]')).toHaveCount(8);
  });
});

test.describe('Core Workflow 3: Viewer Seat Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Create a layout
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // Switch to viewer mode
    await page.click('[data-testid="toggle-viewer-mode"]');
  });

  test('should select seats in viewer mode', async ({ page }) => {
    // Click first chair
    const firstChair = page.locator('[data-element-type="chair"]').first();
    await firstChair.click();

    // Verify chair is selected
    await expect(firstChair).toHaveClass(/selected-for-reservation/);

    // Check selection count
    const selectionCount = page.locator('[data-testid="selected-seats-count"]');
    await expect(selectionCount).toHaveText('1');
  });

  test('should deselect seat when clicked again', async ({ page }) => {
    const firstChair = page.locator('[data-element-type="chair"]').first();

    // Select
    await firstChair.click();
    await expect(firstChair).toHaveClass(/selected-for-reservation/);

    // Deselect
    await firstChair.click();
    await expect(firstChair).not.toHaveClass(/selected-for-reservation/);
  });

  test('should enforce seat limit', async ({ page }) => {
    // Set seat limit to 2
    await page.fill('[data-testid="seat-limit-input"]', '2');

    // Select 2 seats
    const chairs = page.locator('[data-element-type="chair"]');
    await chairs.nth(0).click();
    await chairs.nth(1).click();

    // Try to select 3rd seat - should be blocked
    await chairs.nth(2).click();

    // Verify warning notification
    const notification = page.locator('[data-testid="notification"]');
    await expect(notification).toContainText('only select up to 2');

    // Verify only 2 seats are selected
    const selectedSeats = page.locator('[data-element-type="chair"].selected-for-reservation');
    await expect(selectedSeats).toHaveCount(2);
  });

  test('should not allow selection of pre-reserved seats', async ({ page }) => {
    // Mark first chair as pre-reserved (this would be done via input prop in real scenario)
    await page.evaluate(() => {
      const viewerStore = (window as any).__viewerStore;
      if (viewerStore) {
        viewerStore.setPreReservedSeats(['chair-id-1']);
      }
    });

    const firstChair = page.locator('[data-element-type="chair"]').first();
    await firstChair.click();

    // Verify warning notification
    const notification = page.locator('[data-testid="notification"]');
    await expect(notification).toContainText('already reserved');

    // Verify seat is not selected
    await expect(firstChair).not.toHaveClass(/selected-for-reservation/);
  });

  test('should complete reservation with customer info', async ({ page }) => {
    // Select seat
    const firstChair = page.locator('[data-element-type="chair"]').first();
    await firstChair.click();

    // Enter customer info
    await page.fill('[data-testid="customer-name-input"]', 'John Doe');
    await page.fill('[data-testid="customer-email-input"]', 'john@example.com');

    // Complete reservation
    await page.click('[data-testid="reserve-button"]');

    // Verify success notification
    const notification = page.locator('[data-testid="notification"]');
    await expect(notification).toContainText('Successfully reserved');

    // Verify seat is now marked as reserved
    await expect(firstChair).toHaveClass(/reserved/);

    // Verify selection is cleared
    const selectionCount = page.locator('[data-testid="selected-seats-count"]');
    await expect(selectionCount).toHaveText('0');
  });
});

test.describe('Performance Tests', () => {
  test('should handle layout with 100+ elements', async ({ page }) => {
    await page.goto('/');

    // Create 100 tables programmatically
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        for (let i = 0; i < 100; i++) {
          layoutStore.addElement({
            id: `table-${i}`,
            type: 'roundTable',
            x: (i % 10) * 100 + 50,
            y: Math.floor(i / 10) * 100 + 50,
            radius: 30,
            chairCount: 4
          });
        }
      }
    });

    // Verify elements are rendered
    const tables = page.locator('[data-element-type="roundTable"]');
    await expect(tables).toHaveCount(100);

    // Test pan performance
    const startTime = Date.now();
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();
    const panTime = Date.now() - startTime;

    // Pan should complete in less than 500ms
    expect(panTime).toBeLessThan(500);
  });

  test('should handle rapid zoom operations', async ({ page }) => {
    await page.goto('/');

    // Create some elements
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    const startTime = Date.now();

    // Rapid zoom in/out
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="zoom-in-button"]');
      await page.click('[data-testid="zoom-out-button"]');
    }

    const zoomTime = Date.now() - startTime;

    // Zoom operations should complete in less than 1 second
    expect(zoomTime).toBeLessThan(1000);
  });
});
