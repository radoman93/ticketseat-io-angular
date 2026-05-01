import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { ArcSeatingRowProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { Chair } from '../../models/chair.model';
import viewerStore from '../../stores/viewer.store';

@Component({
  selector: 'app-arc-seating-row',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './arc-seating-row.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArcSeatingRowComponent implements OnInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() radius: number = 200;
  @Input() startAngle: number = 0;
  @Input() endAngle: number = 180;
  @Input() seats: number = 10;
  @Input() seatRadius: number = 10;
  @Input() chairFacing: 'inward' | 'outward' = 'inward';
  @Input() name: string = 'Arc Row';
  @Input() arcRowData!: ArcSeatingRowProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  @Input() chairLabelVisible: boolean = true;
  @Input() rowLabelVisible: boolean = true;

  // Internal observable mirrors of @Input — same pattern as sibling components
  public _x: number = 0;
  public _y: number = 0;
  public _radius: number = 200;
  public _startAngle: number = 0;
  public _endAngle: number = 180;
  public _seats: number = 10;
  public _seatRadius: number = 10;
  public _chairFacing: 'inward' | 'outward' = 'inward';
  public _name: string = 'Arc Row';
  public _arcRowData: ArcSeatingRowProperties | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;
  public _chairLabelVisible: boolean = true;
  public _rowLabelVisible: boolean = true;

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      arcStyles: computed,
      chairStyles: computed,
      labelPosition: computed,
      isEffectivePreview: computed,
      _x: observable,
      _y: observable,
      _radius: observable,
      _startAngle: observable,
      _endAngle: observable,
      _seats: observable,
      _seatRadius: observable,
      _chairFacing: observable,
      _name: observable,
      _arcRowData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      _chairLabelVisible: observable,
      _rowLabelVisible: observable,
      x: false, y: false, radius: false, startAngle: false, endAngle: false,
      seats: false, seatRadius: false, chairFacing: false, name: false,
      arcRowData: false, isSelected: false, isPreview: false, rotation: false,
      chairLabelVisible: false, rowLabelVisible: false, class: false,
      store: false, viewerStore: false
    });
  }

  ngOnInit() {
    this.syncInputs();
    this.generateChairsIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
    const seatChanged = changes['seats'] || (changes['arcRowData'] &&
      changes['arcRowData'].previousValue?.seats !== changes['arcRowData'].currentValue?.seats);
    const geometryChanged = changes['radius'] || changes['startAngle'] || changes['endAngle'] ||
      (changes['arcRowData'] && this.hasGeometryChanged(
        changes['arcRowData'].previousValue,
        changes['arcRowData'].currentValue
      ));
    if (seatChanged || geometryChanged) {
      this.generateChairsIfNeeded(true);
    }
  }

  @action
  public syncInputs() {
    this._x = this.x;
    this._y = this.y;
    this._radius = this.radius;
    this._startAngle = this.startAngle;
    this._endAngle = this.endAngle;
    this._seats = this.seats;
    this._seatRadius = this.seatRadius;
    this._chairFacing = this.chairFacing;
    this._name = this.name;
    this._arcRowData = this.arcRowData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
    this._chairLabelVisible = this.chairLabelVisible;
    this._rowLabelVisible = this.rowLabelVisible;
  }

  private hasGeometryChanged(prev: ArcSeatingRowProperties, curr: ArcSeatingRowProperties): boolean {
    if (!prev || !curr) return false;
    return prev.radius !== curr.radius || prev.startAngle !== curr.startAngle || prev.endAngle !== curr.endAngle;
  }

  private generateChairsIfNeeded(forceRegenerate: boolean = false) {
    if (!this._arcRowData || !this._arcRowData.id || this._isPreview) return;

    const existingChairs = this.store.chairStore.getChairsByTable(this._arcRowData.id);
    const needsRegeneration = forceRegenerate ||
      existingChairs.length === 0 ||
      existingChairs.length !== this._arcRowData.seats;

    if (needsRegeneration) {
      existingChairs.forEach(c => this.store.chairStore.removeChair(c.id));
      this.store.chairStore.generateChairsForArcRow(
        this._arcRowData.id,
        this._arcRowData.seats,
        this._arcRowData.radius,
        this._arcRowData.startAngle,
        this._arcRowData.endAngle,
        this._arcRowData.chairLabels
      );
    }
  }

  // Container is positioned at the arc center; chairs are translated by polar offsets within
  get arcStyles() {
    const data = this._arcRowData;
    return {
      left: `${data ? data.x : this._x}px`,
      top: `${data ? data.y : this._y}px`,
      transform: `translate(-50%, -50%) rotate(${this._rotation || (data && data.rotation) || 0}deg)`
    };
  }

  // Compute per-chair transform + back-rotation along the arc.
  // Angles use standard math convention (CCW from +X axis), but DOM Y grows downward,
  // so we flip the y component to match visual expectation.
  get chairStyles() {
    const data = this._arcRowData;
    const seats = data ? data.seats : this._seats;
    const radius = data ? data.radius : this._radius;
    const startAngle = data ? data.startAngle : this._startAngle;
    const endAngle = data ? data.endAngle : this._endAngle;
    const facing = data ? (data.chairFacing || 'inward') : this._chairFacing;

    if (seats <= 0) return [];

    const arcSpan = endAngle - startAngle;
    const step = seats === 1 ? 0 : arcSpan / (seats - 1);
    const baseAngle = seats === 1 ? startAngle + arcSpan / 2 : startAngle;

    const chairsArray: any[] = [];
    for (let i = 0; i < seats; i++) {
      const angleDeg = baseAngle + step * i;
      const angleRad = angleDeg * Math.PI / 180;
      const px = Math.cos(angleRad) * radius;
      const py = -Math.sin(angleRad) * radius; // flip Y for screen coords

      // Back rotation: chair-back path defaults to opening downward (positive Y in SVG).
      // Inward facing: opening should point toward arc center → rotate so opening = -angleDeg + 90
      // Outward facing: opening points away from center → rotate by -angleDeg - 90
      // (negation accounts for SVG Y-down vs math Y-up)
      const backRotation = facing === 'outward' ? -angleDeg - 90 : -angleDeg + 90;

      const chairId = `${data ? data.id : 'preview'}-chair-${i}`;
      const chair = data ? this.store.chairStore.chairs.get(chairId) : null;

      chairsArray.push({
        id: chairId,
        transform: `translate(${px}px, ${py}px)`,
        backRotation,
        label: chair ? chair.label : (i + 1).toString(),
        isSelected: chair ? chair.isSelected : false,
        chair: chair,
        index: i
      });
    }

    return chairsArray;
  }

  // Place row label near the arc midpoint, slightly outside the chair ring.
  get labelPosition() {
    const data = this._arcRowData;
    const radius = data ? data.radius : this._radius;
    const startAngle = data ? data.startAngle : this._startAngle;
    const endAngle = data ? data.endAngle : this._endAngle;
    const midDeg = (startAngle + endAngle) / 2;
    const midRad = midDeg * Math.PI / 180;
    const labelDistance = radius + 30;
    return {
      left: `${Math.cos(midRad) * labelDistance}px`,
      top: `${-Math.sin(midRad) * labelDistance}px`
    };
  }

  get isEffectivePreview(): boolean {
    return this._isPreview || (this._arcRowData ? !!this._arcRowData.isPreview : false);
  }

  handleArcClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this._arcRowData && this._arcRowData.id) {
      this.store.selectionStore.selectItem(this._arcRowData);
    }
  }

  onChairClick(event: Event, seat: any): void {
    event.stopPropagation();
    if (this.isEffectivePreview || !seat.chair) return;
    const me = event as MouseEvent;
    this.selectChair(seat.chair, me.clientX, me.clientY);
  }

  onChairMouseDown(event: Event, seat: any): void {
    event.stopPropagation();
    if (this.viewerStore.isViewerMode || this.isEffectivePreview || !seat.chair) return;
    const me = event as MouseEvent;
    this.selectChair(seat.chair, me.clientX, me.clientY);
  }

  onChairHover(_seat: any): void { /* no-op for now */ }

  getSvgPadColors(seat: any): { fill: string; stroke: string } {
    const avail = { fill: '#E8DCC4', stroke: '#C9B999' };
    const selected = { fill: '#B8331C', stroke: '#962513' };
    const sold = { fill: '#C9C2B5', stroke: '#B8B0A2' };
    if (!seat.chair) return avail;
    if (this.viewerStore.isViewerMode) {
      const s = this.viewerStore.getSeatReservationStatus(seat.chair);
      if (s === 'selected-for-reservation') return selected;
      if (s === 'pre-reserved' || s === 'reserved') return sold;
      return avail;
    }
    return seat.isSelected ? selected : avail;
  }

  getSeatTitle(seat: any): string {
    if (!seat.chair) return `Seat ${seat.label}`;
    if (this.viewerStore.isViewerMode) {
      const status = this.viewerStore.getSeatReservationStatus(seat.chair);
      if (status === 'pre-reserved') return `Seat ${seat.label} - Already Reserved`;
      if (status === 'reserved') return `Seat ${seat.label} - Reserved by ${seat.chair.reservedBy || 'Unknown'}`;
      if (status === 'selected-for-reservation') return `Seat ${seat.label} - Selected (Price: $${seat.chair.price})`;
      return `Seat ${seat.label} - Available (Price: $${seat.chair.price})`;
    }
    return `Chair ${seat.label} (ID: ${seat.id})`;
  }

  private selectChair(chair: Chair, clickX?: number, clickY?: number): void {
    if (this.viewerStore.isViewerMode) {
      const status = this.viewerStore.getSeatReservationStatus(chair);
      if (status === 'pre-reserved' || status === 'reserved') {
        this.viewerStore.showReservedSeatFeedback();
        return;
      }
      if (this.viewerStore.isSeatSelectedForReservation(chair.id)) {
        this.viewerStore.deselectSeatForReservation(chair.id);
      } else {
        this.viewerStore.selectSeatForReservation(chair.id);
      }
      return;
    }

    if (this.store.chairStore.selectedChairId && this.store.chairStore.selectedChairId !== chair.id) {
      this.store.chairStore.deselectChair();
    }
    if (clickX !== undefined && clickY !== undefined) {
      this.store.chairStore.setPanelPosition(clickX + 20, clickY - 100);
    }
    if (chair.isSelected) {
      this.store.chairStore.deselectChair();
    } else {
      this.store.chairStore.selectChair(chair.id);
    }
  }
}
