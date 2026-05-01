# PRD — AI-Powered Seating Plan Image Import

> Status: brainstorm + draft PRD. Approach: **Option C (VLM-assisted draft + side-by-side refinement)** via **OpenRouter** using `minimax/minimax-m2.5:free` as the default model, with model-swappable architecture.

---

## 1. Context & Problem

TicketSeat lets users design seating layouts from primitives (round/rectangle tables, seating rows, segmented rows). New users arriving with an existing venue plan — a PDF, a photo of a printed map, a screenshot from another vendor — must currently rebuild the entire layout by hand. For a small restaurant that's annoying; for a 1,000-seat theater it's a deal-breaker.

The example image (Italian opera house: Platea + Palchi + Prima Galleria + Seconda Galleria, ~600+ seats, curved rows, color-coded sections, hierarchical seat numbering) represents the upper bound of what users will throw at us. We won't perfectly reproduce it. The goal: **80% of done in 60 seconds** so the remaining 20% is light cleanup instead of a multi-hour rebuild.

---

## 2. Brutal Honesty — Capability Bounds

**Realistic today (2026):**
- Identifying gross structure: section count, table-vs-row clusters, orientation.
- Approximate seat counts per row/table with ~85–95% accuracy on clean images using a *frontier* vision model.
- **With `minimax/minimax-m2.5:free`, expect noticeably lower accuracy** — probably 70–85% on simple layouts and degrading fast on complex ones. Free models trade quality for cost.
- Producing a *first draft* the user fixes.

**Not realistic:**
- Pixel-perfect coordinates at 600+ seat density.
- Reading every tiny seat number without errors (5–20% OCR miss rate on dense numerical labels even with frontier models; worse on free).
- Distinguishing reserved/accessible/VIP semantics from color alone.
- Stylized/3D/hand-drawn plans.

Position this as **"AI-assisted import"**, not "AI import." The copy must reflect that.

---

## 3. Hard Constraints From The Codebase

Findings from surveying `src/app/models/elements.model.ts`, `chair.store.ts`, and `layout-export-import.service.ts`:

1. **Chair labels are auto-sequential integers only.** No per-chair label override field exists. Theaters routinely use non-sequential labels (odd/even splits, reserved gaps, A1–A20 vs row "AA"). **The current data model cannot represent this faithfully.**
2. **No true arc primitive.** `SegmentedSeatingRow` is polyline-only. Curved opera tiers must be approximated with many short straight segments — visually polygonal up close.
3. **No section/zone grouping.** Galleria/Platea/Palchi cannot be modeled as nested containers. Visual grouping today = `polygon` outline + `text` label as separate elements.
4. **Single importer entry point.** `LayoutExportImportService.importLayout()` accepts the exact export JSON. AI must produce JSON in this exact shape.

These are the gaps **Pre-Phase 0** addresses.

---

## 4. Pre-Phase 0 — Build the Missing Primitives First

We are not shipping AI import on top of a data model that can't represent the things AI is supposed to extract. Pre-Phase 0 is mandatory groundwork. **Estimated 1.5–2 weeks.**

### 4.1 New primitive: `ArcSeatingRow` (true circular arc)

**Why**: an opera tier or amphitheater curve is a single arc with N seats spaced along it. Today we'd fake it with 6–10 `SegmentedSeatingRow` segments and the result looks polygonal. A native arc primitive renders smooth curves and lets the AI extract `(centerX, centerY, radius, startAngle, endAngle, seats)` as 6 numbers instead of 30+ segment endpoints — much easier and more accurate for the AI.

**Schema** (extend `src/app/models/elements.model.ts`):
```typescript
interface ArcSeatingRowElement extends LayoutElement {
  type: ElementType.ARC_SEATING_ROW;
  centerX: number;       // arc's center of curvature
  centerY: number;
  radius: number;        // distance from center to chair centers
  startAngle: number;    // degrees, 0 = +X axis, CCW positive
  endAngle: number;
  seats: number;         // chairs evenly distributed along arc
  seatRadius?: number;
  chairLabels?: string[];  // see 4.2
  chairFacing?: 'inward' | 'outward';  // chairs face center or away
}
```

**Implementation tasks**:
- Add `ARC_SEATING_ROW` to `ElementType` enum.
- New component `src/app/components/arc-seating-row/` with template, ts, css. Renders chairs as DOM elements at polar coordinates derived from arc params (mirrors `round-table` chair-placement math, but along an arc segment instead of a full circle).
- `ChairStore.generateChairsForArcRow(elementId, arcParams)` — distributes chairs evenly along the arc with `angle` per chair stored relative to the element.
- Selection box: bounding rect of the arc's actual swept region (use chord + sagitta math, not the full circle).
- `LayoutExportImportService.importLayout()` and exporter: round-trip the new element.
- Toolbar: new "Arc row" tool in the editor toolbox.
- Properties panel: numeric inputs for radius, start/end angle, seats, plus a small visual handle in the canvas to drag-adjust the arc endpoints.
- Tests: chair coordinate generation, round-trip serialization, selection box correctness for arcs spanning >180°.

**Acceptance**: I can place an arc row with 30 seats spanning 120° of a 400px-radius circle, drag-adjust its endpoints, save, reload, and see identical geometry.

### 4.2 Per-chair label overrides

**Why**: theater seats are not always 1, 2, 3, ... A given row might be 2, 4, 6, 8 (even-only) or 101, 103, 105 (gallery numbering). Without this, AI import for theaters is dead on arrival.

**Schema** (extend each chair-bearing element type):
```typescript
chairLabels?: string[];   // optional override; length must match seat count when present
```

**Implementation tasks**:
- Add optional `chairLabels` to `RoundTableElement`, `RectangleTableElement`, `SeatingRowElement`, `SegmentedSeatingRowElement`, `ArcSeatingRowElement`.
- `ChairStore.generateChairsForTable` (and the equivalents for row/segment/arc): if `chairLabels` is provided, use it; else fall back to sequential `(i+1).toString()`.
- Validator in `importLayout()`: if `chairLabels.length !== seatCount`, log warning and ignore the override (don't fail import).
- Properties panel: existing per-chair editing UI continues to work and writes back into `chairLabels`.
- Bulk-relabel utility (used later in Phase 3): given a selection of chairs, write a generated sequence into `chairLabels` (start, increment, prefix/suffix, reset).
- Tests: round-trip with and without override; mismatched-length tolerance.

**Acceptance**: I can place a 10-seat row, set chairs to `["1","3","5","7","9","11","13","15","17","19"]`, save, reload, see odd numbers.

### 4.3 Section/zone grouping (lightweight, optional)

**Why**: not strictly required — `polygon` + `text` already give visual grouping. But the AI's output is much cleaner if it can emit a `section` element that contains a name and references the children inside it. Without this, the AI dumps 600 elements flat into the layout and the user can't easily say "delete the whole Palchi section."

**Decision**: ship V1 without semantic sections. Use polygon outlines + text labels as the AI's grouping convention. Re-evaluate after V1 telemetry shows whether users want bulk section operations. Don't gold-plate.

### 4.4 Pre-Phase 0 Deliverables Checklist

- [ ] `ArcSeatingRowElement` schema, component, store integration, toolbar entry, properties panel, tests.
- [ ] `chairLabels?: string[]` added to all 5 chair-bearing element types.
- [ ] `ChairStore` honors overrides, falls back to sequential.
- [ ] Importer/exporter round-trips both new fields.
- [ ] Bump export `meta.version` from `"1.0"` to `"1.1"` and ensure `importLayout()` accepts both.
- [ ] No regressions in existing layouts (regression test against fixtures in `src/app/data/`).

**Only when Pre-Phase 0 ships do we start Phase 1.**

---

## 5. User & Use Cases

**Primary**: small venue operator (restaurant, banquet, club, small theater) onboarding with a non-machine-readable plan.

**Secondary**: large venue admin migrating from a competitor — more complex layouts, willing to clean up if bulk is correct.

**Volume-ranked use cases** (V1 should delight 1–4, produce best-effort drafts for 5–6):
1. Restaurant ~30 round/rectangle tables on a hand-drawn floor plan — *easiest*.
2. Banquet hall grid of round tables — *easy-medium*.
3. Conference room / classroom rows — *easy*.
4. Small theater 100–300 seats, straight rows — *medium*.
5. Auditorium / mid-theater with curved rows — *hard*. ArcSeatingRow makes this viable.
6. Opera / stadium (the example) — *very hard*. Best-effort with explicit framing.

---

## 6. Recommended V1 — Option C: VLM-Assisted Draft + Refinement

### 6.1 Flow

1. User clicks "Import from image" in editor toolbar.
2. Upload modal: drag-drop or file picker. PNG/JPG/PDF (PDF → first page rasterized client-side via pdf.js).
3. **Pre-flight classification call (cheap, 2–3s)**: classify image type — restaurant / banquet / classroom / theater / mixed. Set expectations: *"Detected: theater layout with ~280 seats. AI will produce a draft — expect to fine-tune."*
4. **Main extraction call (15–60s, with progress UX)**: VLM returns JSON in app's import schema, plus `confidence` per element and `notes` array.
5. Layout drops into editor as draft. Original image floats as a translucent **reference overlay** behind the canvas (toggleable, opacity slider).
6. **Refinement tools**:
   - Bulk relabel (writes `chairLabels`).
   - Snap-row-to-image: click two points on the reference image, the row's anchors snap there.
   - Section delete: lasso → delete.
   - Re-extract on selection: lasso a region, "re-extract just this part" sends a cropped image back.
7. User commits → layout saves normally.

### 6.2 Architecture (model-agnostic, OpenRouter-backed)

```
[Browser]
  ├── Upload widget (PDF→PNG via pdf.js)
  ├── Image preview + reference overlay
  ├── Refinement tools
  └── HTTPS POST /api/import/seating-image
                              │
                              ▼
[Backend service — new, small Node]
  ├── Image preprocessing (resize ≤2048px, EXIF rotate, normalize)
  ├── Pre-flight classifier  → OpenRouter ▸ minimax/minimax-m2.5:free
  ├── Main extraction        → OpenRouter ▸ minimax/minimax-m2.5:free
  ├── Schema validator (rejects malformed, retries once with stricter prompt)
  ├── Model-swap logic: if free model fails N times or returns non-vision
  │   error, optionally fall back to a configured paid model
  └── Returns LayoutExportData JSON
                              │
                              ▼
[Browser] LayoutExportImportService.importLayout(data, 'merge')
```

**Why a backend at all**: API key cannot ship in an Angular library; need rate limiting; need centralised cost/usage tracking; image preprocessing belongs server-side.

### 6.3 OpenRouter Integration

- **Endpoint**: `POST https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible).
- **Default model**: `minimax/minimax-m2.5:free`.
- **Fallback chain (configurable, off by default)**: e.g., `google/gemini-2.5-flash`, `anthropic/claude-sonnet-4.6`, etc. Triggered when:
  - Free model returns 429 (rate-limited)
  - Free model returns invalid JSON twice in a row
  - Free model rejects vision input
  - Free model removed/deprecated by OpenRouter
- **Headers**: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer: https://ticketseat.io`, `X-Title: TicketSeat`.
- **Request shape**: standard OpenAI chat.completions with `messages[].content` as an array of `{type:"text"}` and `{type:"image_url", image_url:{url:"data:image/png;base64,..."}}` parts.

### 6.4 Honest Risks With `minimax/minimax-m2.5:free` — Mitigate Before Building

These are the things that, if true, kill the feature. **Verify them in a 1-day spike before Pre-Phase 0 starts**:

| Risk | Spike check | If true |
|---|---|---|
| Model doesn't accept image input on OpenRouter | Send a tiny test image, see if it 400s | Pick a different free vision model (e.g., check OpenRouter's free tier list for current vision-capable options) |
| Free tier rate limit too low (e.g., 20/day) | Hammer the endpoint, observe 429 timing | Architect mandates fallback to paid; treat free as "trial mode for new users" |
| JSON output unreliable (model produces narrative instead of JSON) | Test 10 sample images, count valid JSON | Add JSON-mode if supported; else add heavy prompt structure + retry-with-stricter-prompt logic |
| Vision quality unusably bad on dense plans | Test on 5 reference venue images | Document hard limit ("works for ≤50 seats") OR require fallback to paid |
| Model removed/renamed by OpenRouter | One-time check, plus runtime detection | Config-driven model name; deploy = update env var, no code change |

**Recommendation**: even if all checks pass, ship with the fallback chain *configured* (just disabled by default) so the day a paying customer needs better quality you flip a flag, not a sprint.

### 6.5 Prompt Strategy

System prompt fixes the JSON schema (the actual `LayoutExportData` shape, including the new `ARC_SEATING_ROW` and `chairLabels` from Pre-Phase 0). User message includes the image plus:

> Extract the seating plan as JSON matching the schema. Use round/rectangle tables for clusters, `seating_row` for straight lines of seats, `arc_seating_row` for circular curves (provide center, radius, start/end angle), `segmented_seating_row` only for non-circular polylines. Add `polygon` outlines and `text` labels for visually distinct sections. For each element, include a `confidence` (0–1) and `notes` if you guessed. Do not invent seats you cannot see. Output JSON only, no prose.

Anchor with 2–3 few-shot examples (small image + correct JSON) — critical for free models which under-perform on schema-following without examples.

---

## 7. Failure Modes & Mitigations

| Failure | Likelihood | Mitigation |
|---|---|---|
| VLM hallucinates seat counts | **High** (higher with free model) | Show confidence per element; reference image overlay makes discrepancies obvious; bulk-edit seat count |
| OCR misreads section names | High | Section names are text labels — easy for user to fix; don't gate import on label correctness |
| Coordinates off by 10–30% | Certain | Reference overlay + drag-to-correct + "snap row to two reference points" |
| Image rotated / upside-down | Medium | Pre-flight detects orientation, rotates before main extraction |
| 3D / isometric render | Medium | Pre-flight rejects: "We only read top-down 2D plans." |
| User uploads PII | Medium | TOS; do not log images; auto-delete after extraction |
| Free model rate-limits | **High** under any real load | Fallback chain (6.3); per-user daily quota; cache by image hash |
| Free model returns invalid JSON | Medium-high | Retry-once with stricter prompt; final fallback to paid model if configured |
| Cost spikes | Low (free) until fallback fires | Resize images to ≤2048px; rate-limit per user; monitor fallback usage closely |

---

## 8. Cost & Latency Budget

**With `minimax/minimax-m2.5:free`**:
- Cost: **$0 per call** for the model itself. OpenRouter free tier rate limits (currently ~20 req/day per key on free models, but verify) are the binding constraint.
- Latency: free models are typically slower than paid. Expect 20–80s for extraction calls. Progress UX is **mandatory**.
- **Real cost**: backend hosting + bandwidth for image uploads, not model inference.

**With paid fallback (Gemini Flash / Claude Sonnet)**:
- ~$0.05–$0.30 per import depending on size.

**Mitigations**:
- Cache by image hash — re-uploads are free even on free tier.
- For large layouts (>300 detected seats), split into 2 calls (sections, then per-section detail) — also helps free-tier rate limits by spacing calls.
- Per-user daily quota in V1 (e.g., 5 imports/user/day) so one user doesn't burn the whole free budget.

---

## 9. Success Metrics

- **Activation**: % of new users who use AI import within first 24h. Target: 30%+.
- **Completion**: % of users who keep the imported layout vs. discarding. Target: 70%+. (Will be lower than this with free model — that's the trade-off and we'll see it in data.)
- **Time-to-first-layout**: AI users vs. manual users. Target: 3–5x faster.
- **Edit distance**: post-import edits per element. Lower is better — proxy for AI accuracy. **Use this metric to decide when to enable paid fallback.**
- **Fallback rate**: % of calls that hit a paid fallback. If high, free model isn't pulling its weight.
- **Support tickets** mentioning "import" — leading indicator of expectation mismatch.

---

## 10. Phased Roadmap

### Pre-Phase 0 — Codebase Prerequisites (1.5–2 weeks)
**Detailed in §4.** Build `ArcSeatingRow`, add `chairLabels`, bump export schema version, regression-test.

### Phase 1 — Spike + Backend (1 week)
- **Day 1 spike**: verify `minimax/minimax-m2.5:free` on OpenRouter actually accepts vision and produces parseable JSON on 5 reference images. **Stop and replan if it fails.**
- New Node service `seating-image-import-service`. Endpoints: `POST /classify`, `POST /extract`.
- OpenRouter client with model-swap logic (default free, fallback chain configurable).
- Image preprocessing (resize, EXIF rotation, PDF first-page rasterization).
- Schema validation, retry-once-on-malformed.
- Rate limiting (per-IP and per-user), image-hash cache, no-log policy.
- Per-user daily quota.

### Phase 2 — Editor Integration (1.5 weeks)
- "Import from image" toolbar action + upload modal.
- Progress UX (estimated time, animated indicator).
- Reference image overlay with opacity slider (new component in `src/app/components/grid/`).
- Wire backend response into `LayoutExportImportService.importLayout(data, 'merge')`.

### Phase 3 — Refinement Tools (1.5 weeks)
- Bulk chair relabel dialog (writes `chairLabels` from §4.2).
- "Snap row to image points" interaction (two-click anchor).
- "Re-extract selection" (lasso → cropped image → backend).
- Per-element confidence indicator (dim low-confidence elements).

### Phase 4 — Polish & Launch (1 week)
- Onboarding tooltip flow.
- Telemetry (Mixpanel/PostHog/whatever you use).
- TOS / privacy copy.
- Internal dogfood on 20+ real venue images, tune prompt + few-shot examples.

**Total estimate: 6–7 weeks** (Pre-Phase 0 sequential, then Phases 1–4).

### Phase 5 (post-launch) — Quality Iteration
Decide based on telemetry:
- If `edit-distance` is high → invest in better prompt + larger few-shot set, or enable paid fallback.
- If `fallback rate` is high → reconsider whether free model is viable; bake paid into the default for paying customers.
- If users want bulk section operations → add `section` grouping primitive (deferred from Pre-Phase 0).

---

## 11. Critical Files To Reuse / Modify

**Existing (modify)**:
- `src/app/models/elements.model.ts` — add `ArcSeatingRowElement`, add `chairLabels?` to all chair-bearing types, add `ARC_SEATING_ROW` to `ElementType`.
- `src/app/stores/chair.store.ts` — `generateChairsForTable` and equivalents honor `chairLabels` override; new `generateChairsForArcRow`.
- `src/app/stores/layout.store.ts` — handle new element type in CRUD paths.
- `src/app/services/layout-export-import.service.ts` — round-trip new fields, bump `meta.version` to `"1.1"`, accept both versions.
- `src/app/components/event-editor/` — toolbar entry for arc row + "Import from image".
- `src/app/components/grid/` — render arc rows, render reference image overlay.
- Properties panel components — arc-row property editor; chair-label override UI.

**New**:
- `src/app/components/arc-seating-row/` — component for the new primitive.
- `src/app/components/image-import-modal/` — upload + progress + preview.
- `src/app/services/image-import.service.ts` — calls backend, handles retries, normalizes response.
- New backend service (separate repo or workspace) — OpenRouter integration, prompt management, image preprocessing.

---

## 12. Open Questions (need answers before Phase 1)

1. **Backend ownership**: does TicketSeat already have a backend? If pure client today, this feature requires standing up a hosted service.
2. **Customer pricing**: free feature (eat backend hosting cost as acquisition) or metered? If metered, billing infra needed.
3. **Privacy posture**: are we OK sending customer images to OpenRouter (which routes to MiniMax in China for the free model)? Some venue operators (corporate, government, EU GDPR-sensitive) may not be. Do we need an EU-only paid model fallback for those users?
4. **PDF handling**: multi-page (one floor per page) or first-page only in V1?
5. **Schema bump buy-in**: OK adding `chairLabels` and bumping export format from `1.0` to `1.1`? Affects every export consumer.
6. **OpenRouter account**: who owns the API key, where does the budget come from when fallback fires, what's the monthly cap?

---

## 13. Verification / Test Plan

**Pre-Phase 0**:
- Unit: schema validator round-trips all element types with and without `chairLabels`; arc-row chair coordinate generation; export/import round-trip including version-bump compatibility.
- Visual regression: existing layout fixtures in `src/app/data/` render identically post-change.
- Manual: place arc rows spanning <90°, 90°–180°, 180°–270°, >270°; verify selection box, drag, properties panel.

**Phase 1+**:
- Spike fixture: 5 representative venue images with hand-labeled element-count ground truth. Run on free model, record JSON validity rate, element-count error, latency.
- Integration: backend returns valid `LayoutExportData` for fixture set within tolerance.
- E2E: Playwright uploads a known image, asserts editor populates with N±tolerance elements, asserts reference overlay renders.
- Eval set: maintain a private benchmark of 30–50 venue images with hand-labeled ground truth. Run prompt changes against this set; track regression in edit-distance.
- Manual: dogfood on opera example. If "obviously wrong but easy to fix" → ship. If "uninterpretable" → replan (probably means free model isn't enough; enable paid fallback by default).

---

## 14. TL;DR For Stakeholders

Ship "AI-assisted import" using **OpenRouter + `minimax/minimax-m2.5:free`** (with paid model fallback architected in but disabled by default). Total **6–7 weeks**.

**Pre-Phase 0 (1.5–2 weeks)** is non-negotiable: build `ArcSeatingRow` for true curves, add per-chair label overrides for theater seat numbering. Without these, the AI cannot produce faithful theater layouts — and the codebase can't represent what AI extracts.

**One-day spike** in Phase 1 verifies the free model actually does vision + valid JSON before we commit. If it fails, we replan with a different free model or enable the paid fallback as default.

The opera example will not be pixel-perfect on V1. The user lands in the editor with 600 seats already placed and spends 10 minutes nudging instead of 4 hours building from scratch. That's the win.
