// editor-ui.ts — editor chrome components. Port of editor/seat-editor.jsx.
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, computed, input, output, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { Seat, TIERS, TIER_COLORS, Tier, VObj, Venue, seatCountForTier, tierById } from './seat-data';

const DISPLAY_CONTENTS = ':host{display:contents;}';

// ── small controls ───────────────────────────────────────────────────────────
@Component({
  selector: 'ed-stepper', standalone: true, imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-stepper">
      <button (click)="change.emit(Math.max(min(), value() - 1))" [disabled]="value() <= min()"><sms-icon name="Add" [s]="14" [rot]="45"/></button>
      <span class="val">{{ value() }}</span>
      <button (click)="change.emit(Math.min(max(), value() + 1))" [disabled]="value() >= max()"><sms-icon name="Add" [s]="14"/></button>
    </div>`,
})
export class StepperComponent { value = input(1); min = input(1); max = input(99); change = output<number>(); Math = Math; }

@Component({
  selector: 'ed-seg', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-seg">
      @for (o of options(); track o.v) {
        <button [class.on]="value() === o.v" (click)="change.emit(o.v)">{{ o.label }}</button>
      }
    </div>`,
})
export class SegComponent { value = input<string>(''); options = input<{ v: string; label: string }[]>([]); change = output<string>(); }

@Component({
  selector: 'ed-slide', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-slide">
      <input type="range" [min]="min()" [max]="max()" [step]="step()" [value]="value()"
             (input)="change.emit(+$any($event.target).value)"/>
      <span class="num">{{ value() }}{{ unit() }}</span>
    </div>`,
})
export class SlideComponent {
  value = input(0); min = input(0); max = input(100); step = input(1); unit = input(''); change = output<number>();
}

@Component({
  selector: 'ed-tierpick', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="tier-pick">
      @for (t of list(); track t.id) {
        <button [class.on]="value() === t.id" (click)="change.emit(t.id)" [title]="t.name + ' · $' + t.price">
          <i [style.background]="t.color"></i><span>{{ t.name }}</span><b>\${{ t.price }}</b>
        </button>
      }
    </div>`,
})
export class TierPickComponent {
  value = input<string | null>(null); tiers = input<Tier[]>([]); change = output<string>();
  list = computed(() => { const t = this.tiers(); return t && t.length ? t : TIERS; });
}

@Component({
  selector: 'ed-field', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `<div class="ed-field"><label>{{ label() }}</label><ng-content></ng-content></div>`,
})
export class FieldComponent { label = input(''); }

// ── tool rail ──────────────────────────────────────────────────────────────
export interface Tool { id: string; name: string; icon: string; wizard?: boolean; }
export const TOOLS: Tool[] = [
  { id: 'select', name: 'Select', icon: 'Cursor' },
  { id: 'stage', name: 'Stage', icon: 'Stage' },
  { id: 'row', name: 'Row of seats', icon: 'Row', wizard: true },
  { id: 'table', name: 'Table', icon: 'Table' },
  { id: 'zone', name: 'GA zone', icon: 'Zone', wizard: true },
  { id: 'polygon', name: 'Polygon section', icon: 'Polygon' },
  { id: 'label', name: 'Text label', icon: 'Label' },
  { id: 'marker', name: 'Marker', icon: 'Marker' },
];
export const OBJ_ICON: Record<string, string> = { stage: 'Stage', row: 'Row', table: 'Table', zone: 'Zone', polygon: 'Polygon', label: 'Label', marker: 'Marker' };

@Component({
  selector: 'ed-toolrail', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-rail">
      @for (t of TOOLS; track t.id) {
        <button class="ed-tool" [class.on]="active() === t.id" (click)="tool.emit(t)" [title]="t.name"><sms-icon [name]="t.icon" [s]="20"/></button>
      }
    </div>`,
})
export class ToolRailComponent { active = input('select'); tool = output<Tool>(); TOOLS = TOOLS; }

// ── top bar ──────────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-topbar', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-topbar">
      <div class="row gap-1">
        <button class="ed-ic" (click)="undo.emit()" [disabled]="!canUndo()" title="Undo"><sms-icon name="Undo" [s]="17"/></button>
        <button class="ed-ic" (click)="redo.emit()" [disabled]="!canRedo()" title="Redo"><sms-icon name="Redo" [s]="17"/></button>
      </div>
      @if (!isMobile()) { <div class="ed-div"></div> }
      @if (!isMobile()) {
        <button class="ed-flag" [class.on]="showGrid()" (click)="toggleGrid.emit()"><sms-icon name="Grid" [s]="15"/> <span class="mono">{{ gridPx() }}px</span></button>
      }
      @if (!isMobile()) {
        <button class="ed-flag" [class.on]="snap()" (click)="toggleSnap.emit()"><sms-icon name="Magnet" [s]="15"/> <span class="mono">Snap</span></button>
      }
      <div style="flex:1"></div>
      <div class="row gap-1 ed-zoom">
        <button class="ed-ic" (click)="zoom.emit(0.83)" title="Zoom out"><sms-icon name="ZoomOut" [s]="17"/></button>
        <button class="ed-pct mono" (click)="fit.emit()" title="Fit to screen">{{ round(scale() * 100) }}%</button>
        <button class="ed-ic" (click)="zoom.emit(1.2)" title="Zoom in"><sms-icon name="ZoomIn" [s]="17"/></button>
      </div>
      @if (!isMobile()) { <div class="ed-div"></div> }
      @if (!isMobile()) { <span class="mono ed-count">{{ seats() }} seats</span> }
      @if (isMobile()) { <button class="ed-ic" (click)="menu.emit()" title="Objects"><sms-icon name="Layers" [s]="18"/></button> }
    </div>`,
})
export class TopBarComponent {
  venue = input.required<Venue>();
  scale = input(0.8); gridPx = input(25); showGrid = input(true); snap = input(false);
  canUndo = input(false); canRedo = input(false); isMobile = input(false);
  undo = output<void>(); redo = output<void>(); toggleGrid = output<void>(); toggleSnap = output<void>();
  zoom = output<number>(); fit = output<void>(); menu = output<void>();
  round = Math.round;
  seats = computed(() => this.venue().objects.reduce((n, o) => n + (o.type === 'row' ? (o.seats as Seat[]).length : 0), 0));
}

// ── objects panel ────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-objects', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="obj-list">
      <div class="panel-head"><span>Objects</span><b class="mono">{{ venue().objects.length }}</b></div>
      <div class="obj-scroll">
        @for (o of venue().objects; track o.id) {
          <button class="obj-row" [class.on]="selection().has(o.id)" (click)="select.emit({ ids: [o.id], additive: $event.shiftKey })">
            <span class="obj-ic"><sms-icon [name]="iconFor(o)" [s]="16"/></span>
            <span class="obj-name">{{ nameFor(o) }}</span>
            <span class="obj-sub mono">{{ subFor(o) }}</span>
          </button>
        }
      </div>
    </div>`,
})
export class ObjectsPanelComponent {
  venue = input.required<Venue>(); selection = input<Set<string>>(new Set());
  select = output<{ ids: string[]; additive: boolean }>();
  iconFor(o: VObj) { return OBJ_ICON[o.type] || 'Marker'; }
  nameFor(o: VObj) { return o.label || o.text || (o.type[0].toUpperCase() + o.type.slice(1)); }
  subFor(o: VObj) {
    if (o.type === 'row') return `${(o.seats as Seat[]).length} seats`;
    if (o.type === 'table') return `${o.seats as number} seats`;
    if (o.type === 'zone' || o.type === 'polygon') return `cap ${o.capacity}`;
    return o.type;
  }
}

// ── tier manager ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-tiers', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="tier-mgr">
      <div class="panel-head"><span>Price tiers</span><b class="mono">{{ venue().tiers.length }}</b></div>
      <div class="tier-mgr-scroll">
        @for (t of venue().tiers; track t.id) {
          <div class="tier-card">
            <div class="tier-card-top">
              <button class="tier-swatch" [style.background]="t.color" (click)="toggleSwatch(t.id)" title="Change color"></button>
              <input class="tier-name" [value]="t.name" (input)="patch.emit({ id: t.id, p: { name: $any($event.target).value } })"/>
              <button class="tier-del" (click)="del.emit(t.id)" [disabled]="venue().tiers.length <= 1" title="Delete tier"><sms-icon name="Trash" [s]="15"/></button>
            </div>
            @if (swatchFor() === t.id) {
              <div class="tier-swatches">
                @for (c of TIER_COLORS; track c) {
                  <button class="tsw" [class.on]="t.color === c" [style.background]="c" (click)="pickColor(t.id, c)"></button>
                }
              </div>
            }
            <div class="tier-card-bot">
              <div class="tier-price">
                <span>$</span>
                <input type="number" [min]="0" [value]="t.price" (input)="patch.emit({ id: t.id, p: { price: clampPrice($any($event.target).value) } })"/>
              </div>
              <span class="tier-count mono">{{ count(t.id) }} seats</span>
            </div>
          </div>
        }
      </div>
      <div class="tier-mgr-foot"><button class="ed-btn primary" (click)="add.emit()"><sms-icon name="Add" [s]="15"/> Add tier</button></div>
    </div>`,
})
export class TierManagerComponent {
  venue = input.required<Venue>();
  add = output<void>(); patch = output<{ id: string; p: Partial<Tier> }>(); del = output<string>();
  TIER_COLORS = TIER_COLORS;
  swatchFor = signal<string | null>(null);
  toggleSwatch(id: string) { this.swatchFor.update((s) => (s === id ? null : id)); }
  pickColor(id: string, c: string) { this.patch.emit({ id, p: { color: c } }); this.swatchFor.set(null); }
  clampPrice(v: string) { return Math.max(0, Number(v) || 0); }
  count(id: string) { return seatCountForTier(this.venue(), id).toLocaleString(); }
}

// ── inspector ────────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-inspector', standalone: true,
  imports: [IconComponent, FieldComponent, TierPickComponent, StepperComponent, SlideComponent, SegComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    @if (sel().size === 0) {
      <div class="insp-empty">
        <span class="insp-ic"><sms-icon name="Cursor" [s]="22"/></span>
        <b>No element selected</b>
        <p>Tap an object on the canvas — or a tool on the left — to edit its properties.</p>
      </div>
    } @else if (sel().size > 1) {
      <div class="insp">
        <div class="insp-head"><b>{{ sel().size }} selected</b></div>
        <p class="insp-note">Move them together by dragging on the canvas, or apply a tier to every seat row in the selection.</p>
        <ed-field label="Apply tier to rows">
          <ed-tierpick [value]="null" [tiers]="venue().tiers" (change)="applyTier($event)"/>
        </ed-field>
        <div class="insp-actions">
          <button class="ed-btn ghost" (click)="dup.emit()"><sms-icon name="Copy" [s]="15"/> Duplicate</button>
          <button class="ed-btn danger" (click)="del.emit()"><sms-icon name="Trash" [s]="15"/> Delete</button>
        </div>
      </div>
    } @else {
      @if (obj(); as o) {
      <div class="insp">
        <div class="insp-head">
          <span class="obj-ic"><sms-icon [name]="iconFor(o)" [s]="16"/></span>
          <b>{{ o.label || o.text || o.type }}</b>
          <span class="insp-type mono">{{ o.type }}</span>
        </div>

        @if (hasLabel(o)) {
          <ed-field label="Label"><input class="ed-input" [value]="o.label || ''" (input)="P(o, { label: $any($event.target).value })"/></ed-field>
        }
        @if (o.type === 'label') {
          <ed-field label="Text"><input class="ed-input" [value]="o.text || ''" (input)="P(o, { text: $any($event.target).value })"/></ed-field>
          <ed-field label="Size"><ed-slide [value]="o.size || 18" [min]="11" [max]="42" unit="px" (change)="P(o, { size: $event })"/></ed-field>
        }

        @switch (o.type) {
          @case ('row') {
            <ed-field label="Tier"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field [label]="'Seats · ' + seatLen(o)">
              <ed-stepper [value]="seatLen(o)" [min]="1" [max]="40" (change)="setRowSeats(o, $event)"/>
            </ed-field>
            <ed-field label="Seat spacing"><ed-slide [value]="o.seatGap || 30" [min]="22" [max]="48" unit="px" (change)="P(o, { seatGap: $event })"/></ed-field>
            <ed-field label="Curve"><ed-slide [value]="o.arc || 0" [min]="0" [max]="60" unit="°" (change)="P(o, { arc: $event })"/></ed-field>
          }
          @case ('stage') {
            <ed-field label="Shape"><ed-seg [value]="o.shape!" [options]="shapeStage" (change)="P(o, { shape: $any($event) })"/></ed-field>
            <ed-field label="Width"><ed-slide [value]="o.w!" [min]="160" [max]="800" [step]="10" (change)="P(o, { w: $event })"/></ed-field>
            <ed-field label="Depth"><ed-slide [value]="o.h!" [min]="40" [max]="180" [step]="2" (change)="P(o, { h: $event })"/></ed-field>
          }
          @case ('table') {
            <ed-field label="Shape"><ed-seg [value]="o.shape!" [options]="shapeTable" (change)="P(o, { shape: $any($event) })"/></ed-field>
            <ed-field label="Tier"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field [label]="'Seats · ' + (o.seats || 0)"><ed-stepper [value]="$any(o.seats)" [min]="2" [max]="14" (change)="P(o, { seats: $event })"/></ed-field>
            @if (o.shape === 'round') {
              <ed-field label="Size"><ed-slide [value]="o.r!" [min]="20" [max]="48" (change)="P(o, { r: $event })"/></ed-field>
            } @else {
              <ed-field label="Length"><ed-slide [value]="o.w || 120" [min]="70" [max]="220" [step]="5" (change)="P(o, { w: $event })"/></ed-field>
              <ed-field label="Width"><ed-slide [value]="o.h || 50" [min]="36" [max]="90" [step]="2" (change)="P(o, { h: $event })"/></ed-field>
            }
          }
          @case ('zone') {
            <ed-field label="Tier"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field label="Capacity"><ed-slide [value]="o.capacity!" [min]="50" [max]="3000" [step]="50" (change)="P(o, { capacity: $event })"/></ed-field>
            <ed-field label="Width"><ed-slide [value]="o.w!" [min]="120" [max]="800" [step]="10" (change)="P(o, { w: $event })"/></ed-field>
            <ed-field label="Height"><ed-slide [value]="o.h!" [min]="80" [max]="400" [step]="10" (change)="P(o, { h: $event })"/></ed-field>
          }
          @case ('polygon') {
            <ed-field label="Tier"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field label="Capacity"><ed-slide [value]="o.capacity!" [min]="50" [max]="3000" [step]="50" (change)="P(o, { capacity: $event })"/></ed-field>
            <p class="insp-note">{{ o.points!.length }} vertices · drag the shape on the canvas to reposition it.</p>
          }
          @case ('marker') {
            <ed-field label="Kind"><ed-seg [value]="o.kind!" [options]="markerKinds" (change)="P(o, { kind: $event })"/></ed-field>
          }
        }

        <div class="insp-actions">
          <button class="ed-btn ghost" (click)="dup.emit()"><sms-icon name="Copy" [s]="15"/> Duplicate</button>
          <button class="ed-btn danger" (click)="del.emit()"><sms-icon name="Trash" [s]="15"/> Delete</button>
        </div>
      </div>
      }
    }`,
})
export class InspectorComponent {
  sel = input<Set<string>>(new Set());
  venue = input.required<Venue>();
  patch = output<{ id: string; p: Partial<VObj> }>(); del = output<void>(); dup = output<void>();

  shapeStage = [{ v: 'arc', label: 'Arc' }, { v: 'rect', label: 'Rect' }];
  shapeTable = [{ v: 'round', label: 'Round' }, { v: 'rect', label: 'Long' }];
  markerKinds = [{ v: 'entrance', label: 'Entry' }, { v: 'exit', label: 'Exit' }, { v: 'bar', label: 'Bar' }];

  obj = computed<VObj | undefined>(() => {
    const s = this.sel(); if (s.size !== 1) return undefined;
    const id = [...s][0];
    return this.venue().objects.find((q) => q.id === id);
  });

  iconFor(o: VObj) { return OBJ_ICON[o.type] || 'Marker'; }
  hasLabel(o: VObj) { return ['row', 'stage', 'zone', 'table', 'marker', 'polygon'].includes(o.type); }
  seatLen(o: VObj) { return (o.seats as Seat[]).length; }

  P(o: VObj, p: Partial<VObj>) { this.patch.emit({ id: o.id, p }); }
  setRowSeats(o: VObj, n: number) {
    const seats = (o.seats as Seat[]).slice(0, n);
    while (seats.length < n) seats.push({ n: (seats.at(-1)?.n ?? 100) + 1, status: 'available' });
    this.patch.emit({ id: o.id, p: { seats } });
  }
  applyTier(tier: string) {
    const v = this.venue();
    [...this.sel()].forEach((id) => {
      const o = v.objects.find((q) => q.id === id);
      if (o && (o.type === 'row' || o.type === 'zone' || o.type === 'table' || o.type === 'polygon')) this.patch.emit({ id, p: { tier } });
    });
  }
}

// ── wizard ────────────────────────────────────────────────────────────────────
export interface RowWizardCfg { n: number; count: number; gap: number; arc: number; tier: string; }
export interface ZoneWizardCfg { tier: string; cap: number; }

@Component({
  selector: 'ed-wizard', standalone: true,
  imports: [IconComponent, FieldComponent, TierPickComponent, StepperComponent, SlideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="wiz-back" (click)="close.emit()">
      <div class="wiz" (click)="$event.stopPropagation()">
        <div class="wiz-head">
          <span class="wiz-ic"><sms-icon name="Wand" [s]="18"/></span>
          <b>{{ isRow ? 'Add rows of seats' : 'Add a GA zone' }}</b>
          <button class="ed-ic" (click)="close.emit()"><sms-icon name="Add" [s]="18" [rot]="45"/></button>
        </div>
        <div class="wiz-body">
          @if (isRow) {
            <ed-field [label]="'Number of rows · ' + n()"><ed-stepper [value]="n()" [min]="1" [max]="12" (change)="n.set($event)"/></ed-field>
            <ed-field [label]="'Seats per row · ' + count()"><ed-stepper [value]="count()" [min]="2" [max]="36" (change)="count.set($event)"/></ed-field>
            <ed-field label="Seat spacing"><ed-slide [value]="gap()" [min]="22" [max]="48" unit="px" (change)="gap.set($event)"/></ed-field>
            <ed-field label="Curve"><ed-slide [value]="arc()" [min]="0" [max]="60" unit="°" (change)="arc.set($event)"/></ed-field>
            <ed-field label="Tier"><ed-tierpick [value]="tier()" [tiers]="tlist()" (change)="tier.set($event)"/></ed-field>
            <div class="wiz-preview mono">{{ n() }} row{{ n() > 1 ? 's' : '' }} · {{ n() * count() }} seats · {{ tierName() }}</div>
          } @else {
            <ed-field label="Tier"><ed-tierpick [value]="tier()" [tiers]="tlist()" (change)="tier.set($event)"/></ed-field>
            <ed-field [label]="'Capacity · ' + cap()"><ed-slide [value]="cap()" [min]="50" [max]="3000" [step]="50" (change)="cap.set($event)"/></ed-field>
            <div class="wiz-preview mono">Standing zone · holds {{ cap() }}</div>
          }
        </div>
        <div class="wiz-foot">
          <button class="ed-btn ghost" (click)="close.emit()">Cancel</button>
          <button class="ed-btn primary" (click)="emitCreate()"><sms-icon name="Check" [s]="15"/> Add to canvas</button>
        </div>
      </div>
    </div>`,
})
export class WizardComponent {
  @Input({ required: true }) type!: 'row' | 'zone';
  @Input({ required: true }) set tiers(v: Tier[]) { this._tiers.set(v); }
  private _tiers = signal<Tier[]>([]);
  close = output<void>(); create = output<RowWizardCfg | ZoneWizardCfg>();

  tlist = computed(() => { const t = this._tiers(); return t && t.length ? t : TIERS; });
  get isRow() { return this.type === 'row'; }

  n = signal(3); count = signal(12); gap = signal(30); arc = signal(22); cap = signal(400);
  tier = signal('standard');
  private inited = false;

  ngOnInit() {
    this.n.set(this.isRow ? 3 : 1);
    this.arc.set(this.isRow ? 22 : 0);
    const tl = this.tlist();
    this.tier.set((tl[Math.min(2, tl.length - 1)] || tl[0]).id);
    this.inited = true;
  }
  tierName() { return tierById(this.tlist(), this.tier()).name; }
  emitCreate() {
    this.create.emit(this.isRow
      ? { n: this.n(), count: this.count(), gap: this.gap(), arc: this.arc(), tier: this.tier() }
      : { tier: this.tier(), cap: this.cap() });
  }
}

// ── draw HUD ──────────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-drawhud', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="draw-hud">
      <span class="draw-hud-info"><sms-icon name="Polygon" [s]="15"/> {{ info() }}</span>
      <button class="draw-hud-btn ghost" (click)="cancel.emit()">Cancel</button>
      <button class="draw-hud-btn primary" (click)="finish.emit()" [disabled]="count() < 3"><sms-icon name="Check" [s]="14"/> Finish</button>
    </div>`,
})
export class DrawHudComponent {
  count = input(0); finish = output<void>(); cancel = output<void>();
  info() {
    const c = this.count();
    if (c === 0) return 'Click to drop the first point';
    if (c >= 3) return `${c} points · click the first point to close`;
    return `${c} point${c > 1 ? 's' : ''} · need ${3 - c} more`;
  }
}
