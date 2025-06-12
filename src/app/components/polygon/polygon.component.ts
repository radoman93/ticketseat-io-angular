import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolygonProperties } from '../../services/selection.service';

@Component({
  selector: 'app-polygon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="svgWidth"
      [attr.height]="svgHeight"
      [style.position]="'absolute'"
      [style.left.px]="svgLeft"
      [style.top.px]="svgTop"
      [style.pointer-events]="'none'"
      [style.z-index]="isSelected ? 20 : 10">
      
      <!-- Single point indicator -->
      <circle
        *ngIf="polygon.points.length === 1"
        [attr.cx]="polygon.points[0].x - svgLeft"
        [attr.cy]="polygon.points[0].y - svgTop"
        r="3"
        [attr.fill]="polygon.strokeColor || '#000000'">
      </circle>
      
      <!-- Polyline for 2 points preview -->
      <polyline
        *ngIf="polygon.points.length === 2"
        [attr.points]="pathString"
        [attr.stroke]="polygon.strokeColor || '#000000'"
        [attr.stroke-width]="polygon.thickness || 2"
        fill="none"
        [class.selected]="isSelected"
        [style.pointer-events]="'all'"
        (click)="handlePolygonClick($event)"
        (mousedown)="handlePolygonMouseDown($event)">
      </polyline>
      
      <!-- Polyline for 3+ points when not closed -->
      <polyline
        *ngIf="polygon.points.length >= 3 && !isPolygonClosed"
        [attr.points]="pathString"
        [attr.stroke]="polygon.strokeColor || '#000000'"
        [attr.stroke-width]="polygon.thickness || 2"
        fill="none"
        [class.selected]="isSelected"
        [style.pointer-events]="'all'"
        (click)="handlePolygonClick($event)"
        (mousedown)="handlePolygonMouseDown($event)">
      </polyline>
      
      <!-- Polygon path for closed polygons only -->
      <polygon
        *ngIf="polygon.points.length >= 3 && isPolygonClosed"
        [attr.points]="pathString"
        [attr.stroke]="polygon.strokeColor || '#000000'"
        [attr.stroke-width]="polygon.thickness || 2"
        [attr.fill]="polygon.fillColor || '#E5E5E5'"
        [class.selected]="isSelected"
        [style.pointer-events]="'all'"
        (click)="handlePolygonClick($event)"
        (mousedown)="handlePolygonMouseDown($event)">
      </polygon>
      
      <!-- Point handles for all points (always visible) -->
      <g>
        <circle
          *ngFor="let point of polygon.points; let i = index"
          [attr.cx]="point.x - svgLeft"
          [attr.cy]="point.y - svgTop"
          r="3"
          [attr.fill]="isSelected ? '#007bff' : '#666666'"
          [attr.stroke]="isSelected ? 'white' : '#ffffff'"
          stroke-width="1"
          [style.pointer-events]="isPreview ? 'none' : 'all'"
          [style.cursor]="isSelected ? 'move' : 'pointer'"
          class="point-handle">
        </circle>
      </g>
      
      <!-- Selection handles when selected (larger handles for editing) -->
      <g *ngIf="isSelected && !isPreview">
        <circle
          *ngFor="let point of polygon.points; let i = index"
          [attr.cx]="point.x - svgLeft"
          [attr.cy]="point.y - svgTop"
          r="6"
          fill="#007bff"
          stroke="white"
          stroke-width="2"
          [style.pointer-events]="'all'"
          [style.cursor]="'move'"
          class="point-handle-selected">
        </circle>
      </g>

      <!-- Label in the center (only for closed polygons) -->
      <text
        *ngIf="polygon.label && polygon.points.length >= 3 && isPolygonClosed"
        [attr.x]="centerX - svgLeft"
        [attr.y]="centerY - svgTop"
        text-anchor="middle"
        alignment-baseline="middle"
        [style.pointer-events]="'none'"
        fill="#000000"
        font-size="14px">
        {{polygon.label}}
      </text>
    </svg>
  `,
  styles: [`
    .selected {
      stroke-dasharray: 5,5;
      animation: dash 1s linear infinite;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: -10;
      }
    }
    
    .point-handle {
      cursor: pointer;
    }
    
    .point-handle:hover {
      fill: #0056b3;
    }
    
    .point-handle-selected {
      cursor: move;
    }
    
    .point-handle-selected:hover {
      fill: #0056b3;
    }
  `]
})
export class PolygonComponent {
  @Input() polygon!: PolygonProperties;
  @Input() isSelected: boolean = false;
  @Input() isPolygonClosed: boolean = false;
  @Input() isPreview: boolean = false;
  
  @Output() select = new EventEmitter<{ polygon: PolygonProperties, event: MouseEvent }>();

  get pathString(): string {
    return this.polygon.points.map(point => `${point.x - this.svgLeft},${point.y - this.svgTop}`).join(' ');
  }

  get svgBounds() {
    if (this.polygon.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }

    const minX = Math.min(...this.polygon.points.map(p => p.x));
    const minY = Math.min(...this.polygon.points.map(p => p.y));
    const maxX = Math.max(...this.polygon.points.map(p => p.x));
    const maxY = Math.max(...this.polygon.points.map(p => p.y));

    // Ensure minimum dimensions for very small polygons/lines
    const width = Math.max(maxX - minX, 50);
    const height = Math.max(maxY - minY, 50);

    return { 
      minX: minX - (width - (maxX - minX)) / 2, 
      minY: minY - (height - (maxY - minY)) / 2, 
      maxX: maxX + (width - (maxX - minX)) / 2, 
      maxY: maxY + (height - (maxY - minY)) / 2 
    };
  }

  get svgWidth(): number {
    if (this.isPreview) {
      return 5000; // Large fixed width for preview mode
    }
    const bounds = this.svgBounds;
    return (bounds.maxX - bounds.minX) + 40; // Add padding for handles
  }

  get svgHeight(): number {
    if (this.isPreview) {
      return 5000; // Large fixed height for preview mode
    }
    const bounds = this.svgBounds;
    return (bounds.maxY - bounds.minY) + 40; // Add padding for handles
  }

  get svgLeft(): number {
    if (this.isPreview) {
      return -2500; // Center the fixed-size SVG
    }
    const bounds = this.svgBounds;
    return bounds.minX - 20; // Add padding for handles
  }

  get svgTop(): number {
    if (this.isPreview) {
      return -2500; // Center the fixed-size SVG
    }
    const bounds = this.svgBounds;
    return bounds.minY - 20; // Add padding for handles
  }

  get centerX(): number {
    const bounds = this.svgBounds;
    return (bounds.minX + bounds.maxX) / 2;
  }

  get centerY(): number {
    const bounds = this.svgBounds;
    return (bounds.minY + bounds.maxY) / 2;
  }

  handlePolygonClick(event: MouseEvent): void {
    event.stopPropagation();
    this.select.emit({ polygon: this.polygon, event });
  }

  handlePolygonMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    this.select.emit({ polygon: this.polygon, event });
  }
} 