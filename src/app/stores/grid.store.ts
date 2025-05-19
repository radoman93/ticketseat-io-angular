import { makeAutoObservable } from 'mobx';

export class GridStore {
  // Grid properties
  mouseX = 0;
  mouseY = 0;
  gridSize = 50;
  zoomLevel = 100;
  panOffset = { x: 0, y: 0 };
  canvasWidth = 3000;
  canvasHeight = 2000;
  isPanning = false;
  panStart = { x: 0, y: 0 };
  showGrid = true;
  showGuides = true;
  
  // Callback for triggering grid redraw
  private redrawCallbacks: (() => void)[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  setGridSize(size: number) {
    this.gridSize = size;
    this.triggerRedraw();
  }

  startPanning(x: number, y: number) {
    this.isPanning = true;
    this.panStart.x = x;
    this.panStart.y = y;
  }

  stopPanning() {
    this.isPanning = false;
  }

  pan(x: number, y: number) {
    if (this.isPanning) {
      const dx = x - this.panStart.x;
      const dy = y - this.panStart.y;

      this.panOffset.x += dx;
      this.panOffset.y += dy;

      this.panStart.x = x;
      this.panStart.y = y;
    }
  }

  adjustZoom(amount: number) {
    this.zoomLevel = Math.max(10, Math.min(200, this.zoomLevel + amount));
    this.triggerRedraw();
  }

  zoomIn() {
    this.adjustZoom(10);
  }

  zoomOut() {
    this.adjustZoom(-10);
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.triggerRedraw();
  }

  toggleGuides() {
    this.showGuides = !this.showGuides;
    this.triggerRedraw();
  }

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