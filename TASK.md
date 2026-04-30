# TicketSeat UI Redesign — Implementation Plan

## Design Direction: Studio (Warm Cream / Oxblood / Ochre)

From Claude Design handoff. Pro/dense Figma-inspired layout with warm editorial palette.

### Design Tokens
- **bg**: `#F4EFE6` (warm cream) | **panel**: `#FDFBF7` (paper white) | **panelAlt**: `#F8F3E8`
- **border**: `rgba(28,22,12,0.08)` | **borderStrong**: `rgba(28,22,12,0.14)`
- **ink**: `#1C160C` | **inkSoft**: `#5C5446` | **inkMute**: `#9A9286`
- **seatAvail**: `#E8DCC4` | **seatHeld**: `#D89A3C` | **seatSold**: `#C9C2B5`
- **accent**: `#B8331C` (oxblood) | **accentSoft**: `#F4DDD4` | **accentDeep**: `#962513`

---

## Tasks

### 1. [x] Design Tokens (CSS Custom Properties)
- Add `:root` variables in `lib-styles.css`
- Update `.seat` classes to warm palette
- Add Inter + JetBrains Mono font imports

### 2. [ ] Editor Layout Redesign
- Top bar: logo/name + auto-save + Preview/Publish
- Sub-toolbar: undo/redo, grid, coords, zoom, stats, import/export
- Left tool rail: 60px icons with dark active state
- Canvas: warm paper grid
- Inspector: sections with mono headers

### 3. [ ] Viewer Redesign
- Card on cream bg, legend row, checkout bar
- Warm palette seats

### 4. [ ] Element Colors
- Tables: white fill, borderStrong, oxblood selected
- Seats: warm beige → oxblood selected → ochre held → gray sold
- Selection glow: oxblood

### 5. [ ] Toolbars + Properties Panel
- Dark active state, warm hover, section headers

### 6. [ ] Grid + Selection Indicators
- Canvas bg, oxblood dashes, warm preview borders

### 7. [ ] Build Verification
