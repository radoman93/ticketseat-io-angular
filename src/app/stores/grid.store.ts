import { makeAutoObservable, action } from 'mobx';

export class GridStore {
  // Grid properties
  mouseX = 0;
  mouseY = 0;
  gridSize = 50;
  zoomLevel = 100;
  panOffset = { x: 0, y: 0 };
  isPanning = false;
  panStart = { x: 0, y: 0 };
  showGrid = true;
  showGuides = true;
  
  // Callback for triggering grid redraw
  private redrawCallbacks: (() => void)[] = [];

  constructor() {
    makeAutoObservable(this, {
      // Explicitly mark actions
      setMousePosition: action,
      setGridSize: action,
      startPanning: action,
      stopPanning: action,
      pan: action,
      adjustZoom: action,
      zoomIn: action,
      zoomOut: action,
      toggleGrid: action,
      toggleGuides: action,
      registerRedrawCallback: false,
      unregisterRedrawCallback: false,
      triggerRedraw: false
    });
  }

  // Computed value for mouse position
  get mousePosition() {
    return {
      x: this.getUnscaledCoordinate(this.mouseX - this.panOffset.x),
      y: this.getUnscaledCoordinate(this.mouseY - this.panOffset.y)
    };
  }

  // Actions
  setMousePosition = action('setMousePosition', (x: number, y: number) => {
    this.mouseX = x;
    this.mouseY = y;
  });

  setGridSize = action('setGridSize', (size: number) => {
    this.gridSize = size;
    this.triggerRedraw();
  });

  startPanning = action('startPanning', (x: number, y: number) => {
    this.isPanning = true;
    this.panStart.x = x;
    this.panStart.y = y;
  });

  stopPanning = action('stopPanning', () => {
    this.isPanning = false;
  });

  pan = action('pan', (x: number, y: number) => {
    if (this.isPanning) {
      const dx = x - this.panStart.x;
      const dy = y - this.panStart.y;

      this.panOffset.x += dx;
      this.panOffset.y += dy;

      this.panStart.x = x;
      this.panStart.y = y;
    }
  });

  adjustZoom = action('adjustZoom', (amount: number) => {
    this.zoomLevel = Math.max(10, Math.min(200, this.zoomLevel + amount));
    this.triggerRedraw();
  });

  zoomIn = action('zoomIn', () => {
    this.adjustZoom(10);
  });

  zoomOut = action('zoomOut', () => {
    this.adjustZoom(-10);
  });

  toggleGrid = action('toggleGrid', () => {
    this.showGrid = !this.showGrid;
    this.triggerRedraw();
  });

  toggleGuides = action('toggleGuides', () => {
    this.showGuides = !this.showGuides;
    this.triggerRedraw();
  });

  getUnscaledCoordinate(coord: number): number {
    return Math.floor(coord / (this.zoomLevel / 100));
  }

  // Methods for managing redraw callbacks
  registerRedrawCallback(callback: () => void) {
    this.redrawCallbacks.push(callback);
  }

  unregisterRedrawCallback(callback: () => void) {
    const index = this.redrawCallbacks.indexOf(callback);
    if (index !== -1) {
      this.redrawCallbacks.splice(index, 1);
    }
  }

  triggerRedraw() {
    for (const callback of this.redrawCallbacks) {
      callback();
    }
  }
}

// Create a singleton instance
export const gridStore = new GridStore(); 