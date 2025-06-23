import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventEditorComponent } from './components/event-editor/event-editor.component';
import { LayoutExportData } from './services/layout-export-import.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    EventEditorComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ticketseat-io-angular';

  // Example design data - you can replace this with your own JSON or pass it dynamically
  exampleDesign: LayoutExportData = {
    "meta": {
      "version": "1.0",
      "name": "testis",
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
