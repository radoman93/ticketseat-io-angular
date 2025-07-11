import { Component } from '@angular/core';
import { EventViewerComponent } from '../components/event-viewer/event-viewer.component';

@Component({
    selector: 'app-seat-limit-demo',
    standalone: true,
    imports: [EventViewerComponent],
    template: `
    <div class="h-screen bg-gray-50">
      <div class="p-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Seat Limit Demo</h1>
        <p class="text-gray-600 mb-6">This demo shows the EventViewer with a 3-seat selection limit.</p>
        
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <app-event-viewer 
            [design]="sampleLayout" 
            [seatLimit]="3">
          </app-event-viewer>
        </div>
      </div>
    </div>
  `
})
export class SeatLimitDemoComponent {
    // Sample layout with a few tables for testing
    sampleLayout = {
        meta: {
            name: "Seat Limit Demo Layout",
            version: "1.0",
            created: new Date().toISOString(),
            description: "Demo layout for testing seat limit feature"
        },
        elements: [
            {
                id: "round-table-1",
                type: "roundTable",
                x: 200,
                y: 200,
                rotation: 0,
                radius: 60,
                seats: 6,
                label: "Table 1",
                tableLabelVisible: true,
                chairLabelVisible: true
            },
            {
                id: "round-table-2",
                type: "roundTable",
                x: 400,
                y: 200,
                rotation: 0,
                radius: 60,
                seats: 8,
                label: "Table 2",
                tableLabelVisible: true,
                chairLabelVisible: true
            },
            {
                id: "rectangle-table-1",
                type: "rectangleTable",
                x: 300,
                y: 400,
                rotation: 0,
                width: 120,
                height: 60,
                upChairs: 3,
                downChairs: 3,
                leftChairs: 0,
                rightChairs: 0,
                label: "Rect Table",
                tableLabelVisible: true,
                chairLabelVisible: true
            }
        ]
    };
}
