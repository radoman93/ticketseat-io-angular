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
        <app-event-editor></app-event-editor>
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

  ngOnInit() {
    // React to store changes
    this.disposers.push(
      autorun(() => {
        this.currentZoom = Math.round(viewerStore.zoom * 100);
      }),
      
      autorun(() => {
        this.elementCount = layoutStore.elements.length;
      }),
      
      autorun(() => {
        this.selectedCount = selectionStore.selectedElements.length;
      })
    );
  }

  ngOnDestroy() {
    // Clean up reactions
    this.disposers.forEach(dispose => dispose());
  }

  exportLayout() {
    const layout = layoutStore.exportLayout();
    console.log('Exported layout:', layout);
    
    // You can save this to a file or send to an API
    const blob = new Blob([JSON.stringify(layout, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  clearLayout() {
    if (confirm('Are you sure you want to clear the layout?')) {
      layoutStore.clearLayout();
    }
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
```

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
```

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