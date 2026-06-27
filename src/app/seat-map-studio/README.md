# Seat Map Studio

A modern, self-contained seat-map **editor + viewer** for Angular (standalone, signals-based).
It supports curved/straight seat rows, round & long tables, **price tiers**, **GA zones**,
free-drawn **polygon sections**, stage shapes, markers and text labels — with pan/zoom,
undo/redo, a properties inspector, add wizards, dark mode and a responsive mobile layout.

> This is a **new** public surface, separate from the classic `app-event-editor` /
> `app-event-viewer` components. It uses its own `Venue` data model (tiers, zones, GA) rather
> than `LayoutExportData` / `Chair`. The two can coexist; pick whichever fits your project.

---

## Install

```bash
npm install @radoman93/ticketseat-io-angular
```

### Font (required for 1:1 visuals)

The design uses the **Geist** / **Geist Mono** typefaces. Add to your `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

> No CSS import is needed — component styles are bundled with the component.
> Requires a modern browser (uses CSS `color-mix()`).

---

## Quick start

The component is **standalone** — import it directly. By default it fills the viewport
(`position: fixed`) and loads the built-in "Grand Theater" sample.

```ts
import { Component } from '@angular/core';
import { SeatMapStudioComponent } from '@radoman93/ticketseat-io-angular';

@Component({
  selector: 'app-seating',
  standalone: true,
  imports: [SeatMapStudioComponent],
  template: `<app-seat-map-studio (venueChange)="onChange($event)" />`,
})
export class SeatingComponent {
  onChange(venue: unknown) { /* persist */ }
}
```

### Load your own layout, hide the sample switcher, embed in a box

```ts
import { Component, signal } from '@angular/core';
import {
  SeatMapStudioComponent, Venue, OrderLine, makeRow,
} from '@radoman93/ticketseat-io-angular';

@Component({
  standalone: true,
  imports: [SeatMapStudioComponent],
  template: `
    <div style="height: 80vh">
      <app-seat-map-studio
        [embedded]="true"
        [showVenueSwitcher]="false"
        [initialVenue]="venue()"
        initialMode="viewer"
        initialTheme="light"
        (venueChange)="onVenueChange($event)"
        (orderChange)="onOrderChange($event)"
        (checkoutClick)="onCheckout($event)" />
    </div>
  `,
})
export class EmbeddedSeating {
  venue = signal<Venue>({
    name: 'My Hall',
    kind: 'theater',
    tiers: [
      { id: 'vip',      name: 'VIP',      color: '#6668ee', price: 150 },
      { id: 'standard', name: 'Standard', color: '#0c9d6e', price: 60  },
    ],
    objects: [
      { id: 'stage', type: 'stage', x: 600, y: 90, w: 520, h: 84, label: 'STAGE', shape: 'arc' },
      makeRow({ label: 'Row A', x: 600, y: 240, count: 12, gap: 32, arc: 26, tier: 'vip' }),
      makeRow({ label: 'Row B', x: 600, y: 310, count: 12, gap: 32, arc: 26, tier: 'standard' }),
    ],
  });

  onVenueChange(v: Venue) { /* save edits */ }
  onOrderChange(order: OrderLine[]) { /* live cart */ }
  onCheckout(order: OrderLine[]) { /* go to payment */ }
}
```

---

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `initialVenue` | `Venue \| undefined` | `undefined` | Seed layout. If omitted, loads the built-in "Grand Theater". |
| `initialMode` | `'editor' \| 'viewer'` | `'editor'` | Starting mode. |
| `initialTheme` | `'light' \| 'dark'` | `'light'` | Starting app-chrome theme (canvas stays light). |
| `showVenueSwitcher` | `boolean` | `true` | Show the built-in sample-venue dropdown. Set `false` for a single layout. |
| `embedded` | `boolean` | `false` | `true` ⇒ fills its host box (`position: relative; height: 100%`) instead of the full viewport. |
| `reservedIds` | `string[] \| null` | `null` | Seat IDs (`"<objectId>:<seatNumber>"`) reserved/sold externally. Overlaid **live** on the viewer as `held` (non-selectable). **Reactive** - update it (e.g. from a WebSocket) and the map recolors without recreating. |
| `seatLimit` | `number` | `0` | Max seats a viewer may select (`0` = unlimited). Enforced at the click - over-limit picks are rejected and emit `limitReached`. |
| `readonly` | `boolean` | `false` | Read-only viewer: seats are not selectable and the order panel/checkout is hidden. For display-only embeds. |
| `showOrderPanel` | `boolean` | `true` | Show the built-in order panel + checkout in viewer mode (ignored when `readonly`). Set `false` to drive selection purely via `orderChange` from your own cart UI. |

> **Seed vs. reactive:** `initialVenue` / `initialMode` / `initialTheme` are **seed values** applied
> on init - re-assigning them later won't reset the studio. `reservedIds`, `seatLimit`, `readonly`
> and `showOrderPanel` are **live** - changing them updates the running studio.

## Outputs

| Output | Payload | Fires when |
|---|---|---|
| `venueChange` | `Venue` | The layout changes (add/move/edit/delete/tier/venue load). |
| `orderChange` | `OrderLine[]` | The viewer order (selected seats / GA) changes. |
| `modeChange` | `'editor' \| 'viewer'` | The editor/viewer toggle changes. |
| `themeChange` | `'light' \| 'dark'` | The theme toggle changes. |
| `checkoutClick` | `OrderLine[]` | The viewer "Checkout" button is pressed. |
| `limitReached` | `number` | A seat pick was blocked because `seatLimit` was hit (payload = the limit). |

---

## Data model

```ts
interface Venue {
  name: string;
  kind: string;                 // free label, e.g. 'theater' | 'tables' | 'ga'
  objects: VObj[];
  tiers: Tier[];
}

interface Tier { id: string; name: string; color: string; price: number; }

interface VObj {
  id: string;
  type: 'stage' | 'row' | 'table' | 'zone' | 'polygon' | 'label' | 'marker';
  x?: number; y?: number;       // center (most objects)
  w?: number; h?: number;       // stage / zone / long table
  r?: number;                   // round table radius
  shape?: 'arc' | 'rect' | 'round';
  label?: string; text?: string; size?: number;
  seats?: Seat[] | number;      // row: Seat[]   table: seat count
  seatGap?: number; arc?: number; // row spacing / curvature (degrees)
  tier?: string;                // tier id
  capacity?: number;            // zone / polygon GA capacity
  points?: Pt[];                // polygon vertices
  kind?: string;                // marker: 'entrance' | 'exit' | 'bar'
}

interface Seat { n: number; status: 'available' | 'sold' | 'held'; }
interface Pt { x: number; y: number; }

interface OrderLine { id: string; kind: 'seat' | 'ga'; label: string; tierId: string; price: number; }
```

### Helpers (exported)

| Helper | Use |
|---|---|
| `makeRow({ label, x, y, count, gap?, arc?, tier?, startNum? })` | Build a seat row. |
| `makeTier(existing?)` | New tier with the next unused swatch. |
| `tierById(tiers, id)` | Resolve a tier (falls back gracefully). |
| `tierStats(venue)` | Per-tier availability/price summary. |
| `seatCountForTier(venue, id)` | Total seats/capacity for a tier. |
| `objBounds(o)` / `venueBounds(objs)` | World-space bounding boxes. |
| `rowSeatPositions` / `rowSeatAngle` / `tableSeatPositions` | Seat geometry. |
| `TIERS`, `TIER_COLORS`, `VENUES`, `VENUE_META` | Defaults + the 5 sample venues. |

### Built-in sample venues

`VENUES.theater()`, `VENUES.grid()`, `VENUES.tables()`, `VENUES.ga()`, `VENUES.sections()`
each return a ready `Venue`. `VENUE_META` lists their ids, names and subtitles (used by the
built-in switcher).

---

## Advanced: bring your own chrome

`SeatCanvasComponent` (`<sms-canvas>`) is the standalone pan/zoom SVG canvas used by both modes.
It exposes `venue`, `mode`, `selection`, `selectedSeats` inputs and `select` / `move` /
`seatClick` / `zonePick` / `scaleChange` outputs, plus imperative `fit()`, `zoomBy()`,
`focus()`, `getCenterWorld()` methods (via a template ref). Use it if you want the canvas
without the editor/viewer panels.

---

## Migration note

The classic `app-event-editor` / `app-event-viewer` (with `LayoutExportData`, `reservedIds`,
`seatLimit`, the reservation panel and the exported MobX stores) are **unchanged** and still
available. Seat Map Studio is additive — adopt it per page/route. There is currently **no
automatic converter** between `LayoutExportData` and `Venue`; map the fields you need if you
must interop.
