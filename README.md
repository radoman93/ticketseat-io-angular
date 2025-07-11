# TicketSeat.io Angular Library

A powerful, feature-rich event layout editor for Angular applications. Create, edit, and manage seating arrangements with an intuitive drag-and-drop interface.

## Features

- 🪑 **Multiple Seating Elements**: Round tables, rectangle tables, and seating rows
- 🎯 **Drag & Drop**: Intuitive element placement and arrangement
- 🔧 **Real-time Editing**: Live property adjustments with immediate visual feedback
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 💾 **Import/Export**: Save and load layouts in JSON format
- 🔄 **Design Input**: Load existing designs programmatically
- 👨‍💼 **Separate Editor & Viewer**: Dedicated components for admin and user experiences
- 🎨 **Customizable**: Extensive theming and styling options
- 📊 **MobX State Management**: Reactive state management for optimal performance

## Components

This library provides two main components:

### 🔧 EventEditorComponent (Admin Dashboard)
- Full layout editing capabilities
- Drag-and-drop table placement
- Properties panel for configuration
- Export/import functionality
- Grid and guides controls
- Undo/redo operations

### 👥 EventViewerComponent (End Users)
- Read-only layout viewing
- Seat selection for reservations
- Reservation management panel
- Customer information collection
- Clean, user-friendly interface

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

### Assets Setup

The library includes icon assets that need to be accessible by your application. You have several options:

#### Option 1: Copy assets to your public folder (Recommended)

Copy the assets from the library to your application's public folder:

```bash
cp -r node_modules/@radoman93/ticketseat-io-angular/assets ./src/assets/
```

Or manually copy the `assets` folder from `node_modules/@radoman93/ticketseat-io-angular/assets` to your `src/assets/` directory.

#### Option 2: Configure angular.json to include library assets

Add the library assets to your `angular.json` build configuration:

```json
{
  "assets": [
    "src/favicon.ico",
    "src/assets",
    {
      "glob": "**/*",
      "input": "node_modules/@radoman93/ticketseat-io-angular/assets",
      "output": "assets"
    }
  ]
}
```

#### Option 3: Configure custom asset path (Advanced)

If you want to use a different asset path, you can configure the library's asset service:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { TICKETSEAT_ASSET_BASE_PATH } from '@radoman93/ticketseat-io-angular';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: TICKETSEAT_ASSET_BASE_PATH,
      useValue: 'custom-path/to/assets' // Change this to your custom path
    }
    // ... other providers
  ]
});
```

**Note**: The library expects icons to be available at `{basePath}/icons/toolbar/` path relative to your application root.

## Quick Start

### Admin Dashboard - Layout Editor

Use this component in admin interfaces where users need to create and edit layouts:

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor></app-event-editor>
    </div>
  `
})
export class AdminDashboardComponent {}
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
      "created": "2025-07-11T08:50:43.212Z",
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
        "x": 441,
        "y": 196,
        "radius": 50,
        "seats": 8,
        "openSpaces": 0,
        "name": "Table 1",
        "rotation": 0,
        "tableLabelVisible": true,
        "chairLabelVisible": true,
        "chairs": [
          {
            "id": "table-1-chair-0",
            "tableId": "table-1",
            "label": "1",
            "price": 25,
            "position": { "angle": 0, "distance": 70 },
            "isSelected": false,
            "reservationStatus": "free"
          },
          {
            "id": "table-1-chair-1",
            "tableId": "table-1",
            "label": "2",
            "price": 25,
            "position": { "angle": 45, "distance": 70 },
            "isSelected": false,
            "reservationStatus": "free"
          }
          // ... more chairs would be here
        ]
      },
      {
        "id": "table-2",
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
        "rotation": 0,
        "tableLabelVisible": true,
        "chairLabelVisible": true,
        "chairs": [
          {
            "id": "table-2-chair-0",
            "tableId": "table-2",
            "label": "1",
            "price": 25,
            "position": { "angle": 0, "distance": 25 },
            "isSelected": false,
            "reservationStatus": "free"
          }
          // ... more chairs would be here
        ]
      },
      {
        "id": "seating-row-1",
        "type": "seatingRow",
        "x": 150,
        "y": 350,
        "rotation": 0,
        "seatCount": 8,
        "seatSpacing": 35,
        "name": "Row A",
        "rowLabelVisible": true,
        "chairLabelVisible": true,
        "chairs": [
          {
            "id": "seating-row-1-chair-0",
            "tableId": "seating-row-1",
            "label": "1",
            "price": 0,
            "position": { "angle": 0, "distance": 0 },
            "isSelected": false
          }
          // ... more chairs would be here
        ]
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
| `design` | `LayoutExportData \| string \| null` | `undefined` | Initial design to load. 
Can be a JSON object, string, or null |

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

interface ElementType {
  id: string;
  type: 'roundTable' | 'rectangleTable' | 'seatingRow' | 'segmentedSeatingRow';
  x: number;
  y: number;
  rotation: number;
  name: string;
  chairs: Chair[];
  // Additional properties vary by element type
}

interface Chair {
  id: string;
  tableId: string;
  label: string;
  price: number;
  position: {
    angle: number;
    distance: number;
  };
  isSelected?: boolean;
  reservationStatus?: 'free' | 'reserved' | 'selected-for-reservation';
  reservedBy?: string;
}
```

#### Export Format Example

The library now exports layouts with nested chair objects included in each element:

```json
{
  "meta": {
    "version": "1.0",
    "name": "Sample Layout",
    "created": "2025-07-11T08:50:43.212Z",
    "creator": "TicketSeats v1.0"
  },
  "settings": {
    "gridSize": 25,
    "showGrid": true,
    "showGuides": true
  },
  "elements": [
    {
      "id": "table-1",
      "type": "roundTable",
      "x": 200,
      "y": 150,
      "rotation": 0,
      "radius": 60,
      "seats": 8,
      "openSpaces": 0,
      "name": "Table 1",
      "tableLabelVisible": true,
      "chairLabelVisible": true,
      "chairs": [
        {
          "id": "table-1-chair-0",
          "tableId": "table-1",
          "label": "1",
          "price": 25,
          "position": {
            "angle": 0,
            "distance": 80
          },
          "isSelected": false,
          "reservationStatus": "free"
        },
        {
          "id": "table-1-chair-1",
          "tableId": "table-1",
          "label": "2",
          "price": 25,
          "position": {
            "angle": 45,
            "distance": 80
          },
          "isSelected": false,
          "reservationStatus": "free"
        }
        // ... more chairs
      ]
    },
    {
      "id": "seating-row-1",
      "type": "seatingRow",
      "x": 150,
      "y": 350,
      "rotation": 0,
      "seatCount": 8,
      "seatSpacing": 35,
      "name": "Row A",
      "rowLabelVisible": true,
      "chairLabelVisible": true,
      "chairs": [
        {
          "id": "seating-row-1-chair-0",
          "tableId": "seating-row-1",
          "label": "1",
          "price": 0,
          "position": {
            "angle": 0,
            "distance": 0
          },
          "isSelected": false
        }
        // ... more chairs
      ]
    }
  ]
}
```

**Key Features of the Export Format:**

- **Nested Chair Data**: Each element now includes its `chairs` array with complete chair objects
- **Chair Properties**: Each chair includes `id`, `tableId`, `label`, `price`, `position`, `isSelected`, and `reservationStatus`
- **Position Data**: Chair positions are preserved relative to their parent element
- **Reservation Status**: Chair reservation states are included for viewer compatibility
- **Complete Layout**: All elements, settings, and metadata are preserved

#### Element Types

- **Round Table**: Circular tables with configurable radius and seat count
- **Rectangle Table**: Rectangular tables with chairs on specified sides
- **Seating Row**: Linear seating arrangements
- **Segmented Seating Row**: Multi-segment seating for complex layouts

## Advanced Usage



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

## Real-time Layout Updates

The EventEditorComponent now provides real-time updates of the layout state through the `layoutUpdated` event. This allows parent applications to stay synchronized with the latest layout changes.

### Usage Example

```typescript
import { Component } from '@angular/core';
import { LayoutExportData } from '@radoman93/ticketseat-io-angular';

@Component({
  selector: 'app-root',
  template: `
    <app-event-editor
      [design]="initialDesign"
      (layoutUpdated)="onLayoutUpdated($event)">
    </app-event-editor>
  `
})
export class AppComponent {
  initialDesign: LayoutExportData = {
    // Your initial layout data
  };

  onLayoutUpdated(layout: LayoutExportData) {
    // Handle the updated layout data
    console.log('Layout updated:', layout);
    
    // You can:
    // - Save to your backend
    // - Update your application state
    // - Trigger other actions based on layout changes
  }
}
```

The `layoutUpdated` event provides the complete layout data including:
- All elements (tables, rows, etc.) with their nested chair objects
- Individual chair data with positions, prices, and reservation status
- Current grid settings
- Meta information

**Note:** The export format now includes nested chair objects within each element, providing complete seat information for reservation systems.

The event is emitted whenever:
- Elements are added, removed, or modified
- Chairs are added or removed
- Element properties are changed
- Grid settings are updated

This feature makes it easy to:
- Keep your application state in sync with the editor
- Implement auto-save functionality
- Create real-time collaborative editing features
- Track changes for undo/redo functionality


## EventViewerComponent

The `EventViewerComponent` provides a read-only layout viewing experience optimized for end users making seat reservations.

### Usage

```typescript
// Basic usage
<app-event-viewer [design]="layoutData"></app-event-viewer>

// With pre-reserved seats
<app-event-viewer 
  [design]="layoutData"
  [reservedIds]="['table-1-chair-2', 'seating-row-1-chair-5']">
</app-event-viewer>

// With seat limit
<app-event-viewer 
  [design]="layoutData"
  [seatLimit]="4">
</app-event-viewer>

// With selected seats event emitter
<app-event-viewer 
  [design]="layoutData"
  [seatLimit]="2"
  [reservedIds]="preReservedSeats"
  (selectedSeatsChange)="onSelectedSeatsChange($event)">
</app-event-viewer>
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `design` | `LayoutExportData \| string \| null` | Layout data to display (JSON object or JSON string) |
| `reservedIds` | `string[] \| null` | Array of seat IDs that are already reserved externally |
| `seatLimit` | `number \| undefined` | Maximum number of seats a user can select. 0 = unlimited (default), null/undefined = unlimited |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `selectedSeatsChange` | `EventEmitter<Chair[]>` | Emitted when selected seats change, provides full chair objects |

### Complete Example with All Features

```typescript
import { Component } from '@angular/core';
import { EventViewerComponent, Chair } from '@radoman93/ticketseat-io-angular';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="h-screen w-screen">
      <!-- Controls -->
      <div class="p-4 bg-blue-50 border-b">
        <h2 class="text-lg font-semibold mb-2">Booking Options</h2>
        <div class="flex gap-4 items-center">
          <label class="flex items-center gap-2">
            <span>Seat Limit:</span>
            <input 
              type="number" 
              [(ngModel)]="seatLimit" 
              min="0" 
              max="10"
              placeholder="0 = unlimited"
              class="w-32 px-2 py-1 border rounded">
          </label>
          <button 
            (click)="clearSelection()"
            class="px-3 py-1 bg-red-500 text-white rounded">
            Clear Selection
          </button>
        </div>
        
        <!-- Selected Seats Summary -->
        <div class="mt-3 p-3 bg-white rounded border">
          <h3 class="font-semibold">Selected Seats ({{ selectedSeats.length }})</h3>
          <div class="mt-2 space-y-1">
            <div *ngFor="let seat of selectedSeats" class="text-sm">
              <strong>{{ seat.label }}</strong> - {{ seat.tableId }} - ${{ seat.price }}
            </div>
          </div>
          <div class="mt-2 font-semibold text-green-600">
            Total: ${{ getTotalPrice() }}
          </div>
        </div>
      </div>
      
      <!-- Event Viewer -->
      <app-event-viewer 
        [design]="layoutData"
        [seatLimit]="seatLimit"
        [reservedIds]="preReservedSeats"
        (selectedSeatsChange)="onSelectedSeatsChange($event)">
      </app-event-viewer>
    </div>
  `
})
export class BookingComponent {
  layoutData: LayoutExportData;
  preReservedSeats: string[] = [
    'table-1-chair-2',
    'seating-row-1-chair-5'
  ];
  seatLimit: number = 0; // 0 = unlimited
  selectedSeats: Chair[] = [];

  async ngOnInit() {
    // Load layout from your backend
    this.layoutData = await this.venueService.getLayout(this.eventId);
    this.preReservedSeats = await this.bookingService.getReservedSeats(this.eventId);
  }

  onSelectedSeatsChange(selectedChairs: Chair[]): void {
    this.selectedSeats = selectedChairs;
    
    // Log full chair details
    console.log('Selected seats changed:', selectedChairs);
    console.log('Selected seat count:', selectedChairs.length);
    console.log('Selected seat IDs:', selectedChairs.map(chair => chair.id));
    
    // Access individual chair properties
    selectedChairs.forEach(chair => {
      console.log('Chair details:', {
        id: chair.id,
        label: chair.label,
        tableId: chair.tableId,
        price: chair.price,
        position: chair.position,
        reservationStatus: chair.reservationStatus
      });
    });

    // You can now:
    // - Calculate total price
    // - Update your booking state
    // - Send to your backend
    // - Update UI components
  }

  getTotalPrice(): number {
    return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }

  clearSelection(): void {
    // This would trigger the selectedSeatsChange event with empty array
    // Implementation depends on your specific needs
  }
}
```

### Seat Limit Feature

The seat limit feature controls how many seats a user can select:

```typescript
// Unlimited seats (default behavior)
<app-event-viewer [design]="layout"></app-event-viewer>
<app-event-viewer [design]="layout" [seatLimit]="0"></app-event-viewer>

// Limited to specific number
<app-event-viewer [design]="layout" [seatLimit]="4"></app-event-viewer>

// Dynamic seat limit
<app-event-viewer [design]="layout" [seatLimit]="userTicketCount"></app-event-viewer>
```

**Seat Limit Values:**
- **0 or undefined**: Unlimited seats (default behavior)
- **Positive number**: Maximum seats that can be selected
- Visual feedback shows selected/total when limit is set

**Seat Limit Behavior:**
- Users cannot select more seats than the limit (when > 0)
- Visual feedback shows remaining seats (e.g., "2 / 4 seats selected")
- Warning notifications when trying to exceed the limit
- If limit is reduced, excess selections are automatically removed
- When set to 0, no limit indicators are shown

### Event Emitter Feature

The `selectedSeatsChange` event provides full chair objects:

```typescript
onSelectedSeatsChange(chairs: Chair[]): void {
  // chairs is an array of complete Chair objects
  chairs.forEach(chair => {
    console.log('Chair ID:', chair.id);           // e.g., "table-1-chair-2"
    console.log('Chair Label:', chair.label);     // e.g., "3"
    console.log('Table ID:', chair.tableId);      // e.g., "table-1"
    console.log('Price:', chair.price);           // e.g., 25.00
    console.log('Position:', chair.position);     // { angle: 90, distance: 80 }
    console.log('Status:', chair.reservationStatus); // "selected-for-reservation"
  });
}
```

**Chair Object Properties:**
```typescript
interface Chair {
  id: string;              // Unique identifier
  tableId: string;         // Parent table/row ID
  label: string;           // Display label (1, 2, 3, etc.)
  price: number;           // Chair price
  position: {              // Position relative to parent
    angle: number;         // Angle in degrees
    distance: number;      // Distance from center
  };
  isSelected?: boolean;    // Selection state
  reservationStatus?: 'free' | 'reserved' | 'selected-for-reservation';
  reservedBy?: string;     // Customer name if reserved
}
```

### Panning and Zooming

The EventViewer supports interactive navigation:

**Panning:**
- Click and drag anywhere on the layout to pan around
- Works with both left mouse button and middle mouse button
- Visual feedback with grab/grabbing cursor
- Smooth panning with immediate updates

**Zooming:**
- Use scroll wheel to zoom in and out
- Zoom range: 10% to 200%
- Zoom level is maintained across interactions
- Works in combination with panning

**Usage Tips:**
- For large layouts, use panning to navigate to different sections
- Zoom in to see seat details more clearly
- Zoom out to get an overview of the entire layout
- Panning and zooming work seamlessly with seat selection

```typescript
// The viewer provides visual cues for navigation
<app-event-viewer 
  [design]="layoutData"
  [seatLimit]="4">
  <!-- Users will see "Drag to pan view, scroll to zoom" in the instructions -->
</app-event-viewer>
```

### Features

- **Read-only Layout Display**: Shows venue layouts without editing capabilities
- **Seat Selection**: Users can select available seats for reservation
- **Seat Limit**: Optional limit on how many seats can be selected
- **Pre-Reserved Seats**: Seats with IDs in `reservedIds` are marked as unavailable (red) and cannot be selected
- **Event Emitter**: Emits selected chair objects back to parent component
- **Panning & Zooming**: Click and drag to pan around the layout, scroll wheel to zoom in/out
- **Reservation Interface**: Clean UI for seat selection and customer information
- **Real-time Updates**: Immediate visual feedback for seat selection
- **Green Theme**: User-friendly green color scheme
- **Mobile Responsive**: Touch-friendly for mobile devices

### Seat States

The viewer displays seats in different visual states:

- **Available**: Gray seats that can be selected (hover effects)
- **Selected for Reservation**: Green seats selected by current user
- **Pre-Reserved (External)**: Dark red seats with `cursor-not-allowed` - cannot be selected
- **Reserved (Internal)**: Red seats reserved through the current session

### Example with Role-Based Loading

```typescript
export class BookingComponent {
  layoutData: LayoutExportData;
  preReservedSeats: string[] = [];

  async ngOnInit() {
    // Load layout and reserved seats from your backend
    this.layoutData = await this.venueService.getLayout(this.eventId);
    this.preReservedSeats = await this.bookingService.getReservedSeats(this.eventId);
  }
}
```

```html
<app-event-viewer 
  [design]="layoutData"
  [reservedIds]="preReservedSeats">
</app-event-viewer>
```

