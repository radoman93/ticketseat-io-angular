# Seating Row Tool Testing Plan

## Test Overview
**Test Scope**: Comprehensive testing of the Seating Row Tool functionality including creation, linear seat arrangement, labeling, and viewer interaction
**Test Environment**: Angular seating layout editor with MobX state management
**Element Type**: Linear seating arrangements for theater/stadium style seating

---

## Test Scenarios

### 1. Row Creation Tests
- [ ] **Tool Selection**: Clicking seating row tool activates it
- [ ] **Two-Click Creation**: First click start point, second click end point
- [ ] **Preview Line**: Preview line shows during creation
- [ ] **Horizontal Creation**: Can create horizontal rows
- [ ] **Vertical Creation**: Can create vertical rows
- [ ] **Diagonal Creation**: Can create angled rows
- [ ] **Cancel Creation**: Escape cancels row creation
- [ ] **Multiple Rows**: Can create multiple rows in sequence

### 2. Seat Distribution Tests
- [ ] **Default Seat Count**: Default 8 seats in new row
- [ ] **Even Spacing**: Seats evenly distributed along row
- [ ] **Seat Alignment**: Seats align along row centerline
- [ ] **End Margins**: Appropriate margins at row ends
- [ ] **Seat Size**: Consistent seat size regardless of spacing
- [ ] **Dynamic Length**: Row length adjusts to seat count
- [ ] **Minimum Spacing**: Seats don't overlap at minimum

### 3. Property Panel Tests
- [ ] **Panel Display**: Shows when row selected
- [ ] **Seat Count Control**: Can adjust seats (1-50)
- [ ] **Count Buttons**: +/- increment/decrement by 1
- [ ] **Seat Spacing**: Can adjust spacing (20-100px)
- [ ] **Spacing Buttons**: +/- increment by 1px
- [ ] **Row Name**: Can edit row display name
- [ ] **Label Position**: Left/Center/Right options
- [ ] **Row Label Toggle**: Show/hide row label
- [ ] **Chair Label Toggle**: Show/hide seat numbers
- [ ] **Real-time Updates**: Changes apply immediately

### 4. Labeling Tests
- [ ] **Row Label Display**: Row name displays correctly
- [ ] **Label Positions**: Left/center/right work properly
- [ ] **Chair Numbers**: Sequential numbering (1, 2, 3...)
- [ ] **Number Visibility**: Chair labels toggle on/off
- [ ] **Label Scaling**: Labels scale with zoom
- [ ] **Label Rotation**: Labels readable at any angle
- [ ] **Label Styling**: Consistent label appearance

### 5. Selection & Movement Tests
- [ ] **Row Selection**: Click selects entire row
- [ ] **Individual Seats**: Can select individual seats
- [ ] **Multi-Selection**: Works with other elements
- [ ] **Drag Movement**: Can drag row to new position
- [ ] **Maintain Angle**: Row angle preserved during move
- [ ] **Seats Move Together**: All seats move with row
- [ ] **Grid Snap**: Snaps to grid if enabled

### 6. Rotation Tests
- [ ] **Free Rotation**: Rows can be at any angle
- [ ] **Rotation Handle**: Visual rotation handle (if implemented)
- [ ] **Seat Orientation**: Seats maintain proper orientation
- [ ] **Label Readability**: Labels stay readable
- [ ] **Smooth Rotation**: No visual artifacts
- [ ] **Rotation Center**: Rotates around row center

### 7. Visual Rendering Tests
- [ ] **Row Line**: Visual line connecting seats (optional)
- [ ] **Seat Appearance**: Clear seat representation
- [ ] **Selection Highlight**: Clear selection box
- [ ] **Hover Effects**: Seat hover feedback
- [ ] **Row Boundaries**: Clear row extent indication
- [ ] **Consistent Styling**: Matches other elements
- [ ] **Zoom Behavior**: Scales properly

### 8. Delete Tests
- [ ] **Delete Key**: Deletes selected row
- [ ] **Delete Button**: Property panel delete works
- [ ] **Seat Removal**: All seats removed with row
- [ ] **Multi-Delete**: Can delete multiple rows
- [ ] **Confirmation**: Delete confirmation (if implemented)

### 9. Undo/Redo Tests
- [ ] **Undo Create**: Can undo row creation
- [ ] **Undo Move**: Can undo position changes
- [ ] **Undo Property Changes**: Can undo seat count, spacing
- [ ] **Undo Delete**: Can restore deleted row
- [ ] **Redo Operations**: Can redo all operations
- [ ] **History Chain**: Maintains operation order

### 10. Export/Import Tests
- [ ] **Export Format**: Row data structure correct
- [ ] **Position Data**: Start/end points preserved
- [ ] **Seat Data**: Individual seat information included
- [ ] **Property Export**: All properties saved
- [ ] **Import Recreation**: Rows recreated exactly
- [ ] **Label Settings**: Label preferences preserved

### 11. Viewer Mode Tests
- [ ] **Display Consistency**: Rows appear correctly
- [ ] **Seat Selection**: Can select seats for booking
- [ ] **No Editing**: Properties locked
- [ ] **Availability Display**: Shows seat states
- [ ] **Row Information**: Row name visible
- [ ] **Seat Information**: Seat numbers visible
- [ ] **Booking Flow**: Can book selected seats

### 12. Edge Cases
- [ ] **Single Seat Row**: Row with 1 seat
- [ ] **Maximum Seats**: Row with 50 seats
- [ ] **Minimum Spacing**: 20px spacing
- [ ] **Maximum Spacing**: 100px spacing
- [ ] **Very Short Row**: Minimum length row
- [ ] **Very Long Row**: Canvas-spanning row
- [ ] **Steep Angles**: Near-vertical rows

### 13. Performance Tests
- [ ] **Many Rows**: 200+ rows on canvas
- [ ] **Long Rows**: 50-seat rows
- [ ] **Complex Angles**: Various row orientations
- [ ] **Rapid Creation**: Quick successive rows
- [ ] **Selection Speed**: Fast selection response
- [ ] **Property Updates**: Quick property changes

### 14. Integration Tests
- [ ] **With Tables**: Rows work with tables
- [ ] **With Polygons**: No conflicts with shapes
- [ ] **Mixed Layouts**: Theater + banquet setup
- [ ] **Alignment Tools**: Rows align properly
- [ ] **Grid Integration**: Consistent grid behavior
- [ ] **Tool Switching**: Clean transitions

### 15. Advanced Row Features
- [ ] **Curved Rows**: Arc-shaped rows (if supported)
- [ ] **Row Sections**: Gaps in rows (if supported)
- [ ] **Aisle Seats**: Special aisle marking
- [ ] **Row Grouping**: Multiple rows as group
- [ ] **Accessibility Seats**: Special seat types
- [ ] **Price Zones**: Different pricing areas

### 16. Accessibility Tests
- [ ] **Keyboard Control**: Create/edit via keyboard
- [ ] **Tab Navigation**: Tab through seats
- [ ] **Screen Reader**: Row information announced
- [ ] **High Contrast**: Visible in high contrast
- [ ] **Focus Indicators**: Clear focus states

### 17. Mobile/Touch Tests
- [ ] **Touch Creation**: Two-tap row creation
- [ ] **Touch Selection**: Tap to select
- [ ] **Pinch Zoom**: Works with rows visible
- [ ] **Touch Drag**: Can move rows
- [ ] **Responsive UI**: Property panel adapts

---

## Test Execution Priority

### P0 - Critical (Must Pass)
- Basic row creation
- Seat distribution
- Property controls
- Selection and movement
- Delete functionality

### P1 - High (Should Pass)
- Labeling system
- Export/import
- Viewer mode
- Undo/redo
- Various angles

### P2 - Medium (Nice to Have)
- Advanced features
- Performance optimization
- Edge cases
- Integration scenarios

### P3 - Low (Future)
- Accessibility
- Mobile support
- Curved rows
- Special features

---

## Test Environment Setup

### Prerequisites
- Clear canvas area
- Grid enabled
- Property panel visible
- Sample venue layout
- Test data prepared

### Test Data
- Straight horizontal rows
- Angled theater rows
- Various seat counts
- Different spacing values
- Mixed element layouts

---

## Success Criteria

✅ All P0 tests pass (100%)
✅ At least 95% of P1 tests pass
✅ Seat spacing accurate within 1px
✅ No visual rendering issues
✅ Performance with 100+ rows

---

## Test Results

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| SR001 | Tool Selection | ⏳ | - |
| SR002 | Row Creation | ⏳ | - |
| SR003 | Seat Distribution | ⏳ | - |
| ... | ... | ... | ... |

---

## Known Issues & Limitations

### Current Limitations
- Straight rows only (no curves)
- Fixed seat shape
- No row sections/gaps
- Limited styling options

### Planned Improvements
- Curved row support
- Section breaks
- Custom seat shapes
- Advanced labeling
- Price zone integration

---

*Last Updated: January 2025*
*Version: 1.0*