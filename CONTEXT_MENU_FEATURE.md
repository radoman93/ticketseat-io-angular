# Context Menu Feature Implementation

## Overview
Implemented a right-click context menu that allows users to reorder elements in the z-order (rendering order) by sending them forward or backward.

## Features Implemented

### 1. Right-Click Context Menu
- Disabled default browser context menu on canvas
- Custom context menu appears on right-click with two options:
  - Send Forward (with up arrow icon)
  - Send Backward (with down arrow icon)

### 2. Element Selection on Right-Click
- Right-clicking an element automatically selects it
- Uses coordinate transformation to account for pan and zoom
- Checks elements in reverse order (top to bottom)

### 3. Z-Order Management
- Added `swapElements` method to LayoutStore for reordering elements
- Elements later in the array render on top
- Send Forward: moves element up one position in array
- Send Backward: moves element down one position in array

### 4. Undo/Redo Support
- Created `ReorderElementCommand` for command pattern
- All reorder operations can be undone/redone
- Maintains element selection after reordering

### 5. UI/UX Considerations
- Context menu only appears in editor mode (not viewer mode)
- Menu auto-hides when clicking elsewhere
- Menu positioned at mouse cursor location
- Clean, minimal design with hover effects

## Technical Implementation

### Files Modified:
1. `grid.component.ts` - Added context menu logic and event handlers
2. `grid.component.html` - Added context menu HTML
3. `layout.store.ts` - Added swapElements method
4. `reorder-element.command.ts` - New command for undo/redo

### Key Methods:
- `onContextMenu()` - Handles right-click events
- `getElementAtPosition()` - Finds element at click coordinates
- `showContextMenu()` - Displays context menu
- `sendElementForward/Backward()` - Executes reorder commands

## Usage
1. Right-click on any element in the editor
2. Element will be selected automatically
3. Choose "Send Forward" or "Send Backward" from menu
4. Use Ctrl+Z/Cmd+Z to undo changes