# TASK — Recreate "Seat Map Studio" design 1:1 in Angular

Source: Claude Design project "Ticketseat Design" → `editor/SeatMapStudio.html` (React + Babel,
self-contained). Owner: Aleksa (the user). Goal: pixel-faithful Angular port, verified with Playwright.

## What the design is
A full-screen **Seat Map Studio** with two modes:
- **Editor**: header → topbar → [tool rail | left browser (Objects/Tiers) | SVG canvas | right inspector].
- **Viewer**: header → [canvas | right side (tier legend + order panel)] with zoom buttons.
Plus: venue switcher menu, theme toggle, polygon draw HUD, add-row/add-zone wizards, mobile chrome.

The `tweaks-panel.jsx` is the Claude-Design editing scaffold — NOT part of the app. Hardcode its
defaults: canvasStyle=skeuomorphic(soft), canvasTheme=light, inspector=right, mobilePattern=sheet,
viewerUX=direct, appTheme=light.

## Architecture decision
- Port React → Angular **standalone components + signals**, reusing the **exact CSS** (scoped under
  `.sms`, `ViewEncapsulation.None` on root) and the **exact SVG markup/geometry**.
- Non-destructive: keep existing demo. `AppComponent` → router shell; demo → `DemoComponent` at `''`;
  studio at route `/studio`.
- Add Geist + Geist Mono fonts to `index.html`.

## Roadmap / subtasks
- [ ] 1. `seat-data.ts` — types, TIERS, TIER_COLORS, VENUES, VENUE_META, geometry, bounds, helpers.
- [ ] 2. `icon.component.ts` — `sms-icon` (EdIcons + Logo/Moon/Sun), `s` size + `rot` deg.
- [ ] 3. `seat-canvas.component.ts` — pan/zoom SVG, all object renderers, seat glyph, grid, draw,
      marquee, selection halos, pointer/wheel/pinch, imperative zoomBy/fit/focus, @Output events.
- [ ] 4. `editor-ui.ts` — Stepper/Seg/Slide/TierPick/Field + ToolRail, TopBar, ObjectsPanel,
      TierManager, Inspector, Wizard, DrawHud.
- [ ] 5. `viewer-ui.ts` — TierLegend, OrderPanel, SeatListPanel, ViewerBar; tierStats.
- [ ] 6. `seat-map-studio.component.ts` — root: scoped CSS, state signals + all ops, Header,
      Editor/Viewer chrome, BottomSheet, MobileTools, responsive (matchMedia 880px).
- [ ] 7. Routing: `DemoComponent`, slim `AppComponent`, routes, Geist fonts.
- [ ] 8. Build + `ng serve`; fix type/template errors.
- [ ] 9. Playwright verify desktop (1440×900) + mobile (390×844); iterate until 1:1.

## Debug notes
- Default load: Editor, Grand Theater, light, right inspector, empty inspector, Objects tab.
- Seat numbers render only when canvas scale > 1.45. Canvas fits on mount → displayed zoom % = fit.
