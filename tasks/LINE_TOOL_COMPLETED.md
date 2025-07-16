# Line Tool Implementation

## Overview
Implement a Line drawing tool for the seating layout editor that allows users to draw decorative lines with two clicks.

## Status: Completed ✅
- ✅ Core line drawing functionality completed
- ✅ Line preview working with CSS-based approach  
- ✅ SVG rendering with circular endpoints implemented
- ✅ Selection, movement, and drag functionality working
- ✅ Undo/redo support fully integrated
- ✅ Export/import functionality implemented
- ✅ Property panel for editing thickness and color
- ✅ All acceptance criteria met and tested
- ✅ Line style property removed per user request

## User Flow
1. User selects Line tool from toolbar
2. First click sets the starting point
3. Mouse movement shows preview line
4. Second click sets the end point and creates the line
5. Line appears with circular endpoints
6. Line can be selected, moved, and deleted like other elements

## Tasks and Subtasks

### 1. Data Models and Types
- [x] Add `LINE` to `ElementType` enum in `src/app/models/layout.model.ts`
- [x] Create `LineElement` interface:
  ```typescript
  interface LineElement extends LayoutElement {
    type: ElementType.LINE;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number; // default: 2
    color: string; // default: '#000000'
    style: 'solid' | 'dashed' | 'dotted'; // default: 'solid'
  }
  ```
- [x] Update `TableElement` union type to include `LineElement`

### 2. Tool System Integration
- [x] Add `Line = 'line'` to `ToolType` enum
- [x] Update `ToolStore` to handle line tool state (automatically handled by existing architecture)
- [x] Add line tool button to toolbar with icon
- [x] Add cursor style for line drawing mode

### 3. Line Component
- [x] Create `src/app/components/line/line.component.ts`
- [x] Create `src/app/components/line/line.component.html`
- [x] Create `src/app/components/line/line.component.css`
- [x] Implement line rendering using SVG:
  - Calculate SVG viewport dimensions and positioning
  - Convert absolute coordinates to SVG-relative coordinates
  - Support solid, dashed, and dotted line styles
  - Render circular endpoints as SVG circles
- [x] Add selection highlight support (blue glow when selected)
- [x] Handle viewer vs editor mode
- [x] Implement MobX reactions for reactive updates
- [x] Add LineComponent to Grid component imports
- [x] Add line element rendering in grid template
- [x] Add preview line rendering in grid template

### 4. Drawing Logic in Grid Component
- [x] Add line drawing state:
  ```typescript
  isDrawingLine: boolean = false;
  lineStartX: number = 0;
  lineStartY: number = 0;
  ```
- [x] Handle mouse events when line tool is active:
  - First click: Set start point, enable preview
  - Mouse move: Update preview line endpoint
  - Second click: Create line via AddObjectCommand
- [x] Add preview line rendering using line component
- [x] Handle escape key to cancel drawing
- [x] Update TablePosition and TableElement types to include LineElement
- [x] Add line tool initialization in autorun tool change handler
- [x] Implement cancelLineDrawing method
- [x] Implement finalizeLine method

### 5. Selection and Movement
- [x] Implement line selection hit detection
  - Calculate distance from point to line segment
  - Use tolerance for easier selection (e.g., 5px)
- [x] Calculate selection box for lines:
  - Box should encompass the entire line
  - Account for line thickness
- [x] Integrate with `SelectionStore`
- [x] Implement drag movement:
  - Move both start and end points
  - Maintain line length and angle
- [x] Support multi-selection with other elements

### 6. Commands for Undo/Redo
- [x] Update `AddObjectCommand` to support `LineElement`
- [x] Update `DeleteObjectCommand` to handle lines
- [x] Update `MoveObjectCommand` for line movement
- [x] Create/update `UpdateObjectCommand` for line properties
- [x] Test undo/redo functionality with lines

### 7. Layout Store Integration
- [x] Update `LayoutStore` to manage line elements
- [x] Add line-specific methods if needed
- [x] Ensure lines are included in element iterations
- [x] Update element counting/filtering logic

### 8. Export/Import Support
- [x] Update `LayoutExportImportService`:
  - Add line serialization
  - Add line deserialization
  - Handle backward compatibility
- [x] Test save/load with layouts containing lines

### 9. Property Panel (Optional Enhancement)
- [x] Add line section to property panel when line is selected
- [x] Add controls for:
  - Line thickness (number input/slider)
  - Line color (color picker)
  - ~~Line style (dropdown: solid/dashed/dotted)~~ *Removed per user request*
- [x] Connect property changes to UpdateObjectCommand

### 10. Testing and Polish
- [x] Test line drawing in different scenarios
- [x] Test selection accuracy
- [x] Test movement and snapping
- [x] Test export/import
- [x] Test undo/redo
- [x] Add keyboard shortcuts if needed
- [x] Update documentation

## Technical Considerations
- Lines should follow the same coordinate system (origin top-left)
- Use MobX patterns consistently with other components
- Ensure proper cleanup in component OnDestroy
- Consider performance with many lines
- Follow existing code style and patterns

## Acceptance Criteria
- [x] User can select line tool from toolbar
- [x] Two-click drawing creates a line
- [x] Preview shows during drawing
- [x] Lines have circular endpoints
- [x] Lines can be selected by clicking
- [x] Lines can be moved by dragging
- [x] Lines can be deleted with Delete key
- [x] Undo/redo works with line operations
- [x] Lines are saved/loaded correctly
- [x] Lines appear correctly in viewer mode