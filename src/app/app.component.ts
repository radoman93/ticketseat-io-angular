import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventEditorComponent } from './components/event-editor/event-editor.component';
import { EventViewerComponent } from './components/event-viewer/event-viewer.component';
import { LayoutExportData } from './services/layout-export-import.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, EventEditorComponent, EventViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'TicketSeat.io Angular Demo';
  
  // Component toggle
  showEditor = true;
  
  // Sample pre-reserved seat IDs for viewer testing
  preReservedSeats: string[] = [
    'table-1-chair-2',  // Table 1, seat 3
    'table-1-chair-5',  // Table 1, seat 6
    'seating-row-1-chair-3', // Row 1, seat 4
    'seating-row-2-chair-0', // Row 2, seat 1
  ];
  
  // Custom reserved seats input
  customReservedSeats = '';
  
  // Sample layout data
  sampleLayout: LayoutExportData | null = null;

  constructor() {
    // Create a sample layout for testing
    this.createSampleLayout();
  }

  toggleComponent(): void {
    this.showEditor = !this.showEditor;
  }

  updatePreReservedSeats(): void {
    if (this.customReservedSeats.trim()) {
      this.preReservedSeats = this.customReservedSeats
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    }
  }

  clearPreReservedSeats(): void {
    this.preReservedSeats = [];
    this.customReservedSeats = '';
  }

  addSampleReservedSeats(): void {
    this.preReservedSeats = [
      'table-1-chair-2',
      'table-1-chair-5', 
      'seating-row-1-chair-3',
      'seating-row-2-chair-0',
    ];
    this.customReservedSeats = this.preReservedSeats.join(', ');
  }

  private createSampleLayout(): void {
    // This creates a basic sample layout for demonstration
    // In a real app, this would come from your backend
    this.sampleLayout = {
      meta: {
        name: 'Sample Theater Layout',
        version: '1.0.0',
        created: new Date().toISOString(),
        creator: 'TicketSeats Demo v1.0'
      },
      settings: {
        gridSize: 25,
        showGrid: true,
        showGuides: true
      },
      elements: [
        {
          id: 'table-1',
          type: 'roundTable',
          x: 200,
          y: 150,
          rotation: 0,
          radius: 60,
          seats: 8,
          openSpaces: 0,
          name: 'Table 1'
        },
        {
          id: 'rect-table-1',
          type: 'rectangleTable',
          x: 400,
          y: 150,
          rotation: 0,
          width: 120,
          height: 80,
          leftChairs: 3,
          rightChairs: 3,
          upChairs: 2,
          downChairs: 2,
          name: 'Rectangle Table 1'
        },
        {
          id: 'seating-row-1',
          type: 'seatingRow',
          x: 150,
          y: 350,
          rotation: 0,
          seatCount: 8,
          seatSpacing: 35,
          name: 'Row A'
        },
        {
          id: 'seating-row-2',
          type: 'seatingRow',
          x: 150,
          y: 400,
          rotation: 0,
          seatCount: 8,
          seatSpacing: 35,
          name: 'Row B'
        }
      ]
    };
  }
}
