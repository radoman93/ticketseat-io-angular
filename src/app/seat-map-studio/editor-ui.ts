// editor-ui.ts — editor chrome components. Port of editor/seat-editor.jsx.
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, computed, input, output, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { Seat, TIERS, TIER_COLORS, Tier, VObj, Venue, seatCountForTier, tableSeats, tierById } from './seat-data';

const DISPLAY_CONTENTS = ':host{display:contents;}';
// Panel hosts must be real flex columns (not display:contents) so their inner
// scroll region is height-constrained by the sidebar — display:contents children
// don't get flex-sized reliably in Chromium.
const PANEL_HOST = ':host{display:flex;flex-direction:column;min-height:0;flex:1 1 0;overflow:hidden;}';

// ── small controls ───────────────────────────────────────────────────────────
@Component({
  selector: 'ed-stepper', standalone: true, imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="ed-stepper">
      <button (click)="change.emit(Math.max(min(), value() - 1))" [disabled]="value() <= min()"><sms-icon name="Minus" [s]="14"/></button>
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
             (input)="valueChange.emit(+$any($event.target).value)"/>
      <span class="num">{{ value() }}{{ unit() }}</span>
    </div>`,
})
export class SlideComponent {
  // Output is NOT named "change": the range input fires a native "change" DOM event
  // that bubbles and was being caught by the parent's (change) binding, overwriting
  // the value with the Event object ("[object Event]").
  value = input(0); min = input(0); max = input(100); step = input(1); unit = input(''); valueChange = output<number>();
}

@Component({
  selector: 'ed-tierpick', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="tier-pick">
      @for (t of list(); track t.id) {
        <button [class.on]="value() === t.id" (click)="change.emit(t.id)" [title]="t.name + ' · ' + currency() + t.price">
          <i [style.background]="t.color"></i><span>{{ t.name }}</span><b>{{ currency() }}{{ t.price }}</b>
        </button>
      }
    </div>`,
})
export class TierPickComponent {
  value = input<string | null>(null); tiers = input<Tier[]>([]); change = output<string>();
  currency = input<string>('$');
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
  { id: 'segrow', name: 'Segmented row', icon: 'Segrow' },
  { id: 'table', name: 'Round table', icon: 'Table' },
  { id: 'table-long', name: 'Long table', icon: 'TableLong' },
  { id: 'zone', name: 'GA zone', icon: 'Zone', wizard: true },
  { id: 'polygon', name: 'Polygon section', icon: 'Polygon' },
  { id: 'line', name: 'Line', icon: 'Line' },
  { id: 'label', name: 'Text label', icon: 'Label' },
  { id: 'marker', name: 'Marker', icon: 'Marker' },
];
export const OBJ_ICON: Record<string, string> = { stage: 'Stage', row: 'Row', table: 'Table', zone: 'Zone', polygon: 'Polygon', label: 'Label', marker: 'Marker', line: 'Line' };

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
        <button class="ed-flag" [class.on]="showGrid()" (click)="cycleGrid.emit()" title="Grid size"><sms-icon name="Grid" [s]="15"/> <span class="mono">{{ showGrid() ? gridPx() + 'px' : 'Off' }}</span></button>
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
      <button class="ed-ic" (click)="help.emit()" title="Help & shortcuts"><sms-icon name="Help" [s]="18"/></button>
    </div>`,
})
export class TopBarComponent {
  venue = input.required<Venue>();
  scale = input(0.8); gridPx = input(25); showGrid = input(true); snap = input(false);
  canUndo = input(false); canRedo = input(false); isMobile = input(false);
  undo = output<void>(); redo = output<void>(); toggleGrid = output<void>(); toggleSnap = output<void>();
  cycleGrid = output<void>();
  zoom = output<number>(); fit = output<void>(); menu = output<void>(); help = output<void>();
  round = Math.round;
  seats = computed(() => this.venue().objects.reduce((n, o) =>
    n + (o.type === 'row' ? (o.seats as Seat[]).length : o.type === 'table' ? tableSeats(o) : 0), 0));
}

// ── objects panel ────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-objects', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [PANEL_HOST],
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
    if (o.type === 'table') return `${tableSeats(o)} seats`;
    if (o.type === 'zone' || o.type === 'polygon') return o.capacity ? `cap ${o.capacity}` : 'no limit';
    if (o.type === 'line') return `${o.path?.length || 0} points`;
    return o.type;
  }
}

// ── tier manager ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ed-tiers', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [PANEL_HOST],
  template: `
    <div class="tier-mgr">
      <div class="panel-head"><span>Pricing</span><b class="mono">{{ venue().tiers.length }}</b></div>
      <div class="tier-mgr-scroll">
        @for (t of venue().tiers; track t.id) {
          <div class="tier-card">
            <div class="tier-card-top">
              <button class="tier-swatch" [style.background]="t.color" (click)="toggleSwatch(t.id)" title="Change color"></button>
              <input class="tier-name" [value]="t.name" (input)="patch.emit({ id: t.id, p: { name: $any($event.target).value } })"/>
              <button class="tier-del" (click)="del.emit(t.id)" [disabled]="venue().tiers.length <= 1" title="Delete price"><sms-icon name="Trash" [s]="15"/></button>
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
                <span>{{ currency() }}</span>
                <input type="number" [min]="0" [value]="t.price" (input)="patch.emit({ id: t.id, p: { price: clampPrice($any($event.target).value) } })"/>
              </div>
              <span class="tier-count mono">{{ count(t.id) }} seats</span>
            </div>
          </div>
        }
      </div>
      <div class="tier-mgr-foot"><button class="ed-btn primary" (click)="add.emit()"><sms-icon name="Add" [s]="15"/> Add price</button></div>
    </div>`,
})
export class TierManagerComponent {
  venue = input.required<Venue>();
  add = output<void>(); patch = output<{ id: string; p: Partial<Tier> }>(); del = output<string>();
  currency = input<string>('$');
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
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [PANEL_HOST],
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
        <p class="insp-note">Move them together by dragging on the canvas, or apply a price to every seat row in the selection.</p>
        <ed-field label="Apply price to rows">
          <ed-tierpick [value]="null" [tiers]="venue().tiers" [currency]="currency()" (change)="applyTier($event)"/>
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
          <ed-field label="Size"><ed-slide [value]="o.size || 18" [min]="11" [max]="42" unit="px" (valueChange)="P(o, { size: $event })"/></ed-field>
          <ed-field label="Color">
            <div class="ed-color">
              <input type="color" class="ed-color-swatch" [value]="o.color || '#111827'"
                     (input)="P(o, { color: $any($event.target).value })"/>
              @for (c of LABEL_COLORS; track c) {
                <button class="ed-color-dot" [class.on]="(o.color || '').toLowerCase() === c" [style.background]="c"
                        (click)="P(o, { color: c })" [title]="c"></button>
              }
              <button class="ed-color-auto" [class.on]="!o.color" (click)="P(o, { color: undefined })"
                      title="Use theme colour">Auto</button>
            </div>
          </ed-field>
        }

        @switch (o.type) {
          @case ('row') {
            <ed-field label="Price"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" [currency]="currency()" (change)="P(o, { tier: $event })"/></ed-field>
            @if (o.path) {
              <ed-field label="Seat spacing"><ed-slide [value]="o.seatGap || 30" [min]="22" [max]="48" unit="px" (valueChange)="P(o, { seatGap: $event })"/></ed-field>
              <ed-field label="Chair facing"><ed-seg [value]="o.faceAlong ? 'along' : 'front'" [options]="rowFacing" (change)="P(o, { faceAlong: $event === 'along' })"/></ed-field>
              <p class="insp-note">{{ seatLen(o) }} seats · {{ o.path!.length }} points{{ o.closed ? ' · ring' : '' }} · drag to reposition.</p>
            } @else {
              <ed-field [label]="'Seats · ' + seatLen(o)"><ed-stepper [value]="seatLen(o)" [min]="1" [max]="60" (change)="setRowSeats(o, $event)"/></ed-field>
              <ed-field label="Seat spacing"><ed-slide [value]="o.seatGap || 30" [min]="22" [max]="48" unit="px" (valueChange)="P(o, { seatGap: $event })"/></ed-field>
              <ed-field label="Curve"><ed-slide [value]="o.arc || 0" [min]="0" [max]="60" unit="°" (valueChange)="P(o, { arc: $event })"/></ed-field>
            }
          }
          @case ('stage') {
            <ed-field label="Shape"><ed-seg [value]="o.shape!" [options]="shapeStage" (change)="P(o, { shape: $any($event) })"/></ed-field>
            <ed-field label="Width"><ed-slide [value]="o.w!" [min]="160" [max]="800" [step]="10" (valueChange)="P(o, { w: $event })"/></ed-field>
            <ed-field label="Depth"><ed-slide [value]="o.h!" [min]="40" [max]="180" [step]="2" (valueChange)="P(o, { h: $event })"/></ed-field>
          }
          @case ('table') {
            <ed-field label="Shape"><ed-seg [value]="o.shape!" [options]="shapeTable" (change)="P(o, { shape: $any($event) })"/></ed-field>
            <ed-field label="Price"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" [currency]="currency()" (change)="P(o, { tier: $event })"/></ed-field>
            @if (o.shape === 'round') {
              <ed-field [label]="'Seats · ' + (o.seats || 0)"><ed-stepper [value]="$any(o.seats)" [min]="2" [max]="14" (change)="P(o, { seats: $event })"/></ed-field>
              <ed-field label="Open spaces"><ed-stepper [value]="o.openSpaces || 0" [min]="0" [max]="($any(o.seats) || 8) - 1" (change)="P(o, { openSpaces: $event })"/></ed-field>
              <ed-field label="Size"><ed-slide [value]="o.r!" [min]="20" [max]="48" (valueChange)="P(o, { r: $event })"/></ed-field>
            } @else {
              <ed-field label="Top"><ed-stepper [value]="o.up || 0" [min]="0" [max]="12" (change)="P(o, { up: $event })"/></ed-field>
              <ed-field label="Bottom"><ed-stepper [value]="o.down || 0" [min]="0" [max]="12" (change)="P(o, { down: $event })"/></ed-field>
              <ed-field label="Left"><ed-stepper [value]="o.left || 0" [min]="0" [max]="12" (change)="P(o, { left: $event })"/></ed-field>
              <ed-field label="Right"><ed-stepper [value]="o.right || 0" [min]="0" [max]="12" (change)="P(o, { right: $event })"/></ed-field>
              <ed-field label="Length"><ed-slide [value]="o.w || 120" [min]="70" [max]="220" [step]="5" (valueChange)="P(o, { w: $event })"/></ed-field>
              <ed-field label="Width"><ed-slide [value]="o.h || 50" [min]="36" [max]="90" [step]="2" (valueChange)="P(o, { h: $event })"/></ed-field>
            }
          }
          @case ('zone') {
            <ed-field label="Price"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" [currency]="currency()" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field label="Capacity (0 = no limit)"><input type="number" class="ed-input" min="0" max="100000" [value]="o.capacity ?? 0" (change)="P(o, { capacity: clampCap($any($event.target).value) })"/></ed-field>
            <ed-field label="Width"><ed-slide [value]="o.w!" [min]="120" [max]="800" [step]="10" (valueChange)="P(o, { w: $event })"/></ed-field>
            <ed-field label="Height"><ed-slide [value]="o.h!" [min]="80" [max]="400" [step]="10" (valueChange)="P(o, { h: $event })"/></ed-field>
          }
          @case ('polygon') {
            <ed-field label="Price"><ed-tierpick [value]="o.tier!" [tiers]="venue().tiers" [currency]="currency()" (change)="P(o, { tier: $event })"/></ed-field>
            <ed-field label="Capacity (0 = no limit)"><input type="number" class="ed-input" min="0" max="100000" [value]="o.capacity ?? 0" (change)="P(o, { capacity: clampCap($any($event.target).value) })"/></ed-field>
            <p class="insp-note">{{ o.points!.length }} vertices · drag the shape on the canvas to reposition it.</p>
          }
          @case ('marker') {
            <ed-field label="Kind"><ed-seg [value]="o.kind!" [options]="markerKinds" (change)="P(o, { kind: $event })"/></ed-field>
          }
          @case ('line') {
            <ed-field label="Color">
              <div class="ed-color">
                <input type="color" class="ed-color-swatch" [value]="o.color || '#94a3b8'"
                       (input)="P(o, { color: $any($event.target).value })"/>
                @for (c of LINE_COLORS; track c) {
                  <button class="ed-color-dot" [class.on]="(o.color || '').toLowerCase() === c" [style.background]="c"
                          (click)="P(o, { color: c })" [title]="c"></button>
                }
              </div>
            </ed-field>
            <ed-field label="Thickness"><ed-slide [value]="o.thickness || 2" [min]="1" [max]="12" unit="px" (valueChange)="P(o, { thickness: $event })"/></ed-field>
            <p class="insp-note">{{ o.path!.length }} points · drag the line on the canvas to reposition it.</p>
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
  currency = input<string>('$');

  shapeStage =[{ v: 'arc', label: 'Arc' }, { v: 'rect', label: 'Rect' }];
  shapeTable = [{ v: 'round', label: 'Round' }, { v: 'rect', label: 'Long' }];
  markerKinds = [{ v: 'entrance', label: 'Entry' }, { v: 'exit', label: 'Exit' }, { v: 'bar', label: 'Bar' }];
  rowFacing = [{ v: 'front', label: 'Face front' }, { v: 'along', label: 'Follow line' }];
  // Quick-pick swatches for label text colour (lowercase — compared against o.color).
  LABEL_COLORS = ['#111827', '#ffffff', '#6668ee', '#0c9d6e', '#d83a3a', '#b9750a'];
  LINE_COLORS = ['#94a3b8', '#111827', '#6668ee', '#0c9d6e', '#d83a3a', '#b9750a'];

  obj = computed<VObj | undefined>(() => {
    const s = this.sel(); if (s.size !== 1) return undefined;
    const id = [...s][0];
    return this.venue().objects.find((q) => q.id === id);
  });

  iconFor(o: VObj) { return OBJ_ICON[o.type] || 'Marker'; }
  hasLabel(o: VObj) { return ['row', 'stage', 'zone', 'table', 'marker', 'polygon'].includes(o.type); }
  seatLen(o: VObj) { return (o.seats as Seat[]).length; }

  P(o: VObj, p: Partial<VObj>) { this.patch.emit({ id: o.id, p }); }
  /** Custom GA capacity: 0 (no limit) up to 100,000. */
  clampCap(v: string) { return Math.max(0, Math.min(100000, Math.round(Number(v) || 0))); }
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
            <ed-field label="Seat spacing"><ed-slide [value]="gap()" [min]="22" [max]="48" unit="px" (valueChange)="gap.set($event)"/></ed-field>
            <ed-field label="Curve"><ed-slide [value]="arc()" [min]="0" [max]="60" unit="°" (valueChange)="arc.set($event)"/></ed-field>
            <ed-field label="Price"><ed-tierpick [value]="tier()" [tiers]="tlist()" [currency]="currency()" (change)="tier.set($event)"/></ed-field>
            <div class="wiz-preview mono">{{ n() }} row{{ n() > 1 ? 's' : '' }} · {{ n() * count() }} seats · {{ tierName() }}</div>
          } @else {
            <ed-field label="Price"><ed-tierpick [value]="tier()" [tiers]="tlist()" [currency]="currency()" (change)="tier.set($event)"/></ed-field>
            <ed-field [label]="'Capacity · ' + cap()"><ed-slide [value]="cap()" [min]="50" [max]="3000" [step]="50" (valueChange)="cap.set($event)"/></ed-field>
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
  currency = input<string>('$');
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
      <span class="draw-hud-info"><sms-icon [name]="hudIcon()" [s]="15"/> {{ info() }}</span>
      @if (kind() === 'segrow' && seats() > 0) {
        <span class="mono" style="font-weight:700;color:var(--brand);white-space:nowrap">{{ seats() }} seats</span>
      }
      <button class="draw-hud-btn ghost" (click)="cancel.emit()">Cancel</button>
      <button class="draw-hud-btn primary" (click)="finish.emit()" [disabled]="count() < min()"><sms-icon name="Check" [s]="14"/> Finish</button>
    </div>`,
})
export class DrawHudComponent {
  count = input(0); kind = input<'polygon' | 'segrow' | 'line'>('polygon'); seats = input(0);
  finish = output<void>(); cancel = output<void>();
  min = computed(() => (this.kind() === 'polygon' ? 3 : 2));
  hudIcon() { return this.kind() === 'segrow' ? 'Segrow' : this.kind() === 'line' ? 'Line' : 'Polygon'; }
  info() {
    const c = this.count(), k = this.kind();
    if (c === 0) return k === 'segrow' ? 'Click to start the row, then click each bend'
      : k === 'line' ? 'Click to start the line, then click each point' : 'Click to drop the first point';
    if (k === 'segrow' && c >= 3) return `${c} points · click the first seat to make a ring, or press Enter to finish`;
    if (c >= this.min()) return k === 'polygon' ? `${c} points · click the first point to close`
      : k === 'segrow' ? `${c} points · add a bend, or press Enter to finish` : `${c} points · add a point, or press Enter to finish`;
    return `${c} point${c > 1 ? 's' : ''} · need ${this.min() - c} more`;
  }
}

// ── help / quick-start ─────────────────────────────────────────────────────────
@Component({
  selector: 'ed-help', standalone: true, imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="sms-help-back" (click)="close.emit()">
      <div class="sms-help" role="dialog" aria-label="Quick start and shortcuts" (click)="$event.stopPropagation()">
        <div class="help-head">
          <b>Quick start</b>
          <button class="ed-ic" (click)="close.emit()" title="Close"><sms-icon name="Add" [s]="18" [rot]="45"/></button>
        </div>
        <ol class="help-steps">
          <li><span class="help-num">1</span><div><b>Place</b><p>Pick a tool on the left, then click the canvas to drop seats, tables, or a stage.</p></div></li>
          <li><span class="help-num">2</span><div><b>Arrange</b><p>Drag anything to move it. Select it to resize, rename, or bend it in the panel on the right.</p></div></li>
          <li><span class="help-num">3</span><div><b>Set pricing</b><p>Open the Pricing tab to name your price levels, then give each section a price.</p></div></li>
        </ol>
        <div class="help-keys">
          <div class="help-keys-title">Keys &amp; gestures</div>
          <div class="help-keys-grid">
            <span><span class="kbd">Del</span> Remove selected</span>
            <span><span class="kbd">Shift</span>+drag &middot; Select many</span>
            <span><span class="kbd">Ctrl</span><span class="kbd">Z</span> Undo</span>
            <span>Drag canvas &middot; Pan</span>
            <span><span class="kbd">Enter</span> Finish a shape</span>
            <span>Scroll &middot; Zoom</span>
            <span><span class="kbd">Esc</span> Cancel</span>
          </div>
        </div>
      </div>
    </div>`,
})
export class HelpComponent { close = output<void>(); }
