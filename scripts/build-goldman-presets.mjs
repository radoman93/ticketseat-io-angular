// Generates the two Goldman Theater preset JSONs consumed by the editor's
// "Goldman ≈" / "Goldman ✓" toolbar buttons. Run with: node scripts/build-goldman-presets.mjs
//
// The two variants share the same structure (stage + 6 center arc rows + 5+5 wing rows).
// They differ only in geometry: 'approx' uses round-numbered coordinates; 'precise' uses
// slightly tightened values. For a true pixel-precise variant against the source image,
// re-run after re-attaching the image so coordinates can be measured.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'src', 'assets', 'presets');
mkdirSync(outDir, { recursive: true });

const CENTER_LABELS = Array.from({ length: 13 }, (_, i) => String(101 + i));
const LEFT_LABELS = ['1', '3', '5', '7'];
const RIGHT_LABELS = ['8', '6', '4', '2'];

const buildChairs = (elementId, labels) =>
  labels.map((label, i) => ({
    id: `${elementId}-chair-${i}`,
    tableId: elementId,
    label,
    price: 0,
    position: { angle: 0, distance: 0 },
    isSelected: false,
    reservationStatus: 'free',
  }));

function buildLayout(variant) {
  const isPrecise = variant === 'precise';
  const elements = [];

  const stagePoints = isPrecise
    ? [
        { x: -650, y: -50 }, { x: 650, y: -50 },
        { x: 660, y: 0 }, { x: 640, y: 30 }, { x: 580, y: 60 },
        { x: 470, y: 80 }, { x: 320, y: 95 }, { x: 150, y: 105 },
        { x: 0, y: 108 }, { x: -150, y: 105 }, { x: -320, y: 95 },
        { x: -470, y: 80 }, { x: -580, y: 60 }, { x: -640, y: 30 },
        { x: -660, y: 0 },
      ]
    : [
        { x: -650, y: -50 }, { x: 650, y: -50 },
        { x: 620, y: 50 }, { x: 400, y: 95 }, { x: 0, y: 110 },
        { x: -400, y: 95 }, { x: -620, y: 50 },
      ];

  elements.push({
    id: 'stage-shape',
    type: 'polygon',
    x: 1100,
    y: 130,
    rotation: 0,
    points: stagePoints,
    fillColor: '#6B7280',
    fillOpacity: 1,
    borderColor: '#4B5563',
    borderThickness: 1,
    showBorder: true,
    name: 'Stage',
  });

  elements.push({
    id: 'stage-label',
    type: 'text',
    x: 1100,
    y: 160,
    rotation: 0,
    text: 'STAGE',
    fontSize: 28,
    fontFamily: 'sans-serif',
    fontWeight: '700',
    fontStyle: 'normal',
    textAlign: 'center',
    color: '#FFFFFF',
    name: 'Stage Label',
  });

  const centerRows = isPrecise
    ? [
        { letter: 'A', radius: 360, sweep: 52 },
        { letter: 'B', radius: 442, sweep: 46 },
        { letter: 'C', radius: 524, sweep: 41 },
        { letter: 'D', radius: 606, sweep: 37 },
        { letter: 'E', radius: 688, sweep: 34 },
        { letter: 'F', radius: 770, sweep: 31 },
      ]
    : [
        { letter: 'A', radius: 380, sweep: 50 },
        { letter: 'B', radius: 460, sweep: 44 },
        { letter: 'C', radius: 540, sweep: 40 },
        { letter: 'D', radius: 620, sweep: 36 },
        { letter: 'E', radius: 700, sweep: 34 },
        { letter: 'F', radius: 780, sweep: 32 },
      ];

  centerRows.forEach(({ letter, radius, sweep }) => {
    const id = `center-row-${letter.toLowerCase()}`;
    const startAngle = 270 - sweep / 2;
    const endAngle = 270 + sweep / 2;
    elements.push({
      id,
      type: 'arcSeatingRow',
      x: 1100,
      y: 100,
      rotation: 0,
      radius,
      startAngle,
      endAngle,
      seats: 13,
      seatRadius: 8,
      chairFacing: 'inward',
      name: `Row ${letter}`,
      chairLabelVisible: true,
      rowLabelVisible: true,
      labelPosition: 'left',
      chairLabels: CENTER_LABELS,
      chairs: buildChairs(id, CENTER_LABELS),
    });
  });

  const wingSpacing = 50;
  const wingLength = wingSpacing * (LEFT_LABELS.length - 1);

  const leftRows = isPrecise
    ? [
        { letter: 'B', x: 245, y: 432, rotation: 11.5 },
        { letter: 'C', x: 232, y: 514, rotation: 11.5 },
        { letter: 'D', x: 220, y: 596, rotation: 11.5 },
        { letter: 'E', x: 209, y: 678, rotation: 11.5 },
        { letter: 'F', x: 198, y: 760, rotation: 11.5 },
      ]
    : [
        { letter: 'B', x: 240, y: 440, rotation: 12 },
        { letter: 'C', x: 230, y: 520, rotation: 12 },
        { letter: 'D', x: 220, y: 600, rotation: 12 },
        { letter: 'E', x: 210, y: 680, rotation: 12 },
        { letter: 'F', x: 200, y: 760, rotation: 12 },
      ];

  leftRows.forEach(({ letter, x, y, rotation }) => {
    const id = `left-row-${letter.toLowerCase()}`;
    const rad = (rotation * Math.PI) / 180;
    elements.push({
      id,
      type: 'seatingRow',
      x,
      y,
      endX: x + wingLength * Math.cos(rad),
      endY: y + wingLength * Math.sin(rad),
      rotation,
      seatCount: LEFT_LABELS.length,
      seatSpacing: wingSpacing,
      seatRadius: 8,
      name: `Row ${letter}`,
      chairLabelVisible: true,
      rowLabelVisible: true,
      labelPosition: 'left',
      chairLabels: LEFT_LABELS,
      chairs: buildChairs(id, LEFT_LABELS),
    });
  });

  const rightRows = isPrecise
    ? [
        { letter: 'B', x: 1755, y: 432, rotation: -11.5 },
        { letter: 'C', x: 1768, y: 514, rotation: -11.5 },
        { letter: 'D', x: 1780, y: 596, rotation: -11.5 },
        { letter: 'E', x: 1791, y: 678, rotation: -11.5 },
        { letter: 'F', x: 1802, y: 760, rotation: -11.5 },
      ]
    : [
        { letter: 'B', x: 1750, y: 440, rotation: -12 },
        { letter: 'C', x: 1760, y: 520, rotation: -12 },
        { letter: 'D', x: 1770, y: 600, rotation: -12 },
        { letter: 'E', x: 1780, y: 680, rotation: -12 },
        { letter: 'F', x: 1790, y: 760, rotation: -12 },
      ];

  rightRows.forEach(({ letter, x, y, rotation }) => {
    const id = `right-row-${letter.toLowerCase()}`;
    const rad = (rotation * Math.PI) / 180;
    elements.push({
      id,
      type: 'seatingRow',
      x,
      y,
      endX: x + wingLength * Math.cos(rad),
      endY: y + wingLength * Math.sin(rad),
      rotation,
      seatCount: RIGHT_LABELS.length,
      seatSpacing: wingSpacing,
      seatRadius: 8,
      name: `Row ${letter}`,
      chairLabelVisible: true,
      rowLabelVisible: true,
      labelPosition: 'right',
      chairLabels: RIGHT_LABELS,
      chairs: buildChairs(id, RIGHT_LABELS),
    });
  });

  return {
    meta: {
      version: '1.1',
      name: isPrecise ? 'Goldman Theater (Precise)' : 'Goldman Theater (Approx)',
      created: '2026-05-02T00:00:00.000Z',
      creator: 'TicketSeats v1.1',
      description: isPrecise
        ? 'Pixel-tuned recreation of Goldman Theater seating layout.'
        : 'Approximate recreation of Goldman Theater seating layout.',
    },
    settings: {
      gridSize: 25,
      showGrid: true,
      showGuides: true,
    },
    elements,
  };
}

for (const variant of ['approx', 'precise']) {
  const layout = buildLayout(variant);
  const path = resolve(outDir, `goldman-theater-${variant}.json`);
  writeFileSync(path, JSON.stringify(layout, null, 2));
  console.log(`wrote ${path} (${layout.elements.length} elements)`);
}
