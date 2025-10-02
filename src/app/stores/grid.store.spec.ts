import { GridStore } from './grid.store';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('GridStore', () => {
  let store: GridStore;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new GridStore();
  });

  describe('initialization', () => {
    it('should initialize with default grid size of 50', () => {
      expect(store.gridSize).toBe(50);
    });

    it('should initialize with zoom level of 100', () => {
      expect(store.zoomLevel).toBe(100);
    });

    it('should initialize with pan offset at origin', () => {
      expect(store.panOffset).toEqual({ x: 0, y: 0 });
    });

    it('should initialize with grid and guides visible', () => {
      expect(store.showGrid).toBe(true);
      expect(store.showGuides).toBe(true);
    });

    it('should initialize with snap to grid disabled', () => {
      expect(store.snapToGrid).toBe(false);
    });

    it('should initialize with panning disabled', () => {
      expect(store.isPanning).toBe(false);
    });
  });

  describe('setMousePosition', () => {
    it('should update mouse coordinates', () => {
      store.setMousePosition(150, 250);

      expect(store.mouseX).toBe(150);
      expect(store.mouseY).toBe(250);
    });
  });

  describe('mousePosition computed property', () => {
    it('should calculate unscaled mouse position', () => {
      store.setMousePosition(100, 100);

      const pos = store.mousePosition;
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(100);
    });

    it('should account for pan offset', () => {
      store.panOffset = { x: 50, y: 50 };
      store.setMousePosition(100, 100);

      const pos = store.mousePosition;
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(50);
    });
  });

  describe('panning', () => {
    it('should start panning', () => {
      store.startPanning(100, 100);

      expect(store.isPanning).toBe(true);
      expect(store.panStart).toEqual({ x: 100, y: 100 });
    });

    it('should stop panning', () => {
      store.startPanning(100, 100);
      store.stopPanning();

      expect(store.isPanning).toBe(false);
    });

    it('should update pan offset during panning', () => {
      store.startPanning(100, 100);
      store.pan(150, 150);

      expect(store.panOffset).toEqual({ x: 50, y: 50 });
      expect(store.panStart).toEqual({ x: 150, y: 150 });
    });

    it('should not update pan offset when not panning', () => {
      store.pan(150, 150);

      expect(store.panOffset).toEqual({ x: 0, y: 0 });
    });

    it('should accumulate pan offset on multiple pan calls', () => {
      store.startPanning(100, 100);
      store.pan(150, 150); // +50, +50
      store.pan(200, 200); // +50, +50

      expect(store.panOffset).toEqual({ x: 100, y: 100 });
    });
  });

  describe('zoom', () => {
    it('should zoom in by 10%', () => {
      store.zoomIn();

      expect(store.zoomLevel).toBe(110);
    });

    it('should zoom out by 10%', () => {
      store.zoomOut();

      expect(store.zoomLevel).toBe(90);
    });

    it('should not zoom below 10%', () => {
      store.zoomLevel = 15;
      store.adjustZoom(-10);

      expect(store.zoomLevel).toBe(10);
    });

    it('should not zoom above 200%', () => {
      store.zoomLevel = 195;
      store.adjustZoom(10);

      expect(store.zoomLevel).toBe(200);
    });

    it('should clamp zoom to valid range', () => {
      store.adjustZoom(-1000);
      expect(store.zoomLevel).toBe(10);

      store.adjustZoom(1000);
      expect(store.zoomLevel).toBe(200);
    });
  });

  describe('grid settings', () => {
    it('should set grid size', () => {
      store.setGridSize(25);

      expect(store.gridSize).toBe(25);
    });

    it('should toggle grid visibility', () => {
      expect(store.showGrid).toBe(true);

      store.toggleGrid();
      expect(store.showGrid).toBe(false);

      store.toggleGrid();
      expect(store.showGrid).toBe(true);
    });

    it('should toggle guides visibility', () => {
      expect(store.showGuides).toBe(true);

      store.toggleGuides();
      expect(store.showGuides).toBe(false);

      store.toggleGuides();
      expect(store.showGuides).toBe(true);
    });

    it('should toggle snap to grid', () => {
      expect(store.snapToGrid).toBe(false);

      store.toggleSnapToGrid();
      expect(store.snapToGrid).toBe(true);

      store.toggleSnapToGrid();
      expect(store.snapToGrid).toBe(false);
    });
  });

  describe('redraw callbacks', () => {
    let callbackStore: GridStore;

    beforeEach(() => {
      // Create fresh store for callback tests to avoid pollution
      callbackStore = new GridStore();
    });

    it('should register redraw callback', () => {
      const callback = jasmine.createSpy('redrawCallback');
      callbackStore.registerRedrawCallback(callback);

      callbackStore.setGridSize(30);

      expect(callback).toHaveBeenCalled();
    });

    it('should call multiple registered callbacks', () => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      callbackStore.registerRedrawCallback(callback1);
      callbackStore.registerRedrawCallback(callback2);

      callbackStore.setGridSize(30);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unregister redraw callback', () => {
      // Use completely fresh store instance
      const testStore = new GridStore();
      const testCallback1 = jasmine.createSpy('testCallback1');
      const testCallback2 = jasmine.createSpy('testCallback2');

      testStore.registerRedrawCallback(testCallback1);
      testStore.registerRedrawCallback(testCallback2);

      // Verify both are registered by triggering redraw
      testStore.setGridSize(30);
      expect(testCallback1).toHaveBeenCalledTimes(1);
      expect(testCallback2).toHaveBeenCalledTimes(1);

      // Reset spy counters
      testCallback1.calls.reset();
      testCallback2.calls.reset();

      // Unregister testCallback2 only
      testStore.unregisterRedrawCallback(testCallback2);

      // Trigger redraw - only testCallback1 should be called
      testStore.setGridSize(25);

      expect(testCallback1).toHaveBeenCalledTimes(1);
      expect(testCallback2).not.toHaveBeenCalled();
    });

    it('should trigger redraw on zoom changes', () => {
      const callback = jasmine.createSpy('redrawCallback');
      callbackStore.registerRedrawCallback(callback);

      callbackStore.zoomIn();

      expect(callback).toHaveBeenCalled();
    });

    it('should trigger redraw on grid toggle', () => {
      const callback = jasmine.createSpy('redrawCallback');
      callbackStore.registerRedrawCallback(callback);

      callbackStore.toggleGrid();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('snapCoordinateToGrid', () => {
    it('should snap coordinates to nearest grid point', () => {
      store.gridSize = 50;
      store.snapToGrid = true;

      const snapped = store.snapCoordinateToGrid(123, 137);

      expect(snapped.x).toBe(100); // Nearest multiple of 50
      expect(snapped.y).toBe(150); // Nearest multiple of 50
    });

    it('should snap to larger grid point when closer', () => {
      store.gridSize = 50;
      store.snapToGrid = true;

      const snapped = store.snapCoordinateToGrid(138, 27);

      expect(snapped.x).toBe(150); // Closer to 150 than 100
      expect(snapped.y).toBe(50);  // Closer to 50 than 0
    });

    it('should handle negative coordinates', () => {
      store.gridSize = 50;
      store.snapToGrid = true;

      const snapped = store.snapCoordinateToGrid(-37, -63);

      expect(snapped.x).toBe(-50);
      expect(snapped.y).toBe(-50);
    });

    it('should return exact value if already on grid', () => {
      store.gridSize = 50;
      store.snapToGrid = true;

      const snapped = store.snapCoordinateToGrid(150, 100);

      expect(snapped.x).toBe(150);
      expect(snapped.y).toBe(100);
    });

    it('should return original coordinates when snap is disabled', () => {
      store.gridSize = 50;
      store.snapToGrid = false;

      const snapped = store.snapCoordinateToGrid(123, 137);

      expect(snapped.x).toBe(123);
      expect(snapped.y).toBe(137);
    });
  });
});
