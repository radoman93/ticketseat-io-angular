// viewer-ui.ts — viewer chrome components. Port of editor/seat-viewer.jsx.
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';
import { Seat, TIERS, Tier, VObj, Venue, tierById } from './seat-data';

const DISPLAY_CONTENTS = ':host{display:contents;}';
const fmt = (n: number) => '$' + n.toLocaleString();

export interface OrderLine { id: string; kind: 'seat' | 'ga'; label: string; tierId: string; price: number; }
export interface TierStat { tier: Tier; seats: number; avail: number; zoneCap: number; }

export function tierStats(venue: Venue): TierStat[] {
  const m: Record<string, TierStat> = {};
  const tiers = venue.tiers || TIERS;
  const fallback = () => Object.values(m)[0];
  tiers.forEach((t) => (m[t.id] = { tier: t, seats: 0, avail: 0, zoneCap: 0 }));
  venue.objects.forEach((o) => {
    if (o.type === 'row') (o.seats as Seat[]).forEach((s) => { const k = m[o.tier!] || fallback(); if (!k) return; k.seats++; if (s.status === 'available') k.avail++; });
    if (o.type === 'zone') { const k = m[o.tier!] || fallback(); if (k) k.zoneCap += o.capacity || 0; }
    if (o.type === 'table') { const k = m[o.tier!] || fallback(); if (k) { k.seats += o.seats as number; k.avail += o.seats as number; } }
  });
  return tiers.map((t) => m[t.id]).filter((x) => x.seats || x.zoneCap);
}

// ── tier legend / section navigator ──────────────────────────────────────────
@Component({
  selector: 'vw-legend', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="vw-legend">
      <div class="panel-head">
        <span>{{ mode() === 'zoom' ? 'Sections' : 'Pricing' }}</span>
        @if (mode() === 'zoom' && focusTier()) {
          <button class="vw-back" (click)="focus.emit(null)"><sms-icon name="ZoomOut" [s]="13"/> Overview</button>
        }
      </div>
      <div class="legend-list">
        @for (s of stats(); track s.tier.id) {
          <button class="legend-row" [class.nav]="mode() === 'zoom'" [class.on]="focusTier() === s.tier.id" (click)="onClick(s)">
            <i class="legend-dot" [style.background]="s.tier.color"></i>
            <span class="legend-name">{{ s.tier.name }}</span>
            <span class="legend-meta mono">{{ s.zoneCap ? s.zoneCap + ' GA' : s.avail + ' left' }}</span>
            <b class="legend-price">{{ fmt(s.tier.price) }}</b>
            @if (mode() === 'zoom') { <sms-icon class="legend-chev" name="ZoomIn" [s]="14"/> }
          </button>
        }
      </div>
    </div>`,
})
export class TierLegendComponent {
  venue = input.required<Venue>();
  mode = input<'zoom' | 'legend'>('legend');
  focusTier = input<string | null>(null);
  focus = output<string | null>();
  currency = input<string>('$');
  fmt = (n: number) => this.currency() + n.toLocaleString();
  stats = computed(() => tierStats(this.venue()));
  onClick(s: TierStat) {
    const isZoom = this.mode() === 'zoom';
    this.focus.emit(isZoom ? (this.focusTier() === s.tier.id ? null : s.tier.id) : s.tier.id);
  }
}

// ── order panel ──────────────────────────────────────────────────────────────
@Component({
  selector: 'vw-order', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="vw-order">
      <div class="panel-head"><span>Your order</span><b class="mono">{{ order().length }}</b></div>
      @if (order().length === 0) {
        <div class="order-empty">
          <span class="insp-ic"><sms-icon name="Cart" [s]="20"/></span>
          <p>Tap a seat on the map to add it to your order.</p>
        </div>
      } @else {
        <div class="order-scroll">
          @for (l of order(); track l.id) {
            <div class="order-line">
              <i class="legend-dot" [style.background]="tier(l).color"></i>
              <div class="order-info"><b>{{ l.label }}</b><span class="mono">{{ tier(l).name }}</span></div>
              <span class="order-price mono">{{ fmt(l.price) }}</span>
              <button class="order-x" (click)="remove.emit(l.id)"><sms-icon name="Add" [s]="14" [rot]="45"/></button>
            </div>
          }
        </div>
      }
      <div class="order-foot">
        <div class="order-sums">
          <div class="sum-row"><span>Subtotal</span><span class="mono">{{ fmt(sub()) }}</span></div>
          <div class="sum-row muted"><span>Service fee</span><span class="mono">{{ fmt(sub() ? fee() : 0) }}</span></div>
          <div class="sum-row total"><span>Total</span><span class="mono">{{ fmt(total()) }}</span></div>
        </div>
        <button class="vw-cta" [disabled]="!order().length" (click)="checkout.emit()">
          <sms-icon name="Check" [s]="16"/> {{ order().length ? 'Checkout · ' + fmt(total()) : 'Select seats' }}
        </button>
        <div class="order-trust mono"><sms-icon name="Check" [s]="12"/> Secure checkout · seats held 10:00</div>
      </div>
    </div>`,
})
export class OrderPanelComponent {
  order = input<OrderLine[]>([]);
  venue = input.required<Venue>();
  remove = output<string>(); checkout = output<void>();
  currency = input<string>('$');
  fmt = (n: number) => this.currency() + n.toLocaleString();
  sub = computed(() => this.order().reduce((n, l) => n + l.price, 0));
  fee = computed(() => Math.round(this.sub() * 0.12));
  total = computed(() => this.sub() + (this.sub() ? this.fee() : 0));
  tier(l: OrderLine) { return tierById(this.venue().tiers, l.tierId); }
}

// ── seat list (list+map mode) ────────────────────────────────────────────────
@Component({
  selector: 'vw-seatlist', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <div class="vw-seatlist">
      <div class="panel-head"><span>Available seats</span></div>
      <div class="seatlist-scroll">
        @for (r of rows(); track r.id) {
          @if (hasAvail(r)) {
            <div class="seatlist-group">
              <div class="seatlist-rowhead">
                <i class="legend-dot" [style.background]="tier(r).color"></i>
                <b>{{ r.label }}</b><span class="mono">{{ tier(r).name }} · {{ fmt(tier(r).price) }}</span>
              </div>
              <div class="seatlist-seats">
                @for (s of seatsOf(r); track s.n) {
                  <button class="seat-chip" [class.on]="selectedKeys().has(key(r, s))" [class.sold]="s.status === 'sold'"
                          [disabled]="s.status === 'sold'"
                          [style.background]="selectedKeys().has(key(r, s)) ? tier(r).color : null"
                          [style.borderColor]="selectedKeys().has(key(r, s)) ? tier(r).color : null"
                          (click)="pick.emit({ row: r, seat: s, tier: tier(r) })">{{ s.n }}</button>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>`,
})
export class SeatListPanelComponent {
  venue = input.required<Venue>();
  selectedKeys = input<Set<string>>(new Set());
  pick = output<{ row: VObj; seat: Seat; tier: Tier }>();
  currency = input<string>('$');
  fmt = (n: number) => this.currency() + n.toLocaleString();
  rows = computed(() => this.venue().objects.filter((o) => o.type === 'row'));
  tier(r: VObj) { return tierById(this.venue().tiers, r.tier); }
  seatsOf(r: VObj) { return r.seats as Seat[]; }
  hasAvail(r: VObj) { return (r.seats as Seat[]).some((s) => s.status === 'available'); }
  key(r: VObj, s: Seat) { return `${r.id}:${s.n}`; }
}

// ── mobile order bar ─────────────────────────────────────────────────────────
@Component({
  selector: 'vw-bar', standalone: true, imports: [IconComponent], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: [DISPLAY_CONTENTS],
  template: `
    <button class="vw-bar" (click)="open.emit()" [disabled]="!order().length">
      <div class="vw-bar-l">
        <span class="vw-bar-count mono">{{ order().length }}</span>
        <span>{{ order().length ? ('seat' + (order().length > 1 ? 's' : '') + ' selected') : 'No seats yet' }}</span>
      </div>
      <div class="vw-bar-r">
        <b class="mono">{{ fmt(total()) }}</b>
        <span class="vw-bar-go">Order <sms-icon name="Cart" [s]="15"/></span>
      </div>
    </button>`,
})
export class ViewerBarComponent {
  order = input<OrderLine[]>([]);
  open = output<void>();
  currency = input<string>('$');
  fmt = (n: number) => this.currency() + n.toLocaleString();
  total = computed(() => { const sub = this.order().reduce((n, l) => n + l.price, 0); return sub + (sub ? Math.round(sub * 0.12) : 0); });
}
