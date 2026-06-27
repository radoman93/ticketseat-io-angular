import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventEditorComponent } from './components/event-editor/event-editor.component';
import { EventViewerComponent } from './components/event-viewer/event-viewer.component';
import { LayoutExportData } from './services/layout-export-import.service';
import { Chair } from './models/chair.model';
import { LoggerService } from './services/logger.service';
import { PresetLoaderService } from './services/preset-loader.service';

// DemoComponent — the original library demo harness. Lives at route '' and reuses
// the existing app.component.html / app.component.css. (Extracted so the new
// Seat Map Studio can live at /studio without disturbing this demo.)
@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, EventEditorComponent, EventViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class DemoComponent {
  title = 'TicketSeat.io Angular Demo';

  private static readonly THEATER_SCALE = 0.6;
  private static readonly THEATER_OFFSET_X = -150;
  private static readonly THEATER_OFFSET_Y = 0;
  private static readonly THEATER_ARC_CENTER_X = 1100 * DemoComponent.THEATER_SCALE + DemoComponent.THEATER_OFFSET_X;
  private static readonly THEATER_ARC_CENTER_Y = 100 * DemoComponent.THEATER_SCALE + DemoComponent.THEATER_OFFSET_Y;
  private static readonly THEATER_SIDE_SEAT_SPACING = 50 * DemoComponent.THEATER_SCALE;

  showEditor = true;

  preReservedSeats: string[] = [
    'table-1-chair-2',
    'table-1-chair-5',
    'seating-row-1-chair-3',
    'seating-row-2-chair-0',
  ];

  customReservedSeats = '';
  seatLimitValue: number = 0;
  sampleLayout: LayoutExportData | null = null;

  constructor(private logger: LoggerService, private presetLoader: PresetLoaderService) {
    this.createSampleLayout();
  }

  loadGoldman(variant: 'approx' | 'precise'): void {
    const url = `assets/presets/goldman-theater-${variant}.json`;
    this.presetLoader.load(url).catch(err => console.error('Goldman preset load failed', err));
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
    this.logger.info('Selected seats changed', {
      component: 'DemoComponent',
      action: 'seat_selection',
      selectedCount: selectedChairs.length,
      chairIds: selectedChairs.map(c => c.id)
    });
  }

  private createSampleLayout(): void {
    const s = DemoComponent.THEATER_SCALE;

    this.sampleLayout = {
      "meta": {
        "version": "1.1",
        "name": "Theater",
        "created": "2026-05-07T09:13:54.615Z",
        "creator": "TicketSeats v1.1"
      },
      "settings": {
        "gridSize": 25,
        "showGrid": true,
        "showGuides": true
      },
      "elements": [
        this.buildStage(s),
        this.buildStageLabel(s),
        ...this.buildArcRow("center-row-a", "Row A", 360 * s, 244, 296),
        ...this.buildArcRow("center-row-b", "Row B", 442 * s, 247, 293),
        ...this.buildArcRow("center-row-c", "Row C", 524 * s, 249.5, 290.5),
        ...this.buildArcRow("center-row-d", "Row D", 606 * s, 251.5, 288.5),
        ...this.buildArcRow("center-row-e", "Row E", 688 * s, 253, 287),
        ...this.buildArcRow("center-row-f", "Row F", 770 * s, 254.5, 285.5),
        ...this.buildSideRow("left-row-b", "Row B", 500 * s, 425 * s, 391.9887056931244 * s, 461.9051901625796 * s, 11.5, "left", ["1", "3", "5", "7"]),
        ...this.buildSideRow("left-row-c", "Row C", 475 * s, 500 * s, 378.9887056931244 * s, 543.9051901625796 * s, 11.5, "left", ["1", "3", "5", "7"]),
        ...this.buildSideRow("left-row-d", "Row D", 450 * s, 575 * s, 366.9887056931244 * s, 625.9051901625796 * s, 11.5, "left", ["1", "3", "5", "7"]),
        ...this.buildSideRow("left-row-e", "Row E", 425 * s, 650 * s, 355.9887056931244 * s, 707.9051901625796 * s, 11.5, "left", ["1", "3", "5", "7"]),
        ...this.buildSideRow("left-row-f", "Row F", 400 * s, 725 * s, 344.9887056931244 * s, 789.9051901625796 * s, 11.5, "left", ["1", "3", "5", "7"]),
        ...this.buildSideRow("right-row-b", "Row B", 1525 * s, 450 * s, 1901.9887056931245 * s, 402.0948098374204 * s, -11.5, "right", ["8", "6", "4", "2"]),
        ...this.buildSideRow("right-row-c", "Row C", 1550 * s, 525 * s, 1914.9887056931245 * s, 484.0948098374204 * s, -11.5, "right", ["8", "6", "4", "2"]),
        ...this.buildSideRow("right-row-d", "Row D", 1575 * s, 600 * s, 1926.9887056931245 * s, 566.0948098374204 * s, -11.5, "right", ["8", "6", "4", "2"]),
        ...this.buildSideRow("right-row-e", "Row E", 1600 * s, 675 * s, 1937.9887056931245 * s, 648.0948098374204 * s, -11.5, "right", ["8", "6", "4", "2"]),
        ...this.buildSideRow("right-row-f", "Row F", 1625 * s, 750 * s, 1948.9887056931245 * s, 730.0948098374204 * s, -11.5, "right", ["8", "6", "4", "2"])
      ]
    };
  }

  private buildStage(s: number): any {
    const points: Array<[number, number]> = [
      [467.7777777777783, 16.666666666666686],
      [1767.7777777777783, 16.666666666666686],
      [1777.7777777777783, 66.66666666666669],
      [1757.7777777777783, 96.66666666666669],
      [1697.7777777777783, 126.66666666666669],
      [1587.7777777777783, 146.66666666666669],
      [1437.7777777777783, 161.66666666666669],
      [1267.7777777777783, 171.66666666666669],
      [1117.7777777777783, 174.66666666666669],
      [967.7777777777783, 171.66666666666669],
      [797.7777777777783, 161.66666666666669],
      [647.7777777777783, 146.66666666666669],
      [537.7777777777783, 126.66666666666669],
      [477.7777777777783, 96.66666666666669],
      [457.7777777777783, 66.66666666666669]
    ];
    const dx = DemoComponent.THEATER_OFFSET_X;
    const dy = DemoComponent.THEATER_OFFSET_Y;
    return {
      id: "stage-shape",
      type: "polygon",
      x: 2217.7777777777783 * s + dx,
      y: 196.66666666666669 * s + dy,
      rotation: 0,
      points: points.map(([x, y]) => ({ x: x * s + dx, y: y * s + dy })),
      fillColor: "#6B7280",
      fillOpacity: 1,
      borderColor: "#4B5563",
      borderThickness: 1,
      showBorder: true,
      name: "Stage"
    };
  }

  private buildStageLabel(s: number): any {
    return {
      id: "stage-label",
      type: "text",
      x: 1100 * s + DemoComponent.THEATER_OFFSET_X,
      y: 160 * s + DemoComponent.THEATER_OFFSET_Y,
      rotation: 0,
      text: "STAGE",
      fontSize: 28,
      fontFamily: "sans-serif",
      fontWeight: "700",
      fontStyle: "normal",
      textAlign: "center",
      color: "#FFFFFF",
      name: "Stage Label",
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      padding: 4
    };
  }

  private buildArcRow(id: string, name: string, radius: number, startAngle: number, endAngle: number): any[] {
    const labels = ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113"];
    return [{
      id,
      type: "arcSeatingRow",
      x: DemoComponent.THEATER_ARC_CENTER_X,
      y: DemoComponent.THEATER_ARC_CENTER_Y,
      rotation: 0,
      radius,
      startAngle,
      endAngle,
      seats: 13,
      seatRadius: 8,
      chairFacing: "inward",
      name,
      chairLabelVisible: true,
      rowLabelVisible: true,
      labelPosition: "left",
      chairLabels: [...labels],
      chairs: labels.map((label, i) => ({
        id: `${id}-chair-${i}`,
        tableId: id,
        label,
        price: 0,
        position: { angle: 0, distance: 0 },
        isSelected: false,
        reservationStatus: "free"
      }))
    }];
  }

  private buildSideRow(
    id: string,
    name: string,
    x: number,
    y: number,
    endX: number,
    endY: number,
    rotation: number,
    labelPosition: "left" | "right",
    labels: string[]
  ): any[] {
    const dx = DemoComponent.THEATER_OFFSET_X;
    const dy = DemoComponent.THEATER_OFFSET_Y;
    return [{
      id,
      type: "seatingRow",
      x: x + dx,
      y: y + dy,
      endX: endX + dx,
      endY: endY + dy,
      rotation,
      seatCount: labels.length,
      seatSpacing: DemoComponent.THEATER_SIDE_SEAT_SPACING,
      seatRadius: 8,
      name,
      chairLabelVisible: true,
      rowLabelVisible: true,
      labelPosition,
      chairLabels: [...labels],
      chairs: labels.map((label, i) => ({
        id: `${id}-chair-${i}`,
        tableId: id,
        label,
        price: 0,
        position: { angle: 0, distance: 0 },
        isSelected: false,
        reservationStatus: "free"
      }))
    }];
  }
}
