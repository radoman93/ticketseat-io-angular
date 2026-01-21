import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gridStore, GridStore } from '../../stores/grid.store';
import { layoutStore } from '../../stores/layout.store';
import { ElementBoundsService } from '../../services/element-bounds.service';

@Component({
  selector: 'app-navigation-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="navigation-controls" [class.compact]="compact">
      <!-- Zoom In -->
      <button
        class="nav-btn"
        (click)="zoomIn()"
        [disabled]="gridStore.zoomLevel >= maxZoom"
        title="Zoom In"
        aria-label="Zoom In">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>

      <!-- Zoom Level Display -->
      <div class="zoom-level" *ngIf="showZoomLevel">
        {{ Math.round(gridStore.zoomLevel) }}%
      </div>

      <!-- Zoom Out -->
      <button
        class="nav-btn"
        (click)="zoomOut()"
        [disabled]="gridStore.zoomLevel <= minZoom"
        title="Zoom Out"
        aria-label="Zoom Out">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Reset View -->
      <button
        class="nav-btn"
        (click)="resetView()"
        title="Reset View"
        aria-label="Reset View">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      </button>

      <!-- Fit All -->
      <button
        class="nav-btn"
        (click)="fitAll()"
        title="Fit All Elements"
        aria-label="Fit All Elements">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
          <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .navigation-controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }

    .navigation-controls.compact {
      bottom: 16px;
      right: 16px;
      padding: 6px;
      gap: 6px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 8px;
      background: #f3f4f6;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
      touch-action: manipulation;
    }

    .compact .nav-btn {
      width: 40px;
      height: 40px;
    }

    .nav-btn:hover:not(:disabled) {
      background: #e5e7eb;
      color: #111827;
    }

    .nav-btn:active:not(:disabled) {
      background: #d1d5db;
      transform: scale(0.95);
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .nav-btn .icon {
      width: 20px;
      height: 20px;
    }

    .compact .nav-btn .icon {
      width: 18px;
      height: 18px;
    }

    .zoom-level {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      padding: 4px 0;
      min-width: 44px;
    }

    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 4px 0;
    }

    /* Mobile-specific adjustments */
    @media (max-width: 768px) {
      .navigation-controls {
        bottom: 16px;
        right: 16px;
        padding: 6px;
        gap: 6px;
      }

      .nav-btn {
        width: 48px;
        height: 48px;
      }

      .nav-btn .icon {
        width: 22px;
        height: 22px;
      }
    }

    /* Very small screens */
    @media (max-width: 375px) {
      .navigation-controls {
        bottom: 12px;
        right: 12px;
      }
    }

    /* Viewer mode - green theme */
    :host-context(.viewer-mode) .navigation-controls {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    :host-context(.viewer-mode) .nav-btn {
      background: #dcfce7;
    }

    :host-context(.viewer-mode) .nav-btn:hover:not(:disabled) {
      background: #bbf7d0;
    }

    :host-context(.viewer-mode) .nav-btn:active:not(:disabled) {
      background: #86efac;
    }
  `]
})
export class NavigationControlsComponent implements OnInit {
  @Input() compact = false;
  @Input() showZoomLevel = true;
  @Input() containerRef?: HTMLElement;

  gridStore: GridStore = gridStore;

  // Make Math available in template for rounding
  Math = Math;

  readonly minZoom = 25;
  readonly maxZoom = 200;
  readonly zoomStep = 10;

  constructor(private elementBoundsService: ElementBoundsService) {}

  ngOnInit(): void {}

  zoomIn(): void {
    const newZoom = Math.min(this.gridStore.zoomLevel + this.zoomStep, this.maxZoom);
    this.gridStore.zoomLevel = newZoom;
    this.gridStore.triggerRedraw();
  }

  zoomOut(): void {
    const newZoom = Math.max(this.gridStore.zoomLevel - this.zoomStep, this.minZoom);
    this.gridStore.zoomLevel = newZoom;
    this.gridStore.triggerRedraw();
  }

  resetView(): void {
    this.gridStore.panOffset.x = 0;
    this.gridStore.panOffset.y = 0;
    this.gridStore.zoomLevel = 100;
    this.gridStore.triggerRedraw();
  }

  fitAll(): void {
    const elements = layoutStore.elements;
    if (elements.length === 0) {
      this.resetView();
      return;
    }

    // Calculate bounds of all elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      const bounds = this.elementBoundsService.getElementBounds(element);
      minX = Math.min(minX, bounds.visualLeft);
      minY = Math.min(minY, bounds.visualTop);
      maxX = Math.max(maxX, bounds.visualRight);
      maxY = Math.max(maxY, bounds.visualBottom);
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Get container dimensions (fallback to window if no container)
    const containerWidth = this.containerRef?.clientWidth || window.innerWidth;
    const containerHeight = this.containerRef?.clientHeight || window.innerHeight - 100; // Account for header

    // Calculate zoom level to fit content
    const zoomX = (containerWidth / contentWidth) * 100;
    const zoomY = (containerHeight / contentHeight) * 100;
    let newZoom = Math.min(zoomX, zoomY);

    // Clamp zoom level
    newZoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));

    // Apply zoom
    this.gridStore.zoomLevel = newZoom;

    // Calculate pan to center content
    const zoomFactor = newZoom / 100;
    const scaledContentWidth = contentWidth * zoomFactor;
    const scaledContentHeight = contentHeight * zoomFactor;

    // Center the content
    this.gridStore.panOffset.x = (containerWidth - scaledContentWidth) / 2 - (minX * zoomFactor);
    this.gridStore.panOffset.y = (containerHeight - scaledContentHeight) / 2 - (minY * zoomFactor);

    this.gridStore.triggerRedraw();
  }
}
