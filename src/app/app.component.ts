import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventEditorComponent } from './components/event-editor/event-editor.component';
import { EventViewerComponent } from './components/event-viewer/event-viewer.component';
import { LayoutExportData } from './services/layout-export-import.service';
import { Chair } from './models/chair.model';

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

  // Seat limit value for testing
  seatLimitValue: number = 0;

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

  onSelectedSeatsChange(selectedChairs: Chair[]): void {
    console.log('Selected seats changed:', selectedChairs);
  }

  private createSampleLayout(): void {
    // This creates a basic sample layout for demonstration
    // In a real app, this would come from your backend
    this.sampleLayout = {
      "meta": {
        "version": "1.0",
        "name": "3",
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
            },
            {
              "id": "table-1-chair-2",
              "tableId": "table-1",
              "label": "3",
              "price": 25,
              "position": {
                "angle": 90,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1-chair-3",
              "tableId": "table-1",
              "label": "4",
              "price": 25,
              "position": {
                "angle": 135,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1-chair-4",
              "tableId": "table-1",
              "label": "5",
              "price": 25,
              "position": {
                "angle": 180,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1-chair-5",
              "tableId": "table-1",
              "label": "6",
              "price": 25,
              "position": {
                "angle": 225,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1-chair-6",
              "tableId": "table-1",
              "label": "7",
              "price": 25,
              "position": {
                "angle": 270,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1-chair-7",
              "tableId": "table-1",
              "label": "8",
              "price": 25,
              "position": {
                "angle": 315,
                "distance": 80
              },
              "isSelected": false,
              "reservationStatus": "free"
            }
          ]
        },
        {
          "id": "rect-table-1",
          "type": "rectangleTable",
          "x": 400,
          "y": 150,
          "rotation": 0,
          "width": 120,
          "height": 80,
          "leftChairs": 3,
          "rightChairs": 3,
          "upChairs": 2,
          "downChairs": 2,
          "name": "Rectangle Table 1",
          "tableLabelVisible": true,
          "chairLabelVisible": true,
          "chairs": [
            {
              "id": "rect-table-1-chair-0",
              "tableId": "rect-table-1",
              "label": "1",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-1",
              "tableId": "rect-table-1",
              "label": "2",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-2",
              "tableId": "rect-table-1",
              "label": "3",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-3",
              "tableId": "rect-table-1",
              "label": "4",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-4",
              "tableId": "rect-table-1",
              "label": "5",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-5",
              "tableId": "rect-table-1",
              "label": "6",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-6",
              "tableId": "rect-table-1",
              "label": "7",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-7",
              "tableId": "rect-table-1",
              "label": "8",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-8",
              "tableId": "rect-table-1",
              "label": "9",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "rect-table-1-chair-9",
              "tableId": "rect-table-1",
              "label": "10",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            }
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
            },
            {
              "id": "seating-row-1-chair-1",
              "tableId": "seating-row-1",
              "label": "2",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-2",
              "tableId": "seating-row-1",
              "label": "3",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-3",
              "tableId": "seating-row-1",
              "label": "4",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-4",
              "tableId": "seating-row-1",
              "label": "5",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-5",
              "tableId": "seating-row-1",
              "label": "6",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-6",
              "tableId": "seating-row-1",
              "label": "7",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-1-chair-7",
              "tableId": "seating-row-1",
              "label": "8",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            }
          ]
        },
        {
          "id": "seating-row-2",
          "type": "seatingRow",
          "x": 150,
          "y": 400,
          "rotation": 0,
          "seatCount": 8,
          "seatSpacing": 35,
          "name": "Row B",
          "rowLabelVisible": true,
          "chairLabelVisible": true,
          "chairs": [
            {
              "id": "seating-row-2-chair-0",
              "tableId": "seating-row-2",
              "label": "1",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-1",
              "tableId": "seating-row-2",
              "label": "2",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-2",
              "tableId": "seating-row-2",
              "label": "3",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-3",
              "tableId": "seating-row-2",
              "label": "4",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-4",
              "tableId": "seating-row-2",
              "label": "5",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-5",
              "tableId": "seating-row-2",
              "label": "6",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-6",
              "tableId": "seating-row-2",
              "label": "7",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            },
            {
              "id": "seating-row-2-chair-7",
              "tableId": "seating-row-2",
              "label": "8",
              "price": 0,
              "position": {
                "angle": 0,
                "distance": 0
              },
              "isSelected": false
            }
          ]
        },
        {
          "id": "table-1752223838615",
          "type": "rectangleTable",
          "x": 576,
          "y": 295,
          "width": 120,
          "height": 80,
          "upChairs": 4,
          "downChairs": 4,
          "leftChairs": 0,
          "rightChairs": 0,
          "name": "Table 5",
          "rotation": 0,
          "tableLabelVisible": true,
          "chairLabelVisible": true,
          "chairs": [
            {
              "id": "table-1752223838615-chair-0",
              "tableId": "table-1752223838615",
              "label": "1",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-1",
              "tableId": "table-1752223838615",
              "label": "2",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-2",
              "tableId": "table-1752223838615",
              "label": "3",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-3",
              "tableId": "table-1752223838615",
              "label": "4",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-4",
              "tableId": "table-1752223838615",
              "label": "5",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-5",
              "tableId": "table-1752223838615",
              "label": "6",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-6",
              "tableId": "table-1752223838615",
              "label": "7",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            },
            {
              "id": "table-1752223838615-chair-7",
              "tableId": "table-1752223838615",
              "label": "8",
              "price": 25,
              "position": {
                "angle": 0,
                "distance": 25
              },
              "isSelected": false,
              "reservationStatus": "free"
            }
          ]
        },
        {
          "id": "line-1",
          "type": "line",
          "x": 300,
          "y": 250,
          "rotation": 0,
          "startX": 300,
          "startY": 250,
          "endX": 500,
          "endY": 300,
          "thickness": 3,
          "color": "#ff0000",
          "name": "Sample Line",
          "label": "Sample Line"
        },
        {
          "id": "polygon-1",
          "type": "polygon",
          "x": 200,
          "y": 400,
          "rotation": 0,
          "points": [
            {"x": 200, "y": 400},
            {"x": 300, "y": 380},
            {"x": 350, "y": 450},
            {"x": 280, "y": 500},
            {"x": 150, "y": 480}
          ],
          "fillColor": "#0000ff",
          "fillOpacity": 0.3,
          "borderColor": "#000080",
          "borderThickness": 2,
          "showBorder": true,
          "name": "Sample Polygon",
          "label": "Sample Polygon"
        }
      ]
    }
  }
}
