import { SeatingRowProperties, SegmentProperties } from '../services/selection.service';

/**
 * Test data for segmented seating rows - Phase 1 validation
 */
export const TEST_SEGMENTED_SEATING_ROWS: SeatingRowProperties[] = [
  // Regular seating row (for comparison)
  {
    id: 'regular-row-1',
    type: 'seatingRow',
    x: 100,
    y: 100,
    endX: 200,
    endY: 100,
    seatCount: 4,
    seatSpacing: 35,
    name: 'Regular Row A',
    rotation: 0,
    chairLabelVisible: true,
    rowLabelVisible: true,
    isSegmented: false
  },
  
  // Simple segmented seating row (2 segments, L-shape)
  {
    id: 'segmented-row-1',
    type: 'seatingRow',
    x: 100,
    y: 200,
    endX: 0, // Not used for segmented rows
    endY: 0, // Not used for segmented rows
    seatCount: 0, // Not used for segmented rows
    seatSpacing: 35,
    name: 'Segmented Row B',
    rotation: 0,
    chairLabelVisible: true,
    rowLabelVisible: true,
    isSegmented: true,
    segments: [
      {
        id: 'segmented-row-1-segment-0-123456',
        startX: 100,
        startY: 200,
        endX: 200,
        endY: 200,
        seatCount: 3,
        seatSpacing: 35,
        rotation: 0,
        segmentIndex: 0
      },
      {
        id: 'segmented-row-1-segment-1-123457',
        startX: 200, // Continues from previous segment
        startY: 200,
        endX: 200,
        endY: 300,
        seatCount: 4,
        seatSpacing: 35,
        rotation: 90,
        segmentIndex: 1
      }
    ] as SegmentProperties[],
    totalSegments: 2,
    totalSeats: 7
  },
  
  // Complex segmented seating row (3 segments, curved arrangement)
  {
    id: 'segmented-row-2',
    type: 'seatingRow',
    x: 400,
    y: 100,
    endX: 0,
    endY: 0,
    seatCount: 0,
    seatSpacing: 30,
    name: 'Curved Row C',
    rotation: 0,
    chairLabelVisible: true,
    rowLabelVisible: true,
    labelPosition: 'center',
    isSegmented: true,
    segments: [
      {
        id: 'segmented-row-2-segment-0-123458',
        startX: 400,
        startY: 100,
        endX: 480,
        endY: 120,
        seatCount: 3,
        seatSpacing: 30,
        rotation: 14, // Slight angle
        segmentIndex: 0
      },
      {
        id: 'segmented-row-2-segment-1-123459',
        startX: 480,
        startY: 120,
        endX: 540,
        endY: 180,
        seatCount: 3,
        seatSpacing: 30,
        rotation: 45, // 45 degree turn
        segmentIndex: 1
      },
      {
        id: 'segmented-row-2-segment-2-123460',
        startX: 540,
        startY: 180,
        endX: 540,
        endY: 260,
        seatCount: 3,
        seatSpacing: 30,
        rotation: 90, // Vertical
        segmentIndex: 2
      }
    ] as SegmentProperties[],
    totalSegments: 3,
    totalSeats: 9
  }
];

/**
 * Helper function to validate our test data
 */
export function validateTestData(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  TEST_SEGMENTED_SEATING_ROWS.forEach((row, index) => {
    if (row.isSegmented) {
      if (!row.segments || row.segments.length === 0) {
        errors.push(`Row ${index}: Segmented row missing segments`);
      } else {
        const calculatedTotalSeats = row.segments.reduce((sum, seg) => sum + seg.seatCount, 0);
        if (row.totalSeats !== calculatedTotalSeats) {
          errors.push(`Row ${index}: totalSeats mismatch. Expected ${calculatedTotalSeats}, got ${row.totalSeats}`);
        }
        
        if (row.totalSegments !== row.segments.length) {
          errors.push(`Row ${index}: totalSegments mismatch. Expected ${row.segments.length}, got ${row.totalSegments}`);
        }
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
} 