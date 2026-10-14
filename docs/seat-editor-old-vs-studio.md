# Seat editor: Pavle's editor vs Seat Map Studio

*Compared 2026-10-14 in `ticketseat-io-angular` (v1.21.0 + local fixes).*

- **Pavle's editor:** `EventEditorComponent` / `EventViewerComponent`, `src/app/components/**`, 131 commits by Pavle up to 2026-05-01.
- **Seat Map Studio:** `src/app/seat-map-studio/**`, built 2026-06-27 to 07-02. This is what the admin and the store use today.

## 1. Two different products, not two versions

Studio is a rewrite, not a port. It has its own data format, seat ids, renderer and state. It does not use MobX, and it shares no code with Pavle's components.

| | Pavle's editor | Seat Map Studio |
|---|---|---|
| Saved format | `LayoutExportData`: `meta`, `settings`, `elements[]`; each element carries `chairs[]` | `Venue`: `name`, `kind`, `objects[]`, `tiers[]`; rows carry `seats[{ n, status }]` |
| Seat id (stored on tickets) | `<elementId>-chair-<index>`; segmented rows `<id>-seg<s>-chair-<i>` | `<objectId>:<seat number>`; tables `<objectId>:<position index + 1>` |
| Ticket label | `<element name>, Seat <chair label>` | `<object label>, Seat <n>` (`backend/helpers/seat.helper.js`) |
| Pricing | A price on each chair | Price levels (tiers: name, colour, price), assigned per object |
| Rendering | DOM elements with CSS transforms, plus a canvas for the grid and selection | One SVG with pan/zoom |
| State | MobX stores (layout, selection, grid, tool, chair, history, viewer) | Angular signals inside one component |
| Old layouts | n/a | **Not read.** `parseVenue` returns `null` for `LayoutExportData`, so the admin opens a blank canvas and the store shows no seat map |

## 2. Feature differences

### Only in Pavle's editor (missing in Studio)

- **Seat labels:**
  - A custom label and price on each chair (chair panel).
  - A `chairLabels[]` override per element.
  - Show/hide toggles for chair numbers, row names and table names.
- **Row-name position:** left, centre or right of the row.
- **Arc row:** radius, start/end angle, and chairs facing inward or outward. Studio's nearest equivalent is the row "Curve" slider.
- **Drawing direction:** a straight row is drawn by click, move, click, and takes its angle from the drawing direction. Studio's wizard always creates level rows that you then rotate.
- **Text styling:** font family, weight, style, alignment, background, border and padding. Studio has size and colour only.
- **Polygon styling:** fill colour and opacity, border colour and width, border on/off. Studio colours polygons by their price level.
- **Names on lines and polygons**, with a toggle.
- **Import "merge"**, which adds to the current layout. It had an id bug. Studio only replaces.
- **Ordering:** a context menu with Send forward / backward. Studio reorders by dragging in the Objects list instead.
- **Alignment guides** for element-to-element snapping. This code had no switch in the UI.

### Only in Studio (new)

- **New object types:**
  - Price levels with colour.
  - GA zones and polygon sections with capacity, picked by the spot.
  - Stage (arc or rectangle).
  - Markers (entrance, exit, bar).
  - Lines with colour and thickness.
- **Tables:**
  - Round tables with "open spaces", which are chairless but bookable.
  - Long tables with chairs set per side.
  - Rotation for every object type: a slider, plus a handle on the canvas that snaps to 15° when Snap is on.
- **Segmented rows:** "Face front" or "Follow line" chairs, and closing a row into a ring.
- **Editing tools:**
  - Multi-select with a marquee or Ctrl/Shift-click, duplicate, and assigning a price to many objects at once.
  - Undo/redo with Ctrl+Z / Ctrl+Shift+Z. The old editor showed the shortcut but had no handler.
  - Ghost placement: the object follows the cursor until you click.
  - Grid sizes 10/25/50/100 px, and Snap.
- **Navigation and layout:** wheel zoom in the editor, Space-drag pan, pinch zoom, mobile sheets, a help tour, and a seat count in the top bar.
- **Viewer:**
  - Price legend with focus.
  - Order panel.
  - Seat limit, with a `limitReached` event.
  - Externally reserved seats.
  - Selection and "taken" animations.
  - Sample venues.

### Same idea, different behaviour

| | Pavle's editor | Studio |
|---|---|---|
| Rotation pivot | Rows: start point. Tables: centre. | Centre of the object's box, for every type |
| Seat numbers when rotated | Rotate with the object (upside down near 180°). Segmented rows stay upright. | **Fixed in this pass:** always upright |
| Seat numbering | 1…n | Was 101…; **fixed:** starts at 1, and you can set the first number and the direction |
| Selection | One object at a time | Many |
| Keyboard | Delete, Esc | Delete, Esc, Enter, Ctrl+Z, Space |

## 3. Fixed in this pass (local, not published yet)

1. **Upright text on rotated objects:**
   - Seat numbers on rows and tables always read upright.
   - Row names stay level and sit in line just before the first seat, at a distance that allows for the name's width.
   - Table names and marker captions stay level.
   - Stage, zone and section captions flip instead of reading upside down.
2. **Numbering:**
   - New rows and segmented rows start at seat 1, not 101.
   - The row inspector has "First seat number" and "Numbering runs: From first chair / From last chair".
   - Adding seats to a row numbered from the last chair keeps that direction.
3. **Segmented rows set to "Follow line":** chairs turned the opposite way to the line, because the angle had the wrong sign. They now follow each segment.
4. **Rotation-aware hit areas:** marquee selection and "fit to screen" now use where a rotated object actually is, not its unrotated box.
5. **Table chairs in the store:** chairs sold or held elsewhere showed as available and could be picked, because table chairs were hard-coded "available". They now show as taken and can't be selected.
6. **Price legend:**
   - Long tables were counted from a leftover `seats` number instead of their four sides.
   - Polygon sections were left out.
7. **Long-table selection box:** it was a square sized by the table's longest side. It now fits the table.
8. **Order lines** read "Row A · Seat 3" for rows too. Before, rows showed "Row A · 3".

### Second pass (same day)

9. **Duplicate names:**
   - The row wizard always started at "Row A", so a second batch, a copied row or a segmented row repeated names. New and copied rows now take the next free letter (… Z, AA, AB).
   - Tables now take the next free "T" number instead of "count + 1", which repeated a name after a delete.
   - Duplicate names matter because the ticket label is "<name>, Seat <n>".
10. **Price level:** new objects no longer point at a deleted "standard" price level. They use one that exists.
11. **Snap while dragging:** it snapped every corner on its own, bending polygons, lines and segmented rows and pulling multi-selections out of line. Now one anchor snaps and everything moves by the same offset.
12. **Undo:**
    - A plain click on an object no longer adds an empty undo step.
    - Ctrl+Z does nothing in Preview or the viewer.
    - Delete does nothing while a dialog is open.
    - Keys typed in the host page's selects and rich-text fields are ignored.
13. **Preview order panel:** it showed a made-up 12% "service fee" and "seats held 10:00". It now shows seat prices only.
14. **Speed:** every pan or zoom tick rebuilt every seat on the map. The map now rebuilds only when the seat-number zoom threshold is crossed.
15. **Rotation handle:** it keeps a constant on-screen size (it used to shrink to a few pixels when zoomed out).
16. **A row with no seats** no longer crashes the canvas.
17. **Adding seats never renumbers existing chairs.** New chairs take numbers above the row's highest. A seat's number is its ticket id, and resizing used to shift or reuse numbers on rows numbered from the last chair.
18. **Ids:** object and GA-pick ids carry 12 random characters from `crypto` (was 4 from `Math.random`). The counter restarts in every buyer's browser, so GA picks could collide, giving a false "already booked".
19. **Open spaces:** a sold open space draws as taken, not as a free dashed slot. Picking one is labelled "Open space N".
20. **Seat limit:** picking a seat now counts GA picks too, so the limit message shows instead of the pick being silently dropped.

## 4. Outside the library (backend / store / admin), found 2026-10-14, not fixed

| Sev | Problem | Where | Fix |
|---|---|---|---|
| P0 | A seated order can go through with fewer seats than tickets, or with seat ids that don't exist. Missing seats are free and the tickets have no seat. | store `ticket-selection.ts` `buyNow()`, backend `routes/order/index.js:101-108`, `helpers/room.helper.js:9-14` | Require `seatIds.length === quantity` and that every id resolves in the venue. Disable checkout until they match. |
| P0 | Editing a layout after sales re-keys or orphans sold seats, so a chair can be sold twice. | `PUT /event/:id/room` (`routes/event/index.js:460-489`) has no sales guard | Reject room saves that drop or re-key a sold or held seat id. Show sold seats as locked in the editor. |
| P1 | Admin "issue ticket": the seat limit is the max quantity instead of the chosen quantity, so extra seats go into the order without tickets. `/batch` skips holds and zone capacity. | `issue-ticket-modal.component.ts:108,331`, `routes/issuedTicket/index.js:65-131` | Bind the seat limit to quantity. Run the availability and capacity checks in `/batch`. |
| P1 | Tickets issued from the admin never get their email (`ObjectId` passed as the ticket), but the UI says it was sent. | `routes/issuedTicket/index.js:160`, `utils/mailgun.util.js:456` | Pass the ticket document with `_id` and `seatLabel`. |
| P2 | `seatLabel` is never saved, so the order page, wallet pass, scanner manifest, CSV and admin list show raw ids like `row_3_a1:7`. | `routes/webhook/index.js:443`, `routes/order/index.js:571-574` and readers | Save `findSeatLabel(...)` on every insert, or resolve it when reading. Add `seatId` to the order's ticket projection. |
| P2 | Seat totals use the stale `seats` field: wrong for long tables, and open spaces are ignored. | `seatReservationService.js:723-726`, superadmin `event-detail.component.ts:281` | Count like `scanner-door.js` `seatNumbers()` / `tableSeats()`. |
| P2 | The backend labels a table open space "T1, Seat 9". | `helpers/seat.helper.js:43` | Say "Open space" when the index is an open slot. |
| Note | Seat ids are per event, not per date, so each seat of a multi-night seated run can be sold once in total. | | A product decision. |

## 5. Still open in the library (risks worth deciding on)

- **Old layouts are dropped.**
  - Any event saved with Pavle's editor opens empty in the admin, and saving it overwrites the old layout.
  - The store shows no seat map for those events.
  - A converter (`LayoutExportData` → `Venue`) is possible, but seat ids would change. Seats already sold under the old ids would not block the new ones, so convert only events with no sales, or map the ids.
- **Table seat ids are positions, not chairs.**
  - Long-table chairs are numbered top, bottom (including open spaces), left, then right.
  - Changing the count on one side renumbers the chairs on every later side. After tickets are sold, that points them at different chairs.
  - Rows don't have this problem because they store their seats.
- **No custom seat labels** (e.g. "A1", "Box 3"). Tickets can only say "<object>, Seat <number>".
- **Rotation pivot is the object's box centre.** On a rotated curved row, changing the seat count moves the row slightly. Pavle's editor pivoted rows on their start point. Changing the pivot now would shift layouts that are already rotated.
- **Seat numbers only show above about 145% zoom.**
- **Table availability in the legend** doesn't subtract sold chairs. Rows do.
- **Renumbering after sales:** "First seat number" and "Numbering runs" still renumber a row on purpose. The panel warns about this, but nothing blocks it after sales. That needs the backend guard above.
- **Hit areas are estimated** for row names (not inside the selection box) and for text labels (estimated from character count).
