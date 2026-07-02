# TASK.md — Studio: icon-ify Export/Import + make the flow obviously work

## Finding (verified in-browser, 2026-07-02)
Export and import **logic both work**:
- Export → blob `application/json`, anchor download fires, filename `…-venue.json`, valid JSON. ✔
- Import → dispatching a real `File` at the input's `change` swaps the venue (name + objects update). ✔

So the user's "doesn't export/import" is a **UI/feedback** problem, not the core:
1. Buttons are text + semantically-wrong icons (Map/Layers).
2. Import uses `<label>` + nested hidden `<input>` — a flaky trigger on some setups.
3. Import errors are swallowed to `console.error` — a bad file looks like "nothing happened".

## Plan
- [ ] Icons: add Lucide **Download** (export) + **Upload** (import) to `icon.component.ts`.
- [ ] Header: replace the two labelled buttons with **icon-only** buttons (tooltips kept).
      Import becomes `<button (click)="importInput.click()">` + `<input #importInput hidden>`
      (robust programmatic trigger instead of label→nested-input).
- [ ] Feedback: add a minimal `toast` signal + fixed toast element.
      - Export → "Layout exported".
      - Import ok → "Imported ‘<name>’".
      - Import fail → the error message ("That file isn't a seat map.").
- [ ] CSS: `.icon-btn` (square 38×38, header button language) + `.toast`.
- [ ] Verify: click real Export (download fires), real Import label opens picker + applies,
      bad-file import shows the error toast. AOT build. Commit (no manual version bump — CI bumps).

## Icon choice (rationale)
Download = arrow into tray (get the layout *out* as a file). Upload = arrow out of tray
(bring a file *in*). Universal, self-evident, no text needed.
