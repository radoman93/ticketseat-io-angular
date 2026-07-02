// seat-data.ts — venue data model, sample layouts, geometry helpers.
// Port of editor/seat-data.jsx (Seat Map Studio design).

export type ObjType = 'stage' | 'row' | 'table' | 'zone' | 'polygon' | 'label' | 'marker' | 'line';
export type SeatStatus = 'available' | 'sold' | 'held';

export interface Seat { n: number; status: SeatStatus; }
export interface Pt { x: number; y: number; a?: number; }
export interface Tier { id: string; name: string; color: string; price: number; }

export interface VObj {
  id: string;
  type: ObjType;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  r?: number;
  label?: string;
  text?: string;
  size?: number;
  color?: string;              // label text colour / line colour
  thickness?: number;          // line: stroke width
  shape?: 'arc' | 'rect' | 'round';
  seats?: Seat[] | number;     // row: Seat[]; table: number
  seatGap?: number;
  arc?: number;
  tier?: string;
  capacity?: number;
  points?: Pt[];
  path?: Pt[];                 // segmented row: polyline vertices (seats spread along it)
  closed?: boolean;            // segmented row: join last vertex back to first (ring of seats)
  faceAlong?: boolean;         // segmented row: rotate chairs to follow the line (else face front)
  kind?: string;
  openSpaces?: number;         // round table: leave a contiguous gap of N chairs in the ring
  rotation?: number;           // point-based objects: rotation about own x,y (degrees)
  up?: number;                 // rect table: chairs on top edge
  down?: number;               // rect table: chairs on bottom edge
  left?: number;               // rect table: chairs on left edge
  right?: number;              // rect table: chairs on right edge
}

export interface Venue { name: string; kind: string; objects: VObj[]; tiers: Tier[]; }

// ── Tiers ────────────────────────────────────────────────────────────────────
export const TIERS: Tier[] = [
  { id: 'vip',      name: 'VIP / Front',  color: '#6668ee', price: 180 },
  { id: 'premium',  name: 'Premium',      color: '#3b82f6', price: 120 },
  { id: 'standard', name: 'Standard',     color: '#0c9d6e', price: 75  },
  { id: 'value',    name: 'Value',        color: '#b9750a', price: 45  },
];

export const TIER_COLORS = ['#6668ee', '#3b82f6', '#0c9d6e', '#b9750a', '#e1306c', '#8b5cf6', '#0d9488', '#d83a3a', '#0ea5e9', '#64748b'];

export const tierById = (tiers: Tier[] | undefined, id: string | undefined): Tier => {
  const list = tiers && tiers.length ? tiers : TIERS;
  return list.find((t) => t.id === id) || list[0];
};
const freshTiers = (): Tier[] => TIERS.map((t) => ({ ...t }));

// ── ID factory ───────────────────────────────────────────────────────────────
let _seq = 0;
export const uid = (p = 'o') => `${p}_${(_seq++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ── Geometry ─────────────────────────────────────────────────────────────────
/** Segment metadata for a polyline: endpoints, length, and tangent angle (deg). */
function polySegments(verts: Pt[]) {
  return verts.slice(0, -1).map((a, i) => {
    const b = verts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    return { a, b, len: Math.hypot(dx, dy), ang: (Math.atan2(dy, dx) * 180) / Math.PI };
  });
}

/** Place `count` seats at FIXED spacing `gap` measured FROM THE FIRST vertex.
 *  Anchoring to the start is what keeps earlier seats put when you add more
 *  segments — only new seats appear on the extension. Each point carries `a`
 *  (its segment's tangent angle) for the optional rotate-chairs mode. */
function placeAlong(verts: Pt[], gap: number, count: number): Pt[] {
  const segs = polySegments(verts);
  if (!segs.length) return [];
  const total = segs.reduce((s, q) => s + q.len, 0);
  const out: Pt[] = [];
  for (let k = 0; k < count; k++) {
    let d = Math.min(k * gap, total), i = 0;
    while (i < segs.length - 1 && d > segs[i].len) { d -= segs[i].len; i++; }
    const s = segs[i], t = s.len ? d / s.len : 0;
    out.push({ x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t, a: s.ang });
  }
  return out;
}

// Seats for a committed segmented row — fixed spacing from the start.
export function pathRowPositions(row: VObj): Pt[] {
  const closed = !!row.closed;
  const verts = closed ? [...row.path!, row.path![0]] : row.path!;
  const gap = row.seatGap ?? 30;
  return placeAlong(verts, gap, segRowSeatCount(row.path!, gap, closed));
}

/** Grow/shrink a seats array to `n`, keeping existing seats + numbering. */
export function resizeSeats(seats: Seat[], n: number): Seat[] {
  if (n === seats.length) return seats;
  if (n < seats.length) return seats.slice(0, n);
  const out = seats.slice();
  const base = (seats[seats.length - 1]?.n ?? 100) + 1;
  for (let i = seats.length; i < n; i++) out.push({ n: base + (i - seats.length), status: 'available' });
  return out;
}

// How many seats a polyline yields at spacing `gap` — shared by preview, commit,
// and rendering so the count never drifts between them.
export function segRowSeatCount(points: Pt[], gap = 30, closed = false): number {
  if (points.length < (closed ? 3 : 2)) return 0;
  const verts = closed ? [...points, points[0]] : points;
  let total = 0;
  for (let i = 0; i < verts.length - 1; i++) total += Math.hypot(verts[i + 1].x - verts[i].x, verts[i + 1].y - verts[i].y);
  if (total === 0) return closed ? 3 : 2;
  return Math.max(closed ? 3 : 2, closed ? Math.round(total / gap) : Math.floor(total / gap) + 1);
}

// Live preview seats while drawing (path so far + cursor) — fixed spacing from start.
export function segRowPreview(points: Pt[], gap = 30, closed = false): Pt[] {
  const count = segRowSeatCount(points, gap, closed);
  if (!count) return [];
  const verts = closed ? [...points, points[0]] : points;
  return placeAlong(verts, gap, count);
}

export function rowSeatPositions(row: VObj): Pt[] {
  if (row.path && row.path.length >= 2) return pathRowPositions(row);
  const seats = row.seats as Seat[];
  const n = seats.length;
  const gap = row.seatGap ?? 30;
  const arc = row.arc ?? 0;
  const out: Pt[] = [];
  if (!arc || n < 2) {
    const span = (n - 1) * gap;
    for (let i = 0; i < n; i++) out.push({ x: (row.x ?? 0) - span / 2 + i * gap, y: row.y ?? 0 });
    return out;
  }
  const sweep = (arc * Math.PI) / 180;
  const R = ((n - 1) * gap) / sweep;
  const cx = row.x ?? 0, cy = (row.y ?? 0) - R;
  for (let i = 0; i < n; i++) {
    const t = (i - (n - 1) / 2) * (gap / R);
    out.push({ x: cx + R * Math.sin(t), y: cy + R * Math.cos(t) });
  }
  return out;
}

export function rowSeatAngle(row: VObj, i: number): number {
  const seats = row.seats as Seat[];
  const n = seats.length;
  if (!row.arc || n < 2) return 0;
  const gap = row.seatGap ?? 30;
  const sweep = (row.arc * Math.PI) / 180;
  const R = ((n - 1) * gap) / sweep;
  return ((i - (n - 1) / 2) * (gap / R) * 180) / Math.PI;
}

export function tableSeatPositions(t: VObj): Pt[] {
  const out: Pt[] = [];
  const n = t.seats as number;
  if (t.shape === 'round') {
    const R = (t.r ?? 30) + 17;
    // Render only `n - openSpaces` chairs, keeping them in the first slots of the
    // `n` evenly-spaced ring positions so a single contiguous gap appears.
    const open = Math.max(0, Math.min(n - 1, t.openSpaces ?? 0));
    const shown = n - open;
    for (let i = 0; i < shown; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: (t.x ?? 0) + R * Math.cos(a), y: (t.y ?? 0) + R * Math.sin(a), a: (a * 180) / Math.PI - 90 });
    }
  } else {
    const w = t.w || 120, h = t.h || 50;
    const cx = t.x ?? 0, cy = t.y ?? 0;
    const hasSides = t.up != null || t.down != null || t.left != null || t.right != null;
    if (hasSides) {
      // Per-side chairs: evenly spaced along each edge, facing outward.
      const edge = (count: number, horiz: boolean, sign: number, a: number) => {
        const m = count || 0;
        for (let k = 0; k < m; k++) {
          const f = (k + 0.5) / m; // even spacing along the edge
          if (horiz) out.push({ x: cx - w / 2 + w * f, y: cy + sign * (h / 2 + 15), a });
          else out.push({ x: cx + sign * (w / 2 + 15), y: cy - h / 2 + h * f, a });
        }
      };
      edge(t.up ?? 0, true, -1, 180);    // top edge, facing up
      edge(t.down ?? 0, true, 1, 0);     // bottom edge, facing down
      edge(t.left ?? 0, false, -1, 90);  // left edge, facing left
      edge(t.right ?? 0, false, 1, -90); // right edge, facing right
    } else {
      const per = Math.ceil(n / 2);
      const gap = w / per;
      for (let i = 0; i < n; i++) {
        const top = i < per;
        const k = top ? i : i - per;
        const x = cx - w / 2 + gap * (k + 0.5);
        out.push({ x, y: cy + (top ? -(h / 2 + 15) : h / 2 + 15), a: top ? 180 : 0 });
      }
    }
  }
  return out;
}

export interface RowSpec { label: string; x: number; y: number; count: number; gap?: number; arc?: number; tier?: string; startNum?: number; }
export function makeRow({ label, x, y, count, gap = 30, arc = 0, tier = 'standard', startNum = 101 }: RowSpec): VObj {
  return {
    id: uid('row'), type: 'row', label, x, y, seatGap: gap, arc, tier,
    seats: Array.from({ length: count }, (_, i): Seat => ({ n: startNum + i, status: 'available' })),
  };
}

export function makeTier(existing: Tier[] = []): Tier {
  const used = new Set(existing.map((t) => t.color));
  const color = TIER_COLORS.find((c) => !used.has(c)) || TIER_COLORS[existing.length % TIER_COLORS.length];
  return { id: uid('tier'), name: 'New tier', color, price: 50 };
}

// ── Bounds (from seat-canvas.jsx) ────────────────────────────────────────────
export interface Box { x1: number; y1: number; x2: number; y2: number; }
export function objBounds(o: VObj): Box {
  if (o.type === 'stage' || o.type === 'zone')
    return { x1: o.x! - o.w! / 2, y1: o.y! - o.h! / 2, x2: o.x! + o.w! / 2, y2: o.y! + o.h! / 2 };
  if (o.type === 'polygon') {
    const xs = o.points!.map((p) => p.x), ys = o.points!.map((p) => p.y);
    return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  }
  if (o.type === 'line') {
    const xs = o.path!.map((p) => p.x), ys = o.path!.map((p) => p.y);
    return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  }
  if (o.type === 'row') {
    const ps = rowSeatPositions(o);
    const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
    return { x1: Math.min(...xs) - 16, y1: Math.min(...ys) - 16, x2: Math.max(...xs) + 16, y2: Math.max(...ys) + 16 };
  }
  if (o.type === 'table') {
    const rad = (o.shape === 'round' ? o.r! : Math.max(o.w || 120, o.h || 50) / 2) + 34;
    return { x1: o.x! - rad, y1: o.y! - rad, x2: o.x! + rad, y2: o.y! + rad };
  }
  if (o.type === 'label') {
    const fs = o.size || 18;
    const w = Math.max(24, (o.text?.length || 1) * fs * 0.58);
    const h = fs * 1.4;
    return { x1: o.x! - w / 2, y1: o.y! - h / 2, x2: o.x! + w / 2, y2: o.y! + h / 2 };
  }
  return { x1: o.x! - 20, y1: o.y! - 24, x2: o.x! + 20, y2: o.y! + 20 }; // marker
}
export function venueBounds(objs: VObj[]): Box {
  if (!objs.length) return { x1: 0, y1: 0, x2: 1200, y2: 800 };
  const b = objs.map(objBounds);
  return {
    x1: Math.min(...b.map((q) => q.x1)), y1: Math.min(...b.map((q) => q.y1)),
    x2: Math.max(...b.map((q) => q.x2)), y2: Math.max(...b.map((q) => q.y2)),
  };
}
export function polyCentroid(points: Pt[]): { cx: number; cy: number } {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { cx, cy };
}

// ── Sample venues ────────────────────────────────────────────────────────────
function venueTheater(): Venue {
  const objects: VObj[] = [];
  objects.push({ id: uid('stage'), type: 'stage', x: 600, y: 90, w: 520, h: 84, label: 'STAGE', shape: 'arc' });
  const rows = 'ABCDEF';
  rows.split('').forEach((r, i) => {
    const count = 11 + (i % 2);
    const tier = i === 0 ? 'vip' : i < 2 ? 'premium' : i < 4 ? 'standard' : 'value';
    objects.push(makeRow({ label: `Row ${r}`, x: 600, y: 240 + i * 70, count, gap: 32, arc: 26, tier }));
  });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'entrance', x: 270, y: 660, label: 'Entrance' });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'exit', x: 930, y: 660, label: 'Exit' });
  return { name: 'Grand Theater', kind: 'theater', objects, tiers: freshTiers() };
}

function venueGrid(): Venue {
  const objects: VObj[] = [];
  objects.push({ id: uid('stage'), type: 'stage', x: 600, y: 80, w: 420, h: 70, label: 'SCREEN', shape: 'rect' });
  'ABCDEFG'.split('').forEach((r, i) => {
    const tier = i < 1 ? 'premium' : i < 4 ? 'standard' : 'value';
    objects.push(makeRow({ label: `Row ${r}`, x: 600, y: 220 + i * 60, count: 14, gap: 30, arc: 0, tier }));
  });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'exit', x: 300, y: 200, label: 'Exit' });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'exit', x: 900, y: 200, label: 'Exit' });
  return { name: 'Cinema 3', kind: 'grid', objects, tiers: freshTiers() };
}

function venueTables(): Venue {
  const objects: VObj[] = [];
  objects.push({ id: uid('stage'), type: 'stage', x: 600, y: 90, w: 360, h: 70, label: 'HEAD TABLE', shape: 'rect' });
  const cols = [380, 540, 700, 860], rows = [300, 470, 640];
  let t = 1;
  rows.forEach((y, ri) => cols.forEach((x, ci) => {
    if (ri === 2 && (ci === 0 || ci === 3)) return;
    const tier = ri === 0 ? 'vip' : ri === 1 ? 'premium' : 'standard';
    objects.push({ id: uid('tab'), type: 'table', x, y, shape: 'round', r: 30, seats: 8, label: `T${t++}`, tier });
  }));
  objects.push({ id: uid('mk'), type: 'marker', kind: 'bar', x: 600, y: 760, label: 'Bar' });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'entrance', x: 250, y: 470, label: 'Entrance' });
  return { name: 'Gala Ballroom', kind: 'tables', objects, tiers: freshTiers() };
}

function venueGA(): Venue {
  const objects: VObj[] = [];
  objects.push({ id: uid('stage'), type: 'stage', x: 600, y: 90, w: 600, h: 96, label: 'MAIN STAGE', shape: 'arc' });
  objects.push({ id: uid('z'), type: 'zone', x: 600, y: 330, w: 560, h: 180, label: 'Golden Circle', tier: 'vip', capacity: 400 });
  objects.push({ id: uid('z'), type: 'zone', x: 600, y: 560, w: 720, h: 220, label: 'General Admission', tier: 'standard', capacity: 1800 });
  objects.push({ id: uid('z'), type: 'zone', x: 250, y: 470, w: 150, h: 360, label: 'Left Stand', tier: 'premium', capacity: 300 });
  objects.push({ id: uid('z'), type: 'zone', x: 950, y: 470, w: 150, h: 360, label: 'Right Stand', tier: 'premium', capacity: 300 });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'bar', x: 250, y: 720, label: 'Bar' });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'entrance', x: 600, y: 760, label: 'Entrance' });
  return { name: 'Open Air Festival', kind: 'ga', objects, tiers: freshTiers() };
}

function venueSections(): Venue {
  const objects: VObj[] = [];
  objects.push({ id: uid('stage'), type: 'stage', x: 600, y: 80, w: 540, h: 80, label: 'STAGE', shape: 'arc' });
  'ABCD'.split('').forEach((r, i) => {
    objects.push(makeRow({ label: `Front ${r}`, x: 600, y: 230 + i * 58, count: 12, gap: 30, arc: 18, tier: i < 2 ? 'vip' : 'premium' }));
  });
  objects.push({ id: uid('z'), type: 'zone', x: 600, y: 560, w: 540, h: 180, label: 'GA Floor', tier: 'standard', capacity: 900 });
  objects.push({ id: uid('z'), type: 'zone', x: 250, y: 430, w: 150, h: 320, label: 'Left Tier', tier: 'value', capacity: 240 });
  objects.push({ id: uid('z'), type: 'zone', x: 950, y: 430, w: 150, h: 320, label: 'Right Tier', tier: 'value', capacity: 240 });
  objects.push({ id: uid('mk'), type: 'marker', kind: 'entrance', x: 600, y: 720, label: 'Entrance' });
  return { name: 'Arena Mixed', kind: 'sections', objects, tiers: freshTiers() };
}

export const VENUES: Record<string, () => Venue> = {
  theater: venueTheater,
  grid: venueGrid,
  tables: venueTables,
  ga: venueGA,
  sections: venueSections,
};

export const VENUE_META = [
  { id: 'theater',  name: 'Grand Theater',     sub: 'Curved raked rows' },
  { id: 'grid',     name: 'Cinema 3',          sub: 'Straight grid rows' },
  { id: 'tables',   name: 'Gala Ballroom',     sub: 'Round banquet tables' },
  { id: 'ga',       name: 'Open Air Festival', sub: 'General admission zones' },
  { id: 'sections', name: 'Arena Mixed',       sub: 'Reserved + GA zones' },
];

// helper: count seats for a tier (used in TierManager)
/** Effective chair count for a table — honours per-side counts and round open spaces. */
export function tableSeats(o: VObj): number {
  const hasSides = o.up != null || o.down != null || o.left != null || o.right != null;
  if (o.shape !== 'round' && hasSides) return (o.up ?? 0) + (o.down ?? 0) + (o.left ?? 0) + (o.right ?? 0);
  const n = (o.seats as number) || 0;
  return o.shape === 'round' ? Math.max(0, n - (o.openSpaces ?? 0)) : n;
}

export function seatCountForTier(venue: Venue, id: string): number {
  return venue.objects.reduce((n, o) => {
    if (o.tier !== id) return n;
    if (o.type === 'row') return n + (o.seats as Seat[]).length;
    if (o.type === 'table') return n + tableSeats(o);
    if (o.type === 'zone' || o.type === 'polygon') return n + (o.capacity || 0);
    return n;
  }, 0);
}
