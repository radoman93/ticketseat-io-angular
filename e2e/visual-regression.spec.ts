import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for seating elements
 */

test.describe('Visual Regression: Element Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('round table rendering at various sizes', async ({ page }) => {
    // Create round tables of different sizes
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'small-table',
          type: 'roundTable',
          x: 100,
          y: 100,
          radius: 30,
          chairCount: 4
        });
        layoutStore.addElement({
          id: 'medium-table',
          type: 'roundTable',
          x: 300,
          y: 100,
          radius: 50,
          chairCount: 8
        });
        layoutStore.addElement({
          id: 'large-table',
          type: 'roundTable',
          x: 500,
          y: 100,
          radius: 70,
          chairCount: 12
        });
      }
    });

    await expect(page).toHaveScreenshot('round-tables-various-sizes.png', {
      clip: { x: 0, y: 0, width: 800, height: 300 }
    });
  });

  test('rectangle table rendering with different chair counts', async ({ page }) => {
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'rect-4-chairs',
          type: 'rectangleTable',
          x: 100,
          y: 100,
          width: 100,
          height: 60,
          topChairs: 2,
          bottomChairs: 2,
          leftChairs: 0,
          rightChairs: 0
        });
        layoutStore.addElement({
          id: 'rect-8-chairs',
          type: 'rectangleTable',
          x: 300,
          y: 100,
          width: 150,
          height: 80,
          topChairs: 3,
          bottomChairs: 3,
          leftChairs: 1,
          rightChairs: 1
        });
      }
    });

    await expect(page).toHaveScreenshot('rectangle-tables-different-chairs.png', {
      clip: { x: 0, y: 0, width: 600, height: 300 }
    });
  });

  test('rotated seating rows', async ({ page }) => {
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'row-0deg',
          type: 'seatingRow',
          x: 100,
          y: 100,
          rotation: 0,
          chairCount: 10,
          chairSpacing: 10
        });
        layoutStore.addElement({
          id: 'row-45deg',
          type: 'seatingRow',
          x: 100,
          y: 200,
          rotation: 45,
          chairCount: 10,
          chairSpacing: 10
        });
        layoutStore.addElement({
          id: 'row-90deg',
          type: 'seatingRow',
          x: 100,
          y: 300,
          rotation: 90,
          chairCount: 10,
          chairSpacing: 10
        });
      }
    });

    await expect(page).toHaveScreenshot('rotated-seating-rows.png', {
      clip: { x: 0, y: 0, width: 700, height: 500 }
    });
  });

  test('complex segmented seating row', async ({ page }) => {
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'segmented-row',
          type: 'segmentedSeatingRow',
          x: 400,
          y: 300,
          segments: [
            { chairCount: 10, angle: 0 },
            { chairCount: 8, angle: 30 },
            { chairCount: 6, angle: 60 }
          ]
        });
      }
    });

    await expect(page).toHaveScreenshot('segmented-seating-row.png', {
      clip: { x: 100, y: 100, width: 700, height: 500 }
    });
  });
});

test.describe('Visual Regression: Selection States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Create a table
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'test-table',
          type: 'roundTable',
          x: 400,
          y: 300,
          radius: 60,
          chairCount: 8
        });
      }
    });
  });

  test('element selection states', async ({ page }) => {
    // Select table
    const table = page.locator('[data-element-type="roundTable"]').first();
    await table.click();

    // Capture selected state
    await expect(page).toHaveScreenshot('table-selected-state.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });

    // Deselect
    await page.click('[data-testid="grid-canvas"]', { position: { x: 100, y: 100 } });

    // Capture unselected state
    await expect(page).toHaveScreenshot('table-unselected-state.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });
  });

  test('chair hover and selection states', async ({ page }) => {
    await page.click('[data-testid="toggle-viewer-mode"]');

    const chair = page.locator('[data-element-type="chair"]').first();

    // Hover state
    await chair.hover();
    await expect(page).toHaveScreenshot('chair-hover-state.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });

    // Selected state
    await chair.click();
    await expect(page).toHaveScreenshot('chair-selected-state.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });
  });

  test('reserved and disabled seat states', async ({ page }) => {
    await page.click('[data-testid="toggle-viewer-mode"]');

    // Set some seats as reserved and disabled
    await page.evaluate(() => {
      const chairStore = (window as any).__chairStore;
      const chairs = Array.from(chairStore.chairs.values());

      if (chairs[0]) {
        chairStore.updateChair(chairs[0].id, {
          reservationStatus: 'reserved',
          reservedBy: 'John Doe'
        });
      }

      if (chairs[1]) {
        chairStore.updateChair(chairs[1].id, {
          isDisabled: true
        });
      }
    });

    await expect(page).toHaveScreenshot('seat-states-reserved-disabled.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });
  });
});

test.describe('Visual Regression: Grid Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('grid at different zoom levels', async ({ page }) => {
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // 100% zoom
    await expect(page).toHaveScreenshot('grid-zoom-100.png');

    // Zoom in
    await page.click('[data-testid="zoom-in-button"]');
    await page.click('[data-testid="zoom-in-button"]');
    await expect(page).toHaveScreenshot('grid-zoom-120.png');

    // Zoom out
    await page.click('[data-testid="zoom-out-button"]');
    await page.click('[data-testid="zoom-out-button"]');
    await page.click('[data-testid="zoom-out-button"]');
    await expect(page).toHaveScreenshot('grid-zoom-90.png');
  });

  test('grid with pan offset', async ({ page }) => {
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 400, y: 300 } });

    // Pan the grid
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();

    await expect(page).toHaveScreenshot('grid-panned.png');
  });

  test('snap to grid alignment', async ({ page }) => {
    // Enable snap to grid
    await page.click('[data-testid="snap-to-grid-toggle"]');

    // Create element - should snap to grid
    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 423, y: 317 } });

    // Element should be snapped to nearest grid point
    await expect(page).toHaveScreenshot('element-snapped-to-grid.png', {
      clip: { x: 300, y: 200, width: 300, height: 300 }
    });
  });
});

test.describe('Visual Regression: Responsive Design', () => {
  test('mobile viewport - iPhone 13', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 195, y: 300 } });

    await expect(page).toHaveScreenshot('mobile-iphone13.png', { fullPage: true });
  });

  test('tablet viewport - iPad', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/');

    await page.click('[data-testid="tool-round-table"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 410, y: 400 } });

    await expect(page).toHaveScreenshot('tablet-ipad.png', { fullPage: true });
  });

  test('desktop viewport - 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Create multiple elements
    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        for (let i = 0; i < 5; i++) {
          layoutStore.addElement({
            id: `table-${i}`,
            type: 'roundTable',
            x: 200 + i * 200,
            y: 300,
            radius: 50,
            chairCount: 8
          });
        }
      }
    });

    await expect(page).toHaveScreenshot('desktop-1920x1080.png', { fullPage: true });
  });
});

test.describe('Visual Regression: Theme and Styling', () => {
  test('light theme rendering', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'table-1',
          type: 'roundTable',
          x: 300,
          y: 200,
          radius: 60,
          chairCount: 8
        });
      }
    });

    await expect(page).toHaveScreenshot('theme-light.png');
  });

  test('custom colors and labels', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const layoutStore = (window as any).__layoutStore;
      if (layoutStore) {
        layoutStore.addElement({
          id: 'vip-table',
          type: 'roundTable',
          x: 400,
          y: 300,
          radius: 60,
          chairCount: 6,
          label: 'VIP-1',
          chairColor: '#FFD700', // Gold
          chairLabelColor: '#000000'
        });
      }
    });

    await expect(page).toHaveScreenshot('custom-colors-labels.png', {
      clip: { x: 200, y: 100, width: 400, height: 400 }
    });
  });
});
