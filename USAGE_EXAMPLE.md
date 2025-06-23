# Usage Examples

## Simple Integration

### app.component.ts
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
export class AppComponent {
  title = 'My Event Editor App';
}
```

## Loading an Existing Design

### app.component.ts with Design Input
```typescript
import { Component } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor [design]="myDesign"></app-event-editor>
    </div>
  `
})
export class AppComponent {
  title = 'My Event Editor App';

  // Load an existing design - can be an object or JSON string
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

## Dynamic Design Loading

### component.ts with Dynamic Loading
```typescript
import { Component, OnInit } from '@angular/core';
import { EventEditorComponent, LayoutExportData } from 'ticketseat-io-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <div class="p-4 bg-gray-100">
        <button 
          *ngFor="let layout of availableLayouts" 
          (click)="loadLayout(layout.id)"
          class="mr-2 mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          {{ layout.name }}
        </button>
      </div>
      <div class="flex-1">
        <app-event-editor [design]="currentDesign"></app-event-editor>
      </div>
    </div>
  `
})
export class EventPageComponent implements OnInit {
  currentDesign: LayoutExportData | null = null;
  availableLayouts = [
    { id: 'wedding', name: 'Wedding Layout' },
    { id: 'conference', name: 'Conference Layout' },
    { id: 'banquet', name: 'Banquet Layout' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Load default layout
    this.loadLayout('wedding');
  }

  async loadLayout(layoutId: string) {
    try {
      // Load from your API or local storage
      const response = await this.http.get<LayoutExportData>(`/api/layouts/${layoutId}`).toPromise();
      this.currentDesign = response!;
    } catch (error) {
      console.error('Failed to load layout:', error);
      // Fallback to empty layout
      this.currentDesign = null;
    }
  }
}
```

## Loading from JSON String

### component.ts with JSON String
```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="h-screen w-screen">
      <app-event-editor [design]="jsonDesign"></app-event-editor>
    </div>
  `
})
export class AppComponent {
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

## Advanced Usage with Store Access

### event-page.component.ts
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  EventEditorComponent, 
  viewerStore, 
  layoutStore, 
  selectionStore 
} from 'ticketseat-io-angular';
import { autorun, IReactionDisposer } from 'mobx';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [EventEditorComponent],
  template: `
    <div class="flex flex-col h-screen">
      <header class="bg-gray-800 text-white p-4">
        <h1>Event Layout Editor</h1>
        <div class="flex gap-4 mt-2">
          <span>Zoom: {{ currentZoom }}%</span>
          <span>Elements: {{ elementCount }}</span>
          <span>Selected: {{ selectedCount }}</span>
        </div>
      </header>
      
      <main class="flex-1">
        <app-event-editor [design]="initialDesign"></app-event-editor>
      </main>
      
      <footer class="bg-gray-100 p-4">
        <button 
          (click)="exportLayout()" 
          class="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Export Layout
        </button>
        <button 
          (click)="clearLayout()" 
          class="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear Layout
        </button>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class EventPageComponent implements OnInit, OnDestroy {
  currentZoom = 100;
  elementCount = 0;
  selectedCount = 0;
  
  private disposers: IReactionDisposer[] = [];

  // Initial design to load
  initialDesign = {
    "meta": {
      "version": "1.0",
      "name": "Conference Hall",
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
      })
    );
  }

  ngOnDestroy() {
    // Clean up reactions
    this.disposers.forEach(dispose => dispose());
  }

  exportLayout() {
    // Access layout data from the store
    const layoutData = {
      meta: {
        version: '1.0',
        name: 'Exported Layout',
        created: new Date().toISOString(),
        creator: 'TicketSeats v1.0'
      },
      settings: {
        gridSize: 50,
        showGrid: true,
        showGuides: true
      },
      elements: layoutStore.elements
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'layout.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  clearLayout() {
    layoutStore.clearAll();
    selectionStore.deselectItem();
  }
}

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