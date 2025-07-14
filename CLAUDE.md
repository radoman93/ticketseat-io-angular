# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Start development server
npm start

# Build the library for distribution
npm run build

# Run tests
npm test

# Watch mode for library development
npm run watch

# Build and pack for testing
npm run pack

# Publish to GitHub packages
npm run publish:github
```

### Build Process
The build process involves multiple steps:
1. `npm run build:lib` - Build Angular library using ng-packagr
2. `npm run add:css-export` - Add CSS export (runs add-css-export.js)
3. `npm run build:css` - Build Tailwind CSS
4. `npm run copy:css` - Copy built CSS to dist
5. `npm run copy:assets` - Copy assets to dist

## Architecture Overview

### Core Architecture
This is an Angular library (v19) for creating interactive seating layouts with drag-and-drop functionality. It uses **MobX for state management** instead of traditional Angular state patterns.

### Key Components

#### EventEditorComponent (`src/app/components/event-editor/`)
- Admin interface for creating/editing layouts
- Provides full CRUD operations on seating elements
- Exports layouts as JSON

#### EventViewerComponent (`src/app/components/event-viewer/`)
- End-user interface for seat selection
- Read-only view with reservation functionality
- Supports pre-reserved seats and seat limits

#### GridComponent (`src/app/components/grid/`)
- Canvas-based grid system for element positioning
- Handles pan/zoom, selection, and element creation
- Uses hybrid rendering: Canvas for grid, DOM for interactive elements

### State Management (MobX)

The application uses MobX stores (`src/app/stores/`):

- **RootStore** - Aggregates all stores, single entry point
- **LayoutStore** - Manages all layout elements (tables, rows)
- **ChairStore** - Manages individual chair states
- **SelectionStore** - Tracks selected elements
- **GridStore** - Grid settings, pan/zoom state
- **ViewerStore** - Viewer-specific state (reservations)
- **HistoryStore** - Undo/redo functionality
- **DragStore** - Drag and drop operations
- **ToolStore** - Active tool management

### Element Types

Four main seating elements:
1. **RoundTable** - Circular tables with radial chair placement
2. **RectangleTable** - Rectangular tables with chairs on sides
3. **SeatingRow** - Linear seating arrangements
4. **SegmentedSeatingRow** - Multi-segment complex rows

### Rendering Strategy

- **Grid background**: HTML5 Canvas for performance
- **Seating elements**: DOM elements with CSS transforms
- **Selection indicators**: Overlay divs with dynamic positioning
- **Chairs**: Individual DOM elements for interactivity

### Key Services

- **SegmentedSeatingRowService** - Geometry calculations for rows
- **LayoutExportImportService** - JSON serialization/deserialization
- **AssetService** - Icon/asset path management
- **SelectionService** - Element selection logic

### Command Pattern
Uses command pattern for undo/redo (`src/app/commands/`):
- AddObjectCommand
- DeleteObjectCommand
- MoveObjectCommand
- UpdateObjectCommand

### CSS/Styling
- Uses Tailwind CSS + DaisyUI
- Custom styles in component CSS files
- Library exports compiled CSS for consumers

### Important Files
- `public-api.ts` - Library's public API exports
- `ng-package.json` - ng-packagr configuration
- `src/lib-styles.css` - Base styles for Tailwind processing

## Development Guidelines

### MobX Patterns
- Use `makeAutoObservable` for stores
- Mark actions with `@action` or `action()`
- Avoid direct state mutations outside actions
- Use computed values for derived state

### Component Structure
- Standalone components (no modules)
- Use MobX reactions/autorun for reactive updates
- Implement OnDestroy to clean up reactions

### Coordinate System
- Origin (0,0) is top-left
- Rotation is in degrees, clockwise
- Positions are absolute, not relative to viewport

### Selection System
- Selection boxes use CSS transforms with translate(-50%, -50%)
- Width/height calculations must account for element rotation
- Different positioning logic for each element type

### Export Format
Layouts export as JSON with:
- Meta information (version, name, creator)
- Grid settings
- Elements array with nested chair data
- All coordinates are absolute

## Common Issues & Solutions

### Selection Box Positioning
For seating rows, the selection box needs special handling:
- Calculate center position based on actual chair positions
- Account for chair width and spacing
- Use proper transform origin for rotated elements

### Console Performance
Remove all console.log statements except in error handlers to maintain performance during mouse movements and rendering.

### MobX Strict Mode
Currently disabled in main.ts. If re-enabling, ensure all state mutations happen within actions.

### Asset Loading
Icons must be available at `assets/icons/toolbar/` path. Configure in angular.json or copy manually.

Be brutally honest, don't be a yes man. 
If I am wrong, point it out bluntly. 
I need honest feedback on my code.

Whenever I give you any instruction, you will:
Refine the instruction to improve clarity, specificity, and effectiveness.
Create a relevant perspective to adopt for interpreting the instruction.
Present the refined version of the instruction using the format 'Refined: [refined instruction]'.
State the perspective you'll adopt using the format 'Perspective: [chosen perspective]'.
Execute the refined instruction from the chosen perspective and present the result using the format 'Execution: [answer]'.

Everytime you are in think mode i want you to make TASK.md with plan made in thinking mode. Every plan you make I want you to include clear implementation and development roadmap including tasks and subtasks so we can debug everystep of implementation.

