import { Component } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { LayoutExportData } from '../services/layout-export-import.service';
import { EventEditorComponent } from '../components/event-editor/event-editor.component';

@Component({
  standalone: true,
  imports: [CommonModule, JsonPipe, EventEditorComponent],
  selector: 'app-editor-with-updates',
  template: `
    <div class="container">
      <app-event-editor
        [design]="initialDesign"
        (layoutUpdated)="onLayoutUpdated($event)">
      </app-event-editor>
      
      <!-- Debug panel to show updates -->
      <div *ngIf="lastUpdate" class="debug-panel">
        <h3>Last Update</h3>
        <pre>{{ lastUpdate | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .container {
      height: 100vh;
      display: flex;
    }
    .debug-panel {
      position: fixed;
      right: 20px;
      top: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 300px;
      max-height: 400px;
      overflow: auto;
    }
  `]
})
export class EditorWithUpdatesComponent {
  initialDesign: LayoutExportData = {
    meta: {
      version: '1.0',
      name: 'Test Layout',
      created: new Date().toISOString(),
      creator: 'TicketSeats v1.0'
    },
    settings: {
      gridSize: 25,
      showGrid: true,
      showGuides: true
    },
    elements: []
  };

  lastUpdate?: LayoutExportData;

  onLayoutUpdated(layout: LayoutExportData) {
    console.log('Layout updated:', layout);
    this.lastUpdate = layout;
  }
}
