# Line Tool Testing Plan

## Test Scenarios

### 1. Line Drawing Tests
- [ ] **Basic Drawing**: Select line tool → First click → Move mouse → Second click creates line
- [ ] **Preview Functionality**: Preview line appears and follows mouse movement
- [ ] **Cancel Drawing**: Escape key cancels line drawing
- [ ] **Multiple Lines**: Can draw multiple lines in sequence
- [ ] **Different Angles**: Draw lines at various angles (horizontal, vertical, diagonal)

### 2. Selection Tests
- [ ] **Click Selection**: Lines can be selected by clicking on them
- [ ] **Selection Visual**: Selected lines show selection highlight
- [ ] **Multi-Selection**: Lines can be multi-selected with Ctrl+click
- [ ] **Selection Box**: Selection box appears around selected lines
- [ ] **Deselection**: Clicking empty space deselects lines

### 3. Movement Tests
- [ ] **Drag Movement**: Selected lines can be dragged to new positions
- [ ] **Maintain Dimensions**: Line length and angle preserved during movement
- [ ] **Multi-Line Movement**: Multiple selected lines move together
- [ ] **Smooth Movement**: Movement is smooth without jitter

### 4. Delete Tests
- [ ] **Delete Key**: Selected lines deleted with Delete key
- [ ] **Multi-Delete**: Multiple selected lines deleted together

### 5. Undo/Redo Tests
- [ ] **Undo Create**: Can undo line creation
- [ ] **Undo Move**: Can undo line movement
- [ ] **Undo Delete**: Can undo line deletion
- [ ] **Redo Operations**: Can redo undone operations
- [ ] **History Chain**: Multiple operations work in sequence

### 6. Export/Import Tests
- [ ] **Export with Lines**: Layouts with lines export correctly
- [ ] **Import with Lines**: Exported layouts with lines import correctly
- [ ] **Line Properties**: All line properties preserved (position, style, color, thickness)
- [ ] **Backward Compatibility**: Old layouts still work

### 7. Visual Tests
- [ ] **SVG Rendering**: Lines render as clean SVG with circular endpoints
- [ ] **Different Styles**: Solid, dashed, dotted styles work
- [ ] **Different Colors**: Color property affects line appearance
- [ ] **Different Thickness**: Thickness property affects line width
- [ ] **Zoom Compatibility**: Lines scale properly with zoom

### 8. Integration Tests
- [ ] **Tool Switching**: Can switch between line tool and other tools
- [ ] **Mixed Elements**: Lines work alongside tables and seating rows
- [ ] **Viewer Mode**: Lines appear correctly in viewer mode
- [ ] **Performance**: No performance issues with multiple lines

### 9. Edge Cases
- [ ] **Very Short Lines**: Can create very short lines (minimal distance)
- [ ] **Very Long Lines**: Can create lines spanning canvas
- [ ] **Zero-Length Prevention**: Cannot create zero-length lines
- [ ] **Canvas Bounds**: Lines can extend beyond visible canvas area
- [ ] **Grid Interaction**: Lines work with grid on/off

## Test Results
Results will be documented here after testing.