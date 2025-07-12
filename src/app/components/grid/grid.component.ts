import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnDestroy, OnInit } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableComponent } from '../round-table/round-table.component';
import { RectangleTableComponent } from '../rectangle-table/rectangle-table.component';
import { SeatingRowComponent } from '../seating-row/seating-row.component';
import { ToolType } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { Selectable, RoundTableProperties, RectangleTableProperties, SeatingRowProperties } from '../../services/selection.service';
import { toolStore } from '../../stores/tool.store';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { rootStore } from '../../stores/root.store';
import { autorun, IReactionDisposer } from 'mobx';
import { HistoryStore } from '../../stores/history.store';
import { AddObjectCommand } from '../../commands/add-object.command';
import viewerStore from '../../stores/viewer.store';

// Use union type for table positions  
type TablePosition = RoundTableProperties | RectangleTableProperties | SeatingRowProperties;

@Component({
  selector: 'app-grid',
  imports: [
    MobxAngularModule,
    RoundTableComponent,
    RectangleTableComponent,
    SeatingRowComponent,
    CommonModule
  ],
  standalone: true,
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit, AfterViewInit, OnDestroy {
  store = gridStore;
  rootStore = rootStore;
  toolStore = toolStore;
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  viewerStore = viewerStore;

  ToolType = ToolType; // Make enum available in template

  // Preview table (for ghost table during placement)
  previewTable: TablePosition | null = null;

  // SeatingRow drawing state
  isDrawingSeatingRow: boolean = false;
  drawingStartX: number = 0;
  drawingStartY: number = 0;
  drawingCurrentX: number = 0;
  drawingCurrentY: number = 0;

  private toolChangeDisposer: IReactionDisposer | null = null;

  constructor(
    private historyStore: HistoryStore
  ) { }

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gridContainer') gridContainerRef!: ElementRef<HTMLDivElement>;
  private ctx!: CanvasRenderingContext2D;

  ngOnInit(): void {
    // Use MobX autorun to react to tool changes
    this.toolChangeDisposer = autorun(() => {
      const activeTool = this.toolStore.activeTool;

      if (activeTool === ToolType.RoundTable) {
        // Initialize preview round table when entering add mode
        this.previewTable = {
          id: `table-preview-${Date.now()}`,
          type: 'roundTable',
          x: 0,
          y: 0,
          radius: 50,
          seats: 8,
          openSpaces: 0,
          name: `Table ${this.layoutStore.elements.length + 1}`,
          rotation: 0,
          tableLabelVisible: true,
          chairLabelVisible: true
        };
      } else if (activeTool === ToolType.RectangleTable) {
        // Initialize preview rectangle table when entering add mode
        this.previewTable = {
          id: `table-preview-${Date.now()}`,
          type: 'rectangleTable',
          x: 0,
          y: 0,
          width: 120,
          height: 80,
          upChairs: 4,
          downChairs: 4,
          leftChairs: 0,
          rightChairs: 0,
          name: `Table ${this.layoutStore.elements.length + 1}`,
          rotation: 0,
          tableLabelVisible: true,
          chairLabelVisible: true
        };
      } else if (activeTool === ToolType.SeatingRow) {
        // Reset drawing state when entering SeatingRow tool
        this.resetSeatingRowDrawing();
        this.previewTable = null;
      } else {
        this.previewTable = null;
        this.resetSeatingRowDrawing();
      }
    });

    // Register delete handler with MobX selection store
    this.selectionStore.registerDeleteHandler((item) => {
      this.layoutStore.deleteElement(item.id);
    });
  }

  ngAfterViewInit(): void {
    this.setCanvasSize();
    this.setupCanvas();

    // Track mouse movements for preview table positioning
    this.gridContainerRef.nativeElement.addEventListener('mousemove', (event) => {
      if (this.previewTable && this.previewTable.type !== 'seatingRow') {
        const gridCoords = this.getGridCoordinates(event);
        this.previewTable.x = gridCoords.x;
        this.previewTable.y = gridCoords.y;
      }
    });
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
      this.drawGrid();

      // Register the drawGrid method as a callback
      this.store.registerRedrawCallback(this.drawGrid.bind(this));
    }
  }

  //The idea is to make large canvas and have it contained within grid-container
  private setCanvasSize() {
    if (this.canvasRef && this.gridContainerRef) {
      const canvas = this.canvasRef.nativeElement;
      const container = this.gridContainerRef.nativeElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  private drawGrid(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();

    this.ctx.translate(this.store.panOffset.x, this.store.panOffset.y);
    this.ctx.scale(this.store.zoomLevel / 100, this.store.zoomLevel / 100);

    const startX =
      Math.floor(-this.store.panOffset.x / (this.store.gridSize * (this.store.zoomLevel / 100))) *
      this.store.gridSize;
    const startY =
      Math.floor(-this.store.panOffset.y / (this.store.gridSize * (this.store.zoomLevel / 100))) *
      this.store.gridSize;
    const endX = width / (this.store.zoomLevel / 100) + startX + this.store.gridSize;
    const endY = height / (this.store.zoomLevel / 100) + startY + this.store.gridSize;

    this.ctx.strokeStyle = 'rgb(200, 200, 200)';
    this.ctx.lineWidth = 0.5;

    for (let x = startX; x <= endX; x += this.store.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += this.store.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, 0);
    this.ctx.lineTo(endX, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, startY);
    this.ctx.lineTo(0, endY);
    this.ctx.stroke();

    this.ctx.restore();
  }

  @HostListener('window:resize')
  onResize() {
    this.setCanvasSize();
    this.drawGrid();
  }

  ngOnDestroy() {
    // Unregister the callback when component is destroyed
    this.store.unregisterRedrawCallback(this.drawGrid.bind(this));

    // Clean up MobX reactions
    if (this.toolChangeDisposer) {
      this.toolChangeDisposer();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Allow panning in viewer mode, but disable table manipulation and creation
    if (this.viewerStore.isViewerMode) {
      if (event.button === 1 || event.button === 0) {
        // Middle mouse button OR left mouse button for panning in viewer mode
        this.store.startPanning(event.clientX, event.clientY);
        event.preventDefault();
      }
      return;
    }

    if (event.button === 1) {
      // Middle mouse button for panning
      this.store.startPanning(event.clientX, event.clientY);
      event.preventDefault();
    } else if (event.button === 0) {
      // Left mouse button for selection/dragging/adding
      const activeTool = this.toolStore.activeTool;

      // Handle SeatingRow drawing
      if (activeTool === ToolType.SeatingRow) {
        const gridCoords = this.getGridCoordinates(event);
        
        if (!this.isDrawingSeatingRow) {
          // Start drawing
          this.startSeatingRowDrawing(gridCoords.x, gridCoords.y);
        } else {
          // Finish drawing
          this.finishSeatingRowDrawing();
        }
        
        event.preventDefault();
      }
      // Handle table creation for other tools
      else if ((activeTool === ToolType.RoundTable || activeTool === ToolType.RectangleTable) && this.previewTable) {
        const gridCoords = this.getGridCoordinates(event);
        
        // Create a copy of the preview table for the layout
        const newTable = {
          ...this.previewTable,
          x: gridCoords.x,
          y: gridCoords.y,
          id: `${this.previewTable.type}-${Date.now()}`
        };

        // Add the table to the layout using command pattern
        const addCmd = new AddObjectCommand(newTable);
        this.historyStore.executeCommand(addCmd);

        // Deselect tool after placing table
        this.toolStore.setActiveTool(ToolType.None);
        
        event.preventDefault();
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    // Update mouse position
    const gridCoords = this.getGridCoordinates(event);
    this.store.setMousePosition(gridCoords.x, gridCoords.y);

    // Handle SeatingRow drawing
    if (this.isDrawingSeatingRow) {
      this.updateSeatingRowDrawing(gridCoords.x, gridCoords.y);
      return;
    }

    // Handle panning
    if (this.store.isPanning) {
      this.store.pan(event.clientX, event.clientY);
      return;
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.store.isPanning) {
      this.store.stopPanning();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event): void {
    // Prevent right-click context menu
    event.preventDefault();
  }

  handleCanvasClick(): void {
    // Deselect any selected items when clicking on empty canvas
    this.selectionStore.deselectItem();
  }

  // Handle table selection and start dragging
  selectTable(table: any, event: Event): void {
    event.stopPropagation();

    // Also prevent any click event from bubbling up
    if (event.type === 'mousedown') {
      const mousedownEvent = event as MouseEvent;
      // Create a one-time click event handler to stop propagation
      const clickHandler = (e: Event) => {
        e.stopPropagation();
        window.removeEventListener('click', clickHandler, true);
      };
      window.addEventListener('click', clickHandler, true);
    }

    // Prevent starting a drag if we're in table add mode
    if (this.toolStore.activeTool === ToolType.RoundTable || this.toolStore.activeTool === ToolType.RectangleTable || this.toolStore.activeTool === ToolType.SeatingRow) {
      return;
    }

    // Only handle supported table types
    if (table.type !== 'roundTable' && table.type !== 'rectangleTable' && table.type !== 'seatingRow') {
      return;
    }

    // Select the table if not already selected
    if (!this.selectionStore.isItemSelected(table.id)) {
      this.selectionStore.selectItem(table);
    }
  }

  // Handle wheel events for zoom in viewer mode
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.viewerStore.isViewerMode) {
      // Allow zooming in viewer mode
      event.preventDefault();
      const zoomAmount = event.deltaY > 0 ? -5 : 5;
      this.store.adjustZoom(zoomAmount);
    }
  }

  // Helper method to convert viewport coordinates to grid coordinates
  private getGridCoordinates(event: MouseEvent): { x: number, y: number } {
    if (!this.gridContainerRef) {
      return { x: 0, y: 0 };
    }

    // Get the grid container's position in the viewport
    const containerRect = this.gridContainerRef.nativeElement.getBoundingClientRect();

    // Calculate the mouse position relative to the container
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;

    // Account for pan offset and zoom level to get grid coordinates
    const gridX = (relativeX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
    const gridY = (relativeY - this.store.panOffset.y) / (this.store.zoomLevel / 100);

    return { x: Math.round(gridX), y: Math.round(gridY) };
  }

  // SeatingRow drawing methods
  private startSeatingRowDrawing(x: number, y: number): void {
    this.isDrawingSeatingRow = true;
    this.drawingStartX = x;
    this.drawingStartY = y;
    this.drawingCurrentX = x;
    this.drawingCurrentY = y;
    
    // Create initial preview with fixed start position
    this.previewTable = {
      id: `row-preview-${Date.now()}`,
      type: 'seatingRow',
      x: x,
      y: y,
      endX: x + 30, // Start with small initial length
      endY: y,
      seatCount: 1,
      seatSpacing: 30,
      name: `Row ${this.layoutStore.elements.length + 1}`,
      rotation: 0,
      chairLabelVisible: true,
      rowLabelVisible: true
    };
  }

  private updateSeatingRowDrawing(x: number, y: number): void {
    if (!this.previewTable || this.previewTable.type !== 'seatingRow') return;
    
    // Calculate distance and angle from fixed start position
    const dx = x - this.drawingStartX;
    const dy = y - this.drawingStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update only the end position, keep start position fixed
    this.previewTable.endX = x;
    this.previewTable.endY = y;
    
    // Calculate seat count based on distance and spacing
    const seatSpacing = 30;
    const minSeats = 1;
    const seatCount = Math.max(minSeats, Math.floor(distance / seatSpacing) + 1);
    
    this.previewTable.seatCount = seatCount;
    this.previewTable.seatSpacing = seatSpacing;
  }

  private finishSeatingRowDrawing(): void {
    if (!this.previewTable || this.previewTable.type !== 'seatingRow') return;
    
    // Create the final seating row
    const newSeatingRow = {
      ...this.previewTable,
      id: `seatingrow-${Date.now()}`
    };

    // Add to layout using command pattern
    const addCmd = new AddObjectCommand(newSeatingRow);
    this.historyStore.executeCommand(addCmd);

    // Reset drawing state
    this.resetSeatingRowDrawing();
    
    // Deselect tool
    this.toolStore.setActiveTool(ToolType.None);
  }

  private resetSeatingRowDrawing(): void {
    this.isDrawingSeatingRow = false;
    this.drawingStartX = 0;
    this.drawingStartY = 0;
    this.drawingCurrentX = 0;
    this.drawingCurrentY = 0;
    this.previewTable = null;
  }

  // Helper methods for selection indicator dimensions
  getSelectionWidth(table: any): number {
    if (table.type === 'roundTable') {
      return table.radius * 2 + 80;
    } else if (table.type === 'seatingRow') {
      // Calculate based on seat count and spacing, plus label area
      const seatCount = table.seatCount || 5;
      const seatSpacing = table.seatSpacing || 30;
      const rowLength = (seatCount - 1) * seatSpacing + 20; // Actual row length
      return rowLength + 80; // Add equal padding on both sides
    } else {
      return table.width + 80;
    }
  }

  getSelectionHeight(table: any): number {
    if (table.type === 'roundTable') {
      return table.radius * 2 + 80;
    } else if (table.type === 'seatingRow') {
      return 60; // Smaller height for single row
    } else {
      return table.height + 80;
    }
  }

  getSelectionTransform(table: any): string {
    if (table.type === 'seatingRow') {
      // For seating rows, don't center - position from top-left
      return `rotate(${table.rotation || 0}deg)`;
    } else {
      // For round and rectangle tables, center and rotate
      return `translate(-50%, -50%) rotate(${table.rotation || 0}deg)`;
    }
  }

  getSelectionTransformOrigin(table: any): string {
    if (table.type === 'seatingRow') {
      return '50px 40px'; // Transform origin from left edge + padding
    } else {
      return 'center center';
    }
  }

  getSelectionLeft(table: any): number {
    if (table.type === 'seatingRow') {
      return table.x - 60; // Position to include label area with more padding
    } else {
      return table.x;
    }
  }

  getSelectionTop(table: any): number {
    if (table.type === 'seatingRow') {
      return table.y - 30; // Center vertically on the row
    } else {
      return table.y;
    }
  }
}