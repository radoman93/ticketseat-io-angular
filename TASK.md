# TicketSeat "Chairs with Backs" Element Redesign

## Design Source: Claude Design handoff — Component Variations, Variant 02

### Design Tokens (element-specific)
- **Table top**: `#EFE3CB` fill, `#B89E70` stroke 1.2px, inner ring `rgba(184,158,112,0.4)` 0.5px
- **Chair back**: `#F4ECDB` fill, `#B89E70` stroke 1.2px, ~189° arc (1.05π sweep)
- **Seat pad**: existing seat state classes (avail/selected/sold) serve as pad visuals
- **Pad/back ratio**: pad = 55% of back radius

---

## Tasks

### 1. [x] Add element design tokens to CSS
- `--ts-chair-back`, `--ts-chair-stroke`, `--ts-table-top`, `--ts-table-stroke`, `--ts-table-inner`

### 2. [x] Update table top CSS (round + rectangle)
- Warm beige fill `#EFE3CB`, brown stroke, inner ring via outline
- Rectangle: add `border-radius: 4px`

### 3. [x] Round table: SVG chair backs + angle data
- TS: add `angle` to seatStyles computed
- HTML: insert SVG half-disc arc behind each seat, rotated by `angle + 90`

### 4. [x] Rectangle table: SVG chair backs + rotation helper
- TS: add `getChairBackRotation(side)` method
- HTML: insert SVG half-disc arc, rotated per side

### 5. [x] Seating row: SVG chair backs
- HTML: insert SVG half-disc arc at rotation=0° (all face forward)

### 6. [x] Segmented seating row: SVG chair backs
- HTML: same treatment as seating row

### 7. [x] Build verification
