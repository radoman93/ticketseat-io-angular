// seat-map-studio.component.ts — App shell, state, history, responsive chrome.
// Port of editor/seat-app.jsx (the tweaks-panel scaffold is intentionally omitted;
// its defaults are hardcoded: canvasStyle=skeuomorphic, canvasTheme=light,
// inspector=right, mobilePattern=sheet, viewerUX=direct, appTheme=light).
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation,
  computed, effect, input, output, signal, viewChild,
} from '@angular/core';
import { IconComponent } from './icon.component';
import { SeatCanvasComponent } from './seat-canvas.component';
import {
  Pt, Seat, Tier, VObj, Venue, VENUES, VENUE_META, makeRow, makeTier, tierById, uid, venueBounds,
} from './seat-data';
import {
  DrawHudComponent, InspectorComponent, ObjectsPanelComponent, TOOLS, Tool, ToolRailComponent,
  TopBarComponent, TierManagerComponent, WizardComponent, RowWizardCfg, ZoneWizardCfg,
} from './editor-ui';
import {
  OrderLine, OrderPanelComponent, TierLegendComponent, ViewerBarComponent, tierStats,
} from './viewer-ui';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

@Component({
  selector: 'app-seat-map-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sms', '[attr.data-theme]': 'appTheme()', '[class.sms--embedded]': 'embedded()' },
  imports: [
    NgTemplateOutlet, IconComponent, SeatCanvasComponent,
    ToolRailComponent, TopBarComponent, ObjectsPanelComponent, TierManagerComponent,
    InspectorComponent, WizardComponent, DrawHudComponent,
    TierLegendComponent, OrderPanelComponent, ViewerBarComponent,
  ],
  styleUrl: './seat-map-studio.component.css',
  template: `
    <!-- ── header ── -->
    <header class="st-header">
      <div class="st-brand">
        <sms-icon name="Logo" [s]="isMobile() ? 26 : 30"/>
        @if (!isMobile()) { <span class="st-logo">Seat Map Studio</span> }
      </div>
      @if (showVenueSwitcher()) {
      <div class="st-venue">
        <button class="venue-btn" (click)="venueMenu.set(!venueMenu())">
          <span class="venue-name">{{ venue().name }}</span>
          <sms-icon name="Add" [s]="14" [animate]="true" [rot]="venueMenu() ? 45 : 0"/>
        </button>
        @if (venueMenu()) {
          <div class="venue-menu" (mouseleave)="venueMenu.set(false)">
            @for (v of VENUE_META; track v.id) {
              <button class="venue-item" [class.on]="venueKey() === v.id" (click)="loadVenue(v.id)">
                <b>{{ v.name }}</b><span>{{ v.sub }}</span>
              </button>
            }
          </div>
        }
      </div>
      }
      <div class="st-right">
        <div class="mode-switch">
          <button [class.on]="mode() === 'editor'" (click)="setMode('editor')"><sms-icon name="Edit" [s]="15"/>@if (!isMobile()) {&nbsp;Editor}</button>
          <button [class.on]="mode() === 'viewer'" (click)="setMode('viewer')"><sms-icon name="Eye" [s]="15"/>@if (!isMobile()) {&nbsp;Viewer}</button>
        </div>
        <button class="st-ic" (click)="toggleTheme()" title="Theme">
          @if (appTheme() === 'light') { <sms-icon name="Moon" [s]="18"/> } @else { <sms-icon name="Sun" [s]="18"/> }
        </button>
      </div>
    </header>

    <!-- ── editor / viewer ── -->
    @if (mode() === 'editor') {
      @if (isMobile()) {
        <div class="ed-main mobile">
          <ed-topbar [venue]="venue()" [scale]="scale()" [gridPx]="gridPx" [showGrid]="showGrid()" [snap]="snap()"
                     [canUndo]="canUndo()" [canRedo]="canRedo()" [isMobile]="true"
                     (undo)="undo()" (redo)="redo()" (zoom)="zoomBy($event)" (fit)="fit()"
                     (menu)="sheet.set(sheet() === 'browser' ? null : 'browser')"/>
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            @if (draw(); as d) { <ed-drawhud [count]="d.points.length" (finish)="commitPolygon()" (cancel)="cancelDraw()"/> }
          </div>
          <div class="ed-addbar">
            @for (t of addTools; track t.id) {
              <button class="add-pill" (click)="addObject(t)"><sms-icon [name]="t.icon" [s]="17"/> {{ t.name.split(' ')[0] }}</button>
            }
          </div>
          @if (selection().size > 0) {
            <div class="sheet-back" (click)="selectObjs([], false)">
              <div class="sheet" (click)="$event.stopPropagation()">
                <div class="sheet-grip"></div>
                <div class="sheet-head"><b>Properties</b><button class="ed-ic" (click)="selectObjs([], false)"><sms-icon name="Add" [s]="18" [rot]="45"/></button></div>
                <div class="sheet-body"><ng-container *ngTemplateOutlet="inspectorTpl"></ng-container></div>
              </div>
            </div>
          }
          @if (sheet() === 'browser') {
            <div class="sheet-back" (click)="sheet.set(null)">
              <div class="sheet" (click)="$event.stopPropagation()">
                <div class="sheet-grip"></div>
                <div class="sheet-head"><b>Layout</b><button class="ed-ic" (click)="sheet.set(null)"><sms-icon name="Add" [s]="18" [rot]="45"/></button></div>
                <div class="sheet-body"><ng-container *ngTemplateOutlet="browserTpl"></ng-container></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="ed-main">
          <ed-topbar [venue]="venue()" [scale]="scale()" [gridPx]="gridPx" [showGrid]="showGrid()" [snap]="snap()"
                     [canUndo]="canUndo()" [canRedo]="canRedo()" [isMobile]="false"
                     (undo)="undo()" (redo)="redo()" (toggleGrid)="toggleGrid()" (toggleSnap)="toggleSnap()"
                     (zoom)="zoomBy($event)" (fit)="fit()"/>
          <div class="ed-cols insp-right">
            <ed-toolrail [active]="activeTool()" (tool)="addObject($event)"/>
            <div class="ed-side left"><ng-container *ngTemplateOutlet="browserTpl"></ng-container></div>
            <div class="canvas-host">
              <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
              @if (draw(); as d) { <ed-drawhud [count]="d.points.length" (finish)="commitPolygon()" (cancel)="cancelDraw()"/> }
            </div>
            <div class="ed-side right"><ng-container *ngTemplateOutlet="inspectorTpl"></ng-container></div>
          </div>
        </div>
      }
    } @else {
      @if (isMobile()) {
        <div class="vw-main mobile">
          <div class="vw-mtop">
            <div class="vw-chiprow">
              @for (s of stats(); track s.tier.id) {
                <button class="vw-chip"><i [style.background]="s.tier.color"></i>{{ s.tier.name }}<b class="mono">\${{ s.tier.price }}</b></button>
              }
            </div>
          </div>
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            <ng-container *ngTemplateOutlet="zoomTpl"></ng-container>
          </div>
          <vw-bar [order]="order()" (open)="sheet.set('order')"/>
          @if (sheet() === 'order') {
            <div class="sheet-back" (click)="sheet.set(null)">
              <div class="sheet" (click)="$event.stopPropagation()">
                <div class="sheet-grip"></div>
                <div class="sheet-head"><b>Your order</b><button class="ed-ic" (click)="sheet.set(null)"><sms-icon name="Add" [s]="18" [rot]="45"/></button></div>
                <div class="sheet-body"><ng-container *ngTemplateOutlet="orderTpl"></ng-container></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="vw-main ux-direct">
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            <ng-container *ngTemplateOutlet="zoomTpl"></ng-container>
          </div>
          <div class="vw-side right">
            <vw-legend [venue]="venue()" mode="legend" [focusTier]="focusTier()" (focus)="focusOnTier($event)"/>
            <ng-container *ngTemplateOutlet="orderTpl"></ng-container>
          </div>
        </div>
      }
    }

    @if (wizard(); as wz) {
      <ed-wizard [type]="wz" [tiers]="venue().tiers" (close)="wizard.set(null)" (create)="createFromWizard($event)"/>
    }

    <!-- ── reusable templates ── -->
    <ng-template #canvasTpl>
      <sms-canvas #canvas [venue]="venue()" [mode]="mode()" [canvasStyle]="canvasStyle" [canvasTheme]="canvasTheme"
                  [showGrid]="mode() === 'editor' && showGrid()" [snap]="snap()" [selection]="selection()"
                  [selectedSeats]="selectedKeys()" [dimUnfocused]="null"
                  [drawMode]="!!draw()" [drawPoints]="draw()?.points || []" [drawCursor]="draw()?.cursor || null"
                  (drawAddPoint)="drawAddPoint($event)" (drawCursorChange)="drawCursor($event)" (drawCommit)="commitPolygon()"
                  (select)="selectObjs($event.ids, $event.additive)" (moveStart)="onMoveStart()" (move)="onMove($event.dx, $event.dy)"
                  (seatClick)="pickSeat($event.row, $event.seat, $event.tier)" (zonePick)="pickZone($event)"
                  (scaleChange)="scale.set($event)"/>
    </ng-template>

    <ng-template #browserTpl>
      <div class="ed-browser">
        <div class="panel-tabs">
          <button [class.on]="leftTab() === 'objects'" (click)="leftTab.set('objects')">Objects</button>
          <button [class.on]="leftTab() === 'tiers'" (click)="leftTab.set('tiers')">Tiers</button>
        </div>
        @if (leftTab() === 'objects') {
          <ed-objects [venue]="venue()" [selection]="selection()" (select)="selectObjs($event.ids, $event.additive)"/>
        } @else {
          <ed-tiers [venue]="venue()" (add)="addTier()" (patch)="patchTier($event.id, $event.p)" (del)="deleteTier($event)"/>
        }
      </div>
    </ng-template>

    <ng-template #inspectorTpl>
      <ed-inspector [sel]="selection()" [venue]="venue()" (patch)="patch($event.id, $event.p)" (del)="deleteSel()" (dup)="dupSel()"/>
    </ng-template>

    <ng-template #orderTpl>
      <vw-order [order]="order()" [venue]="venue()" (remove)="removeLine($event)" (checkout)="checkout()"/>
    </ng-template>

    <ng-template #zoomTpl>
      <div class="vw-zoom">
        <button (click)="zoomBy(0.83)"><sms-icon name="ZoomOut" [s]="18"/></button>
        <button (click)="fit()" class="mono">{{ round(scale() * 100) }}%</button>
        <button (click)="zoomBy(1.2)"><sms-icon name="ZoomIn" [s]="18"/></button>
      </div>
    </ng-template>
  `,
})
export class SeatMapStudioComponent implements OnInit, OnDestroy {
  // fixed tweaks
  readonly canvasStyle = 'skeuomorphic';
  readonly canvasTheme = 'light';
  readonly gridPx = 25;
  round = Math.round;
  VENUE_META = VENUE_META;
  addTools: Tool[] = TOOLS.filter((t) => t.id !== 'select');

  // ── public integration API ───────────────────────────────────────────────────
  /** Seed the studio with a layout. Defaults to the built-in "Grand Theater". */
  initialVenue = input<Venue | undefined>(undefined);
  /** Initial mode: 'editor' (default) or 'viewer'. */
  initialMode = input<'editor' | 'viewer' | undefined>(undefined);
  /** Initial app-chrome theme: 'light' (default) or 'dark'. */
  initialTheme = input<'light' | 'dark' | undefined>(undefined);
  /** Show the built-in venue switcher (sample layouts). Hide it for a single embedded layout. */
  showVenueSwitcher = input(true);
  /** Render inside its host box (position:relative; 100% height) instead of full-screen fixed. */
  embedded = input(false);

  /** Emitted whenever the layout changes (add/move/edit/delete/tier/venue load). */
  venueChange = output<Venue>();
  /** Emitted whenever the viewer order (selected seats / GA) changes. */
  orderChange = output<OrderLine[]>();
  /** Emitted when the editor/viewer mode changes. */
  modeChange = output<'editor' | 'viewer'>();
  /** Emitted when the app theme changes. */
  themeChange = output<'light' | 'dark'>();
  /** Emitted when the viewer "Checkout" button is pressed, with the current order. */
  checkoutClick = output<OrderLine[]>();

  private emitReady = false;

  // state
  appTheme = signal<'light' | 'dark'>('light');
  venueKey = signal('theater');
  venue = signal<Venue>(VENUES['theater']());
  mode = signal<'editor' | 'viewer'>('editor');
  selection = signal<Set<string>>(new Set());
  order = signal<OrderLine[]>([]);
  wizard = signal<'row' | 'zone' | null>(null);
  activeTool = signal('select');
  draw = signal<{ points: Pt[]; cursor: Pt | null } | null>(null);
  scale = signal(0.8);
  focusTier = signal<string | null>(null);
  venueMenu = signal(false);
  sheet = signal<string | null>(null);
  leftTab = signal<'objects' | 'tiers'>('objects');
  isMobile = signal<boolean>(false);
  showGrid = signal(true);
  snap = signal(false);

  private canvas = viewChild<SeatCanvasComponent>('canvas');
  canvasRef() { return this.canvas(); }

  // history
  private histPast = signal<Venue[]>([]);
  private histFuture = signal<Venue[]>([]);
  private lastCk: { sig: string | null; t: number } = { sig: null, t: 0 };
  canUndo = computed(() => this.histPast().length > 0);
  canRedo = computed(() => this.histFuture().length > 0);

  private moveSnap: Map<string, { x: number; y: number } | { points: Pt[] }> | null = null;
  private mq?: MediaQueryList;
  private mqHandler?: (e: MediaQueryListEvent) => void;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  selectedKeys = computed(() => new Set(this.order().filter((l) => l.kind === 'seat').map((l) => l.id)));
  stats = computed(() => tierStats(this.venue()));

  // ── lifecycle ────────────────────────────────────────────────────────────────
  constructor() {
    // Surface state changes to host bindings once the component is initialized.
    effect(() => { const v = this.venue(); if (this.emitReady) this.venueChange.emit(v); });
    effect(() => { const o = this.order(); if (this.emitReady) this.orderChange.emit(o); });
    effect(() => { const m = this.mode(); if (this.emitReady) this.modeChange.emit(m); });
    effect(() => { const t = this.appTheme(); if (this.emitReady) this.themeChange.emit(t); });
  }

  ngOnInit() {
    // Apply seed inputs before wiring emitters so the initial state isn't echoed back.
    const iv = this.initialVenue(); if (iv) this.venue.set(iv);
    const im = this.initialMode(); if (im) this.mode.set(im);
    const it = this.initialTheme(); if (it) this.appTheme.set(it);

    this.mq = window.matchMedia('(max-width: 880px)');
    this.isMobile.set(this.mq.matches);
    this.mqHandler = (e) => this.isMobile.set(e.matches);
    this.mq.addEventListener('change', this.mqHandler);
    window.addEventListener('keydown', this.keyHandler);

    this.emitReady = true;
  }
  ngOnDestroy() {
    if (this.mq && this.mqHandler) this.mq.removeEventListener('change', this.mqHandler);
    window.removeEventListener('keydown', this.keyHandler);
  }

  // ── history ──────────────────────────────────────────────────────────────────
  private clone = clone;
  checkpoint(sig?: string) {
    const now = Date.now();
    if (sig && this.lastCk.sig === sig && now - this.lastCk.t < 700) { this.lastCk.t = now; return; }
    this.histPast.update((p) => { const n = [...p, clone(this.venue())]; if (n.length > 50) n.shift(); return n; });
    this.histFuture.set([]);
    this.lastCk = { sig: sig ?? null, t: now };
  }
  undo() {
    const p = this.histPast(); if (!p.length) return;
    this.histFuture.update((f) => [...f, clone(this.venue())]);
    const np = [...p]; const last = np.pop()!;
    this.histPast.set(np); this.venue.set(last); this.selection.set(new Set()); this.lastCk = { sig: null, t: 0 };
  }
  redo() {
    const f = this.histFuture(); if (!f.length) return;
    this.histPast.update((p) => [...p, clone(this.venue())]);
    const nf = [...f]; const last = nf.pop()!;
    this.histFuture.set(nf); this.venue.set(last); this.lastCk = { sig: null, t: 0 };
  }

  // ── header / venue ───────────────────────────────────────────────────────────
  setMode(m: 'editor' | 'viewer') {
    this.mode.set(m); this.selection.set(new Set()); this.sheet.set(null); this.draw.set(null); this.activeTool.set('select');
    setTimeout(() => this.canvasRef()?.fit(), 50);
  }
  toggleTheme() { this.appTheme.update((t) => (t === 'light' ? 'dark' : 'light')); }
  loadVenue(key: string) {
    this.checkpoint('load'); this.venueKey.set(key); this.venue.set(VENUES[key]());
    this.selection.set(new Set()); this.order.set([]); this.focusTier.set(null); this.venueMenu.set(false);
    setTimeout(() => this.canvasRef()?.fit(), 60);
  }

  // ── editor ops ───────────────────────────────────────────────────────────────
  patch(id: string, p: Partial<VObj>, sig?: string) {
    this.checkpoint(sig || `${id}:${Object.keys(p)[0]}`);
    this.venue.update((v) => ({ ...v, objects: v.objects.map((o) => (o.id === id ? { ...o, ...p } : o)) }));
  }
  onMoveStart() {
    this.checkpoint('move');
    const m = new Map<string, { x: number; y: number } | { points: Pt[] }>();
    const sel = this.selection();
    this.venue().objects.forEach((o) => {
      if (sel.has(o.id)) m.set(o.id, o.type === 'polygon' ? { points: o.points!.map((p) => ({ ...p })) } : { x: o.x!, y: o.y! });
    });
    this.moveSnap = m;
  }
  onMove(dx: number, dy: number) {
    const useSnap = this.snap();
    const snapTo = (n: number) => (useSnap ? Math.round(n / 25) * 25 : n);
    this.venue.update((v) => ({ ...v, objects: v.objects.map((o) => {
      const s = this.moveSnap?.get(o.id); if (!s) return o;
      if ('points' in s) return { ...o, points: s.points.map((p) => ({ x: snapTo(p.x + dx), y: snapTo(p.y + dy) })) };
      return { ...o, x: snapTo(s.x + dx), y: snapTo(s.y + dy) };
    }) }));
  }

  addObject(tool: Tool) {
    if (tool.id !== 'polygon') this.draw.set(null);
    if (tool.wizard) { this.activeTool.set('select'); this.wizard.set(tool.id as 'row' | 'zone'); this.sheet.set(null); return; }
    if (tool.id === 'polygon') { this.activeTool.set('polygon'); this.draw.set({ points: [], cursor: null }); this.selection.set(new Set()); this.sheet.set(null); return; }
    this.activeTool.set('select');
    const c = this.canvasRef()?.getCenterWorld() || { x: 600, y: 400 };
    let o: VObj;
    if (tool.id === 'stage') o = { id: uid('stage'), type: 'stage', x: c.x, y: c.y, w: 480, h: 80, label: 'STAGE', shape: 'arc' };
    else if (tool.id === 'table') o = { id: uid('tab'), type: 'table', x: c.x, y: c.y, shape: 'round', r: 30, seats: 8, label: 'T' + (this.venue().objects.filter((q) => q.type === 'table').length + 1), tier: 'standard' };
    else if (tool.id === 'label') o = { id: uid('lbl'), type: 'label', x: c.x, y: c.y, text: 'New label', size: 18 };
    else o = { id: uid('mk'), type: 'marker', x: c.x, y: c.y, kind: 'entrance', label: 'Entrance' };
    this.checkpoint('add'); this.venue.update((v) => ({ ...v, objects: [...v.objects, o] })); this.selection.set(new Set([o.id])); this.sheet.set(null);
  }

  // ── polygon drawing ──────────────────────────────────────────────────────────
  drawAddPoint(p: Pt) { this.draw.update((d) => (d ? { ...d, points: [...d.points, p] } : d)); }
  drawCursor(p: Pt) { this.draw.update((d) => (d ? { ...d, cursor: p } : d)); }
  commitPolygon() {
    const d = this.draw();
    if (!d || d.points.length < 3) return;
    const o: VObj = { id: uid('poly'), type: 'polygon', points: d.points.map((p) => ({ ...p })), tier: 'standard', label: 'Section', capacity: 200 };
    this.checkpoint('add');
    this.venue.update((v) => ({ ...v, objects: [...v.objects, o] }));
    this.selection.set(new Set([o.id])); this.draw.set(null); this.activeTool.set('select');
  }
  cancelDraw() { this.draw.set(null); this.activeTool.set('select'); }

  createFromWizard(cfg: RowWizardCfg | ZoneWizardCfg) {
    const c = this.canvasRef()?.getCenterWorld() || { x: 600, y: 400 };
    this.checkpoint('add'); const added: VObj[] = [];
    if (this.wizard() === 'row') {
      const r = cfg as RowWizardCfg;
      for (let i = 0; i < r.n; i++) added.push(makeRow({ label: `Row ${String.fromCharCode(65 + i)}`, x: c.x, y: c.y - ((r.n - 1) * 60) / 2 + i * 60, count: r.count, gap: r.gap, arc: r.arc, tier: r.tier }));
    } else {
      const z = cfg as ZoneWizardCfg;
      added.push({ id: uid('z'), type: 'zone', x: c.x, y: c.y, w: 360, h: 200, label: 'GA Zone', tier: z.tier, capacity: z.cap });
    }
    this.venue.update((v) => ({ ...v, objects: [...v.objects, ...added] }));
    this.selection.set(new Set(added.map((a) => a.id))); this.wizard.set(null);
  }

  deleteSel() {
    if (!this.selection().size) return;
    this.checkpoint('del');
    const sel = this.selection();
    this.venue.update((v) => ({ ...v, objects: v.objects.filter((o) => !sel.has(o.id)) }));
    this.selection.set(new Set()); this.sheet.set(null);
  }
  dupSel() {
    if (!this.selection().size) return;
    this.checkpoint('dup'); const copies: VObj[] = []; const sel = this.selection();
    this.venue().objects.forEach((o) => {
      if (sel.has(o.id)) {
        const c: VObj = { ...clone(o), id: uid(o.type) };
        if (o.type === 'polygon') c.points = o.points!.map((p) => ({ x: p.x + 36, y: p.y + 36 }));
        else { c.x = o.x! + 36; c.y = o.y! + 36; }
        copies.push(c);
      }
    });
    this.venue.update((v) => ({ ...v, objects: [...v.objects, ...copies] })); this.selection.set(new Set(copies.map((c) => c.id)));
  }

  // ── tier ops ─────────────────────────────────────────────────────────────────
  addTier() { this.checkpoint('tier-add'); this.venue.update((v) => ({ ...v, tiers: [...v.tiers, makeTier(v.tiers)] })); }
  patchTier(id: string, p: Partial<Tier>) {
    this.checkpoint(`tier:${id}:${Object.keys(p)[0]}`);
    this.venue.update((v) => ({ ...v, tiers: v.tiers.map((tr) => (tr.id === id ? { ...tr, ...p } : tr)) }));
  }
  deleteTier(id: string) {
    this.checkpoint('tier-del');
    this.venue.update((v) => {
      const remaining = v.tiers.filter((tr) => tr.id !== id);
      const fb = remaining[0]?.id;
      return { ...v, tiers: remaining, objects: v.objects.map((o) => (o.tier === id ? { ...o, tier: fb } : o)) };
    });
  }

  // ── selection ─────────────────────────────────────────────────────────────────
  selectObjs(ids: string[], additive: boolean) {
    this.selection.update((prev) => {
      if (!additive) return new Set(ids);
      const n = new Set(prev); ids.forEach((id) => (n.has(id) ? n.delete(id) : n.add(id))); return n;
    });
  }

  // ── viewer ops ───────────────────────────────────────────────────────────────
  pickSeat(row: VObj, seat: Seat, tier: Tier) {
    const key = `${row.id}:${seat.n}`;
    this.order.update((o) => o.some((l) => l.id === key)
      ? o.filter((l) => l.id !== key)
      : [...o, { id: key, kind: 'seat', label: `${row.label || row.type} · ${row.type === 'table' ? 'Seat' : ''} ${seat.n}`.replace(/\s+/g, ' ').trim(), tierId: tier.id, price: tier.price }]);
  }
  pickZone(zone: VObj) {
    const tier = tierById(this.venue().tiers, zone.tier);
    this.order.update((o) => [...o, { id: `${zone.id}:${Date.now()}`, kind: 'ga', label: `${zone.label} · GA`, tierId: tier.id, price: tier.price }]);
  }
  removeLine(id: string) { this.order.update((o) => o.filter((l) => l.id !== id)); }
  checkout() { this.checkoutClick.emit(this.order()); }

  focusOnTier(tid: string | null) {
    this.focusTier.set(tid);
    if (!tid) { this.canvasRef()?.fit(); return; }
    const objs = this.venue().objects.filter((o) => o.tier === tid);
    if (!objs.length) return;
    const b = venueBounds(objs);
    this.canvasRef()?.focus({ x1: b.x1 - 30, y1: b.y1 - 30, x2: b.x2 + 30, y2: b.y2 + 30 });
  }

  // ── topbar / zoom ──────────────────────────────────────────────────────────────
  zoomBy(f: number) { this.canvasRef()?.zoomBy(f); }
  fit() { this.canvasRef()?.fit(); }
  toggleGrid() { this.showGrid.update((g) => !g); }
  toggleSnap() { this.snap.update((s) => !s); }

  // ── keyboard ────────────────────────────────────────────────────────────────────
  private onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
    else if (e.key === 'Enter' && this.draw()) { e.preventDefault(); this.commitPolygon(); }
    else if (this.mode() === 'editor' && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); this.deleteSel(); }
    else if (e.key === 'Escape') { if (this.draw()) this.cancelDraw(); this.selection.set(new Set()); this.wizard.set(null); this.sheet.set(null); }
  }
}
