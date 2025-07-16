import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import viewerStore from '../../stores/viewer.store';
import { LineElement } from '../../models/elements.model';

@Component({
  selector: 'app-line',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.css']
})
export class LineComponent implements OnInit, OnChanges {
  @Input() startX: number = 0;
  @Input() startY: number = 0;
  @Input() endX: number = 100;
  @Input() endY: number = 0;
  @Input() thickness: number = 2;
  @Input() color: string = '#000000';
  @Input() lineData!: LineElement;
  @Input() isSelected: boolean = false;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;

  // Internal observable properties that sync with inputs
  public _startX: number = 0;
  public _startY: number = 0;
  public _endX: number = 100;
  public _endY: number = 0;
  public _thickness: number = 2;
  public _color: string = '#000000';
  public _lineData: LineElement | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      effectiveStartX: computed,
      effectiveStartY: computed,
      effectiveEndX: computed,
      effectiveEndY: computed,
      effectiveThickness: computed,
      effectiveColor: computed,
      svgWidth: computed,
      svgHeight: computed,
      svgLeft: computed,
      svgTop: computed,
      svgX1: computed,
      svgY1: computed,
      svgX2: computed,
      svgY2: computed,
      // Internal observable properties
      _startX: observable,
      _startY: observable,
      _endX: observable,
      _endY: observable,
      _thickness: observable,
      _color: observable,
      _lineData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      // Actions
      syncInputs: action,
      handleLineClick: action,
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      startX: false,
      startY: false,
      endX: false,
      endY: false,
      thickness: false,
      color: false,
      lineData: false,
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
    this._startX = this.startX;
    this._startY = this.startY;
    this._endX = this.endX;
    this._endY = this.endY;
    this._thickness = this.thickness;
    this._color = this.color;
    this._lineData = this.lineData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
  }

  // Handle line click for selecting the line
  handleLineClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this._lineData && this._lineData.id) {
      this.store.selectionStore.selectItem(this._lineData);
    }
  }

  // Computed properties for effective values
  get effectiveStartX(): number {
    return this._lineData ? this._lineData.startX : this._startX;
  }

  get effectiveStartY(): number {
    return this._lineData ? this._lineData.startY : this._startY;
  }

  get effectiveEndX(): number {
    return this._lineData ? this._lineData.endX : this._endX;
  }

  get effectiveEndY(): number {
    return this._lineData ? this._lineData.endY : this._endY;
  }

  get effectiveThickness(): number {
    return this._lineData ? this._lineData.thickness : this._thickness;
  }

  get effectiveColor(): string {
    return this._lineData ? this._lineData.color : this._color;
  }


  // SVG positioning and sizing
  get svgLeft(): number {
    return Math.min(this.effectiveStartX, this.effectiveEndX) - 10; // Add padding for stroke width and endpoints
  }

  get svgTop(): number {
    return Math.min(this.effectiveStartY, this.effectiveEndY) - 10; // Add padding
  }

  get svgWidth(): number {
    return Math.abs(this.effectiveEndX - this.effectiveStartX) + 20; // Add padding
  }

  get svgHeight(): number {
    return Math.abs(this.effectiveEndY - this.effectiveStartY) + 20; // Add padding
  }

  // Convert absolute coordinates to SVG-relative coordinates
  get svgX1(): number {
    return this.effectiveStartX - this.svgLeft;
  }

  get svgY1(): number {
    return this.effectiveStartY - this.svgTop;
  }

  get svgX2(): number {
    return this.effectiveEndX - this.svgLeft;
  }

  get svgY2(): number {
    return this.effectiveEndY - this.svgTop;
  }

  // Helper methods for SVG rendering
}