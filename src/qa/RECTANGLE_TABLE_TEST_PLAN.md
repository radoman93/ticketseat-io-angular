# Rectangle Table Tool Testing Plan

## Test Overview
**Test Scope**: Comprehensive testing of the Rectangle Table Tool functionality including creation, chair placement on different sides, properties, and viewer interaction
**Test Environment**: Angular seating layout editor with MobX state management
**Element Type**: Rectangular tables with chairs on specified sides

---

## Test Scenarios

### 1. Table Creation Tests
- [ ] **Tool Selection**: Clicking rectangle table tool activates it
- [ ] **Single Click Creation**: One click creates table at cursor position
- [ ] **Default Properties**: New table has default width, height, and chair distribution
- [ ] **Visual Feedback**: Table appears immediately after click
- [ ] **Multiple Tables**: Can create multiple tables in sequence
- [ ] **Tool Persistence**: Tool stays active for multiple creations
- [ ] **Grid Snap**: Table snaps to grid if enabled
- [ ] **Creation Position**: Table centers on click point

### 2. Table Dimensions Tests
- [ ] **Default Size**: Default 120x80 dimensions
- [ ] **Width Adjustment**: Can adjust width (60-300)
- [ ] **Width Buttons**: +/- buttons increment by 10
- [ ] **Height Adjustment**: Can adjust height (40-200)
- [ ] **Height Buttons**: +/- buttons increment by 10
- [ ] **Aspect Ratio**: No forced aspect ratio
- [ ] **Visual Updates**: Table resizes smoothly
- [ ] **Chair Repositioning**: Chairs adjust to new dimensions

### 3. Chair Distribution Tests
- [ ] **Four Sides Control**: Separate controls for each side
- [ ] **Top Chairs**: Can place 0-20 chairs on top
- [ ] **Bottom Chairs**: Can place 0-20 chairs on bottom
- [ ] **Left Chairs**: Can place 0-20 chairs on left
- [ ] **Right Chairs**: Can place 0-20 chairs on right
- [ ] **Even Spacing**: Chairs evenly spaced on each side
- [ ] **Corner Handling**: No chairs at corners
- [ ] **Total Count Display**: Shows total chair count
- [ ] **Chair Orientation**: Chairs face into table

### 4. Property Panel Tests
- [ ] **Panel Display**: Property panel shows when table selected
- [ ] **Dimension Controls**: Width/height inputs work
- [ ] **Chair Distribution Section**: All four sides controllable
- [ ] **Increment/Decrement**: All +/- buttons function
- [ ] **Table Name**: Can edit table display name
- [ ] **Label Visibility**: Toggle table label on/off
- [ ] **Chair Label Visibility**: Toggle chair labels on/off
- [ ] **Rotation Control**: Can rotate entire table
- [ ] **Delete Button**: Delete function works
- [ ] **Real-time Updates**: Changes apply immediately

### 5. Chair Placement Logic Tests
- [ ] **Side Spacing**: Equal spacing along each side
- [ ] **No Corners**: Chairs avoid corner positions
- [ ] **Single Chair Centered**: One chair centers on side
- [ ] **Two Chairs Balanced**: Two chairs symmetrically placed
- [ ] **Maximum Density**: Max chairs don't overlap
- [ ] **Dynamic Redistribution**: Chairs reposition on count change
- [ ] **Side Independence**: Each side updates independently

### 6. Selection & Movement Tests
- [ ] **Table Selection**: Click on table selects entire element
- [ ] **Chair Selection**: Individual chairs selectable
- [ ] **Multi-Selection**: Can select with other elements
- [ ] **Drag Movement**: Can drag table to new position
- [ ] **Chairs Move Together**: All chairs move with table
- [ ] **Shape Preserved**: Rectangle shape maintained
- [ ] **Grid Snap Movement**: Snaps to grid during drag

### 7. Rotation Tests
- [ ] **Manual Rotation**: Can rotate via property panel
- [ ] **15° Increments**: Rotation in 15-degree steps
- [ ] **Chair Rotation**: Chairs rotate with table
- [ ] **Chair Reorientation**: Chairs maintain table-facing orientation
- [ ] **Label Readability**: Labels stay readable
- [ ] **Smooth Rotation**: No visual artifacts
- [ ] **Full 360°**: Complete rotation possible

### 8. Visual Rendering Tests
- [ ] **Table Appearance**: Clean rectangle rendering
- [ ] **Table Fill**: Appropriate fill color/pattern
- [ ] **Table Border**: Visible table outline
- [ ] **Chair Rendering**: Consistent chair appearance
- [ ] **Side Differentiation**: Can distinguish chair sides
- [ ] **Label Display**: Table name shows correctly
- [ ] **Chair Numbers**: Sequential numbering across sides
- [ ] **Zoom Scaling**: Proper scaling at all zoom levels

### 9. Delete Tests
- [ ] **Delete Key**: Selected table deleted with Delete key
- [ ] **Delete Button**: Property panel delete works
- [ ] **Chair Removal**: All chairs removed with table
- [ ] **Multi-Delete**: Can delete multiple tables
- [ ] **Undo Delete**: Can restore deleted table

### 10. Undo/Redo Tests
- [ ] **Undo Create**: Can undo table creation
- [ ] **Undo Move**: Can undo position changes
- [ ] **Undo Resize**: Can undo dimension changes
- [ ] **Undo Chair Changes**: Can undo distribution changes
- [ ] **Undo Rotation**: Can undo rotation
- [ ] **Redo All**: Can redo any undone operation
- [ ] **History Integrity**: Operation sequence maintained

### 11. Export/Import Tests
- [ ] **Export Structure**: Table exports with all properties
- [ ] **Dimension Data**: Width/height preserved
- [ ] **Chair Distribution**: Side counts maintained
- [ ] **Chair Positions**: Individual chair data included
- [ ] **Import Accuracy**: Tables recreated exactly
- [ ] **Rotation Preserved**: Rotation angle maintained
- [ ] **Label States**: Visibility settings preserved

### 12. Viewer Mode Tests
- [ ] **Display Accuracy**: Tables appear correctly
- [ ] **No Editing**: Properties locked in viewer
- [ ] **Chair Selection**: Chairs selectable for booking
- [ ] **Availability Display**: Shows chair states
- [ ] **Side Recognition**: Can identify chair sides
- [ ] **Hover Information**: Chair details on hover
- [ ] **Booking Flow**: Reservation process works

### 13. Edge Cases
- [ ] **Minimum Size**: 60x40 table
- [ ] **Maximum Size**: 300x200 table
- [ ] **No Chairs**: Table with 0 chairs on all sides
- [ ] **One Side Only**: Chairs on single side only
- [ ] **Maximum Chairs**: 20 chairs per side
- [ ] **Extreme Ratios**: Very wide or tall tables
- [ ] **Overlapping Tables**: Behavior with overlaps

### 14. Performance Tests
- [ ] **Many Tables**: 100+ rectangle tables
- [ ] **Complex Distribution**: Various chair configurations
- [ ] **Rapid Creation**: Quick successive tables
- [ ] **Property Changes**: Fast updates
- [ ] **Large Tables**: Max size with max chairs
- [ ] **Rendering Speed**: Smooth zoom/pan

### 15. Integration Tests
- [ ] **With Round Tables**: Mixed table types
- [ ] **With Seating Rows**: Different element types
- [ ] **Selection Together**: Multi-type selection
- [ ] **Alignment**: Tables align properly
- [ ] **Grid Behavior**: Consistent grid snapping
- [ ] **Tool Transitions**: Smooth tool switching

### 16. Chair Interaction Tests
- [ ] **Individual Selection**: Single chair selection
- [ ] **Side Selection**: Select all chairs on side
- [ ] **Price Setting**: Individual chair pricing
- [ ] **Label Editing**: Chair label customization
- [ ] **Status Display**: Visual status indicators
- [ ] **Multi-Chair Actions**: Bulk chair operations

### 17. Accessibility Tests
- [ ] **Keyboard Navigation**: Tab through elements
- [ ] **Screen Reader**: Table information announced
- [ ] **Color Contrast**: Sufficient visibility
- [ ] **Focus Indicators**: Clear focus states
- [ ] **Alternative Input**: Non-mouse interaction

---

## Test Execution Priority

### P0 - Critical (Must Pass)
- Basic table creation
- Dimension controls
- Chair distribution on all sides
- Selection and movement
- Basic property editing

### P1 - High (Should Pass)
- Rotation functionality
- Export/import accuracy
- Viewer mode display
- Undo/redo operations
- Chair interaction

### P2 - Medium (Nice to Have)
- Advanced chair selection
- Performance optimization
- Edge case handling
- Visual enhancements

### P3 - Low (Future)
- Accessibility features
- Advanced animations
- Custom table shapes

---

## Test Environment Setup

### Prerequisites
- Clear canvas workspace
- Property panel visible
- Grid enabled for alignment
- Sample layouts ready
- Multiple browsers available

### Test Data
- Tables with various dimensions
- Different chair distributions
- Rotated tables at various angles
- Mixed element layouts
- Edge case configurations

---

## Success Criteria

✅ All P0 tests pass (100%)
✅ At least 95% of P1 tests pass
✅ Chair distribution accurate
✅ No visual glitches
✅ Performance acceptable with 50+ tables

---

## Test Results

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| RCT001 | Tool Activation | ⏳ | - |
| RCT002 | Table Creation | ⏳ | - |
| RCT003 | Dimension Control | ⏳ | - |
| ... | ... | ... | ... |

---

## Known Issues & Limitations

### Current Limitations
- Fixed chair arrangement pattern
- No rounded corners option
- Limited table styling
- No custom chair positions

### Planned Improvements
- Flexible chair placement
- Table style variations
- Custom corner radius
- Chair grouping options

---

*Last Updated: January 2025*
*Version: 1.0*