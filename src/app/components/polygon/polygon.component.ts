import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import viewerStore from '../../stores/viewer.store';
import { PolygonElement } from '../../models/elements.model';

@Component({
  selector: 'app-polygon',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './polygon.component.html',
  styleUrls: ['./polygon.component.css']
})
export class PolygonComponent implements OnInit, OnChanges {
  @Input() points: Array<{x: number, y: number}> = [];
  @Input() fillColor: string = '#0000ff';
  @Input() fillOpacity: number = 0.3;
  @Input() borderColor: string = '#000000';
  @Input() borderThickness: number = 2;
  @Input() showBorder: boolean = true;
  @Input() polygonData!: PolygonElement;
  @Input() isSelected: boolean = false;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;

  // Internal observable properties that sync with inputs
  public _points: Array<{x: number, y: number}> = [];
  public _fillColor: string = '#0000ff';
  public _fillOpacity: number = 0.3;
  public _borderColor: string = '#000000';
  public _borderThickness: number = 2;
  public _showBorder: boolean = true;
  public _polygonData: PolygonElement | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      effectivePoints: computed,
      effectiveFillColor: computed,
      effectiveFillOpacity: computed,
      effectiveBorderColor: computed,
      effectiveBorderThickness: computed,
      effectiveShowBorder: computed,
      svgWidth: computed,
      svgHeight: computed,
      svgLeft: computed,
      svgTop: computed,
      pathData: computed,
      boundingBox: computed,
      // Observable properties
      _points: observable,
      _fillColor: observable,
      _fillOpacity: observable,
      _borderColor: observable,
      _borderThickness: observable,
      _showBorder: observable,
      _polygonData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      // Actions
      syncInputs: action,
      handlePolygonClick: action,
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      points: false,
      fillColor: false,
      fillOpacity: false,
      borderColor: false,
      borderThickness: false,
      showBorder: false,
      polygonData: false,
      isSelected: false,
      isPreview: false,
      rotation: false,
      class: false,
      // Exclude stores as they are already observable
      store: false,
      viewerStore: false
    });
  }

  ngOnInit() {
    this.syncInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
  }

  @action
  public syncInputs() {
    this._points = this.points || [];
    this._fillColor = this.fillColor;
    this._fillOpacity = this.fillOpacity;
    this._borderColor = this.borderColor;
    this._borderThickness = this.borderThickness;
    this._showBorder = this.showBorder;
    this._polygonData = this.polygonData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
  }

  // Computed properties for effective values (use polygon data if available, otherwise use inputs)
  get effectivePoints(): Array<{x: number, y: number}> {
    return this._polygonData ? this._polygonData.points : this._points;
  }

  get effectiveFillColor(): string {
    return this._polygonData ? this._polygonData.fillColor : this._fillColor;
  }

  get effectiveFillOpacity(): number {
    return this._polygonData ? this._polygonData.fillOpacity : this._fillOpacity;
  }

  get effectiveBorderColor(): string {
    return this._polygonData ? this._polygonData.borderColor : this._borderColor;
  }

  get effectiveBorderThickness(): number {
    return this._polygonData ? this._polygonData.borderThickness : this._borderThickness;
  }

  get effectiveShowBorder(): boolean {
    return this._polygonData ? this._polygonData.showBorder : this._showBorder;
  }

  // Calculate bounding box of all points
  get boundingBox(): {minX: number, minY: number, maxX: number, maxY: number} {
    const points = this.effectivePoints;
    if (points.length === 0) {
      return {minX: 0, minY: 0, maxX: 0, maxY: 0};
    }

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {minX, minY, maxX, maxY};
  }

  // SVG positioning and sizing
  get svgLeft(): number {
    const bbox = this.boundingBox;
    return bbox.minX - 10; // Add padding for stroke width and vertices
  }

  get svgTop(): number {
    const bbox = this.boundingBox;
    return bbox.minY - 10; // Add padding
  }

  get svgWidth(): number {
    const bbox = this.boundingBox;
    return (bbox.maxX - bbox.minX) + 20; // Add padding on both sides
  }

  get svgHeight(): number {
    const bbox = this.boundingBox;
    return (bbox.maxY - bbox.minY) + 20; // Add padding on both sides
  }

  // Convert absolute coordinates to SVG-relative coordinates
  getSvgX(x: number): number {
    return x - this.svgLeft;
  }

  getSvgY(y: number): number {
    return y - this.svgTop;
  }

  // Generate SVG path data for the polygon
  get pathData(): string {
    const points = this.effectivePoints;
    if (points.length < 3) return '';

    let path = `M ${this.getSvgX(points[0].x)} ${this.getSvgY(points[0].y)}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${this.getSvgX(points[i].x)} ${this.getSvgY(points[i].y)}`;
    }
    
    path += ' Z'; // Close the path
    return path;
  }

  // Point-in-polygon algorithm (ray casting)
  private isPointInPolygon(x: number, y: number, polygon: Array<{x: number, y: number}>): boolean {
    if (polygon.length < 3) return false;
    
    let inside = false;
    let j = polygon.length - 1;
    
    for (let i = 0; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // Check if point is near polygon border
  private isPointNearPolygonBorder(x: number, y: number, polygon: Array<{x: number, y: number}>, threshold: number = 5): boolean {
    if (polygon.length < 2) return false;
    
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      
      const distance = this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (distance <= threshold) {
        return true;
      }
    }
    
    return false;
  }

  // Calculate distance from point to line segment
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  // Enhanced hit detection
  isPointInPolygonArea(x: number, y: number): boolean {
    const points = this.effectivePoints;
    if (points.length < 3) return false;
    
    // Check if point is inside the filled area
    if (this.isPointInPolygon(x, y, points)) {
      return true;
    }
    
    // Check if point is near the border (for stroke area)
    if (this.effectiveShowBorder) {
      const borderThreshold = Math.max(this.effectiveBorderThickness / 2, 3);
      return this.isPointNearPolygonBorder(x, y, points, borderThreshold);
    }
    
    return false;
  }

  // Handle click events
  @action
  handlePolygonClick(event: MouseEvent): void {
    if (this._isPreview) return;
    
    event.stopPropagation();
    
    if (this._polygonData) {
      this.store.selectionStore.selectItem(this._polygonData);
    }
  }
}