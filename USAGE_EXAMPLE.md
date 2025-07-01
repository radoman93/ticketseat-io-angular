# Usage Examples

## Setup Requirements

Before using the components, make sure you have completed the following setup steps:

### 1. Install the Package

```bash
npm install @radoman93/ticketseat-io-angular --registry=https://npm.pkg.github.com
```

### 2. Import Styles

Add to your `src/styles.css`:

```css
@import '@radoman93/ticketseat-io-angular/styles.css';
```

### 3. Copy Assets

Copy the library assets to your project:

```bash
cp -r node_modules/@radoman93/ticketseat-io-angular/assets ./src/assets/
```

Or add to your `angular.json`:

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

## Component Overview

This library provides two main components:

- **EventEditorComponent**: For admin dashboards and layout creation
- **EventViewerComponent**: For end users to view layouts and make reservations

## Simple Integration

### Admin Dashboard - Layout Editor

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
export class AdminDashboardComponent {
  title = 'Admin Dashboard';
}
```

### End User - Seat Reservation

```typescript
import { Component } from '@angular/core';
import { EventViewerComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-viewer></app-event-viewer>
    </div>
  `
})
export class BookingPageComponent {
  title = 'Book Your Seats';
}
```

## Loading an Existing Design

### Admin Editor with Design Input

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor [design]="myDesign"></app-event-editor>
    </div>
  `
})
export class AdminDashboardComponent {
  title = 'Admin Dashboard';

  // Load an existing design for editing
  myDesign: LayoutExportData = {
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
        "id": "table-001",
        "type": "roundTable",
        "x": 300,
        "y": 200,
        "radius": 60,
        "seats": 8,
        "openSpaces": 0,
        "name": "Head Table",
        "rotation": 0
      },
      {
        "id": "table-002",
        "type": "rectangleTable",
        "x": 500,
        "y": 400,
        "width": 150,
        "height": 80,
        "upChairs": 3,
        "downChairs": 3,
        "leftChairs": 0,
        "rightChairs": 0,
        "name": "Family Table",
        "rotation": 0
      }
    ]
  };
}
```

### User Viewer with Same Design

```typescript
import { Component } from '@angular/core';
import { EventViewerComponent, LayoutExportData } from 'ticketseat-io-angular';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-viewer [design]="layoutToView"></app-event-viewer>
    </div>
  `
})
export class BookingPageComponent {
  title = 'Book Your Seats';

  // Same layout, but for viewing and reservations
  layoutToView: LayoutExportData = {
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
        "id": "table-001",
        "type": "roundTable",
        "x": 300,
        "y": 200,
        "radius": 60,
        "seats": 8,
        "openSpaces": 0,
        "name": "Head Table",
        "rotation": 0
      },
      {
        "id": "table-002",
        "type": "rectangleTable",
        "x": 500,
        "y": 400,
        "width": 150,
        "height": 80,
        "upChairs": 3,
        "downChairs": 3,
        "leftChairs": 0,
        "rightChairs": 0,
        "name": "Family Table",
        "rotation": 0
      }
    ]
  };
}
```

## Role-Based Component Selection

### Dynamic Component Based on User Role

```typescript
import { Component, OnInit } from '@angular/core';
import { EventEditorComponent, EventViewerComponent, LayoutExportData } from 'ticketseat-io-angular';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [EventEditorComponent, EventViewerComponent],
  template: `
    <div class="h-screen w-screen">
      <!-- Admin users get the full editor -->
      <app-event-editor 
        [design]="currentLayout" 
        *ngIf="userRole === 'admin'">
      </app-event-editor>
      
      <!-- Regular users get the viewer for reservations -->
      <app-event-viewer 
        [design]="currentLayout" 
        *ngIf="userRole === 'user'">
      </app-event-viewer>
      
      <!-- Show loading if role not determined yet -->
      <div *ngIf="!userRole" class="flex items-center justify-center h-full">
        <div class="text-lg">Loading...</div>
      </div>
    </div>
  `
})
export class EventPageComponent implements OnInit {
  userRole: 'admin' | 'user' | null = null;
  currentLayout: LayoutExportData | null = null;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    // Determine user role
    this.userRole = await this.authService.getUserRole();
    
    // Load the event layout
    this.loadEventLayout();
  }

  async loadEventLayout() {
    try {
      const response = await fetch('/api/events/current-layout');
      this.currentLayout = await response.json();
    } catch (error) {
      console.error('Failed to load event layout:', error);
    }
  }
}
```

## Dynamic Layout Loading

### Admin Dashboard with Multiple Layouts

```typescript
import { Component, OnInit } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen flex flex-col">
      <!-- Layout Selector -->
      <div class="p-4 bg-gray-100 border-b">
        <h2 class="text-lg font-semibold mb-2">Select Layout to Edit</h2>
        <div class="flex gap-2">
          <button 
            *ngFor="let layout of availableLayouts" 
            (click)="loadLayout(layout.id)"
            [class.bg-blue-500]="currentLayoutId === layout.id"
            [class.text-white]="currentLayoutId === layout.id"
            class="px-4 py-2 bg-white border rounded hover:bg-gray-50">
            {{ layout.name }}
          </button>
          <button 
            (click)="createNewLayout()"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            + New Layout
          </button>
        </div>
      </div>
      
      <!-- Editor -->
      <div class="flex-1">
        <app-event-editor [design]="currentDesign"></app-event-editor>
      </div>
    </div>
  `
})
export class AdminPageComponent implements OnInit {
  currentDesign: LayoutExportData | null = null;
  currentLayoutId: string | null = null;
  availableLayouts = [
    { id: 'wedding', name: 'Wedding Reception' },
    { id: 'conference', name: 'Conference Hall' },
    { id: 'banquet', name: 'Corporate Banquet' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Load default layout
    this.loadLayout('wedding');
  }

  async loadLayout(layoutId: string) {
    try {
      this.currentLayoutId = layoutId;
      const response = await this.http.get<LayoutExportData>(`/api/admin/layouts/${layoutId}`).toPromise();
      this.currentDesign = response!;
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }

  createNewLayout() {
    this.currentLayoutId = null;
    this.currentDesign = {
      meta: {
        version: '1.0',
        name: 'New Layout',
        created: new Date().toISOString(),
        creator: 'TicketSeats v1.0'
      },
      settings: {
        gridSize: 50,
        showGrid: true,
        showGuides: true
      },
      elements: []
    };
  }
}
```

### User Booking with Event Selection

```typescript
import { Component, OnInit } from '@angular/core';
import { EventViewerComponent, LayoutExportData } from 'ticketseat-io-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="h-screen w-screen flex flex-col">
      <!-- Event Selector -->
      <div class="p-4 bg-green-50 border-b">
        <h2 class="text-lg font-semibold mb-2 text-green-800">Select Event</h2>
        <div class="flex gap-2 flex-wrap">
          <button 
            *ngFor="let event of availableEvents" 
            (click)="selectEvent(event.id)"
            [class.bg-green-500]="selectedEventId === event.id"
            [class.text-white]="selectedEventId === event.id"
            class="px-4 py-2 bg-white border border-green-200 rounded hover:bg-green-50">
            {{ event.name }}
            <span class="text-sm text-gray-600 block">{{ event.date }}</span>
          </button>
        </div>
      </div>
      
      <!-- Viewer/Reservation Interface -->
      <div class="flex-1">
        <app-event-viewer [design]="selectedEventLayout" *ngIf="selectedEventLayout"></app-event-viewer>
        <div *ngIf="!selectedEventLayout" class="flex items-center justify-center h-full">
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-700">Select an event above</h3>
            <p class="text-gray-500">Choose an event to view seating and make reservations</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingPageComponent implements OnInit {
  selectedEventLayout: LayoutExportData | null = null;
  selectedEventId: string | null = null;
  availableEvents = [
    { id: 'wedding-2024', name: 'Smith Wedding', date: '2024-06-15' },
    { id: 'conference-2024', name: 'Tech Conference', date: '2024-07-20' },
    { id: 'gala-2024', name: 'Charity Gala', date: '2024-08-10' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Auto-select first event if available
    if (this.availableEvents.length > 0) {
      this.selectEvent(this.availableEvents[0].id);
    }
  }

  async selectEvent(eventId: string) {
    try {
      this.selectedEventId = eventId;
      const response = await this.http.get<LayoutExportData>(`/api/events/${eventId}/layout`).toPromise();
      this.selectedEventLayout = response!;
    } catch (error) {
      console.error('Failed to load event layout:', error);
      this.selectedEventLayout = null;
    }
  }
}
```

## Loading from JSON String

### Editor with JSON String

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor [design]="jsonDesign"></app-event-editor>
    </div>
  `
})
export class AdminComponent {
  // You can also pass a JSON string directly
  jsonDesign = `{
    "meta": {
      "version": "1.0",
      "name": "Restaurant Layout",
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
        "x": 200,
        "y": 200,
        "radius": 50,
        "seats": 6,
        "name": "Table 1",
        "rotation": 0
      }
    ]
  }`;
}
```

### Viewer with JSON String

```typescript
import { Component } from '@angular/core';
import { EventViewerComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-viewer [design]="jsonDesign"></app-event-viewer>
    </div>
  `
})
export class BookingComponent {
  // Same JSON string, but for viewing and reservations
  jsonDesign = `{
    "meta": {
      "version": "1.0",
      "name": "Restaurant Layout",
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
        "x": 200,
        "y": 200,
        "radius": 50,
        "seats": 6,
        "name": "Table 1",
        "rotation": 0
      }
    ]
  }`;
}
```

## Advanced Usage with Store Access

### Admin Dashboard with Store Integration

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  EventEditorComponent, 
  layoutStore, 
  selectionStore,
  persistenceManager
} from 'ticketseat-io-angular';
import { autorun, IReactionDisposer } from 'mobx';

@Component({
  selector: 'app-admin-advanced',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="flex flex-col h-screen">
      <header class="bg-blue-800 text-white p-4">
        <h1>Advanced Admin Dashboard</h1>
        <div class="flex gap-4 mt-2 text-sm">
          <span>Elements: {{ elementCount }}</span>
          <span>Selected: {{ selectedCount }}</span>
          <span *ngIf="hasUnsavedChanges" class="text-yellow-300">● Unsaved changes</span>
        </div>
      </header>
      
      <main class="flex-1">
        <app-event-editor [design]="initialDesign"></app-event-editor>
      </main>
      
      <footer class="bg-gray-100 p-4 flex justify-between">
        <div class="flex gap-2">
          <button 
            (click)="saveLayout()" 
            [disabled]="!hasUnsavedChanges"
            class="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
            Save Changes
          </button>
          <button 
            (click)="exportLayout()" 
            class="px-4 py-2 bg-green-600 text-white rounded">
            Export Layout
          </button>
        </div>
        <button 
          (click)="clearLayout()" 
          class="px-4 py-2 bg-red-600 text-white rounded">
          Clear All
        </button>
      </footer>
    </div>
  `
})
export class AdvancedAdminComponent implements OnInit, OnDestroy {
  elementCount = 0;
  selectedCount = 0;
  hasUnsavedChanges = false;
  
  private disposers: IReactionDisposer[] = [];

  initialDesign = {
    "meta": {
      "version": "1.0",
      "name": "Admin Layout",
      "created": new Date().toISOString(),
      "creator": "TicketSeats v1.0"
    },
    "settings": {
      "gridSize": 50,
      "showGrid": true,
      "showGuides": true
    },
    "elements": []
  };

  ngOnInit() {
    // Set up reactive data bindings to MobX stores
    this.disposers.push(
      autorun(() => {
        this.elementCount = layoutStore.elements.length;
      }),
      
      autorun(() => {
        this.selectedCount = selectionStore.hasSelection ? 1 : 0;
      }),
      
      autorun(() => {
        // Simple change detection - in real app you'd want more sophisticated tracking
        this.hasUnsavedChanges = layoutStore.elements.length > 0;
      })
    );
  }

  ngOnDestroy() {
    // Clean up reactions
    this.disposers.forEach(dispose => dispose());
  }

  saveLayout() {
    const layoutName = `Layout_${new Date().toISOString().split('T')[0]}`;
    persistenceManager.saveLayout(layoutName);
    this.hasUnsavedChanges = false;
  }

  exportLayout() {
    persistenceManager.exportToFile();
  }

  clearLayout() {
    if (confirm('Are you sure you want to clear all elements?')) {
      layoutStore.clearAll();
      selectionStore.deselectItem();
    }
  }
}
```

### User Booking with Reservation Handling

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  EventViewerComponent, 
  viewerStore,
  layoutStore
} from 'ticketseat-io-angular';
import { autorun, IReactionDisposer } from 'mobx';

@Component({
  selector: 'app-booking-advanced',
  standalone: true,
  imports: [EventViewerComponent],
  template: `
    <div class="flex flex-col h-screen">
      <header class="bg-green-800 text-white p-4">
        <h1>Book Your Event Seats</h1>
        <div class="flex gap-4 mt-2 text-sm">
          <span>Available Seats: {{ availableSeats }}</span>
          <span>Selected: {{ selectedSeats }}</span>
          <span *ngIf="totalPrice > 0">Total: ${{ totalPrice }}</span>
        </div>
      </header>
      
      <main class="flex-1">
        <app-event-viewer [design]="eventLayout"></app-event-viewer>
      </main>
      
      <footer class="bg-gray-100 p-4" *ngIf="selectedSeats > 0">
        <div class="flex justify-between items-center">
          <div>
            <span class="font-medium">{{ selectedSeats }} seats selected</span>
            <span class="text-gray-600 ml-2">Total: ${{ totalPrice }}</span>
          </div>
          <div class="flex gap-2">
            <button 
              (click)="clearSelection()" 
              class="px-4 py-2 bg-gray-600 text-white rounded">
              Clear Selection
            </button>
            <button 
              (click)="proceedToCheckout()" 
              class="px-4 py-2 bg-green-600 text-white rounded">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class AdvancedBookingComponent implements OnInit, OnDestroy {
  availableSeats = 0;
  selectedSeats = 0;
  totalPrice = 0;
  
  private disposers: IReactionDisposer[] = [];

  eventLayout = {
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

  ngOnInit() {
    // Set up reactive data bindings
    this.disposers.push(
      autorun(() => {
        this.selectedSeats = viewerStore.selectedSeatsCount;
      }),
      
      autorun(() => {
        // Calculate total price - you'd implement this based on your pricing logic
        this.totalPrice = this.selectedSeats * 50; // $50 per seat example
      })
    );
  }

  ngOnDestroy() {
    this.disposers.forEach(dispose => dispose());
  }

  clearSelection() {
    viewerStore.clearSelectedSeats();
  }

  proceedToCheckout() {
    // Implement checkout logic
    console.log('Proceeding to checkout with:', {
      selectedSeats: this.selectedSeats,
      totalPrice: this.totalPrice,
      customerInfo: viewerStore.customerInfo
    });
  }
}
```

## Custom Component with Individual Imports

### custom-editor.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  GridComponent,
  MainToolbarComponent,
  PropertiesPanelComponent,
  viewerStore 
} from 'ticketseat-io-angular';

@Component({
  selector: 'app-custom-editor',
  standalone: true,
  imports: [
    CommonModule,
    GridComponent,
    MainToolbarComponent,
    PropertiesPanelComponent
  ],
  template: `
    <div class="editor-container">
      <div class="toolbar-section">
        <app-main-toolbar></app-main-toolbar>
      </div>
      
      <div class="content-section">
        <div class="grid-area">
          <app-grid></app-grid>
        </div>
        
        <div class="properties-area" *ngIf="showProperties">
          <app-properties-panel></app-properties-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .toolbar-section {
      flex-shrink: 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .content-section {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .grid-area {
      flex: 1;
      position: relative;
    }
    
    .properties-area {
      width: 300px;
      border-left: 1px solid #e2e8f0;
      background: #f8fafc;
    }
  `]
})
export class CustomEditorComponent {
  showProperties = true;
  viewerStore = viewerStore;

  toggleProperties() {
    this.showProperties = !this.showProperties;
  }
}

## Service Usage Example

### layout.service.ts
```typescript
import { Injectable } from '@angular/core';
import { 
  layoutStore, 
  LayoutExportImportService,
  LayoutValidatorService 
} from 'ticketseat-io-angular';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  constructor(
    private exportImportService: LayoutExportImportService,
    private validatorService: LayoutValidatorService
  ) {}

  async saveLayout(name: string) {
    const layout = this.exportImportService.exportLayout();
    
    // Validate before saving
    const validation = this.validatorService.validateLayout(layout);
    if (!validation.isValid) {
      throw new Error(`Invalid layout: ${validation.errors.join(', ')}`);
    }

    // Save to your backend
    try {
      const response = await fetch('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, layout })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save layout');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving layout:', error);
      throw error;
    }
  }

  async loadLayout(layoutId: string) {
    try {
      const response = await fetch(`/api/layouts/${layoutId}`);
      if (!response.ok) {
        throw new Error('Failed to load layout');
      }
      
      const { layout } = await response.json();
      this.exportImportService.importLayout(layout);
      
      return layout;
    } catch (error) {
      console.error('Error loading layout:', error);
      throw error;
    }
  }

  getCurrentLayoutStats() {
    return {
      totalElements: layoutStore.elements.length,
      chairs: layoutStore.elements.filter(el => el.type === 'chair').length,
      tables: layoutStore.elements.filter(el => el.type === 'table').length,
      bounds: layoutStore.bounds
    };
  }
}

## Publishing to NPM

To publish your library to NPM:

1. Build the library:
```bash
npm run build:lib
```

2. Navigate to the dist folder:
```bash
cd dist
```

3. Publish to NPM:
```bash
npm publish
```

Or for scoped packages:
```bash
npm publish --access public
```

## User Booking Scenarios

### Basic Seat Selection

```typescript
export class BookingComponent {
  layoutData: LayoutExportData;
  reservedSeats: string[] = [];

  constructor(
    private venueService: VenueService,
    private bookingService: BookingService
  ) {}

  async ngOnInit() {
    // Load the venue layout
    this.layoutData = await this.venueService.getLayoutForEvent(this.eventId);
    
    // Load currently reserved seats from backend
    this.reservedSeats = await this.bookingService.getReservedSeats(this.eventId);
  }
}
```

```html
<!-- User booking interface -->
<app-event-viewer 
  [design]="layoutData"
  [reservedIds]="reservedSeats">
</app-event-viewer>
```

### Real-Time Reservation Updates

```typescript
export class LiveBookingComponent implements OnInit, OnDestroy {
  layoutData: LayoutExportData;
  reservedSeats: string[] = [];
  private subscription?: Subscription;

  constructor(
    private venueService: VenueService,
    private bookingService: BookingService,
    private websocketService: WebSocketService
  ) {}

  async ngOnInit() {
    // Load initial data
    this.layoutData = await this.venueService.getLayoutForEvent(this.eventId);
    this.reservedSeats = await this.bookingService.getReservedSeats(this.eventId);

    // Subscribe to real-time updates
    this.subscription = this.websocketService
      .onReservationUpdate(this.eventId)
      .subscribe(update => {
        if (update.type === 'seat_reserved') {
          this.reservedSeats = [...this.reservedSeats, update.seatId];
        } else if (update.type === 'seat_released') {
          this.reservedSeats = this.reservedSeats.filter(id => id !== update.seatId);
        }
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

```html
<!-- Real-time booking with live updates -->
<div class="booking-container">
  <div class="booking-header">
    <h2>Select Your Seats</h2>
    <div class="legend">
      <span class="available">Available</span>
      <span class="selected">Selected</span>
      <span class="reserved">Reserved</span>
    </div>
  </div>
  
  <app-event-viewer 
    [design]="layoutData"
    [reservedIds]="reservedSeats">
  </app-event-viewer>
</div>
```

### Custom Reserved Seat Management

```typescript
export class AdminBookingComponent {
  layoutData: LayoutExportData;
  preReservedSeats: string[] = [];
  customReservations = '';

  // Load preset reserved seats
  loadVipReservations() {
    this.preReservedSeats = [
      'table-1-chair-0',  // VIP table
      'table-1-chair-1',
      'seating-row-1-chair-5', // Premium seats
      'seating-row-1-chair-6'
    ];
  }

  // Apply custom reservations from text input
  applyCustomReservations() {
    if (this.customReservations.trim()) {
      this.preReservedSeats = this.customReservations
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    }
  }

  // Clear all pre-reservations
  clearReservations() {
    this.preReservedSeats = [];
    this.customReservations = '';
  }

  // Reserve seats for accessibility
  reserveAccessibilitySeats() {
    this.preReservedSeats = [
      'seating-row-1-chair-0',  // Wheelchair accessible
      'seating-row-1-chair-1',  // Companion seat
      'seating-row-10-chair-0', // Back row accessible
      'seating-row-10-chair-1'
    ];
  }
}
```

```html
<!-- Admin interface for managing reservations -->
<div class="admin-booking">
  <div class="controls">
    <h3>Pre-Reserved Seats Management</h3>
    
    <!-- Current reservations display -->
    <div class="current-reservations">
      <label>Currently Reserved ({{ preReservedSeats.length }} seats):</label>
      <div class="seat-list">
        <span *ngIf="preReservedSeats.length === 0" class="empty">No seats reserved</span>
        <code *ngIf="preReservedSeats.length > 0">{{ preReservedSeats.join(', ') }}</code>
      </div>
    </div>

    <!-- Manual entry -->
    <div class="manual-entry">
      <label for="customRes">Custom Seat IDs (comma-separated):</label>
      <input 
        id="customRes"
        [(ngModel)]="customReservations" 
        placeholder="table-1-chair-2, seating-row-1-chair-5"
        class="seat-input">
      <button (click)="applyCustomReservations()">Apply</button>
    </div>

    <!-- Preset buttons -->
    <div class="preset-controls">
      <button (click)="loadVipReservations()" class="vip-btn">Reserve VIP Section</button>
      <button (click)="reserveAccessibilitySeats()" class="access-btn">Reserve Accessibility</button>
      <button (click)="clearReservations()" class="clear-btn">Clear All</button>
    </div>
  </div>

  <!-- Viewer with reserved seats -->
  <app-event-viewer 
    [design]="layoutData"
    [reservedIds]="preReservedSeats">
  </app-event-viewer>
</div>
```

### Integration with Booking Systems

```typescript
export class TicketmasterIntegrationComponent {
  layoutData: LayoutExportData;
  externalReservations: string[] = [];

  constructor(
    private venueService: VenueService,
    private ticketmasterService: TicketmasterService
  ) {}

  async ngOnInit() {
    // Load venue layout
    this.layoutData = await this.venueService.getLayoutForEvent(this.eventId);
    
    // Fetch reservations from external system
    await this.syncExternalReservations();
    
    // Set up periodic sync
    setInterval(() => this.syncExternalReservations(), 30000); // Sync every 30 seconds
  }

  private async syncExternalReservations() {
    try {
      const externalSeats = await this.ticketmasterService.getReservedSeats(this.eventId);
      
      // Map external seat IDs to internal format
      this.externalReservations = externalSeats.map(seat => 
        this.mapExternalSeatId(seat.sectionId, seat.rowId, seat.seatNumber)
      );
      
      console.log('Synced external reservations:', this.externalReservations);
    } catch (error) {
      console.error('Failed to sync external reservations:', error);
    }
  }

  private mapExternalSeatId(section: string, row: string, seat: number): string {
    // Convert external format to internal seat ID format
    if (section.startsWith('TABLE')) {
      return `table-${section.split('-')[1]}-chair-${seat - 1}`;
    } else {
      return `seating-row-${row.charCodeAt(0) - 64}-chair-${seat - 1}`;
    }
  }
}
```

```html
<!-- Integration with external booking systems -->
<div class="external-integration">
  <div class="sync-status">
    <h3>External System Integration</h3>
    <p>Reservations synced from Ticketmaster: {{ externalReservations.length }} seats</p>
    <small>Last sync: {{ lastSyncTime | date:'medium' }}</small>
  </div>

  <app-event-viewer 
    [design]="layoutData"
    [reservedIds]="externalReservations">
  </app-event-viewer>
</div>
```

### Complex Reservation Scenarios

```typescript
export class ComplexBookingComponent {
  layoutData: LayoutExportData;
  
  // Different types of reservations
  vipReservations: string[] = [];
  accessibilityReservations: string[] = [];
  groupReservations: string[] = [];
  temporaryHolds: string[] = [];

  // Combined reserved seats
  get allReservedSeats(): string[] {
    return [
      ...this.vipReservations,
      ...this.accessibilityReservations,
      ...this.groupReservations,
      ...this.temporaryHolds
    ];
  }

  constructor(private bookingService: BookingService) {}

  async ngOnInit() {
    await this.loadAllReservations();
  }

  private async loadAllReservations() {
    const [vip, accessibility, groups, holds] = await Promise.all([
      this.bookingService.getVipReservations(this.eventId),
      this.bookingService.getAccessibilityReservations(this.eventId),
      this.bookingService.getGroupReservations(this.eventId),
      this.bookingService.getTemporaryHolds(this.eventId)
    ]);

    this.vipReservations = vip;
    this.accessibilityReservations = accessibility;
    this.groupReservations = groups;
    this.temporaryHolds = holds;
  }

  // Methods to manage different reservation types
  addVipReservation(seatId: string) {
    if (!this.vipReservations.includes(seatId)) {
      this.vipReservations.push(seatId);
    }
  }

  removeTemporaryHold(seatId: string) {
    this.temporaryHolds = this.temporaryHolds.filter(id => id !== seatId);
  }

  convertHoldToReservation(seatId: string, type: 'vip' | 'group' | 'accessibility') {
    this.removeTemporaryHold(seatId);
    
    switch (type) {
      case 'vip':
        this.addVipReservation(seatId);
        break;
      case 'group':
        this.groupReservations.push(seatId);
        break;
      case 'accessibility':
        this.accessibilityReservations.push(seatId);
        break;
    }
  }
}
```

```html
<!-- Complex reservation management -->
<div class="complex-booking">
  <div class="reservation-manager">
    <h3>Reservation Categories</h3>
    
    <div class="category-summary">
      <div class="category vip">
        VIP: {{ vipReservations.length }} seats
      </div>
      <div class="category accessibility">
        Accessibility: {{ accessibilityReservations.length }} seats
      </div>
      <div class="category group">
        Group: {{ groupReservations.length }} seats
      </div>
      <div class="category temporary">
        Temporary Holds: {{ temporaryHolds.length }} seats
      </div>
    </div>
    
    <div class="total-reserved">
      Total Reserved: {{ allReservedSeats.length }} seats
    </div>
  </div>

  <!-- Viewer shows all reserved seats as unavailable -->
  <app-event-viewer 
    [design]="layoutData"
    [reservedIds]="allReservedSeats">
  </app-event-viewer>
</div>
```

## Reserved Seats Best Practices

### 1. Seat ID Format Consistency
```typescript
// Recommended seat ID format
const seatId = `${elementType}-${elementId}-chair-${seatIndex}`;

// Examples:
// - "table-1-chair-5" (Table 1, seat 6)
// - "seating-row-A-chair-10" (Row A, seat 11)  
// - "rect-table-2-chair-3" (Rectangle table 2, seat 4)
```

### 2. Real-Time Updates
```typescript
// Use observables for real-time reservation updates
export class ReservationService {
  private reservationsSubject = new BehaviorSubject<string[]>([]);
  
  get reservations$() {
    return this.reservationsSubject.asObservable();
  }

  updateReservations(seatIds: string[]) {
    this.reservationsSubject.next(seatIds);
  }
}
```

### 3. Error Handling
```typescript
// Handle reservation sync failures gracefully
async syncReservations() {
  try {
    this.reservedSeats = await this.bookingService.getReservedSeats(this.eventId);
  } catch (error) {
    console.error('Reservation sync failed:', error);
    // Show user-friendly message
    this.showNotification('Unable to load latest reservations. Please refresh.');
  }
}
``` 