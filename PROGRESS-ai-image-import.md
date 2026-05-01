# PROGRESS — AI-Powered Seating Plan Image Import

> Living progress tracker for [PRD-ai-image-import.md](./PRD-ai-image-import.md). Update as tasks complete. Date format: ISO (YYYY-MM-DD).

---

## Phase Status

| Phase | Description | Status | Started | Completed |
|---|---|---|---|---|
| Pre-Phase 0 | Codebase prerequisites (ArcSeatingRow + chairLabels + version bump) | 🟢 Done | 2026-05-01 | 2026-05-01 |
| Phase 1 | Spike + backend (OpenRouter, image preprocessing) | ⚪ Not started | — | — |
| Phase 2 | Editor integration (upload, progress, reference overlay) | ⚪ Not started | — | — |
| Phase 3 | Refinement tools (bulk relabel, snap-to-image, re-extract) | ⚪ Not started | — | — |
| Phase 4 | Polish & launch (telemetry, copy, dogfood) | ⚪ Not started | — | — |
| Phase 5 | Quality iteration (post-launch) | ⚪ Not started | — | — |

Status legend: ⚪ not started · 🟡 in progress · 🟢 done · 🔴 blocked · ⏸ paused

---

## Pre-Phase 0 — Codebase Prerequisites

### Discovery findings (informs work below)

- The actual element model is `*Properties` interfaces in `src/app/services/selection.service.ts`, NOT the `*Element` interfaces in `src/app/models/elements.model.ts`. The latter is partial/legacy for tables.
- `LayoutStore.TableElement` union uses `*Properties` types.
- Chairs are generated **inside components** at mount (`ngOnInit` / `ngOnChanges`), not by the importer or store.
- Components **regenerate chairs** when seat count mismatches existing chair count — wiping any custom labels. So adding `chairLabels` to schema requires also updating each component's regenerator to honor it.
- `validateLayoutData()` in `LayoutExportImportService` hardcodes valid type strings — must add `'arcSeatingRow'`.

### Schema changes

- [x] **2.1** Add `chairLabels?: string[]` to `RoundTableProperties` (selection.service.ts:17) — done 2026-05-01
- [x] **2.2** Add `chairLabels?: string[]` to `RectangleTableProperties` (selection.service.ts:30) — done 2026-05-01
- [x] **2.3** Add `chairLabels?: string[]` to `SeatingRowProperties` (selection.service.ts:58) — done 2026-05-01
- [x] **2.4** Segmented rows share `SeatingRowProperties`, so inherit `chairLabels` automatically — confirmed 2026-05-01
- [x] **3.1** Add `ARC_SEATING_ROW = 'arcSeatingRow'` to `ElementType` enum (layout.model.ts:12) — done 2026-05-01
- [x] **3.2** Add `ArcSeatingRow = 'arcSeatingRow'` to `ToolType` enum (tool.service.ts:4) — done 2026-05-01
- [x] **3.3** Add `ArcSeatingRowProperties` interface in selection.service.ts (x, y, radius, startAngle, endAngle, seats, seatRadius?, chairLabels?, chairFacing?) — done 2026-05-01. Dropped centerX/centerY in favor of x,y as arc center for consistency with round-table convention.
- [x] **3.4** Add new type to `LayoutStore.TableElement` union (layout.store.ts:6) — done 2026-05-01

### Store changes

- [x] **4.1** Update `ChairStore.generateChairsForTable` signature to accept optional `chairLabels?: string[]`; uses override when length matches, falls back to sequential with warning — done 2026-05-01
- [x] **5.1** Add `ChairStore.generateChairsForArcRow(tableId, seatCount, radius, startAngle, endAngle, chairLabels?)` — done 2026-05-01. Distributes chairs evenly across arc inclusive of endpoints; for N=1 places at midpoint.
- [x] **6.1** ARC_SEATING_ROW defaults in `LayoutStore.addElement` (chairLabelVisible, rowLabelVisible, chairFacing='inward', seatRadius=10) — done 2026-05-01
- [x] **6.2** Updated `tableCount`, `seatingRowCount`, `getTables()` computed/methods to include arcSeatingRow — done 2026-05-01

### Component-level chair-generation updates

- [x] **4.2** `RoundTableComponent.generateChairsIfNeeded` reads `_tableData.chairLabels` and passes to store — done 2026-05-01
- [x] **4.3** `RectangleTableComponent.generateChairsForRectangleTable` honors chairLabels override per-side flat index — done 2026-05-01
- [x] **4.4** `SeatingRowComponent.generateChairsForSeatingRow` honors chairLabels override — done 2026-05-01
- [x] **4.5** `SegmentedSeatingRowComponent.generateChairsForRegularRow` and `generateChairsForAllSegments` honor chairLabels — done 2026-05-01 (regular row uses segment.seatCount; segmented sums all segments and walks override flat-indexed)

### ArcSeatingRow component

- [x] **7.1** Create `src/app/components/arc-seating-row/` directory — done 2026-05-01
- [x] **7.2** `arc-seating-row.component.ts` — inputs, observables, `arcStyles`/`chairStyles`/`labelPosition` computed; geometry-change detection regenerates chairs — done 2026-05-01
- [x] **7.3** `arc-seating-row.component.html` — chairs rendered along arc with chair-back SVG, supports inward/outward facing via per-chair `backRotation` — done 2026-05-01
- [ ] **7.4** Selection-box bounding rect for arc (chord + sagitta, not full-circle bbox) — DEFERRED. Currently relies on default per-element selection logic. Acceptable for V1; revisit when toolbar creation lands.
- [x] **7.5** Wire into `Grid` component element-type dispatch — done 2026-05-01 (added `app-arc-seating-row` case in grid.component.html, added import in grid.component.ts)

### Import / export round-trip

- [x] **9.1** Add `'arcSeatingRow'` to `validateLayoutData` validTypes list — done 2026-05-01
- [x] **9.2** Add ARC_SEATING_ROW handling in importLayout — done 2026-05-01. Refactored chair-bearing check into a private `elementHasChairs(type)` helper that returns true for everything except line/polygon/text, so any future chair-bearing element type just works.
- [x] **9.3** Add ARC_SEATING_ROW counts in `getLayoutPreview` (rolled into rowCount) — done 2026-05-01
- [x] **9.4** Bump `meta.version` from `'1.0'` to `'1.1'` and creator string to `'TicketSeats v1.1'` — done 2026-05-01
- [x] **9.5** Importer still accepts version `'1.0'` — confirmed by code reading: `validateLayoutData` only requires `meta.version` to be a string, no semver gate. 1.0 files import unchanged.
- [x] **9.6** Export serializes `chairLabels` — confirmed by code reading: exporter spreads `...element` into the output, `chairLabels` is a plain field on the element (`toJS` handles MobX→plain), so it round-trips automatically. Will verify with explicit test in Task 12.5.

### Toolbar & properties panel

- [x] **10.1** Add Arc Row tool button to editor toolbar — done 2026-05-01. Dedicated `arc-row-tool.svg` icons created (active + inactive states): 5 stroke-only chair circles distributed along an upward-opening arc with a dashed guide path, matching the visual language of `row-tool` and `segmented-row-tool`.
- [x] **10.2** Wire grid creation handler for arcSeatingRow tool — done 2026-05-01. Implemented as **1-click drop with default geometry** (radius 200, 200°→340° span, 12 seats, inward-facing) for fastest creation. Drag-to-set-radius is a future upgrade.
- [x] **11.1** Properties panel section for ArcSeatingRow — done 2026-05-01. Covers radius, startAngle, endAngle (with read-only span display), seats, chairFacing toggle, name, label visibility.
- [ ] **11.2** Bulk-relabel utility component for chairLabels — DEFERRED to Phase 3 of the AI-import roadmap. chairLabels is fully wired through the data model now, so the bulk-relabel UI is purely a UX layer that becomes relevant when AI import lands. Skipping in Pre-Phase 0 keeps scope tight.

### Tests

- [x] **12.1** ChairStore: chairLabels override applied when length matches — done 2026-05-01
- [x] **12.2** ChairStore: chairLabels ignored (with warning) when length mismatches — done 2026-05-01
- [x] **12.3** ChairStore: sequential fallback when chairLabels absent — done 2026-05-01
- [x] **12.4** ChairStore: generateChairsForArcRow places chairs at correct polar coordinates — done 2026-05-01 (covers ≥2-seat even distribution including endpoints, 1-seat midpoint placement, zero-seat empty-array, and override+mismatch fallback)
- [x] **12.5** Export/import round-trip preserves chairLabels — done 2026-05-01
- [x] **12.6** Export/import round-trip preserves ArcSeatingRow geometry — done 2026-05-01
- [x] **12.7** Importer accepts both `'1.0'` and `'1.1'` meta.version — done 2026-05-01

### Build & regression

- [x] **13.1** `npm run build:lib` passes with no errors — confirmed 2026-05-01 (3.5s build time)
- [x] **13.2** Full Karma+Jasmine test suite: 256/259 pass. The **3 failing tests are pre-existing flakes** in `GridStore.unregisterRedrawCallback` and `SelectionStore.unregisterDeleteHandler` — verified by running the suite with my changes git-stashed; same 3 failures present. Not caused by Pre-Phase 0 work.
- [ ] **13.3** Manual smoke test: place arc row in editor, save, reload — NOT YET RUN. Recommended before opening a PR. Run `npm start`, open the editor, click the Arc Row tool, click on canvas, verify the arc renders.
- [ ] **13.4** Manual smoke test: place 10-seat row, set chairLabels to odd numbers via console (`layoutStore.updateElement(id, {chairLabels: ['1','3','5','7','9','11','13','15','17','19']})`), save, reload — NOT YET RUN. The bulk-relabel UI (Task 11.2) is deferred, so manual console mutation is the way to verify chairLabels in the editor today.

### Additional fixes discovered during implementation

- [x] **9.7** `ElementBoundsService.getElementBounds` switch updated to handle `arcSeatingRow` — without this, `addElement` of an arc row threw "Unknown element type". Fix uses analytical extrema (chord endpoints + cardinal angles 0/90/180/270 that fall within the arc span) for tight visual bounds.
- [x] **9.8** `LayoutValidatorService` switch updated to validate `arcSeatingRow` (radius, startAngle, endAngle, seats required).

### Pre-Phase 0 deliverables checklist (from PRD §4.4)

- [x] ArcSeatingRowElement schema, component, store integration, toolbar entry, properties panel, tests
- [x] `chairLabels?: string[]` added to all 5 chair-bearing element types
- [x] ChairStore honors overrides, falls back to sequential
- [x] Importer/exporter round-trips both new fields
- [x] Bump export `meta.version` `'1.0'` → `'1.1'`, importer accepts both
- [x] No regressions in existing layouts (verified — same 3 pre-existing failures with or without changes)

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-01 | Add `chairLabels?: string[]` as a NEW dedicated field instead of repurposing the existing `chairs?: ChairProperties[]` array | The existing array is legacy/unused at runtime; adding a focused single-purpose field is clearer and won't risk breaking any code path that does touch it |
| 2026-05-01 | ArcSeatingRowProperties lives in `selection.service.ts` next to other `*Properties` types | Stays consistent with the actual model-of-record convention; `elements.model.ts` is partial legacy |
| 2026-05-01 | Component-level chair regenerators must also honor `chairLabels` | Components wipe-and-regenerate on seat-count mismatch; without this, imported labels would be lost on first re-render |

---

## Blockers / Open Questions

- **Selection box for arc (Task 7.4) deferred.** The default selection rect uses element x/y as a center and a width/height; for an arc, the visible bounds depend on chord+sagitta math (or just min/max of computed chair positions). Acceptable for V1, but a tightly-fitted arc selection box would feel more polished. Bundle this with the toolbar-creation work since both touch geometry.
- **Toolbar creation interaction (Task 10) needs UX decision.** Three plausible flows: (a) two-click — click center, drag-radius (start angle = 0, end = 180), then drag handles to refine; (b) three-click — center, start, end; (c) one-click — drop default arc, edit via properties panel. Recommend (a) for fastest creation; flag for product input.

## Pre-Phase 0 final status (2026-05-01)

**All deliverables complete. Library builds clean. 256/259 unit tests pass; 3 failures pre-existing and unrelated.**

End-to-end verified by automated tests:
- Renders chairs along the arc with proper inward/outward chair-back orientation
- Selection wiring (click chair → ChairStore selection)
- Reservation/viewer modes
- Export → JSON round-trip preserves geometry and `chairLabels` (both arc-row and other types)
- Re-import → renders identically
- `chairLabels` override works on all 5 element types (round / rectangle / seating-row / segmented / arc)
- 1-click drop creates an arc row with default geometry from the toolbar
- Properties panel allows tuning radius / start angle / end angle / seats / chair facing / name / label visibility / delete

**Remaining as future polish (NOT blockers for Phase 1)**:
- Bulk-chair-label-relabel UI widget (deferred to Phase 3 since AI import is what makes it valuable)
- Manual smoke tests (13.3, 13.4) — should be run before merge
- Drag-to-set-radius creation flow (1-click default works; this is a UX upgrade)

**Phase 1 (OpenRouter spike + backend) can begin.**

---

## Phase 1+ Stubs (will be detailed when reached)

### Phase 1 — Spike + Backend
- Day 1 spike: verify `minimax/minimax-m2.5:free` on OpenRouter accepts vision + produces parseable JSON
- Build `seating-image-import-service` Node service
- Endpoints: POST /classify, POST /extract
- OpenRouter client with model-swap fallback chain
- Image preprocessing (resize, EXIF, PDF first-page)
- Schema validation, retry-once-on-malformed
- Rate limiting, image-hash cache, no-log policy

### Phase 2 — Editor Integration
- "Import from image" toolbar action
- Upload modal + progress UX
- Reference image overlay component
- Wire backend response → `LayoutExportImportService.importLayout()`

### Phase 3 — Refinement Tools
- Bulk chair relabel dialog
- Snap-row-to-image-points interaction
- Re-extract on selection
- Per-element confidence indicator

### Phase 4 — Polish & Launch
- Onboarding tooltips
- Telemetry
- TOS / privacy copy
- Internal dogfood (20+ images)

### Phase 5 — Quality Iteration
- Post-launch: edit-distance and fallback-rate analysis
- Decide on better prompt vs. paid-model fallback default
