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
  Pt, Seat, Tier, VObj, Venue, VENUES, VENUE_META, makeRow, makeTier, resizeSeats, segRowSeatCount, tierById, uid, venueBounds,
} from './seat-data';
import {
  DrawHudComponent, HelpComponent, InspectorComponent, ObjectsPanelComponent, OBJ_ICON, TOOLS, Tool, ToolRailComponent,
  TopBarComponent, TierManagerComponent, WizardComponent, RowWizardCfg, ZoneWizardCfg,
} from './editor-ui';
import {
  OrderLine, OrderPanelComponent, TierLegendComponent, ViewerBarComponent, tierStats,
} from './viewer-ui';
import { downloadVenue, parseVenueJSON } from './seat-io';

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
    InspectorComponent, WizardComponent, DrawHudComponent, HelpComponent,
    TierLegendComponent, OrderPanelComponent, ViewerBarComponent,
  ],
  styleUrl: './seat-map-studio.component.css',
  template: `
    <!-- ── header ── -->
    @if (showVenueSwitcher() || mode() === 'editor') {
    <header class="st-header">
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
      <div style="flex:1"></div>
      @if (mode() === 'editor') {
        <button class="icon-btn" (click)="exportLayout()" title="Export layout as JSON" aria-label="Export layout as JSON">
          <sms-icon name="Download" [s]="18"/>
        </button>
        <button class="icon-btn" (click)="importInput.click()" title="Import layout from JSON" aria-label="Import layout from JSON">
          <sms-icon name="Upload" [s]="18"/>
        </button>
        <input #importInput type="file" accept=".ticketseat,application/json,.json" hidden (change)="onImportPick($event)">
      }
      <button class="venue-btn" (click)="setMode(mode() === 'editor' ? 'viewer' : 'editor')"
              [title]="mode() === 'editor' ? 'Preview and select seats' : 'Back to editing'">
        <sms-icon [name]="mode() === 'editor' ? 'Eye' : 'Edit'" [s]="14"/>
        <span class="venue-name">{{ mode() === 'editor' ? 'Preview' : 'Edit' }}</span>
      </button>
    </header>
    }

    @if (toast(); as t) {
      <div class="sms-toast" [class.err]="t.kind === 'error'" role="status" aria-live="polite">
        <sms-icon [name]="t.kind === 'error' ? 'Help' : 'Check'" [s]="15"/>
        <span>{{ t.msg }}</span>
      </div>
    }

    <!-- ── editor / viewer ── -->
    @if (mode() === 'editor') {
      @if (isMobile()) {
        <div class="ed-main mobile">
          <ed-topbar [venue]="venue()" [scale]="scale()" [gridPx]="gridPx()" [showGrid]="showGrid()" [snap]="snap()"
                     [canUndo]="canUndo()" [canRedo]="canRedo()" [isMobile]="true"
                     (undo)="undo()" (redo)="redo()" (zoom)="zoomBy($event)" (fit)="fit()"
                     (menu)="sheet.set(sheet() === 'browser' ? null : 'browser')" (help)="openHelp()"/>
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            @if (draw(); as d) { <ed-drawhud [count]="d.points.length" [kind]="d.kind" [seats]="segRowCount()" (finish)="commitDraw()" (cancel)="cancelDraw()"/> }
          @if (placing(); as pl) {
            <div class="draw-hud">
              <span class="draw-hud-info"><sms-icon [name]="OBJ_ICON[pl.tool] || 'Marker'" [s]="15"/> Click to place · Esc to cancel</span>
              <button class="draw-hud-btn ghost" (click)="cancelPlacing()">Cancel</button>
            </div>
          }
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
          <ed-topbar [venue]="venue()" [scale]="scale()" [gridPx]="gridPx()" [showGrid]="showGrid()" [snap]="snap()"
                     [canUndo]="canUndo()" [canRedo]="canRedo()" [isMobile]="false"
                     (undo)="undo()" (redo)="redo()" (cycleGrid)="cycleGrid()" (toggleSnap)="toggleSnap()"
                     (zoom)="zoomBy($event)" (fit)="fit()" (help)="openHelp()"/>
          <div class="ed-cols insp-right">
            <ed-toolrail [active]="activeTool()" (tool)="addObject($event)"/>
            <div class="ed-side left"><ng-container *ngTemplateOutlet="browserTpl"></ng-container></div>
            <div class="canvas-host">
              <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
              @if (draw(); as d) { <ed-drawhud [count]="d.points.length" [kind]="d.kind" [seats]="segRowCount()" (finish)="commitDraw()" (cancel)="cancelDraw()"/> }
          @if (placing(); as pl) {
            <div class="draw-hud">
              <span class="draw-hud-info"><sms-icon [name]="OBJ_ICON[pl.tool] || 'Marker'" [s]="15"/> Click to place · Esc to cancel</span>
              <button class="draw-hud-btn ghost" (click)="cancelPlacing()">Cancel</button>
            </div>
          }
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
                <button class="vw-chip"><i [style.background]="s.tier.color"></i>{{ s.tier.name }}<b class="mono">{{ currency() }}{{ s.tier.price }}</b></button>
              }
            </div>
          </div>
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            <ng-container *ngTemplateOutlet="zoomTpl"></ng-container>
          </div>
          @if (!readonly() && showOrderPanel()) {
            <vw-bar [order]="order()" [currency]="currency()" (open)="sheet.set('order')"/>
            @if (sheet() === 'order') {
              <div class="sheet-back" (click)="sheet.set(null)">
                <div class="sheet" (click)="$event.stopPropagation()">
                  <div class="sheet-grip"></div>
                  <div class="sheet-head"><b>Your order</b><button class="ed-ic" (click)="sheet.set(null)"><sms-icon name="Add" [s]="18" [rot]="45"/></button></div>
                  <div class="sheet-body"><ng-container *ngTemplateOutlet="orderTpl"></ng-container></div>
                </div>
              </div>
            }
          }
        </div>
      } @else {
        <div class="vw-main ux-direct">
          <div class="canvas-host">
            <ng-container *ngTemplateOutlet="canvasTpl"></ng-container>
            <ng-container *ngTemplateOutlet="zoomTpl"></ng-container>
          </div>
          @if (!readonly() && showOrderPanel()) {
            <div class="vw-side right">
              <vw-legend [venue]="displayVenue()" mode="legend" [currency]="currency()" [focusTier]="focusTier()" (focus)="focusOnTier($event)"/>
              <ng-container *ngTemplateOutlet="orderTpl"></ng-container>
            </div>
          }
        </div>
      }
    }

    @if (wizard(); as wz) {
      <ed-wizard [type]="wz" [tiers]="venue().tiers" [currency]="currency()" (close)="wizard.set(null)" (create)="createFromWizard($event)"/>
    }

    @if (helpOpen()) { <ed-help (close)="closeHelp()"/> }
    @if (mode() === 'editor' && !helpSeen() && !helpOpen()) {
      <div class="sms-help-nudge">
        <span>New here? Tap <b>?</b> for a 20-second tour.</span>
        <button class="nudge-go" (click)="openHelp()">Show me</button>
        <button class="nudge-x" (click)="dismissNudge()" aria-label="Dismiss"><sms-icon name="Add" [s]="13" [rot]="45"/></button>
      </div>
    }

    <!-- ── reusable templates ── -->
    <ng-template #canvasTpl>
      <sms-canvas #canvas [venue]="displayVenue()" [mode]="mode()" [canvasStyle]="canvasStyle" [canvasTheme]="canvasTheme"
                  [showGrid]="mode() === 'editor' && showGrid()" [grid]="gridPx()" [snap]="snap()" [selection]="selection()"
                  [selectedSeats]="selectedKeys()" [pickedZones]="pickedZones()" [dimUnfocused]="null"
                  [drawMode]="!!draw()" [drawKind]="draw()?.kind || 'polygon'" [drawPoints]="draw()?.points || []" [drawCursor]="draw()?.cursor || null"
                  [placing]="!!placing()" [ghost]="ghostObj()"
                  (drawAddPoint)="drawAddPoint($event)" (drawCursorChange)="drawCursor($event)" (drawCommit)="commitDraw()" (drawClose)="drawClose()"
                  (place)="placeObject($event)" (placeCursor)="placeCursorAt($event)" (rotate)="rotateObject($event)"
                  (select)="selectObjs($event.ids, $event.additive)" (moveStart)="onMoveStart()" (move)="onMove($event.dx, $event.dy)"
                  (seatClick)="pickSeat($event.row, $event.seat, $event.tier)" (zonePick)="pickZone($event)"
                  (scaleChange)="scale.set($event)"/>
    </ng-template>

    <ng-template #browserTpl>
      <div class="ed-browser">
        <div class="panel-tabs">
          <button [class.on]="leftTab() === 'objects'" (click)="leftTab.set('objects')">Objects</button>
          <button [class.on]="leftTab() === 'tiers'" (click)="leftTab.set('tiers')">Pricing</button>
        </div>
        @if (leftTab() === 'objects') {
          <ed-objects [venue]="venue()" [selection]="selection()" (select)="selectObjs($event.ids, $event.additive)" (reorder)="reorderObjects($event)"/>
        } @else {
          <ed-tiers [venue]="venue()" [currency]="currency()" (add)="addTier()" (patch)="patchTier($event.id, $event.p)" (del)="deleteTier($event)"/>
        }
      </div>
    </ng-template>

    <ng-template #inspectorTpl>
      <ed-inspector [sel]="selection()" [venue]="venue()" [currency]="currency()" (patch)="patch($event.id, $event.p)" (del)="deleteSel()" (dup)="dupSel()"/>
    </ng-template>

    <ng-template #orderTpl>
      <vw-order [order]="order()" [venue]="displayVenue()" [currency]="currency()" (remove)="removeLine($event)" (checkout)="checkout()"/>
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
  gridPx = signal(25);
  readonly gridSizes = [10, 25, 50, 100];
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
  /** Currency symbol shown before every price (e.g. '€', 'RSD '). Defaults to '$'. */
  currency = input<string>('$');
  /** Seat IDs ("objectId:seatNumber") reserved/sold externally; overlaid live as held (non-selectable). */
  reservedIds = input<string[] | null>(null);
  /** Max number of seats a viewer may select (0 = unlimited). */
  seatLimit = input<number>(0);
  /** Read-only viewer: seats are not selectable and the order panel/checkout is hidden. */
  readonly = input(false);
  /** Show the built-in order panel + checkout in viewer mode (ignored when readonly). */
  showOrderPanel = input(true);

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
  /** Emitted when a seat pick is blocked because seatLimit was reached. Payload = the limit. */
  limitReached = output<number>();

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
  draw = signal<{ kind: 'polygon' | 'segrow' | 'line'; points: Pt[]; cursor: Pt | null } | null>(null);
  placing = signal<{ tool: string; cursor: Pt } | null>(null);
  OBJ_ICON = OBJ_ICON;
  scale = signal(0.8);
  focusTier = signal<string | null>(null);
  venueMenu = signal(false);
  sheet = signal<string | null>(null);
  leftTab = signal<'objects' | 'tiers'>('objects');
  isMobile = signal<boolean>(false);
  showGrid = signal(true);
  snap = signal(false);
  helpOpen = signal(false);
  helpSeen = signal(true); // set from storage in ngOnInit; assume seen so the nudge never flashes

  private canvas = viewChild<SeatCanvasComponent>('canvas');
  canvasRef() { return this.canvas(); }

  // history
  private histPast = signal<Venue[]>([]);
  private histFuture = signal<Venue[]>([]);
  private lastCk: { sig: string | null; t: number } = { sig: null, t: 0 };
  canUndo = computed(() => this.histPast().length > 0);
  canRedo = computed(() => this.histFuture().length > 0);

  private moveSnap: Map<string, { x: number; y: number } | { points: Pt[] } | { path: Pt[] }> | null = null;
  private mq?: MediaQueryList;
  private mqHandler?: (e: MediaQueryListEvent) => void;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  selectedKeys = computed(() => new Set(this.order().filter((l) => l.kind === 'seat').map((l) => l.id)));
  /** Live seat count for the segmented-row draw HUD (path so far + cursor). */
  segRowCount = computed(() => {
    const d = this.draw();
    if (!d || d.kind !== 'segrow') return 0;
    return segRowSeatCount(d.cursor ? [...d.points, d.cursor] : d.points, 30, false);
  });
  /** Ghost object rendered under the cursor while placing (Photoshop-style). */
  ghostObj = computed<VObj | null>(() => {
    const p = this.placing();
    return p ? this.buildObject(p.tool, p.cursor, 'ghost') : null;
  });
  /** GA zone id → number of spots the viewer has picked there (canvas marks it picked + shows the count). */
  pickedZones = computed(() => {
    const m = new Map<string, number>();
    for (const l of this.order()) {
      if (l.kind !== 'ga') continue;
      const i = l.id.lastIndexOf(':');
      const z = i === -1 ? l.id : l.id.slice(0, i);
      m.set(z, (m.get(z) || 0) + 1);
    }
    return m;
  });
  /** Base venue with externally-reserved seats overlaid as 'sold' (viewer display only; not
   *  persisted) - rendered in the neutral "taken" colour and non-selectable. */
  displayVenue = computed<Venue>(() => {
    const v = this.venue();
    const ids = this.reservedIds();
    if (!ids || ids.length === 0) return v;
    const set = new Set(ids);
    return {
      ...v,
      objects: v.objects.map((o) =>
        Array.isArray(o.seats)
          ? { ...o, seats: (o.seats as Seat[]).map((s) =>
              s.status === 'available' && set.has(`${o.id}:${s.n}`) ? { ...s, status: 'sold' as const } : s) }
          : o),
    };
  });
  stats = computed(() => tierStats(this.displayVenue()));

  // ── lifecycle ────────────────────────────────────────────────────────────────
  constructor() {
    // Surface state changes to host bindings once the component is initialized.
    effect(() => { const v = this.venue(); if (this.emitReady) this.venueChange.emit(v); });
    effect(() => { const o = this.order(); if (this.emitReady) this.orderChange.emit(o); });
    // Enforce seatLimit reactively: if the cap drops below the current pick count
    // (e.g. the buyer lowered their ticket quantity), release the most recently
    // added picks. This un-selects them on the map AND emits orderChange so the
    // host releases them - so quantity can never be less than the held picks.
    effect(() => {
      const lim = this.seatLimit();
      const o = this.order();
      if (lim > 0 && o.length > lim) this.order.set(o.slice(0, lim));
    });
    effect(() => { const m = this.mode(); if (this.emitReady) this.modeChange.emit(m); });
    effect(() => { const t = this.appTheme(); if (this.emitReady) this.themeChange.emit(t); });
  }

  ngOnInit() {
    // Apply seed inputs before wiring emitters so the initial state isn't echoed back.
    const iv = this.initialVenue(); if (iv) this.venue.set(iv);
    const im = this.initialMode(); if (im) this.mode.set(im);
    const it = this.initialTheme(); if (it) this.appTheme.set(it);

    // First-run nudge: show once until the user opens or dismisses help.
    try { this.helpSeen.set(localStorage.getItem('ticketseat-studio-help-seen') === '1'); } catch { this.helpSeen.set(true); }

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
  openHelp() { this.helpOpen.set(true); this.markHelpSeen(); }
  closeHelp() { this.helpOpen.set(false); }
  dismissNudge() { this.markHelpSeen(); }
  private markHelpSeen() { this.helpSeen.set(true); try { localStorage.setItem('ticketseat-studio-help-seen', '1'); } catch { /* storage unavailable */ } }
  loadVenue(key: string) {
    this.checkpoint('load'); this.venueKey.set(key); this.venue.set(VENUES[key]());
    this.selection.set(new Set()); this.order.set([]); this.focusTier.set(null); this.venueMenu.set(false);
    setTimeout(() => this.canvasRef()?.fit(), 60);
  }

  // ── import / export ────────────────────────────────────────────────────────────
  /** Transient status message (bottom-centre toast). */
  toast = signal<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  private toastTimer: any = null;
  private flash(msg: string, kind: 'ok' | 'error' = 'ok') {
    this.toast.set({ msg, kind });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), kind === 'error' ? 4000 : 2400);
  }
  /** Download the current layout as a JSON file. */
  exportLayout() {
    const v = this.venue();
    downloadVenue(v);
    this.flash(`Exported “${v.name}”`);
  }
  /** Load a layout from a picked JSON file (checkpointed for undo). */
  async importLayout(file: File) {
    try {
      const parsed = parseVenueJSON(await file.text());
      this.checkpoint('import');
      this.venue.set(parsed);
      this.selection.set(new Set());
      this.order.set([]);
      setTimeout(() => this.canvasRef()?.fit(), 60);
      this.flash(`Imported “${parsed.name}”`);
    } catch (err) {
      this.flash(err instanceof Error ? err.message : 'Couldn’t read that file.', 'error');
    }
  }
  /** <input type="file"> change handler: grab the file, import it, reset the input. */
  onImportPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.importLayout(file);
    input.value = '';
  }

  // ── editor ops ───────────────────────────────────────────────────────────────
  patch(id: string, p: Partial<VObj>, sig?: string) {
    this.checkpoint(sig || `${id}:${Object.keys(p)[0]}`);
    this.venue.update((v) => ({ ...v, objects: v.objects.map((o) => {
      if (o.id !== id) return o;
      let no: VObj = { ...o, ...p };
      // A segmented row's seat count is derived from its spacing — keep the seats
      // array in sync when spacing (or ring state) changes.
      if (no.type === 'row' && no.path && ('seatGap' in p || 'closed' in p)) {
        no = { ...no, seats: resizeSeats(no.seats as Seat[], segRowSeatCount(no.path, no.seatGap ?? 30, !!no.closed)) };
      }
      return no;
    }) }));
  }
  onMoveStart() {
    this.checkpoint('move');
    const m = new Map<string, { x: number; y: number } | { points: Pt[] } | { path: Pt[] }>();
    const sel = this.selection();
    this.venue().objects.forEach((o) => {
      if (!sel.has(o.id)) return;
      if (o.type === 'polygon') m.set(o.id, { points: o.points!.map((p) => ({ ...p })) });
      else if (o.path) m.set(o.id, { path: o.path.map((p) => ({ x: p.x, y: p.y })) });
      else m.set(o.id, { x: o.x!, y: o.y! });
    });
    this.moveSnap = m;
  }
  onMove(dx: number, dy: number) {
    const useSnap = this.snap();
    const g = this.gridPx();
    const snapTo = (n: number) => (useSnap ? Math.round(n / g) * g : n);
    this.venue.update((v) => ({ ...v, objects: v.objects.map((o) => {
      const s = this.moveSnap?.get(o.id); if (!s) return o;
      if ('points' in s) return { ...o, points: s.points.map((p) => ({ x: snapTo(p.x + dx), y: snapTo(p.y + dy) })) };
      if ('path' in s) return { ...o, path: s.path.map((p) => ({ x: snapTo(p.x + dx), y: snapTo(p.y + dy) })) };
      return { ...o, x: snapTo(s.x + dx), y: snapTo(s.y + dy) };
    }) }));
  }

  addObject(tool: Tool) {
    this.draw.set(null); this.placing.set(null);
    if (tool.id === 'select') { this.activeTool.set('select'); this.selection.set(new Set()); return; }
    if (tool.wizard) { this.activeTool.set('select'); this.wizard.set(tool.id as 'row' | 'zone'); this.sheet.set(null); return; }
    if (tool.id === 'polygon') { this.activeTool.set('polygon'); this.draw.set({ kind: 'polygon', points: [], cursor: null }); this.selection.set(new Set()); this.sheet.set(null); return; }
    if (tool.id === 'segrow') { this.activeTool.set('segrow'); this.draw.set({ kind: 'segrow', points: [], cursor: null }); this.selection.set(new Set()); this.sheet.set(null); return; }
    if (tool.id === 'line') { this.activeTool.set('line'); this.draw.set({ kind: 'line', points: [], cursor: null }); this.selection.set(new Set()); this.sheet.set(null); return; }
    // Direct-placement tools (stage, table, label, marker): arm a ghost that follows
    // the cursor; the object is created where the user clicks on the canvas.
    this.activeTool.set(tool.id);
    const c = this.canvasRef()?.getCenterWorld() || { x: 600, y: 400 };
    this.placing.set({ tool: tool.id, cursor: c });
    this.selection.set(new Set()); this.sheet.set(null);
  }

  /** Template for a direct-placement object at a given point (used for both ghost + final). */
  private buildObject(toolId: string, pt: Pt, id?: string): VObj {
    const { x, y } = pt;
    switch (toolId) {
      case 'stage': return { id: id ?? uid('stage'), type: 'stage', x, y, w: 480, h: 80, label: 'STAGE', shape: 'arc' };
      case 'table': return { id: id ?? uid('tab'), type: 'table', x, y, shape: 'round', r: 30, seats: 8, label: 'T' + (this.venue().objects.filter((q) => q.type === 'table').length + 1), tier: 'standard' };
      case 'table-long': return { id: id ?? uid('tab'), type: 'table', x, y, shape: 'rect', w: 140, h: 54, up: 4, down: 4, seats: 8, label: 'T' + (this.venue().objects.filter((q) => q.type === 'table').length + 1), tier: 'standard' };
      case 'label': return { id: id ?? uid('lbl'), type: 'label', x, y, text: 'New label', size: 18 };
      default: return { id: id ?? uid('mk'), type: 'marker', x, y, kind: 'entrance', label: 'Entrance' };
    }
  }
  placeCursorAt(p: Pt) { this.placing.update((pl) => (pl ? { ...pl, cursor: p } : pl)); }
  placeObject(p: Pt) {
    const pl = this.placing(); if (!pl) return;
    const o = this.buildObject(pl.tool, p);
    this.checkpoint('add');
    this.venue.update((v) => ({ ...v, objects: [...v.objects, o] }));
    this.selection.set(new Set([o.id])); this.placing.set(null); this.activeTool.set('select');
  }
  cancelPlacing() { this.placing.set(null); this.activeTool.set('select'); }
  /** Live rotation from the on-canvas handle (dedup'd into one undo step per drag). */
  rotateObject(e: { id: string; deg: number }) { this.patch(e.id, { rotation: e.deg }, 'rotate:' + e.id); }
  /** Restack objects from the Objects list drag-reorder. `ids` is the new paint order
   *  (earlier = further back). One undo step. */
  reorderObjects(ids: string[]) {
    this.checkpoint('reorder');
    this.venue.update((v) => {
      const byId = new Map(v.objects.map((o) => [o.id, o]));
      const next = ids.map((id) => byId.get(id)!).filter(Boolean);
      return next.length === v.objects.length ? { ...v, objects: next } : v;
    });
  }

  // ── polygon drawing ──────────────────────────────────────────────────────────
  drawAddPoint(p: Pt) { this.draw.update((d) => (d ? { ...d, points: [...d.points, p] } : d)); }
  drawCursor(p: Pt) { this.draw.update((d) => (d ? { ...d, cursor: p } : d)); }
  commitDraw() {
    const d = this.draw();
    if (!d) return;
    if (d.kind === 'segrow') return this.commitSegRow(d.points);
    if (d.kind === 'line') return this.commitLine(d.points);
    if (d.points.length < 3) return;
    const o: VObj = { id: uid('poly'), type: 'polygon', points: d.points.map((p) => ({ ...p })), tier: 'standard', label: 'Section', capacity: 200 };
    this.checkpoint('add');
    this.venue.update((v) => ({ ...v, objects: [...v.objects, o] }));
    this.selection.set(new Set([o.id])); this.draw.set(null); this.activeTool.set('select');
  }
  /** Build a line/divider from the drawn polyline. */
  private commitLine(points: Pt[]) {
    if (points.length < 2) return;
    const o: VObj = { id: uid('line'), type: 'line', label: 'Line', path: points.map((p) => ({ x: p.x, y: p.y })), color: '#94a3b8', thickness: 2 };
    this.checkpoint('add');
    this.venue.update((v) => ({ ...v, objects: [...v.objects, o] }));
    this.selection.set(new Set([o.id])); this.draw.set(null); this.activeTool.set('select');
  }
  /** Close the segmented row into a ring (last vertex → first). */
  drawClose() { const d = this.draw(); if (d?.kind === 'segrow') this.commitSegRow(d.points, true); }
  /** Build a segmented row: seats spread along the drawn polyline (initial count from length). */
  private commitSegRow(points: Pt[], closed = false) {
    const gap = 30;
    const n = segRowSeatCount(points, gap, closed);
    if (!n) return;
    const seats: Seat[] = Array.from({ length: n }, (_, i) => ({ n: 101 + i, status: 'available' as const }));
    const o: VObj = { id: uid('row'), type: 'row', label: 'Row', path: points.map((p) => ({ x: p.x, y: p.y })), closed: closed || undefined, seatGap: gap, tier: 'standard', seats };
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
        else if (o.path) c.path = o.path.map((p) => ({ x: p.x + 36, y: p.y + 36 }));
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
    if (this.readonly()) return;
    const key = `${row.id}:${seat.n}`;
    const isDeselect = this.order().some((l) => l.id === key);
    if (!isDeselect) {
      const lim = this.seatLimit();
      if (lim > 0 && this.order().filter((l) => l.kind === 'seat').length >= lim) { this.limitReached.emit(lim); return; }
    }
    this.order.update((o) => isDeselect
      ? o.filter((l) => l.id !== key)
      : [...o, { id: key, kind: 'seat', label: `${row.label || row.type} · ${row.type === 'table' ? 'Seat' : ''} ${seat.n}`.replace(/\s+/g, ' ').trim(), tierId: tier.id, price: tier.price }]);
  }
  pickZone(zone: VObj) {
    if (this.readonly()) return;
    const lim = this.seatLimit();
    if (lim > 0 && this.order().filter((l) => l.kind === 'seat' || l.kind === 'ga').length >= lim) { this.limitReached.emit(lim); return; }
    const tier = tierById(this.venue().tiers, zone.tier);
    // Unique per pick (uid has no ':') so each GA spot is individually removable -
    // Date.now() collided on rapid taps, making several picks share one id.
    this.order.update((o) => [...o, { id: `${zone.id}:${uid('ga')}`, kind: 'ga', label: `${zone.label} · GA`, tierId: tier.id, price: tier.price }]);
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
  /** Cycle the grid: Off → 10 → 25 → 50 → 100 → Off. */
  cycleGrid() {
    if (!this.showGrid()) { this.showGrid.set(true); this.gridPx.set(this.gridSizes[0]); return; }
    const i = this.gridSizes.indexOf(this.gridPx());
    if (i < 0 || i >= this.gridSizes.length - 1) { this.showGrid.set(false); return; }
    this.gridPx.set(this.gridSizes[i + 1]);
  }

  // ── keyboard ────────────────────────────────────────────────────────────────────
  private onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
    else if (e.key === 'Enter' && this.draw()) { e.preventDefault(); this.commitDraw(); }
    else if (this.mode() === 'editor' && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); this.deleteSel(); }
    else if (e.key === 'Escape') { if (this.helpOpen()) { this.closeHelp(); return; } if (this.draw()) this.cancelDraw(); if (this.placing()) this.cancelPlacing(); this.selection.set(new Set()); this.wizard.set(null); this.sheet.set(null); }
  }
}
