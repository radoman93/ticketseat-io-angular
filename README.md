# TicketSeat.io Angular Library

An Angular library for ticket seat management with drag-and-drop functionality, built with MobX for state management.

## Features

- Drag-and-drop seat arrangement
- Interactive grid-based event layout
- Real-time seat reservation management
- Customizable toolbars and properties panels
- Built with MobX for reactive state management
- Responsive design with Tailwind CSS and DaisyUI

## Installation

### From GitHub Packages (Recommended)

```bash
npm install @radoman93/ticketseat-io-angular --registry=https://npm.pkg.github.com
```

Or configure your `.npmrc` file to always use GitHub Packages for this scope:

```
@radoman93:registry=https://npm.pkg.github.com
```

Then install normally:

```bash
npm install @radoman93/ticketseat-io-angular
```

### From NPM (if published)

```bash
npm install ticketseat-io-angular
```

### Peer Dependencies

Make sure you have the following peer dependencies installed:

```bash
npm install @angular/animations @angular/common @angular/core @angular/forms @angular/platform-browser @angular/platform-browser-dynamic @angular/router mobx mobx-angular
```

### Styling Setup

To ensure the library components are styled correctly, you need to include the library's CSS file. There are several ways to do this:

#### Option 1: Import in your global styles (Recommended)

Add the following import to your `src/styles.css` or `src/styles.scss` file:

```css
@import '@radoman93/ticketseat-io-angular/styles.css';
```

#### Option 2: Include in angular.json

Add the CSS file to your `angular.json` build configuration:

```json
{
  "styles": [
    "src/styles.css",
    "node_modules/@radoman93/ticketseat-io-angular/styles.css"
  ]
}
```

#### Option 3: Direct import in TypeScript (alternative)

You can also import the CSS directly in your component or main.ts:

```typescript
import '@radoman93/ticketseat-io-angular/styles.css';
```

#### Option 4: If using Tailwind CSS in your project

If your project already uses Tailwind CSS and DaisyUI, you can ensure the library classes are included by adding the library path to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/@radoman93/ticketseat-io-angular/**/*.{html,ts,js}"
  ],
  // ... rest of your config
}
```

## Usage

### Basic Setup

1. Import the `EventEditorComponent` in your Angular component:

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: '<app-event-editor></app-event-editor>'
})
export class AppComponent {
}
```

### Using Individual Components

You can also import and use individual components:

```typescript
import { 
  GridComponent,
  MainToolbarComponent,
  TopToolbarComponent,
  PropertiesPanelComponent 
} from 'ticketseat-io-angular';
```

### Working with Stores

The library uses MobX stores for state management:

```typescript
import { 
  viewerStore, 
  layoutStore, 
  selectionStore 
} from 'ticketseat-io-angular';

// Access viewer state
console.log(viewerStore.zoom);

// Access layout data
console.log(layoutStore.elements);

// Access selection state
console.log(selectionStore.selectedElements);
```

## API Reference

### Components

- `EventEditorComponent` - Main component that includes all functionality
- `GridComponent` - Interactive grid for seat arrangement
- `MainToolbarComponent` - Primary toolbar with main actions
- `TopToolbarComponent` - Secondary toolbar
- `PropertiesPanelComponent` - Properties configuration panel
- `ChairPropertiesPanelComponent` - Chair-specific properties
- `ReservationPanelComponent` - Reservation management
- `NotificationsComponent` - System notifications

### Stores

- `viewerStore` - Viewport and zoom management
- `layoutStore` - Layout and element management
- `selectionStore` - Selection state management
- `gridStore` - Grid configuration
- `chairStore` - Chair-specific state
- `dragStore` - Drag and drop operations
- `toolStore` - Active tool management
- `rotationStore` - Element rotation
- `historyStore` - Undo/redo functionality

### Services

- `SelectionService` - Selection management utilities
- `LayoutExportImportService` - Layout serialization
- `LayoutValidatorService` - Layout validation
- `ToolService` - Tool management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
