import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineProperties } from '../../services/selection.service';

@Component({
  selector: 'app-line',
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
      
      <!-- Line path -->
      <polyline
        *ngIf="line.points.length >= 2"
        [attr.points]="pathString"
        [attr.stroke]="line.color || '#000000'"
        [attr.stroke-width]="line.thickness || 2"
        [attr.fill]="'none'"
        [attr.stroke-linecap]="'round'"
        [attr.stroke-linejoin]="'round'"
        [class.selected]="isSelected"
        [style.pointer-events]="'stroke'"
        (click)="handleLineClick($event)"
        (mousedown)="handleLineMouseDown($event)">
      </polyline>
      
      <!-- Selection handles when selected -->
      <g *ngIf="isSelected">
        <circle
          *ngFor="let point of line.points; let i = index"
          [attr.cx]="point.x - svgLeft"
          [attr.cy]="point.y - svgTop"
          r="4"
          fill="#007bff"
          stroke="white"
          stroke-width="2"
          [style.pointer-events]="'all'"
          [style.cursor]="'move'"
          class="point-handle">
        </circle>
      </g>
      
      <!-- Rotation handle when selected - Removed for lines -->
      <!--
      <circle
        *ngIf="isSelected"
        [attr.cx]="rotationHandleX - svgLeft"
        [attr.cy]="rotationHandleY - svgTop"
        r="6"
        fill="#28a745"
        stroke="white"
        stroke-width="2"
        [style.pointer-events]="'all'"
        [style.cursor]="'grab'"
        class="rotation-handle"
        (mousedown)="handleRotationStart($event)">
      </circle>
      -->
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
      cursor: move;
    }
    
    .point-handle:hover {
      fill: #0056b3;
      r: 5;
    }
  `]
})
export class LineComponent {
  @Input() line!: LineProperties;
  @Input() isSelected: boolean = false;
  
  @Output() select = new EventEmitter<{ line: LineProperties, event: MouseEvent }>();
  @Output() startRotate = new EventEmitter<{ line: LineProperties, event: MouseEvent }>();

  get pathString(): string {
    return this.line.points.map(point => `${point.x - this.svgLeft},${point.y - this.svgTop}`).join(' ');
  }

  get svgBounds() {
    if (this.line.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const minX = Math.min(...this.line.points.map(p => p.x));
    const minY = Math.min(...this.line.points.map(p => p.y));
    const maxX = Math.max(...this.line.points.map(p => p.x));
    const maxY = Math.max(...this.line.points.map(p => p.y));

    return { minX, minY, maxX, maxY };
  }

  get svgLeft(): number {
    const bounds = this.svgBounds;
    return bounds.minX - 20; // Add padding for handles
  }

  get svgTop(): number {
    const bounds = this.svgBounds;
    return bounds.minY - 20; // Add padding for handles
  }

  get svgWidth(): number {
    const bounds = this.svgBounds;
    return (bounds.maxX - bounds.minX) + 40; // Add padding for handles
  }

  get svgHeight(): number {
    const bounds = this.svgBounds;
    return (bounds.maxY - bounds.minY) + 40; // Add padding for handles
  }

  get rotationHandleX(): number {
    const bounds = this.svgBounds;
    return bounds.maxX + 15; // Position to the right of the line
  }

  get rotationHandleY(): number {
    const bounds = this.svgBounds;
    return bounds.minY + (bounds.maxY - bounds.minY) / 2; // Center vertically
  }

  handleLineClick(event: MouseEvent): void {
    event.stopPropagation();
    this.select.emit({ line: this.line, event });
  }

  handleLineMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    this.select.emit({ line: this.line, event });
  }

  handleRotationStart(event: MouseEvent): void {
    event.stopPropagation();
    this.startRotate.emit({ line: this.line, event });
  }
} 