// seat-canvas.component.ts — shared pan/zoom SVG canvas (editor + viewer).
// Port of editor/seat-canvas.jsx.
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  ViewEncapsulation, computed, effect, input, output, signal, viewChild,
} from '@angular/core';
import {
  Box, Pt, Seat, Tier, VObj, Venue, objBounds, polyCentroid, rowSeatAngle,
  rowSeatPositions, segRowPreview, tableSeatPositions, tierById, venueBounds,
} from './seat-data';

export interface Pal {
  bg: string; grid: string; grid2: string; sold: string; soldStroke: string;
  text: string; subtext: string; stage: string; stageText: string;
  marker: string; markerStroke: string; markerInk: string;
}
export const SeatPalette: Record<string, Pal> = {
  light: { bg: '#eeeeec', grid: 'rgba(20,20,30,.055)', grid2: 'rgba(20,20,30,.11)',
    sold: '#d2d2d9', soldStroke: '#bcbcc6', text: '#4a4a52', subtext: '#86868f',
    stage: '#6b7280', stageText: '#ffffff', marker: '#ffffff', markerStroke: '#cdcdd4', markerInk: '#56565e' },
  dark: { bg: '#141419', grid: 'rgba(255,255,255,.05)', grid2: 'rgba(255,255,255,.1)',
    sold: '#33333b', soldStroke: '#44444d', text: '#c4c4ce', subtext: '#7c7c87',
    stage: '#4b4b55', stageText: '#f3f3f5', marker: '#22222a', markerStroke: '#3a3a44', markerInk: '#b6b6c0' },
};

interface SeatVM { p: Pt; angle: number; seat: Seat; key: string; open?: boolean; }
interface CanvasItem {
  o: VObj; selected: boolean; dim: boolean; tier: Tier; bounds: Box;
  cx: number; cy: number;   // rotation pivot = bounds centre (works for path shapes too)
  ghost?: boolean;
  picked?: boolean; pickCount?: number;
  stagePath?: string | null; zoneFill?: string;
  polyPoints?: string; polyCx?: number; polyCy?: number; polyFill?: string;
  linePoints?: string;
  tableFill?: string; chairs?: SeatVM[];
  rowSeats?: SeatVM[]; rowLabelX?: number; rowLabelY?: number;
  markerGlyph?: string; markerFontSize?: number;
  showNum?: boolean;
}

const MARKER_GLYPHS: Record<string, string> = { entrance: '→', exit: '→', bar: 'BAR', stairs: '≡' };

// ── Seat glyph ───────────────────────────────────────────────────────────────
@Component({
  selector: 'g[sms-seat]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    g.sms-seat-body{ transform-box: fill-box; transform-origin: center; }
    g.sms-seat-body rect{ transition: fill .18s ease, stroke .18s ease, opacity .18s ease; }
    /* Picked seat: keeps gently pulsating so a pending selection stays alive. */
    g.sms-seat-body.sms-picked{ animation: smsPickPulse 1.35s ease-in-out infinite; }
    /* Seat turning taken: a firmer settle that reads as "locked in". */
    g.sms-seat-body.sms-taken{ animation: smsTake .44s ease both; }
    /* The halo ring breathes in sync with the seat. Animating the radius (not a
       transform) keeps it perfectly centred on the seat as it pulses. */
    circle.sms-seat-ring{ animation: smsRingPulse 1.35s ease-in-out infinite; }
    @keyframes smsPickPulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.14)} }
    @keyframes smsRingPulse{ 0%,100%{ r:12.5px; opacity:.34 } 50%{ r:16.5px; opacity:.1 } }
    @keyframes smsTake{ 0%{transform:scale(1)} 24%{transform:scale(1.18)} 50%{transform:scale(.9)} 74%{transform:scale(1.05)} 100%{transform:scale(1)} }
    @media (prefers-reduced-motion: reduce){ g.sms-seat-body, circle.sms-seat-ring{ animation: none !important; } }
  `],
  template: `
    <ng-container>
      <svg:g [attr.transform]="'translate(' + p().x + ',' + p().y + ') rotate(' + angle() + ')'"
             [attr.opacity]="dim() ? 0.3 : 1" [style.cursor]="cursor"
             [attr.data-seat]="interactive() ? '1' : null" (pointerdown)="onDown($event)">
        @if (selected()) {
          <svg:circle class="sms-seat-ring" [attr.r]="13" fill="none" [attr.stroke]="color()" [attr.stroke-width]="2" [attr.opacity]="0.32"/>
        }
        <svg:g class="sms-seat-body" [class.sms-picked]="selected()" [class.sms-taken]="animateTake()">
          @if (open() && !selected()) {
            <!-- Open space: chairless dashed placeholder — visible and still selectable. -->
            <svg:rect [attr.x]="-7" [attr.y]="-7.5" [attr.width]="14" [attr.height]="12" [attr.rx]="4.4"
                      fill="none" [attr.stroke]="color()" [attr.stroke-width]="1.4" stroke-dasharray="3 2.4" [attr.opacity]="0.9"/>
          } @else if (seatStyle() === 'minimal') {
            <svg:rect [attr.x]="-5.5" [attr.y]="-5.5" [attr.width]="11" [attr.height]="11" [attr.rx]="3.4"
                      [attr.fill]="minFill" [attr.stroke]="minStroke" [attr.stroke-width]="1.5" [attr.opacity]="sold ? 0.55 : 1"/>
          } @else {
            <svg:rect [attr.x]="-7.4" [attr.y]="1.5" [attr.width]="14.8" [attr.height]="6.5" [attr.rx]="3.25"
                      [attr.fill]="back" [attr.opacity]="selected() ? 0.55 : 1"/>
            <svg:rect [attr.x]="-7" [attr.y]="-7.5" [attr.width]="14" [attr.height]="12" [attr.rx]="4.4"
                      [attr.fill]="pad" [attr.stroke]="line ? edge : 'none'" [attr.stroke-width]="1.4"/>
          }
        </svg:g>
        @if (showNum() && !sold && seatStyle() !== 'minimal') {
          <svg:text [attr.y]="-0.5" text-anchor="middle" [attr.font-size]="6.4" [attr.font-weight]="600" [attr.fill]="ink"
                    style="pointer-events:none;font-family:'Geist Mono',monospace">{{ num() }}</svg:text>
        }
      </svg:g>
    </ng-container>
  `,
})
export class SeatComponent {
  p = input.required<Pt>();
  angle = input(0);
  color = input('#6668ee');
  status = input<string>('available');
  seatStyle = input<string>('skeuomorphic');
  num = input<number>(0);
  showNum = input(false);
  selected = input(false);
  interactive = input(false);
  open = input(false);
  dim = input(false);
  pal = input.required<Pal>();
  down = output<PointerEvent>();

  // Play the "taken" pulse only when a seat actually transitions into sold/held —
  // never on first render, so a chart of pre-sold seats doesn't storm on load.
  private _animateTake = signal(false);
  animateTake = this._animateTake.asReadonly();
  constructor() {
    let prev: string | null = null;
    effect(() => {
      const s = this.status();
      const wasTaken = prev === 'sold' || prev === 'held';
      const nowTaken = s === 'sold' || s === 'held';
      const first = prev === null;
      prev = s;
      if (!first && nowTaken && !wasTaken) {
        this._animateTake.set(true);
        setTimeout(() => this._animateTake.set(false), 480);
      }
    });
  }

  get sold() { return this.status() === 'sold'; }
  get held() { return this.status() === 'held'; }
  // Both sold and held seats are unavailable - not selectable.
  get taken() { return this.sold || this.held; }
  get cursor() { return this.interactive() && !this.taken ? 'pointer' : 'default'; }

  // resolve ink slots (mirrors the JSX branch order)
  private slots() {
    const color = this.color(), pal = this.pal();
    let pad = '', edge = '', back = '', ink = '', line = false;
    if (this.sold) { pad = pal.sold; edge = pal.soldStroke; back = pal.soldStroke; ink = pal.subtext; }
    else if (this.selected()) { pad = color; edge = color; back = 'rgba(255,255,255,.5)'; ink = '#ffffff'; }
    else if (this.held) { pad = '#fde7bf'; edge = '#d79a17'; back = '#d79a17'; ink = '#5b4406'; }
    else if (this.seatStyle() === 'flat') { pad = color; edge = color; back = `color-mix(in srgb, ${color} 62%, #000)`; ink = '#ffffff'; }
    else { pad = `color-mix(in srgb, ${color} 15%, ${pal.bg})`; edge = color; back = color; ink = color; line = true; }
    return { pad, edge, back, ink, line };
  }
  get pad() { return this.slots().pad; }
  get edge() { return this.slots().edge; }
  get back() { return this.slots().back; }
  get ink() { return this.slots().ink; }
  get line() { return this.slots().line; }
  get minFill() {
    const color = this.color(), pal = this.pal();
    return this.selected() ? color : (this.sold ? pal.sold : `color-mix(in srgb, ${color} 22%, ${pal.bg})`);
  }
  get minStroke() { return this.selected() ? this.color() : this.edge; }

  onDown(e: PointerEvent) {
    if (!this.interactive() || this.taken) return;
    e.stopPropagation();
    this.down.emit(e);
  }
}

// ── Canvas ───────────────────────────────────────────────────────────────────
@Component({
  selector: 'sms-canvas',
  standalone: true,
  imports: [SeatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [':host{position:absolute;inset:0;display:block;}'],
  template: `
    <div #wrap style="position:absolute;inset:0;overflow:hidden;touch-action:none"
         [style.background]="pal().bg">
      <svg #svg width="100%" height="100%" style="display:block"
           [style.cursor]="drawMode() || placing() ? 'crosshair' : (gesture?.type === 'pan' ? 'grabbing' : (spaceDown ? 'grab' : 'default'))"
           (wheel)="onWheel($event)" (pointerdown)="onPointerDown($event)" (pointermove)="onPointerMove($event)"
           (pointerup)="onPointerUp($event)" (pointercancel)="onPointerUp($event)">
        <defs>
          <pattern id="gp" [attr.width]="grid()" [attr.height]="grid()" patternUnits="userSpaceOnUse"
                   [attr.patternTransform]="'translate(' + view().tx + ',' + view().ty + ') scale(' + view().s + ')'">
            <path [attr.d]="'M ' + grid() + ' 0 L 0 0 0 ' + grid()" fill="none" [attr.stroke]="pal().grid" [attr.stroke-width]="1 / view().s"/>
          </pattern>
        </defs>
        @if (showGrid()) { <rect x="0" y="0" width="100%" height="100%" fill="url(#gp)"/> }
        <g [attr.transform]="'translate(' + view().tx + ',' + view().ty + ') scale(' + view().s + ')'">
          @for (item of items(); track item.o.id) {
            <g [attr.data-oid]="item.o.id" [attr.opacity]="item.ghost ? 0.5 : (item.dim ? 0.28 : 1)"
               [style.pointer-events]="item.ghost ? 'none' : null"
               [style.cursor]="mode() === 'editor' ? 'move' : 'default'"
               [attr.transform]="item.o.rotation ? ('rotate(' + item.o.rotation + ' ' + item.cx + ' ' + item.cy + ')') : null">

              @if (item.selected && item.o.type !== 'row' && item.o.type !== 'polygon' && item.o.type !== 'line') {
                <rect [attr.x]="item.bounds.x1 - 4" [attr.y]="item.bounds.y1 - 4"
                      [attr.width]="item.bounds.x2 - item.bounds.x1 + 8" [attr.height]="item.bounds.y2 - item.bounds.y1 + 8"
                      [attr.rx]="10" fill="color-mix(in srgb, #6668ee 8%, transparent)" stroke="#6668ee"
                      [attr.stroke-width]="2" stroke-dasharray="5 4"/>
              }

              @switch (item.o.type) {
                @case ('stage') {
                  @if (item.stagePath) {
                    <path [attr.d]="item.stagePath" [attr.fill]="pal().stage"/>
                  } @else {
                    <rect [attr.x]="item.o.x! - item.o.w! / 2" [attr.y]="item.o.y! - item.o.h! / 2"
                          [attr.width]="item.o.w" [attr.height]="item.o.h" [attr.rx]="10" [attr.fill]="pal().stage"/>
                  }
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! + 4" text-anchor="middle" [attr.font-size]="15"
                        [attr.font-weight]="700" [attr.letter-spacing]="3" [attr.fill]="pal().stageText"
                        style="pointer-events:none;font-family:Geist,sans-serif">{{ item.o.label }}</text>
                }
                @case ('zone') {
                  <rect [attr.x]="item.o.x! - item.o.w! / 2" [attr.y]="item.o.y! - item.o.h! / 2"
                        [attr.width]="item.o.w" [attr.height]="item.o.h" [attr.rx]="14" [attr.fill]="item.zoneFill"
                        [attr.stroke]="item.tier.color" [attr.stroke-width]="item.picked ? 4 : (item.selected ? 3 : 2)"
                        [attr.stroke-dasharray]="item.picked ? null : '7 6'"/>
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! - 4" text-anchor="middle" [attr.font-size]="17"
                        [attr.font-weight]="700" [attr.fill]="item.tier.color"
                        style="pointer-events:none;font-family:Geist,sans-serif">{{ item.o.label }}</text>
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! + 16" text-anchor="middle" [attr.font-size]="item.picked ? 12 : 11"
                        [attr.font-weight]="item.picked ? 700 : 400" [attr.fill]="item.picked ? item.tier.color : pal().subtext"
                        style="pointer-events:none;font-family:'Geist Mono',monospace">{{ item.picked ? item.pickCount + (item.pickCount === 1 ? ' spot held' : ' spots held') : (item.o.capacity ? 'CAP ' + item.o.capacity : 'No limit') }}</text>
                }
                @case ('polygon') {
                  <polygon [attr.points]="item.polyPoints" [attr.fill]="item.polyFill" [attr.stroke]="item.tier.color"
                           [attr.stroke-width]="item.picked ? 4 : (item.selected ? 3 : 2)"
                           [attr.stroke-dasharray]="item.picked ? null : '7 6'" stroke-linejoin="round"/>
                  <text [attr.x]="item.polyCx" [attr.y]="item.polyCy! - 3" text-anchor="middle" [attr.font-size]="16"
                        [attr.font-weight]="700" [attr.fill]="item.tier.color"
                        style="pointer-events:none;font-family:Geist,sans-serif">{{ item.o.label }}</text>
                  <text [attr.x]="item.polyCx" [attr.y]="item.polyCy! + 15" text-anchor="middle" [attr.font-size]="item.picked ? 12 : 11"
                        [attr.font-weight]="item.picked ? 700 : 400" [attr.fill]="item.picked ? item.tier.color : pal().subtext"
                        style="pointer-events:none;font-family:'Geist Mono',monospace">{{ item.picked ? item.pickCount + (item.pickCount === 1 ? ' spot held' : ' spots held') : (item.o.capacity ? 'CAP ' + item.o.capacity : 'No limit') }}</text>
                  @if (item.selected) {
                    @for (p of item.o.points!; track $index) {
                      <circle [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="4" [attr.fill]="pal().bg" [attr.stroke]="item.tier.color" [attr.stroke-width]="2"/>
                    }
                  }
                }
                @case ('table') {
                  @if (item.o.shape === 'round') {
                    <circle [attr.cx]="item.o.x" [attr.cy]="item.o.y" [attr.r]="item.o.r" [attr.fill]="item.tableFill"
                            [attr.stroke]="item.tier.color" [attr.stroke-width]="1.6"/>
                  } @else {
                    <rect [attr.x]="item.o.x! - (item.o.w || 120) / 2" [attr.y]="item.o.y! - (item.o.h || 50) / 2"
                          [attr.width]="item.o.w || 120" [attr.height]="item.o.h || 50" [attr.rx]="10"
                          [attr.fill]="item.tableFill" [attr.stroke]="item.tier.color" [attr.stroke-width]="1.6"/>
                  }
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! + 4" text-anchor="middle" [attr.font-size]="13"
                        [attr.font-weight]="700" [attr.fill]="pal().text"
                        style="pointer-events:none;font-family:Geist,sans-serif">{{ item.o.label }}</text>
                  @for (c of item.chairs!; track $index) {
                    <g sms-seat [p]="c.p" [angle]="c.angle" [color]="item.tier.color" status="available"
                       [seatStyle]="canvasStyle()" [num]="c.seat.n" [showNum]="false" [open]="!!c.open"
                       [selected]="!!selectedSeats()?.has(c.key)" [interactive]="mode() === 'viewer'"
                       [dim]="item.dim" [pal]="pal()" (down)="seatClick.emit({ row: item.o, seat: c.seat, tier: item.tier })"></g>
                  }
                }
                @case ('marker') {
                  <circle [attr.cx]="item.o.x" [attr.cy]="item.o.y" [attr.r]="15" [attr.fill]="pal().marker"
                          [attr.stroke]="pal().markerStroke" [attr.stroke-width]="1.5"/>
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! + 4" text-anchor="middle" [attr.font-size]="item.markerFontSize"
                        [attr.font-weight]="700" [attr.fill]="pal().markerInk"
                        style="pointer-events:none;font-family:'Geist Mono',monospace">{{ item.markerGlyph }}</text>
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y! + 30" text-anchor="middle" [attr.font-size]="11"
                        [attr.fill]="pal().subtext" style="pointer-events:none;font-family:Geist,sans-serif">{{ item.o.label }}</text>
                }
                @case ('label') {
                  <text [attr.x]="item.o.x" [attr.y]="item.o.y" text-anchor="middle" dominant-baseline="central"
                        [attr.font-size]="item.o.size || 18"
                        [attr.font-weight]="600" [attr.fill]="item.o.color || pal().text" style="font-family:Geist,sans-serif">{{ item.o.text }}</text>
                }
                @case ('line') {
                  <polyline [attr.points]="item.linePoints" fill="none" stroke="transparent" [attr.stroke-width]="16" stroke-linecap="round"/>
                  <polyline [attr.points]="item.linePoints" fill="none" [attr.stroke]="item.o.color || '#94a3b8'"
                            [attr.stroke-width]="item.o.thickness || 2" stroke-linecap="round" stroke-linejoin="round"/>
                  @if (item.selected) {
                    @for (p of item.o.path!; track $index) {
                      <circle [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="4" [attr.fill]="pal().bg" stroke="#6668ee" [attr.stroke-width]="2"/>
                    }
                  }
                }
                @case ('row') {
                  @if (item.selected) {
                    <rect [attr.x]="item.bounds.x1 - 2" [attr.y]="item.bounds.y1 - 2"
                          [attr.width]="item.bounds.x2 - item.bounds.x1 + 4" [attr.height]="item.bounds.y2 - item.bounds.y1 + 4"
                          [attr.rx]="14" fill="none" stroke="#6668ee" [attr.stroke-width]="2" stroke-dasharray="5 4"/>
                  }
                  <text [attr.x]="item.rowLabelX" [attr.y]="item.rowLabelY" text-anchor="end" [attr.font-size]="12"
                        [attr.font-weight]="600" [attr.fill]="pal().text"
                        style="font-family:Geist,sans-serif;pointer-events:none">{{ item.o.label }}</text>
                  @for (rs of item.rowSeats!; track $index) {
                    <g sms-seat [p]="rs.p" [angle]="rs.angle" [color]="item.tier.color" [status]="rs.seat.status"
                       [seatStyle]="canvasStyle()" [num]="rs.seat.n" [showNum]="item.showNum ?? false"
                       [selected]="!!selectedSeats()?.has(rs.key)" [interactive]="mode() === 'viewer'"
                       [dim]="item.dim" [pal]="pal()" (down)="seatClick.emit({ row: item.o, seat: rs.seat, tier: item.tier })"></g>
                  }
                }
              }

              <!-- Drag-to-rotate handle (single selected object, editor). Lives inside the
                   rotated group so it always sticks out the object's current top. -->
              @if (selection().size === 1 && item.selected && mode() === 'editor') {
                <line [attr.x1]="item.cx" [attr.y1]="item.bounds.y1 - 4" [attr.x2]="item.cx" [attr.y2]="item.bounds.y1 - 24"
                      stroke="#6668ee" [attr.stroke-width]="1.6" style="pointer-events:none"/>
                <circle data-rot-handle="1" [attr.cx]="item.cx" [attr.cy]="item.bounds.y1 - 28" [attr.r]="6.5"
                        fill="#fff" stroke="#6668ee" [attr.stroke-width]="2" style="cursor:grab"/>
              }
            </g>
          }

          @if (marquee(); as m) {
            <rect [attr.x]="min(m.x1, m.x2)" [attr.y]="min(m.y1, m.y2)" [attr.width]="abs(m.x2 - m.x1)"
                  [attr.height]="abs(m.y2 - m.y1)" fill="color-mix(in srgb, #6668ee 10%, transparent)"
                  stroke="#6668ee" [attr.stroke-width]="1.4 / view().s"/>
          }

          @if (drawMode() && drawPoints().length > 0) {
            <g style="pointer-events:none">
              @if (drawKind() === 'polygon' && drawPoints().length >= 2) {
                <polygon [attr.points]="drawLine()" fill="color-mix(in srgb, #6668ee 12%, transparent)" stroke="none"/>
              }
              @for (sp of segPreview(); track $index) {
                <rect [attr.x]="sp.x - 7" [attr.y]="sp.y - 6" [attr.width]="14" [attr.height]="12" [attr.rx]="4"
                      fill="color-mix(in srgb, #6668ee 16%, #eeeeec)" stroke="#6668ee" [attr.stroke-width]="1.4" [attr.opacity]="0.9"/>
              }
              <polyline [attr.points]="drawPolyline()" fill="none" stroke="#6668ee" [attr.stroke-width]="1.7 / view().s"
                        [attr.stroke-dasharray]="(5 / view().s) + ' ' + (4 / view().s)" stroke-linejoin="round"/>
              @for (p of drawPoints(); track $index) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="($index === 0 ? 5.5 : 3.6) / view().s"
                        [attr.fill]="$index === 0 ? pal().bg : '#6668ee'" stroke="#6668ee" [attr.stroke-width]="1.8 / view().s"/>
              }
              @if (drawKind() !== 'line' && drawPoints().length >= 3) {
                <circle [attr.cx]="drawPoints()[0].x" [attr.cy]="drawPoints()[0].y" [attr.r]="11 / view().s"
                        fill="none" stroke="#6668ee" [attr.stroke-width]="1.4 / view().s" [attr.opacity]="0.5"/>
              }
            </g>
          }
        </g>
      </svg>
    </div>
  `,
})
export class SeatCanvasComponent implements AfterViewInit, OnDestroy {
  // inputs
  venue = input.required<Venue>();
  mode = input<'editor' | 'viewer'>('editor');
  canvasStyle = input<string>('skeuomorphic');
  canvasTheme = input<string>('light');
  showGrid = input(true);
  snap = input(false);
  selection = input<Set<string>>(new Set());
  selectedSeats = input<Set<string>>(new Set());
  /** GA zone/polygon id → picked-spot count (rendered as picked, with the count shown). */
  pickedZones = input<Map<string, number>>(new Map());
  dimUnfocused = input<Set<string> | null>(null);
  drawMode = input(false);
  drawKind = input<'polygon' | 'segrow' | 'line'>('polygon');
  drawPoints = input<Pt[]>([]);
  drawCursor = input<Pt | null>(null);
  placing = input(false);
  ghost = input<VObj | null>(null);

  // outputs
  select = output<{ ids: string[]; additive: boolean }>();
  moveStart = output<void>();
  move = output<{ dx: number; dy: number }>();
  moveEnd = output<boolean>();
  seatClick = output<{ row: VObj; seat: Seat; tier: Tier }>();
  zonePick = output<VObj>();
  scaleChange = output<number>();
  drawAddPoint = output<Pt>();
  drawCursorChange = output<Pt>();
  drawCommit = output<void>();
  drawClose = output<void>();
  place = output<Pt>();
  placeCursor = output<Pt>();
  rotate = output<{ id: string; deg: number }>();

  grid = input(25);
  view = signal({ s: 0.8, tx: 60, ty: 40 });
  marquee = signal<Box | null>(null);

  private wrapRef = viewChild.required<ElementRef<HTMLDivElement>>('wrap');
  private svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private pointers = new Map<number, { x: number; y: number }>();
  gesture: any = null;
  private fitPending = true;
  private ro?: ResizeObserver;

  min = Math.min; abs = Math.abs;

  pal = computed<Pal>(() => SeatPalette[this.canvasTheme()] || SeatPalette['light']);

  constructor() {
    // emit scale changes
    effect(() => { this.scaleChange.emit(this.view().s); });
    // NOTE: the initial fit is driven solely by ngAfterViewInit + the ResizeObserver
    // (size changes), NOT by venue content changes. Auto-fitting on venue change would
    // zoom the view onto every newly-added element, which we explicitly don't want.
  }

  items = computed<CanvasItem[]>(() => {
    const v = this.venue();
    const list = v.objects.map((o) => this.buildItem(o, v));
    const g = this.ghost();
    if (g) { const gi = this.buildItem(g, v); gi.ghost = true; gi.selected = false; gi.dim = false; list.push(gi); }
    return list;
  });

  private buildItem(o: VObj, v: Venue): CanvasItem {
    const sel = this.selection();
    const picks = this.pickedZones();
    const dimSet = this.dimUnfocused();
    const showNum = this.view().s > 1.45;
    const pal = this.pal();
    {
      const selected = !!sel?.has(o.id);
      const pickCount = picks?.get(o.id) || 0;
      const picked = pickCount > 0;
      const dim = !!(dimSet && dimSet.size && !dimSet.has(o.id));
      const tier = tierById(v.tiers, o.tier);
      const bounds = objBounds(o);
      const item: CanvasItem = { o, selected, picked, pickCount, dim, tier, bounds, cx: (bounds.x1 + bounds.x2) / 2, cy: (bounds.y1 + bounds.y2) / 2 };
      if (o.type === 'stage') {
        const { x, y, w, h } = o as Required<Pick<VObj, 'x' | 'y' | 'w' | 'h'>>;
        item.stagePath = o.shape === 'arc'
          ? `M ${x - w / 2} ${y + h / 2} Q ${x - w / 2} ${y - h / 2} ${x} ${y - h / 2} Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y + h / 2} Z`
          : null;
      } else if (o.type === 'zone') {
        item.zoneFill = `color-mix(in srgb, ${tier.color} ${picked ? 42 : 16}%, transparent)`;
      } else if (o.type === 'polygon') {
        item.polyPoints = o.points!.map((p) => `${p.x},${p.y}`).join(' ');
        const c = polyCentroid(o.points!);
        item.polyCx = c.cx; item.polyCy = c.cy;
        item.polyFill = `color-mix(in srgb, ${tier.color} ${picked ? 42 : 15}%, transparent)`;
      } else if (o.type === 'table') {
        item.tableFill = `color-mix(in srgb, ${tier.color} 12%, ${pal.bg})`;
        item.chairs = tableSeatPositions(o).map((c, i): SeatVM => ({ p: c, angle: c.a || 0, seat: { n: i + 1, status: 'available' }, key: `${o.id}:${i + 1}`, open: !!c.open }));
      } else if (o.type === 'marker') {
        item.markerGlyph = MARKER_GLYPHS[o.kind || ''] || '•';
        item.markerFontSize = o.kind === 'bar' ? 8 : 13;
      } else if (o.type === 'line') {
        item.linePoints = o.path!.map((p) => `${p.x},${p.y}`).join(' ');
      } else if (o.type === 'row') {
        const ps = rowSeatPositions(o);
        const seats = o.seats as Seat[];
        const along = !!o.path && !!o.faceAlong;
        item.rowSeats = ps.map((p, i): SeatVM => {
          // Crash-safe: if the derived seat count outran the stored array (e.g. spacing
          // just changed), synthesize a seat so rendering never throws.
          const seat = seats[i] ?? { n: 101 + i, status: 'available' as const };
          const angle = o.path ? (along ? -(p.a ?? 0) : 0) : -(p.a ?? rowSeatAngle(o, i));
          return { p, angle, seat, key: `${o.id}:${seat.n}` };
        });
        item.rowLabelX = ps[0].x - 22; item.rowLabelY = ps[0].y + 4;
        item.showNum = showNum;
      }
      return item;
    }
  }

  drawLine = computed(() => this.drawPoints().map((p) => `${p.x},${p.y}`).join(' '));
  drawPolyline = computed(() => {
    const c = this.drawCursor();
    return this.drawLine() + (c ? ` ${c.x},${c.y}` : '');
  });
  // Live seat pads previewed while drawing a segmented row (path so far + cursor).
  segPreview = computed<Pt[]>(() => {
    if (!this.drawMode() || this.drawKind() !== 'segrow') return [];
    const pts = [...this.drawPoints()];
    const c = this.drawCursor();
    if (c) pts.push(c);
    return segRowPreview(pts, 30, false);
  });

  // ── lifecycle ──────────────────────────────────────────────────────────────
  ngAfterViewInit() {
    const el = this.wrapRef().nativeElement;
    this.tryFit();
    this.ro = new ResizeObserver(() => this.tryFit());
    this.ro.observe(el);
    window.addEventListener('keydown', this.onSpace, true);
    window.addEventListener('keyup', this.onSpace, true);
  }
  ngOnDestroy() {
    this.ro?.disconnect();
    window.removeEventListener('keydown', this.onSpace, true);
    window.removeEventListener('keyup', this.onSpace, true);
  }
  // Hold Space to pan (Figma/PowerPoint convention) — ignored while typing in a field.
  spaceDown = false;
  private onSpace = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    this.spaceDown = e.type === 'keydown';
  };

  private size() { const r = this.wrapRef().nativeElement.getBoundingClientRect(); return { w: r?.width || 800, h: r?.height || 600 }; }
  private toWorld(cx: number, cy: number): Pt {
    const r = this.svgRef().nativeElement.getBoundingClientRect();
    const v = this.view();
    return { x: (cx - r.left - v.tx) / v.s, y: (cy - r.top - v.ty) / v.s };
  }
  // Decide the initial fit EXACTLY ONCE, on the first measurement where the host has a
  // real (non-zero) size. By then the parent's ngOnInit has already applied the seed
  // venue, so the object count reflects the real starting layout:
  //   • content present  → a layout was loaded (viewer / store / saved editor) → fit to it.
  //   • empty            → a blank editor → leave the default view so adding the first
  //                        element (and every one after) never zooms/recenters the canvas.
  // Either way fitPending is cleared, so no later venue change ever auto-fits again.
  private tryFit() {
    if (!this.fitPending) return;
    try {
      const el = this.wrapRef().nativeElement;
      const r = el.getBoundingClientRect();
      if (r.width <= 60 || r.height <= 60) return; // host not laid out yet; retry on next measurement
      this.fitPending = false;
      if (this.venue().objects.length > 0) this.fit();
    } catch { /* view or venue not resolved yet; stay pending and retry on next measurement */ }
  }

  // ── imperative API ───────────────────────────────────────────────────────────
  fit(b?: Box) {
    const { w, h } = this.size();
    const bb = b || venueBounds(this.venue().objects);
    const bw = bb.x2 - bb.x1, bh = bb.y2 - bb.y1;
    const pad = 60;
    const s = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh, 2.2);
    const tx = (w - bw * s) / 2 - bb.x1 * s;
    const ty = (h - bh * s) / 2 - bb.y1 * s;
    this.view.set({ s, tx, ty });
  }
  focus(b: Box) { this.fit(b); }
  zoomBy(f: number) { this.view.update((v) => this.clampZoom(v, f, this.size())); }
  setZoom(s: number) { this.view.update((v) => this.clampZoom(v, s / v.s, this.size())); }
  getScale() { return this.view().s; }
  getCenterWorld(): Pt { const { w, h } = this.size(); const v = this.view(); return { x: (w / 2 - v.tx) / v.s, y: (h / 2 - v.ty) / v.s }; }

  private clampZoom(v: { s: number; tx: number; ty: number }, f: number, sz: { w: number; h: number }, cx?: number, cy?: number) {
    const ns = Math.max(0.25, Math.min(2.6, v.s * f));
    const px = cx ?? sz.w / 2, py = cy ?? sz.h / 2;
    const wx = (px - v.tx) / v.s, wy = (py - v.ty) / v.s;
    return { s: ns, tx: px - wx * ns, ty: py - wy * ns };
  }

  // ── input handlers ───────────────────────────────────────────────────────────
  onWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = this.svgRef().nativeElement.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 24) {
      const f = Math.exp(-e.deltaY * 0.0016);
      this.view.update((v) => this.clampZoom(v, f, this.size(), e.clientX - rect.left, e.clientY - rect.top));
    } else {
      this.view.update((v) => ({ ...v, tx: v.tx - e.deltaX, ty: v.ty - e.deltaY }));
    }
  }

  private objAt(target: EventTarget | null): string | null {
    const el = target as Element | null;
    return el?.closest?.('[data-oid]')?.getAttribute('data-oid') ?? null;
  }

  onPointerDown(e: PointerEvent) {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { this.svgRef().nativeElement.setPointerCapture?.(e.pointerId); } catch (_) {}
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: this.view() };
      return;
    }
    if (this.placing()) { this.place.emit(this.toWorld(e.clientX, e.clientY)); this.gesture = null; return; }
    if (this.drawMode()) {
      const w = this.toWorld(e.clientX, e.clientY);
      const pts = this.drawPoints();
      if (this.drawKind() !== 'line' && pts.length >= 3) {
        const f = pts[0], s = this.view().s;
        if (Math.hypot((f.x - w.x) * s, (f.y - w.y) * s) < 12) {
          // Clicking the first point closes the shape: a polygon section, or a ring of seats.
          if (this.drawKind() === 'segrow') this.drawClose.emit(); else this.drawCommit.emit();
          this.gesture = null; return;
        }
      }
      this.drawAddPoint.emit(w); this.gesture = null; return;
    }
    const target = e.target as Element;
    // Drag-to-rotate: the handle carries data-rot-handle; rotate about the object centre.
    if (this.mode() === 'editor' && target.closest?.('[data-rot-handle]')) {
      const rid = this.objAt(target);
      const ro = this.venue().objects.find((o) => o.id === rid);
      if (rid && ro) { const b = objBounds(ro); this.gesture = { type: 'rotate', id: rid, cx: (b.x1 + b.x2) / 2, cy: (b.y1 + b.y2) / 2 }; return; }
    }
    if (target.closest?.('[data-seat]')) return; // seat handles its own click
    const oid = this.objAt(target);
    const mode = this.mode();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey; // Windows: Ctrl-click adds/removes
    // Pan with the middle mouse button or while holding Space (both modes).
    if (e.button === 1 || this.spaceDown) {
      this.gesture = { type: 'pan', x: e.clientX, y: e.clientY, v: this.view(), downId: oid, moved: false };
      return;
    }
    if (mode === 'editor' && oid) {
      if (additive) { this.select.emit({ ids: [oid], additive: true }); this.gesture = null; return; }
      if (!this.selection()?.has(oid)) this.select.emit({ ids: [oid], additive: false });
      this.moveStart.emit();
      this.gesture = { type: 'drag', start: this.toWorld(e.clientX, e.clientY), moved: false };
    } else if (mode === 'editor') {
      // Empty canvas → rubber-band marquee (Windows-style; no modifier needed).
      const w = this.toWorld(e.clientX, e.clientY);
      this.gesture = { type: 'marquee', start: w, additive };
      this.marquee.set({ x1: w.x, y1: w.y, x2: w.x, y2: w.y });
    } else {
      this.gesture = { type: 'pan', x: e.clientX, y: e.clientY, v: this.view(), downId: oid, moved: false };
    }
  }

  onPointerMove(e: PointerEvent) {
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.placing()) { this.placeCursor.emit(this.toWorld(e.clientX, e.clientY)); return; }
    if (this.drawMode()) { this.drawCursorChange.emit(this.toWorld(e.clientX, e.clientY)); return; }
    const g = this.gesture; if (!g) return;
    if (g.type === 'pinch' && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const r = this.svgRef().nativeElement.getBoundingClientRect();
      const v0 = g.v, f = d / g.d;
      const ns = Math.max(0.25, Math.min(2.6, v0.s * f));
      const wx = (g.mid.x - r.left - v0.tx) / v0.s, wy = (g.mid.y - r.top - v0.ty) / v0.s;
      this.view.set({ s: ns, tx: (mid.x - r.left) - wx * ns, ty: (mid.y - r.top) - wy * ns });
      return;
    }
    if (g.type === 'pan') {
      if (Math.abs(e.clientX - g.x) + Math.abs(e.clientY - g.y) > 3) g.moved = true;
      this.view.set({ ...g.v, tx: g.v.tx + (e.clientX - g.x), ty: g.v.ty + (e.clientY - g.y) });
    } else if (g.type === 'drag') {
      const w = this.toWorld(e.clientX, e.clientY);
      g.moved = true;
      this.move.emit({ dx: w.x - g.start.x, dy: w.y - g.start.y });
    } else if (g.type === 'marquee') {
      const w = this.toWorld(e.clientX, e.clientY);
      this.marquee.set({ x1: g.start.x, y1: g.start.y, x2: w.x, y2: w.y });
    } else if (g.type === 'rotate') {
      const w = this.toWorld(e.clientX, e.clientY);
      let deg = (Math.atan2(w.y - g.cy, w.x - g.cx) * 180) / Math.PI + 90; // handle is at the object's local top
      deg = ((deg % 360) + 360) % 360;
      deg = this.snap() ? Math.round(deg / 15) * 15 : Math.round(deg);
      this.rotate.emit({ id: g.id, deg });
    }
  }

  onPointerUp(e: PointerEvent) {
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (g?.type === 'drag') this.moveEnd.emit(g.moved);
    if (g?.type === 'pan' && !g.moved && this.mode() === 'editor' && !g.downId) this.select.emit({ ids: [], additive: false });
    if (g?.type === 'pan' && !g.moved && this.mode() === 'viewer' && g.downId) {
      const zo = this.venue().objects.find((o) => o.id === g.downId && (o.type === 'zone' || o.type === 'polygon'));
      if (zo) this.zonePick.emit(zo);
    }
    if (g?.type === 'marquee') {
      const end = this.toWorld(e.clientX, e.clientY);
      const dragged = Math.abs(end.x - g.start.x) > 3 || Math.abs(end.y - g.start.y) > 3;
      if (dragged) {
        const m = { x1: Math.min(g.start.x, end.x), x2: Math.max(g.start.x, end.x), y1: Math.min(g.start.y, end.y), y2: Math.max(g.start.y, end.y) };
        const hit = this.venue().objects.filter((o) => { const b = objBounds(o); return b.x1 < m.x2 && b.x2 > m.x1 && b.y1 < m.y2 && b.y2 > m.y1; }).map((o) => o.id);
        this.select.emit({ ids: hit, additive: g.additive });
      } else if (!g.additive) {
        // A plain click on empty canvas clears the selection.
        this.select.emit({ ids: [], additive: false });
      }
      this.marquee.set(null);
    }
    if (this.pointers.size < 2) this.gesture = null;
  }
}
