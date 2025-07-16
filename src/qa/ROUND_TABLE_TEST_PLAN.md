# Round Table Tool Testing Plan

## Test Overview
**Test Scope**: Comprehensive testing of the Round Table Tool functionality including creation, chair management, properties, and viewer interaction
**Test Environment**: Angular seating layout editor with MobX state management
**Element Type**: Circular tables with radially distributed chairs

---

## Test Scenarios

### 1. Table Creation Tests
- [ ] **Tool Selection**: Clicking round table tool activates it
- [ ] **Single Click Creation**: One click creates table at cursor position
- [ ] **Default Properties**: New table has default radius, seats, and properties
- [ ] **Visual Feedback**: Table appears immediately after click
- [ ] **Multiple Tables**: Can create multiple tables in sequence
- [ ] **Tool Persistence**: Tool stays active for multiple creations
- [ ] **Grid Snap**: Table snaps to grid if enabled
- [ ] **Creation Animation**: Smooth appearance (if implemented)

### 2. Chair Distribution Tests
- [ ] **Default Chair Count**: Default 8 chairs evenly distributed
- [ ] **Chair Positioning**: Chairs positioned radially around table
- [ ] **Equal Spacing**: Chairs have equal angular spacing
- [ ] **Chair Rotation**: Each chair faces center of table
- [ ] **Dynamic Updates**: Chairs update when count changes
- [ ] **Chair Labels**: Chairs numbered sequentially (1, 2, 3...)
- [ ] **Chair Size**: Appropriate chair size relative to table

### 3. Property Panel Tests
- [ ] **Panel Display**: Property panel shows when table selected
- [ ] **Radius Control**: Can adjust table radius (20-100)
- [ ] **Radius Buttons**: +/- buttons increment by 5
- [ ] **Seat Count**: Can adjust number of seats (4-20)
- [ ] **Seat Buttons**: +/- buttons increment by 1
- [ ] **Open Spaces**: Can set open spaces (0-20)
- [ ] **Table Name**: Can edit table display name
- [ ] **Table Label Visibility**: Toggle table label on/off
- [ ] **Chair Label Visibility**: Toggle chair labels on/off
- [ ] **Rotation Control**: Can rotate entire table
- [ ] **Real-time Updates**: Changes apply immediately

### 4. Open Spaces Tests
- [ ] **Space Creation**: Open spaces remove chairs at positions
- [ ] **Space Distribution**: Open spaces evenly distributed
- [ ] **Visual Gap**: Clear visual gap where chairs removed
- [ ] **Space Limit**: Cannot exceed chair count
- [ ] **Dynamic Adjustment**: Spaces adjust with chair count changes
- [ ] **Labeling**: Remaining chairs labeled correctly

### 5. Selection & Movement Tests
- [ ] **Table Selection**: Click on table selects entire element
- [ ] **Chair Selection**: Individual chairs selectable
- [ ] **Multi-Selection**: Can select with other elements
- [ ] **Drag Movement**: Can drag table to new position
- [ ] **Chairs Move Together**: All chairs move with table
- [ ] **Rotation Preserved**: Table rotation maintained during move
- [ ] **Grid Snap Movement**: Snaps to grid during drag

### 6. Visual Rendering Tests
- [ ] **Table Appearance**: Clean circular table rendering
- [ ] **Table Fill**: Appropriate fill color/pattern
- [ ] **Table Border**: Visible table outline
- [ ] **Chair Rendering**: Chairs render as circles/appropriate shapes
- [ ] **Label Rendering**: Table name displays correctly
- [ ] **Chair Labels**: Chair numbers display clearly
- [ ] **Zoom Rendering**: Scales properly with zoom
- [ ] **Selection Highlight**: Clear selection indicators

### 7. Chair Interaction Tests
- [ ] **Chair Hover**: Hover effects on chairs
- [ ] **Chair Click**: Can select individual chairs
- [ ] **Chair Properties**: Can edit chair properties
- [ ] **Chair Pricing**: Can set individual chair prices
- [ ] **Chair Status**: Visual indication of chair status
- [ ] **Multi-Chair Selection**: Can select multiple chairs

### 8. Rotation Tests
- [ ] **Manual Rotation**: Can rotate via property panel
- [ ] **15° Increments**: Rotation in 15-degree steps
- [ ] **Visual Rotation**: Table and chairs rotate together
- [ ] **Label Orientation**: Labels maintain readability
- [ ] **Smooth Rotation**: No visual artifacts during rotation
- [ ] **Rotation Limits**: Full 360-degree rotation

### 9. Delete Tests
- [ ] **Delete Key**: Selected table deleted with Delete key
- [ ] **Delete Button**: Property panel delete button works
- [ ] **Chair Deletion**: Deleting table removes all chairs
- [ ] **Multi-Delete**: Can delete multiple tables at once
- [ ] **Undo Delete**: Can undo table deletion

### 10. Undo/Redo Tests
- [ ] **Undo Create**: Can undo table creation
- [ ] **Undo Move**: Can undo table movement
- [ ] **Undo Property Changes**: Can undo radius, seats, etc.
- [ ] **Undo Rotation**: Can undo rotation changes
- [ ] **Redo Operations**: Can redo all undone operations
- [ ] **History Chain**: Multiple operations in sequence

### 11. Export/Import Tests
- [ ] **Export Data**: Table exports with all properties
- [ ] **Chair Data**: All chairs included in export
- [ ] **Import Restoration**: Imported tables appear correctly
- [ ] **Property Preservation**: All properties maintained
- [ ] **Position Accuracy**: Exact positioning preserved
- [ ] **Rotation State**: Rotation angle preserved

### 12. Viewer Mode Tests
- [ ] **Read-Only Display**: Tables display in viewer
- [ ] **No Editing**: Cannot edit table properties
- [ ] **Chair Selection**: Can select chairs for booking
- [ ] **Chair States**: Shows available/reserved states
- [ ] **Visual Consistency**: Same appearance as editor
- [ ] **Hover Effects**: Appropriate chair hover effects
- [ ] **Reservation Flow**: Can reserve selected chairs

### 13. Edge Cases
- [ ] **Minimum Radius**: Table with radius 20
- [ ] **Maximum Radius**: Table with radius 100
- [ ] **Minimum Chairs**: Table with 4 chairs
- [ ] **Maximum Chairs**: Table with 20 chairs
- [ ] **All Open Spaces**: Table with max open spaces
- [ ] **Overlapping Tables**: Tables can overlap
- [ ] **Canvas Boundaries**: Tables at canvas edges

### 14. Performance Tests
- [ ] **Many Tables**: 100+ tables on canvas
- [ ] **Large Tables**: Tables with 20 chairs each
- [ ] **Rapid Creation**: Quick successive creations
- [ ] **Property Updates**: Fast property changes
- [ ] **Selection Performance**: Quick selection response
- [ ] **Render Performance**: Smooth zoom/pan

### 15. Integration Tests
- [ ] **With Other Tables**: Works with rectangle tables
- [ ] **With Rows**: Works alongside seating rows
- [ ] **With Lines/Polygons**: No conflicts with shapes
- [ ] **Mixed Selection**: Can select with other types
- [ ] **Grid Integration**: Respects grid settings
- [ ] **Tool Switching**: Clean transition between tools

### 16. Accessibility Tests
- [ ] **Keyboard Creation**: Can create via keyboard
- [ ] **Tab Navigation**: Can tab to table elements
- [ ] **Screen Reader**: Table info announced
- [ ] **Color Contrast**: Sufficient contrast
- [ ] **Focus Indicators**: Clear focus states

---

## Test Execution Priority

### P0 - Critical (Must Pass)
- Basic table creation
- Chair distribution
- Property panel controls
- Selection and movement
- Delete functionality

### P1 - High (Should Pass)
- Open spaces functionality
- Rotation features
- Export/import
- Viewer mode display
- Undo/redo

### P2 - Medium (Nice to Have)
- Individual chair editing
- Advanced visual effects
- Performance optimizations
- Edge case handling

### P3 - Low (Future)
- Accessibility features
- Animation effects
- Advanced chair arrangements

---

## Test Environment Setup

### Prerequisites
- Clear canvas area
- Property panel visible
- Grid enabled
- Multiple browser setup
- Sample layout data

### Test Data
- Tables with various radii
- Tables with different chair counts
- Tables with open spaces
- Rotated tables
- Mixed element layouts

---

## Success Criteria

✅ All P0 tests pass (100%)
✅ At least 95% of P1 tests pass
✅ No visual rendering issues
✅ Chair distribution accurate
✅ Smooth performance with 50+ tables

---

## Test Results

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| RT001 | Tool Selection | ⏳ | - |
| RT002 | Table Creation | ⏳ | - |
| RT003 | Chair Distribution | ⏳ | - |
| ... | ... | ... | ... |

---

## Known Issues & Limitations

### Current Limitations
- Fixed chair distribution pattern
- Limited chair shape options
- No custom table shapes
- No table grouping

### Planned Improvements
- Custom chair arrangements
- Different table styles
- Chair shape varieties
- Table templates

---

*Last Updated: January 2025*
*Version: 1.0*