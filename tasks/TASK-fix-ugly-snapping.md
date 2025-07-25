# Task: Fix Multiple Edge Snapping Issue

## Problem
When elements of similar size are dragged near each other, they try to snap multiple edges at once (e.g., center point and top edge, or center edge and left-to-right edge), resulting in an ugly appearance.

## Root Cause Analysis
The current implementation allows multiple alignments per axis without conflict resolution:
1. Both center and edge alignments can occur simultaneously on the same axis
2. No prioritization between conflicting alignments
3. All matching alignments within threshold are processed

## Solution Approach

### Phase 1: Implement Conflict Resolution
- [ ] Add logic to detect conflicting alignments on the same axis
- [ ] Implement priority-based selection when multiple alignments compete
- [ ] Ensure only one alignment per axis is active at a time

### Phase 2: Smart Alignment Selection
- [ ] Add distance-based weighting for alignment selection
- [ ] Implement mutual exclusion for center vs edge alignments
- [ ] Add hysteresis to prevent alignment flickering

### Phase 3: Visual Feedback Improvements
- [ ] Show only the active alignment guide, not all possible ones
- [ ] Add subtle animation when switching between alignments
- [ ] Make guide appearance dependent on alignment strength

## Implementation Details

### 1. Modify SnappingStore
- Update `calculateSnapResult` to filter conflicting alignments
- Add alignment conflict detection logic
- Implement single-best-alignment selection per axis

### 2. Add Alignment Filtering Rules
- Center alignment takes precedence when within 60% of threshold
- Edge alignments are mutually exclusive with center on same axis
- Closer alignments override farther ones

### 3. Update Visual Guides
- Only render guides for active alignments
- Add fade-in/fade-out transitions
- Make line opacity proportional to alignment strength

## Expected Outcome
- Elements snap to only one alignment per axis
- Natural-looking snapping behavior
- Clear visual feedback showing active alignment
- No conflicting multi-edge snapping