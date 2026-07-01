# TASK.md — Restore missing features + real icons in Seat Map Studio

Base: clean `origin/main` @ v1.9.0 (Studio at `src/app/seat-map-studio/`, route `/studio`).
Prior v1.4.0 old-editor redesign is parked in `git stash@{0}` (not deleted).

## Goal
Bring back features the Studio dropped vs the old editor, and replace the
hand-authored ("AI-looking") icon set with a real icon library.

## Gaps found (Studio vs old editor)
| Feature | Status | Plan |
|---|---|---|
| Text/label **color** | label has only Text+Size | add `color` to VObj + inspector picker + canvas render |
| **Segmented row** (multi-click angled row) | only single arc rows | new `segrow` tool reusing the polygon draw flow; seats along a polyline |
| Icons look AI-generated | inline paths in `IconComponent.P` | swap to real Lucide-style path data (dependency-free) |
| (stretch) Label bold/align | missing | optional, low-risk |
| (stretch) Line tool | missing | defer unless asked |

## Roadmap

### Phase 1 — Text/label color  ✅ DONE + verified in Playwright
- [x] 1.1 `seat-data.ts`: add `color?: string` to `VObj`
- [x] 1.2 `editor-ui.ts` Inspector `@case('label')`: color control (native picker + 6 swatches + Auto)
- [x] 1.3 `seat-canvas.ts` `@case('label')`: `fill = o.color || pal.text`
- [x] 1.4 CSS `.ed-color*` in studio css
- [x] 1.5 Verified: added label, picked red → canvas text fill = #d83a3a

### Phase 2 — Real icons  ✅ DONE + verified
- [x] 2.1 Replaced `IconComponent.P` with vendored Lucide path data (keys unchanged)
- [x] 2.2 Domain glyphs: Stage→presentation, Row→armchair, Table→circle-dot, Zone→dashed square, Polygon→pentagon, Label→type, Marker→map-pin
- [x] 2.3 Verified: all rail/topbar/inspector/object-list icons render, 0 console errors

### Phase 3 — Segmented row tool  ✅ DONE + verified
- [x] 3.1 `seat-data.ts`: `path?: Pt[]` + `pathRowPositions()` (seats spread by arc-length, tangent angle per seat)
- [x] 3.2 `draw` signal gained `kind: 'polygon' | 'segrow'`; canvas `drawKind` input; polygon-only close/fill/hint
- [x] 3.3 `segrow` tool in `TOOLS` + new `Segrow` Lucide-style icon
- [x] 3.4 `DrawHud` kind-aware (finish ≥2 for segrow, tailored copy)
- [x] 3.5 `commitSegRow()` builds a `path` row; canvas tilts seats via `p.a`; move/dup handle `path`
- [x] 3.6 Inspector: path rows show Tier + "Seats along path" stepper (redistributes); curve/spacing hidden
- [x] 3.7 Verified: drew a 3-point bent row → 14 seats follow the bend, selectable, 0 console errors

### Phase 4 — Verify pass
- [ ] 4.1 `/studio` boots clean (dev server), no console errors
- [ ] 4.2 Screenshots: editor + viewer, light + dark
- [ ] 4.3 Library build (`build:lib`) passes (Studio is exported in public-api)

## Risks / notes
- Studio is signal-based + immutable `patch()`; keep updates pure.
- `draw`/`commitPolygon` is polygon-specific — must generalize carefully (Enter/Escape/HUD).
- Icons: dependency-free path swap avoids touching build; verify every `name` still resolves.
- Don't touch the old editor components (Studio doesn't use them).
