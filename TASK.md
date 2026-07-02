# TASK.md — Seat Map Studio: feature/bug batch (from user list)

Base: origin/main @ v1.10.0. Studio at `src/app/seat-map-studio/`.

## The list (10 items)
| # | Item | Batch | Status |
|---|------|-------|--------|
| 3/4 | Segmented row: seats drift when adding segments; spawn mid not from start | 1 | ▶ |
| 7 | Segmented row: toggle to rotate chairs (face front vs follow line) | 1 | ▶ |
| 10 | Label bounding box wrong when font size changes | 1 | ▶ |
| 9 | Can't change grid size | 1 | ▶ |
| 8 | Objects column not scrollable | 1 | verify |
| 2 | Round table: open spaces (skip chairs) | 2 | ⏳ |
| 5 | Table rotation (and general rotate) | 2 | ⏳ |
| 6 | Table: per-side chair counts (top/bottom/left/right) | 2 | ⏳ |
| 1 | Import / Export layout (JSON) | 3 | ⏳ |

## Batch 1 — bugs + quick wins (this pass)
- [ ] Segmented row seats: fixed spacing FROM START (k*gap), count from gap not array.
      Anchors seats so earlier segments don't move when you add points.
      `seat-data`: rewrite `pathRowPositions` + `segRowPreview` to share `segRowSeatCount`.
- [ ] `faceAlong?: boolean` on row; canvas applies segment angle only when set; inspector "Chair facing" toggle.
- [ ] Resize seats array when seatGap changes on a path row (`resizeSeats` helper + studio.patch).
- [ ] Replace path-row seat stepper with a Seat-spacing slider (count is derived).
- [ ] `objBounds` label: compute w/h from font size + text length.
- [ ] Grid size: `gridPx` signal; canvas `grid` input drives the pattern; snap uses gridPx;
      topbar grid flag cycles Off → 10 → 25 → 50 → 100.
- [ ] Verify objects list scrolls with many items; fix flex chain if not.

## Batch 2 — table features
- [ ] Round table `openSpaces` (skip N seat slots).
- [ ] Rotation field + inspector control; apply transform in canvas; rotate seats.
- [ ] Rectangle table per-side counts (up/down/left/right) → `tableSeatPositions`.

## Batch 3 — persistence
- [ ] Export venue to JSON (download) + Import from file; buttons in header/topbar.

## Notes
- Keep changes token-driven and AOT-safe (verify `build:lib`).
- Canvas seat mapping must be crash-safe if seats.length != positions (fallback seat).
