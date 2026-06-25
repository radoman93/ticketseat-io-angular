# TASK: Mobile-Responsive Viewer Redesign

## Goal
Make `EventViewerComponent` beautiful and fully usable on mobile devices, with
special focus on the floating zoom-control bar. Desktop experience must not regress.

## Current State (findings)
- Touch gestures already work: `grid.component.ts` handles pinch-zoom + 1-finger pan
  via PointerEvents (lines ~1475-1594). No gesture work needed.
- Zoom bar = `NavigationControlsComponent` — fixed vertical pill, bottom-right,
  white/green theme. Functional but not polished.
- `EventViewerComponent` — flex column; reservation panel is a fixed `w-80` side
  column that becomes full-width column on mobile (awkward). Legend wraps.
- `ReservationPanelComponent` — hardcoded `w-80 h-full`, not mobile friendly.

## Roadmap

### Phase 1 — Floating zoom/navigation bar (primary)
- [x] 1.1 Frosted-glass redesign (backdrop-blur, layered shadow, hairline border)
- [x] 1.2 Desktop: keep vertical, polish hover/active micro-interactions
- [x] 1.3 Mobile (<=768px): horizontal pill, bottom-center, safe-area-inset aware
- [x] 1.4 Divider adapts orientation (horizontal line <-> vertical line)
- [x] 1.5 Touch targets >=44px, tap feedback, no text selection / tap highlight
- [x] 1.6 Modernize viewer-mode (green) theme to match frosted look
- [x] 1.7 Respect prefers-reduced-motion

### Phase 2 — Viewer layout responsiveness
- [x] 2.1 Reservation panel becomes a bottom sheet on mobile (rounded top)
- [x] 2.2 Legend row: horizontally scrollable, compact, hide scrollbar
- [x] 2.3 Grid wrap fills available height; avoid panel squashing canvas

### Phase 3 — Reservation panel internals (mobile)
- [x] 3.1 Responsive width (full on mobile, w-80 desktop), max-height as sheet
- [x] 3.2 Larger inputs, 16px font on inputs (prevent iOS zoom)

### Phase 4 — Verify
- [x] 4.1 Build / typecheck passes
- [x] 4.2 Visual check desktop + mobile breakpoints (375 / 414 / 768)

## Notes / Decisions
- CSS-first; minimal template/TS edits.
- Use CSS `env(safe-area-inset-*)` for notched devices.
- Bottom sheet via CSS only (no new gesture lib).
