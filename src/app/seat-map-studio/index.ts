// Public API for the Seat Map Studio (modern editor/viewer).
// Re-exported from the library root via public-api.ts.

// Main component — the full editor + viewer app shell.
export { SeatMapStudioComponent } from './seat-map-studio.component';

// Advanced: the standalone pan/zoom canvas + its palette (compose your own chrome).
export { SeatCanvasComponent, SeatComponent, SeatPalette } from './seat-canvas.component';
export type { Pal } from './seat-canvas.component';

// Data model + types.
export type {
  Venue, VObj, Tier, Seat, Pt, Box, ObjType, SeatStatus, RowSpec,
} from './seat-data';
export {
  TIERS, TIER_COLORS, VENUES, VENUE_META,
  tierById, makeRow, makeTier, uid,
  rowSeatPositions, rowSeatAngle, tableSeatPositions,
  objBounds, venueBounds, polyCentroid, seatCountForTier,
} from './seat-data';

// Viewer order/availability types + helper.
export type { OrderLine, TierStat } from './viewer-ui';
export { tierStats } from './viewer-ui';

// Layout import/export helpers (save/load a Venue as JSON).
export { exportVenueJSON, parseVenueJSON, downloadVenue } from './seat-io';
