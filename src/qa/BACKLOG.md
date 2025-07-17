# TicketSeat.io Angular - Development Backlog

## Overview
This document outlines potential improvements to the codebase and new features that should be considered for future development. Items are organized by category and priority.

---

## 🔧 Codebase Improvements

### 1. Performance Optimizations

#### P0 - Critical Performance Issues
- [x] **Remove Console Statements** [Effort: S]
  - Remove all console.log statements from production code
  - Keep only error handlers
  - Add proper logging service
  - *Impact: Significant performance improvement during mouse movements*

- [x] **Optimize Selection Rendering** [Effort: M]
  - Implement canvas-based selection boxes instead of DOM elements
  - Reduce reflows during drag operations
  - Cache selection calculations
  - *Impact: Smoother selection experience with 50+ elements*

#### P1 - General Performance
- [ ] **Virtual Scrolling for Large Layouts** [Effort: L]
  - Implement viewport-based rendering
  - Only render visible elements
  - Add element culling system
  - *Impact: Support for 1000+ elements*

- [x] **MobX Optimization** [Effort: M]
  - Audit and optimize computed values
  - Add reaction disposal tracking
  - Implement batch updates for multi-element operations
  - Use `runInAction` for grouped state changes

- [x] **Debounce Property Updates** [Effort: S]
  - Add debouncing to property panel inputs
  - Batch property updates
  - Reduce unnecessary re-renders

### 2. Code Quality & Testing

#### P0 - Test Coverage
- [ ] **Unit Test Coverage** [Effort: XL]
  - Current coverage: ~10%
  - Target coverage: 80%+
  - Priority areas:
    - Stores (MobX state management)
    - Services (calculations, algorithms)
    - Commands (undo/redo)
    - Component logic
  - Add test utilities for MobX

- [ ] **E2E Testing Suite** [Effort: L]
  - Implement Cypress or Playwright
  - Cover critical user journeys:
    - Creating layouts
    - Selecting/reserving seats
    - Export/import
    - Property editing
  - Add visual regression tests

#### P1 - Code Standards
- [ ] **ESLint Configuration** [Effort: S]
  - Add comprehensive ESLint rules
  - Include Angular ESLint plugin
  - Add pre-commit hooks
  - Fix existing violations

- [ ] **Prettier Integration** [Effort: S]
  - Add Prettier configuration
  - Integrate with ESLint
  - Add format-on-save
  - Standardize code style

- [ ] **TypeScript Strict Mode** [Effort: M]
  - Enable strict mode in tsconfig
  - Fix type safety issues
  - Remove all `any` types
  - Add proper null checking

### 3. Architecture Improvements

#### P0 - State Management
- [ ] **Enable MobX Strict Mode** [Effort: M]
  - Currently disabled in main.ts
  - Fix all direct mutations
  - Wrap all mutations in actions
  - Add proper error handling

- [ ] **Centralized Error Handling** [Effort: M]
  - Create error boundary components
  - Add global error handler
  - Implement error reporting service
  - Add user-friendly error messages

#### P1 - Code Organization
- [ ] **Shared Types Module** [Effort: M]
  - Create dedicated types package
  - Consolidate interfaces
  - Remove duplicate type definitions
  - Export public API types

- [ ] **Service Layer Refactor** [Effort: L]
  - Implement proper dependency injection
  - Create service interfaces
  - Add service factories
  - Improve testability

### 4. Developer Experience

#### P1 - Documentation
- [ ] **Storybook Integration** [Effort: L]
  - Document all components
  - Add interactive examples
  - Show different states/variations
  - Include usage guidelines

- [ ] **API Documentation** [Effort: M]
  - Generate TypeDoc documentation
  - Add JSDoc comments
  - Create usage examples
  - Document MobX stores

#### P2 - Development Tools
- [ ] **Debug Mode** [Effort: M]
  - Add development-only tools
  - MobX DevTools integration
  - Performance monitoring
  - State inspection panel

- [ ] **CLI Tool** [Effort: L]
  - Create CLI for common tasks
  - Scaffold new components
  - Generate test files
  - Build automation

---

## ✨ New Features

### 1. Additional Drawing Tools

#### P1 - Essential Tools
- [ ] **Text/Label Tool** [Effort: M]
  - Add text annotations to layouts
  - Customizable fonts/sizes
  - Text alignment options
  - Use cases: Section labels, notes, instructions

- [ ] **Shape Library** [Effort: L]
  - Pre-built venue elements:
    - Stage shapes
    - Podium designs
    - Dance floor
    - Bar counter
    - Exit signs
  - Drag-and-drop from library
  - Customizable properties

#### P2 - Advanced Tools
- [ ] **Circle/Ellipse Tool** [Effort: M]
  - Draw circular elements
  - Useful for: Round bars, fountains, pillars
  - Fill and border options

- [ ] **Arrow/Connector Tool** [Effort: M]
  - Connect elements visually
  - Show flow/direction
  - Multiple arrow styles
  - Use cases: Entry/exit paths, queue lines

- [ ] **Free-form Drawing** [Effort: L]
  - Pen tool for custom shapes
  - Bezier curve support
  - Path editing capabilities

### 2. Advanced Editor Features

#### P0 - Core Editing
- [ ] **Multi-Select Rectangle** [Effort: M]
  - Click-and-drag rectangle selection
  - Add to selection with Shift
  - Remove from selection with Ctrl
  - Visual feedback during selection

- [ ] **Copy/Paste System** [Effort: M]
  - Copy single or multiple elements
  - Paste with offset
  - Duplicate with Ctrl+D
  - Cross-browser clipboard support

#### P1 - Productivity Tools
- [ ] **Alignment Tools** [Effort: M]
  - Align left/center/right
  - Align top/middle/bottom
  - Distribute horizontally/vertically
  - Smart spacing
  - **Requires**: Element Snapping System for visual feedback

- [ ] **Element Snapping System** [Effort: L]
  - **Core Snapping Engine**:
    - Element-to-element snapping detection
    - Snap tolerance configuration (default: 10px)
    - Performance optimization for large layouts
    - Real-time snap calculation during drag operations
    - Multi-element snap detection (snap to multiple elements simultaneously)
  
  - **Snap Points & Alignment**:
    - **Edge Snapping**: Top, bottom, left, right edges of elements
    - **Center Snapping**: Horizontal and vertical center alignment
    - **Corner Snapping**: All four corners of rectangular elements
    - **Custom Snap Points**: Element-specific snap points (e.g., chair positions on tables)
    - **Alignment Lines**: When 3+ elements align, show alignment guides
    - **Equal Spacing**: Snap to maintain equal spacing between elements
  
  - **Visual Feedback System**:
    - **Snap Guides**: Dashed lines showing active snap relationships
    - **Snap Indicators**: Highlight snap points when dragging near them
    - **Measurement Labels**: Show distance/alignment measurements
    - **Snap Preview**: Ghost outline showing final position before drop
    - **Multi-color Coding**: Different colors for different snap types
    - **Fade Animation**: Smooth fade in/out of snap guides
  
  - **User Controls**:
    - **Toggle Button**: Enable/disable snapping in top toolbar
    - **Keyboard Override**: Hold Shift to temporarily disable snapping
    - **Snap Mode Selector**: Edge-only, center-only, or all snap points
    - **Snap Sensitivity**: Adjustable snap distance in settings
    - **Snap Sound**: Optional audio feedback for snap events
  
  
  - **Performance Optimizations**:
    - **Spatial Indexing**: Use quadtree/R-tree for efficient snap detection
    - **Viewport Culling**: Only calculate snaps for visible elements
    - **Debounced Updates**: Throttle snap calculations during rapid movement
    - **Level-of-Detail**: Simplified snapping for zoomed-out views
  
  - **Element-Specific Behaviors**:
    - **Tables**: table edges, center points
    - **Seating Rows**: Snap to row alignment, seat spacing
    - **Polygons**: Snap to vertex points and edge centers
    - **Lines**: Snap endpoints and midpoints
    - **Groups**: Snap to group bounding box
  
  - **Integration Points**:
    - **Drag System**: Integrate with existing drag store
    - **Grid System**: Combine with existing grid snapping
    - **Undo/Redo**: Snap operations trackable in history
    - **Selection System**: Multi-select snap behavior
    - **Zoom Integration**: Scale snap sensitivity with zoom level

- [ ] **Smart Guides & Rulers** [Effort: M]
  - **Complementary Feature to Element Snapping**
  - **Ruler System**:
    - Horizontal and vertical rulers along canvas edges
    - Dynamic measurement units (px, inches, cm)
    - Ruler guides (draggable lines from rulers)
    - Ruler zero point adjustment
  - **Smart Guides**:
    - Auto-generated alignment guides
    - Distance measurement between elements
    - Margin and padding indicators
    - Object relationship visualization
  - **Measurement Tools**:
    - Click-to-measure distance tool
    - Area calculation for selected elements
    - Angle measurement for rotated elements
    - Real-time coordinate display
  - **Integration**:
    - Snap to ruler guides
    - Snap guides enhance ruler functionality
    - Keyboard shortcuts for guide creation
    - Guide persistence across sessions

- [ ] **Enhanced Drag & Drop** [Effort: M]
  - **Prerequisite for Advanced Snapping**
  - **Drag Improvements**:
    - Momentum-based dragging
    - Multi-touch gesture support
    - Drag constraints (horizontal/vertical only)
    - Clone-on-drag with modifier keys
  - **Drop Zones**:
    - Visual drop zone highlights
    - Invalid drop area indicators
    - Drop preview with transparency
    - Magnetic drop zones
  - **Performance**:
    - Optimized drag rendering
    - Reduced DOM manipulation during drag
    - Efficient collision detection
    - Smooth animation curves

- [ ] **Layers Panel** [Effort: L]
  - Visual layer management
  - Reorder elements
  - Lock/unlock layers
  - Show/hide elements
  - Group organization

#### P2 - Power Features
- [ ] **Keyboard Shortcuts** [Effort: M]
  - Comprehensive shortcut system
  - Customizable bindings
  - Shortcut hints/overlay
  - Common shortcuts:
    - Ctrl+Z/Y - Undo/Redo
    - Delete - Delete selected
    - Ctrl+A - Select all
    - Arrow keys - Nudge elements

- [ ] **Measurement Tools** [Effort: M]
  - Ruler display
  - Distance measurement
  - Area calculation
  - Grid coordinates display

### 3. Enhanced Viewer Features

#### P0 - User Experience
- [ ] **Seat Tooltips** [Effort: S]
  - Hover tooltips with:
    - Seat number/label
    - Price information
    - Availability status
    - Row/section info
  - Mobile-friendly touch tooltips

- [ ] **Search Functionality** [Effort: M]
  - Search by seat number
  - Search by section
  - Search by price range
  - Highlight search results
  - Jump to seat

#### P1 - Navigation
- [ ] **Minimap** [Effort: M]
  - Overview of entire layout
  - Current viewport indicator
  - Click to navigate
  - Collapsible panel

- [ ] **Section Navigation** [Effort: M]
  - Section dropdown/buttons
  - Quick jump to sections
  - Breadcrumb navigation
  - Previous/next section

#### P2 - Accessibility
- [ ] **Keyboard Navigation** [Effort: L]
  - Tab through seats
  - Arrow key navigation
  - Enter to select
  - Screen reader support
  - ARIA labels

- [ ] **High Contrast Mode** [Effort: S]
  - Toggle high contrast
  - Larger text options
  - Enhanced selection indicators
  - Color blind friendly options

### 4. Data Management

#### P1 - Version Control
- [ ] **Layout Versioning** [Effort: L]
  - Save layout versions
  - Version comparison
  - Restore previous versions
  - Change history log
  - Version comments

- [ ] **Template System** [Effort: M]
  - Save as template
  - Template library
  - Category organization
  - Share templates
  - Quick start from template

#### P2 - Collaboration
- [ ] **Real-time Collaboration** [Effort: XL]
  - Multiple users editing
  - Live cursor tracking
  - Conflict resolution
  - User permissions
  - Change attribution

- [ ] **Cloud Storage** [Effort: L]
  - Save to cloud
  - Auto-save functionality
  - Sync across devices
  - Backup management
  - Storage quotas

### 5. Business Features

#### P0 - Pricing
- [ ] **Pricing Zones** [Effort: M]
  - Define price categories
  - Color-coded zones
  - Bulk price assignment
  - Visual price heat map
  - Price templates

- [ ] **Dynamic Pricing** [Effort: L]
  - Time-based pricing
  - Demand-based pricing
  - Early bird discounts
  - Group discounts
  - API integration

#### P1 - Booking Features
- [ ] **Seat Hold System** [Effort: M]
  - Temporary seat holds
  - Configurable hold duration
  - Auto-release on timeout
  - Hold extension options
  - Visual hold indicators

- [ ] **Group Booking** [Effort: L]
  - Select adjacent seats
  - Group size requirements
  - Best available algorithm
  - Split group options
  - Group discounts

#### P2 - Advanced Features
- [ ] **Season Tickets** [Effort: L]
  - Season ticket management
  - Renewal workflows
  - Transfer options
  - Upgrade/downgrade
  - Benefits tracking

- [ ] **Analytics Dashboard** [Effort: XL]
  - Sales heat maps
  - Booking patterns
  - Revenue analytics
  - Occupancy trends
  - Custom reports

### 6. Integration Features

#### P1 - API Enhancements
- [ ] **REST API Wrapper** [Effort: M]
  - Complete REST API
  - OpenAPI specification
  - Client SDKs
  - Rate limiting
  - API versioning

- [ ] **GraphQL Support** [Effort: L]
  - GraphQL endpoint
  - Subscriptions
  - Optimistic updates
  - Query batching
  - Schema documentation

#### P2 - External Integrations
- [ ] **Webhook System** [Effort: M]
  - Event notifications
  - Configurable webhooks
  - Retry logic
  - Event filtering
  - Webhook testing

- [ ] **Third-party Integrations** [Effort: XL]
  - Ticketmaster API
  - Eventbrite sync
  - Payment gateways
  - CRM systems
  - Email marketing

---

## 📊 Implementation Strategy

### Quick Wins (1-2 weeks each)
1. Remove console statements
2. Add ESLint/Prettier
3. Seat tooltips
4. Basic keyboard shortcuts
5. High contrast mode

### Medium Projects (2-4 weeks each)
1. Unit test coverage
2. Copy/paste system
3. Multi-select rectangle
4. Element snapping system (core engine + visual feedback)
5. Text tool
6. Pricing zones

### Large Projects (1-2 months each)
1. Virtual scrolling
2. Real-time collaboration
3. Analytics dashboard
4. Third-party integrations
5. Complete E2E test suite

---

## 🎯 Success Metrics

### Performance
- Initial load time < 2 seconds
- 60 FPS during interactions
- Support 1000+ elements
- Memory usage < 200MB

### Quality
- Test coverage > 80%
- Zero critical bugs
- Accessibility score > 90
- Lighthouse score > 90

### User Experience
- Task completion rate > 95%
- User satisfaction > 4.5/5
- Support ticket reduction 50%
- Feature adoption > 70%
- **Element Snapping**:
  - Snap success rate > 90%
  - Snap response time < 50ms
  - User precision improvement > 40%
  - Layout creation time reduction > 25%

---

## 📝 Notes

### Dependencies
- Some features depend on backend API changes
- Real-time features require WebSocket infrastructure
- Analytics require data collection consent
- **Element Snapping System** requires:
  - Enhanced drag & drop implementation
  - Performance optimizations in MobX stores
  - Canvas rendering improvements for snap guides
  - Spatial indexing library (or custom implementation)
  - Integration with existing grid system

### Breaking Changes
- MobX strict mode may require migration
- TypeScript strict mode will need refactoring
- API versioning needed for backwards compatibility

### Resource Requirements
- Additional developers for large features
- UX designer for new tools
- QA resources for testing
- DevOps for infrastructure

### Element Snapping Implementation Phases
**Phase 1 (Week 1-2)**: Core Infrastructure
- Spatial indexing system
- Basic snap detection algorithm
- Integration with drag store
- Toggle control in toolbar

**Phase 2 (Week 3-4)**: Visual Feedback
- Snap guide rendering system
- Dashed line visualization
- Snap point highlighting
- Animation system

**Phase 3 (Week 5-6)**: Advanced Features
- Multi-element snapping
- Smart prioritization
- Performance optimization
- Element-specific behaviors

**Phase 4 (Week 7-8)**: Polish & Integration
- Keyboard shortcuts
- Settings integration
- Comprehensive testing
- Documentation

---

*Last Updated: July 2025*
*Version: 1.1*

### Recent Updates
- **P1 Task 3 - Debounce Property Updates**: ✅ Completed
- **Element Snapping System**: Added comprehensive specification as next priority feature
- **Smart Guides & Rulers**: Added complementary feature to enhance snapping
- **Enhanced Drag & Drop**: Added prerequisite feature for advanced snapping
- **Implementation Strategy**: Updated to include snapping as medium-priority project