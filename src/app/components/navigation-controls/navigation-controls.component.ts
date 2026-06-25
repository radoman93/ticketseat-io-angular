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
    /* ============ Docked top toolbar ============ */
    :host {
      display: block;
      width: 100%;
      flex-shrink: 0;
    }

    .navigation-controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 14px;
      background: var(--ts-panel, #FDFBF7);
      border-bottom: 1px solid var(--ts-border, rgba(28, 22, 12, 0.08));
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      z-index: 20;
    }

    .navigation-controls.compact {
      padding: 6px 10px;
      gap: 3px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: #374151;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .nav-btn:hover:not(:disabled) {
      background: rgba(17, 24, 39, 0.06);
      color: #111827;
    }

    .nav-btn:active:not(:disabled) {
      background: rgba(17, 24, 39, 0.12);
      transform: scale(0.92);
    }

    .nav-btn:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .nav-btn .icon {
      width: 20px;
      height: 20px;
    }

    .zoom-level {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #4b5563;
      padding: 0 4px;
      min-width: 46px;
      font-variant-numeric: tabular-nums;
    }

    /* Vertical divider inside the horizontal bar */
    .divider {
      align-self: center;
      width: 1px;
      height: 22px;
      background: rgba(17, 24, 39, 0.12);
      margin: 0 4px;
    }

    /* ============ Mobile ============ */
    @media (max-width: 768px) {
      .navigation-controls {
        justify-content: center;
        padding: 8px 10px;
        gap: 6px;
      }

      .nav-btn {
        width: 44px;
        height: 44px;
      }

      .nav-btn .icon {
        width: 22px;
        height: 22px;
      }
    }

    @media (max-width: 360px) {
      .navigation-controls {
        gap: 3px;
      }
      .nav-btn {
        width: 42px;
        height: 42px;
      }
      .zoom-level {
        min-width: 40px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-btn {
        transition: none;
      }
      .nav-btn:active:not(:disabled) {
        transform: none;
      }
    }

    /* ============ Viewer mode - green theme ============ */
    :host-context(.viewer-mode) .navigation-controls {
      background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0;
    }

    :host-context(.viewer-mode) .nav-btn {
      color: #166534;
    }

    :host-context(.viewer-mode) .nav-btn:hover:not(:disabled) {
      background: rgba(22, 101, 52, 0.1);
      color: #14532d;
    }

    :host-context(.viewer-mode) .nav-btn:active:not(:disabled) {
      background: rgba(22, 101, 52, 0.18);
    }

    :host-context(.viewer-mode) .zoom-level {
      color: #15803d;
    }

    :host-context(.viewer-mode) .divider {
      background: rgba(22, 101, 52, 0.2);
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
