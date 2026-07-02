// seat-io.ts — layout import/export helpers (save/load a Venue as a JSON file).
// A Venue is already plain-JSON-serializable, so this is thin: wrap on write,
// unwrap + validate on read, and trigger a browser download.
import { Tier, Venue, VObj } from './seat-data';

/** Wrapped envelope written to disk. Lets us version the on-disk format and
 *  fingerprint files as ours without touching the Venue shape. */
interface VenueFile { app: string; version: number; venue: Venue; }

/** Serialize a venue to a pretty-printed JSON string (wrapped envelope). */
export function exportVenueJSON(venue: Venue): string {
  return JSON.stringify({ app: 'ticketseat-studio', version: 1, venue }, null, 2);
}

/** Slugify a name into a safe filename stem (lowercase, dashes, no punctuation). */
function slugify(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse JSON text into a Venue. Accepts either the wrapped `{ venue }` envelope
 *  or a raw Venue object. Throws a friendly Error if the shape isn't a seat map. */
export function parseVenueJSON(text: string): Venue {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('That file isn\'t a seat map.'); }

  const wrapped = data as Partial<VenueFile> | null;
  const raw = (wrapped && typeof wrapped === 'object' && 'venue' in wrapped)
    ? wrapped.venue
    : data;

  const v = raw as Partial<Venue> | null;
  if (!v || typeof v !== 'object' || !Array.isArray(v.objects)) {
    throw new Error('That file isn\'t a seat map.');
  }

  return {
    name: typeof v.name === 'string' ? v.name : 'Imported layout',
    kind: typeof v.kind === 'string' ? v.kind : 'custom',
    objects: v.objects as VObj[],
    tiers: Array.isArray(v.tiers) ? (v.tiers as Tier[]) : [],
  };
}

/** Trigger a browser download of the venue as a JSON file. No-op off-browser. */
export function downloadVenue(venue: Venue, filename?: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([exportVenueJSON(venue)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `${slugify(venue.name) || 'venue'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
