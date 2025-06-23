# TicketSeat.io Angular Library

A powerful, feature-rich event layout editor for Angular applications. Create, edit, and manage seating arrangements with an intuitive drag-and-drop interface.

## Features

- 🪑 **Multiple Seating Elements**: Round tables, rectangle tables, and seating rows
- 🎯 **Drag & Drop**: Intuitive element placement and arrangement
- 🔧 **Real-time Editing**: Live property adjustments with immediate visual feedback
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 💾 **Import/Export**: Save and load layouts in JSON format
- 🔄 **Design Input**: Load existing designs programmatically
- 🎨 **Customizable**: Extensive theming and styling options
- 📊 **MobX State Management**: Reactive state management for optimal performance

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

## Quick Start

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor></app-event-editor>
    </div>
  `
})
export class AppComponent {}
```

### Loading an Existing Design

You can load an existing layout by passing a design object or JSON string to the component:

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <app-event-editor [design]="myLayout"></app-event-editor>
  `
})
export class AppComponent {
  myLayout: LayoutExportData = {
    "meta": {
      "version": "1.0",
      "name": "Wedding Reception",
      "created": "2025-01-01T12:00:00.000Z",
      "creator": "TicketSeats v1.0"
    },
    "settings": {
      "gridSize": 50,
      "showGrid": true,
      "showGuides": true
    },
    "elements": [
      {
        "id": "table-1",
        "type": "roundTable",
        "x": 300,
        "y": 200,
        "radius": 60,
        "seats": 8,
        "name": "Head Table",
        "rotation": 0
      }
    ]
  };
}
```

### Complete Example with Multiple Elements

Here's a full example you can copy and paste to test all element types:

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor [design]="exampleDesign"></app-event-editor>
    </div>
  `
})
export class AppComponent {
  exampleDesign: LayoutExportData = {
    "meta": {
      "version": "1.0",
      "name": "Complete Layout Example",
      "created": "2025-06-23T11:33:24.768Z",
      "creator": "TicketSeats v1.0"
    },
    "settings": {
      "gridSize": 50,
      "showGrid": true,
      "showGuides": true
    },
    "elements": [
      {
        "id": "table-1750678397159",
        "type": "roundTable",
        "x": 441,
        "y": 196,
        "radius": 50,
        "seats": 8,
        "openSpaces": 0,
        "name": "Table 1",
        "rotation": 0
      },
      {
        "id": "table-1750678398457",
        "type": "rectangleTable",
        "x": 520,
        "y": 504,
        "width": 120,
        "height": 80,
        "upChairs": 4,
        "downChairs": 4,
        "leftChairs": 0,
        "rightChairs": 0,
        "name": "Table 2",
        "rotation": 0
      },
      {
        "id": "seatingrow-1750678399789",
        "type": "segmentedSeatingRow",
        "x": 816,
        "y": 357,
        "endX": 1030.5240721353648,
        "endY": 126.3391613765769,
        "seatCount": 10,
        "seatSpacing": 35,
        "name": "Segmented Row 3",
        "rotation": 0,
        "chairLabelVisible": true,
        "rowLabelVisible": true,
        "isSegmented": true,
        "segments": [
          {
            "id": "seatingrow-1750678399789-segment-0-1750678399790",
            "startX": 816,
            "startY": 357,
            "endX": 1030.5240721353648,
            "endY": 126.3391613765769,
            "seatCount": 10,
            "seatSpacing": 35,
            "rotation": -47.07591046004114,
            "segmentIndex": 0
          }
        ],
        "totalSegments": 1,
        "totalSeats": 10
      }
    ]
  };
}
```

### Using JSON String

You can also pass a JSON string directly:

```typescript
@Component({
  template: `<app-event-editor [design]="jsonString"></app-event-editor>`
})
export class AppComponent {
  jsonString = `{
    "meta": {
      "version": "1.0",
      "name": "Conference Layout"
    },
    "settings": {
      "gridSize": 50,
      "showGrid": true,
      "showGuides": true
    },
    "elements": []
  }`;
}
```

## API Reference

### EventEditorComponent

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `design` | `LayoutExportData \| string \| null` | `undefined` | Initial design to load. Can be a JSON object, string, or null |

#### LayoutExportData Interface

```typescript
interface LayoutExportData {
  meta: {
    version: string;
    name: string;
    created: string;
    creator: string;
    description?: string;
  };
  settings: {
    gridSize: number;
    showGrid: boolean;
    showGuides: boolean;
  };
  elements: ElementType[];
}
```

#### Element Types

- **Round Table**: Circular tables with configurable radius and seat count
- **Rectangle Table**: Rectangular tables with chairs on specified sides
- **Seating Row**: Linear seating arrangements
- **Segmented Seating Row**: Multi-segment seating for complex layouts

## Advanced Usage

### Accessing MobX Stores

```typescript
import { 
  layoutStore, 
  selectionStore, 
  viewerStore 
} from 'ticketseat-io-angular';

// Access layout data
const elements = layoutStore.elements;

// Check current selection
const hasSelection = selectionStore.hasSelection;

// Check current mode
const isEditorMode = viewerStore.isEditorMode;
```

### Dynamic Layout Loading

```typescript
@Component({
  template: `
    <div>
      <button (click)="loadLayout('wedding')">Wedding</button>
      <button (click)="loadLayout('conference')">Conference</button>
      <app-event-editor [design]="currentLayout"></app-event-editor>
    </div>
  `
})
export class DynamicLayoutComponent {
  currentLayout: LayoutExportData | null = null;

  async loadLayout(type: string) {
    const response = await fetch(`/api/layouts/${type}`);
    this.currentLayout = await response.json();
  }
}
```

## Examples

For complete examples and advanced usage patterns, see the [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) file.

## Browser Support

- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see LICENSE file for details.
