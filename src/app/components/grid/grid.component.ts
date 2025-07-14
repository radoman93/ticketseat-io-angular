import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnDestroy, OnInit } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableComponent } from '../round-table/round-table.component';
import { RectangleTableComponent } from '../rectangle-table/rectangle-table.component';
import { SeatingRowComponent } from '../seating-row/seating-row.component';
import { SegmentedSeatingRowComponent } from '../segmented-seating-row/segmented-seating-row.component';
import { ToolType } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { Selectable, RoundTableProperties, RectangleTableProperties, SeatingRowProperties, SegmentProperties } from '../../services/selection.service';
import { toolStore } from '../../stores/tool.store';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
// import { dragStore } from '../../stores/drag.store';
import { rootStore } from '../../stores/root.store';
import { autorun, IReactionDisposer } from 'mobx';
import { HistoryStore } from '../../stores/history.store';
import { AddObjectCommand } from '../../commands/add-object.command';
import { SegmentedSeatingRowService } from '../../services/segmented-seating-row.service';
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
    SegmentedSeatingRowComponent,
    CommonModule
  ],
  standalone: true,
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css'
})
export class GridComponent implements AfterViewInit, OnDestroy, OnInit {
  // Reference to our MobX stores
  store = gridStore;
  rootStore = rootStore;
  toolStore = toolStore;
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  // dragStore = dragStore;

  // Temporary stub for dragStore
  dragStore = {
    isDragging: false,
    potentialDragItem: null as any,
    draggedItem: null as any,
    justEndedDragging: false,
    startMouseX: 0,
    startMouseY: 0,
    prepareForDragging: (item: any, x: number, y: number) => { },
    startDragging: () => { },
    updateDragPosition: (x: number, y: number) => { },
    endDragging: (historyStore: any) => { },
  };
  viewerStore = viewerStore;

  // Make enum available in template
  ToolType = ToolType;

  // Preview table for add mode
  previewTable: TablePosition | null = null;

  // MobX reaction disposer for tool changes
  private toolChangeDisposer: IReactionDisposer | null = null;

  // Segmented seating row state (used for both regular and segmented rows)
  isCreatingSegmentedRow: boolean = false;
  isCreatingRegularRow: boolean = false; // Add separate state for regular row click-mode
  segmentedRowId: string = '';
  activeSegmentStartX: number = 0;
  activeSegmentStartY: number = 0;
  activeSegmentEndX: number = 0;
  activeSegmentEndY: number = 0;
  segmentedRowSegments: SegmentProperties[] = [];
  previewSegment: SegmentProperties | null = null;

  constructor(
    private historyStore: HistoryStore,
    private segmentedSeatingRowService: SegmentedSeatingRowService
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
        // Initialize preview seating row using segmented approach (1 segment max)
        this.segmentedRowId = `seatingrow-${Date.now()}`;
        this.segmentedRowSegments = [];
        this.isCreatingSegmentedRow = false;
        this.previewSegment = null;
        this.previewTable = {
          id: this.segmentedRowId,
          type: 'seatingRow',
          x: 0,
          y: 0,
          endX: 35,
          endY: 0,
          seatCount: 0,
          seatSpacing: 35,
          name: `Row ${this.layoutStore.elements.length + 1}`,
          rotation: 0,
          chairLabelVisible: true,
          rowLabelVisible: true,
          segments: [],
          totalSegments: 0,
          totalSeats: 0
        };

        // Reset seating row creation state
        this.isCreatingSegmentedRow = false;
        this.isCreatingRegularRow = false;
        this.activeSegmentStartX = 0;
        this.activeSegmentStartY = 0;
        this.activeSegmentEndX = 0;
        this.activeSegmentEndY = 0;
      } else if (activeTool === ToolType.SegmentedSeatingRow) {
        // Initialize segmented seating row state
        this.segmentedRowId = `segmented-row-${Date.now()}`;
        this.segmentedRowSegments = [];
        this.isCreatingSegmentedRow = false;
        this.previewSegment = null;
        this.previewTable = {
          id: this.segmentedRowId,
          type: 'segmentedSeatingRow',
          x: 0,
          y: 0,
          endX: 35,
          endY: 0,
          seatCount: 0,
          seatSpacing: 35,
          name: `Segmented Row ${this.layoutStore.elements.length + 1}`,
          rotation: 0,
          chairLabelVisible: true,
          rowLabelVisible: true,
          isSegmented: true,
          segments: [],
          totalSegments: 0,
          totalSeats: 0
        };
      } else {
        this.previewTable = null;
        this.previewSegment = null;
      }
    });

    // Register delete handler with MobX selection store
    this.selectionStore.registerDeleteHandler((item) => {
      this.layoutStore.deleteElement(item.id);
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.setCanvasSize();
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

  // Calculate selection indicator width for different table types
  getSelectionWidth(table: any): number {
    if (table.type === 'roundTable') {
      return table.radius * 2 + 80;
    } else if (table.type === 'seatingRow') {
      // Calculate width based on actual element positions including label
      const chairWidth = 20;
      const padding = 40; // Padding on each side
      const labelOffset = 60; // Row label is positioned 60px to the left
      
      // Calculate the full width from row label to last chair
      // Row label starts at -60 from table.x
      // Last chair ends at table.x + (seatCount - 1) * seatSpacing + chairWidth
      const labelToFirstChair = labelOffset;
      const chairsWidth = (table.seatCount - 1) * table.seatSpacing + chairWidth;
      
      // Total width: label offset + chairs width + padding on both sides
      return labelToFirstChair + chairsWidth + (padding * 2);
    } else {
      return table.width + 80;
    }
  }

  // Calculate selection indicator height for different table types
  getSelectionHeight(table: any): number {
    if (table.type === 'roundTable') {
      return table.radius * 2 + 80;
    } else if (table.type === 'seatingRow') {
      return 60;
    } else {
      return table.height + 80;
    }
  }

  // Calculate selection indicator left position
  getSelectionLeft(table: any): number {
    if (table.type === 'seatingRow') {
      // For seating rows, calculate the center position of where the selection box should be
      // Row label is at table.x - 60
      // First chair is at table.x
      // Last chair is at table.x + (seatCount - 1) * seatSpacing
      // Chair width is approximately 20px
      const chairWidth = 20;
      const padding = 40;
      const labelOffset = 60; // Row label is positioned 60px to the left
      
      const rowLabelX = table.x - labelOffset;
      const lastChairX = table.x + (table.seatCount - 1) * table.seatSpacing;
      
      // Selection box should start before the row label and end after last chair
      const selectionStartX = rowLabelX - padding;
      const selectionEndX = lastChairX + chairWidth + padding;
      
      // Return the center position (because transform translate(-50%, -50%) will center it)
      return (selectionStartX + selectionEndX) / 2;
    }
    return table.x;
  }

  // Calculate selection indicator top position
  getSelectionTop(table: any): number {
    return table.y;
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

      if (activeTool === ToolType.SeatingRow && this.previewTable) {
        // Regular row tool: click-to-start drawing mode
        const gridCoords = this.getGridCoordinates(event);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (!this.isCreatingRegularRow) {
          // First click: start drawing the row
          this.isCreatingRegularRow = true;
          this.segmentedRowId = `seatingrow-${Date.now()}`;
          this.segmentedRowSegments = [];
          this.activeSegmentStartX = x;
          this.activeSegmentStartY = y;
          this.activeSegmentEndX = x;
          this.activeSegmentEndY = y;

          // Create preview segment for regular row
          this.previewSegment = this.segmentedSeatingRowService.createSegment(
            this.segmentedRowId,
            0,
            x,
            y,
            x,
            y,
            35 // Default seat spacing
          );

        } else {
          // Second click: finish the row
          this.finalizeRegularRow();
        }

        event.preventDefault();
      } else if (activeTool === ToolType.SegmentedSeatingRow) {
        // Start or continue creating a segmented seating row
        const gridCoords = this.getGridCoordinates(event);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (!this.isCreatingSegmentedRow) {
          // Starting a new segmented row
          this.isCreatingSegmentedRow = true;
          this.activeSegmentStartX = x;
          this.activeSegmentStartY = y;
          this.activeSegmentEndX = x;
          this.activeSegmentEndY = y;

          // Create preview segment
          this.previewSegment = this.segmentedSeatingRowService.createSegment(
            this.segmentedRowId,
            0,
            x,
            y,
            x,
            y,
            35 // Default seat spacing
          );

        } else {
          // Continue with a new segment in the existing row
          // The previous segment end becomes this segment's start
          if (this.segmentedRowSegments.length > 0) {
            const lastSegment = this.segmentedRowSegments[this.segmentedRowSegments.length - 1];
            const nextStart = this.segmentedSeatingRowService.calculateNextSegmentStartPosition(lastSegment);

            this.activeSegmentStartX = nextStart.x;
            this.activeSegmentStartY = nextStart.y;
            this.activeSegmentEndX = x;
            this.activeSegmentEndY = y;

            // Create preview segment for the next segment
            this.previewSegment = this.segmentedSeatingRowService.createSegment(
              this.segmentedRowId,
              this.segmentedRowSegments.length,
              this.activeSegmentStartX,
              this.activeSegmentStartY,
              x,
              y,
              35 // Default seat spacing
            );

          } else {
            console.error('Expected segments array not to be empty');
          }
        }

        event.preventDefault();
      } else if ((activeTool === ToolType.RoundTable || activeTool === ToolType.RectangleTable) && this.previewTable) {
        // We're in add mode for round/rectangle tables, add a new table
        const gridCoords = this.getGridCoordinates(event);
        const newTable: TablePosition = {
          ...this.previewTable,
          id: `table-${Date.now()}`,
          x: gridCoords.x,
          y: gridCoords.y
        };

        // Add to layout and history
        const addCmd = new AddObjectCommand(newTable);
        this.historyStore.executeCommand(addCmd);

        // Deselect tool after placing
        this.toolStore.setActiveTool(ToolType.None);
      } else if (activeTool === ToolType.None) {
        // If no tool is selected, start panning with the left mouse button.
        this.store.startPanning(event.clientX, event.clientY);
        event.preventDefault();
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    // Update grid store mouse coordinates for any listeners
    this.store.setMousePosition(event.clientX, event.clientY);

    if (this.store.isPanning) {
      // Handle panning (allowed in both editor and viewer modes)
      this.store.pan(event.clientX, event.clientY);
      this.drawGrid();
    } else if (!this.viewerStore.isViewerMode) {
      // Only handle dragging and preview updates in editor mode
      if (this.dragStore.isDragging) {
        // Handle dragging an existing item
        this.dragStore.updateDragPosition(event.clientX, event.clientY);
      } else if (this.dragStore.potentialDragItem) {
        // If we have a potential drag item, check if we should start dragging
        const dx = event.clientX - this.dragStore.startMouseX;
        const dy = event.clientY - this.dragStore.startMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) { // Start dragging if mouse moved more than 5px
          this.dragStore.startDragging();
        }
      } else if (this.previewTable) {
        // Update position of preview object when in add mode
        const gridCoords = this.getGridCoordinates(event);
        const x = gridCoords.x;
        const y = gridCoords.y;

        // Always update preview position for non-creating mode
        if (!this.isCreatingSegmentedRow && !this.isCreatingRegularRow) {
          this.previewTable.x = x;
          this.previewTable.y = y;
        }

        if (this.isCreatingRegularRow && this.previewSegment) {
          // Update the end point of the regular row being created
          this.activeSegmentEndX = x;
          this.activeSegmentEndY = y;

          // Update the preview segment with the new end position
          const updatedSegment = this.segmentedSeatingRowService.updateSegmentEndPosition(
            this.previewSegment,
            x,
            y
          );


          // Apply updates to preview segment
          this.previewSegment = {
            ...this.previewSegment,
            ...updatedSegment
          };

          // Sync the updated seat count back to previewTable for mouseup handler
          if (this.previewTable && this.previewTable.type === 'seatingRow') {
            this.previewTable = {
              ...this.previewTable,
              seatCount: this.previewSegment.seatCount,
              endX: this.previewSegment.endX,
              endY: this.previewSegment.endY,
              rotation: this.previewSegment.rotation
            };
          }

        } else if (this.isCreatingSegmentedRow && this.previewSegment) {
          // Update the end point of the current segment being created
          this.activeSegmentEndX = x;
          this.activeSegmentEndY = y;

          // Update the preview segment with the new end position
          const updatedSegment = this.segmentedSeatingRowService.updateSegmentEndPosition(
            this.previewSegment,
            x,
            y
          );

          // Apply updates to preview segment
          this.previewSegment = {
            ...this.previewSegment,
            ...updatedSegment
          };
        }
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    // Stop panning on mouse up
    if (this.store.isPanning) {
      this.store.stopPanning();
    }

    if (this.toolStore.activeTool === ToolType.RoundTable && this.previewTable) {
      // Create a new round table at the preview position
      const newTable: RoundTableProperties = {
        ...this.previewTable as RoundTableProperties,
        id: `table-${Date.now()}`,
        tableLabelVisible: true,
        chairLabelVisible: true
      };
      this.layoutStore.addElement(newTable);
    } else if (this.toolStore.activeTool === ToolType.RectangleTable && this.previewTable) {
      // Create a new rectangle table at the preview position
      const newTable: RectangleTableProperties = {
        ...this.previewTable as RectangleTableProperties,
        id: `table-${Date.now()}`,
        tableLabelVisible: true,
        chairLabelVisible: true
      };
      this.layoutStore.addElement(newTable);
    } else if (this.toolStore.activeTool === ToolType.SeatingRow && this.previewTable) {
      // Create a new seating row at the preview position

      const seatingRowData = this.previewTable as SeatingRowProperties;

      // Safety validation: ensure seatCount > 0
      if (!seatingRowData.seatCount || seatingRowData.seatCount <= 0) {
        console.warn('Cannot create seating row with 0 or invalid seat count:', seatingRowData.seatCount);
        return;
      }

      const newRow: SeatingRowProperties = {
        ...seatingRowData,
        id: `seating-row-${Date.now()}`,
        chairLabelVisible: true,
        rowLabelVisible: true
      };
      this.layoutStore.addElement(newRow);

      // Deselect tool after creating seating row
      this.toolStore.setActiveTool(ToolType.None);
    } else if (event.button === 1) {
      // End panning on middle mouse release
      this.store.stopPanning();
    } else if (event.button === 0) {
      // End dragging if in drag mode
      if (this.dragStore.isDragging) {
        this.dragStore.endDragging(this.historyStore);
      } else if (this.dragStore.potentialDragItem) {
        // If we were potentially dragging but didn't move enough, clear it
        this.dragStore.potentialDragItem = null;
      }
      // Complete segment of a segmented seating row OR regular seating row
      else if (this.isCreatingSegmentedRow && this.previewSegment) {
        // Add the current segment to our segments array
        this.segmentedRowSegments.push(this.previewSegment);

        // Check if this is a regular row (SeatingRow tool) - only allow 1 segment
        const isRegularRow = this.toolStore.activeTool === ToolType.SeatingRow;

        if (isRegularRow) {
          // For regular rows, complete immediately after first segment
          this.finalizeSegmentedSeatingRowAsRegular();
        } else {
          // For segmented rows, continue with multi-segment logic
          // Update the segmented row in the preview
          if (this.previewTable && this.previewTable.type === 'segmentedSeatingRow') {
            // Calculate metrics for the segmented row
            const metrics = this.segmentedSeatingRowService.calculateSegmentedRowMetrics(this.segmentedRowSegments);

            // Update the preview table with the segments and metrics
            this.previewTable = {
              ...this.previewTable,
              segments: [...this.segmentedRowSegments],
              totalSegments: metrics.totalSegments,
              totalSeats: metrics.totalSeats
            };

            // Prepare for next segment
            if (this.segmentedRowSegments.length > 0) {
              const lastSegment = this.segmentedRowSegments[this.segmentedRowSegments.length - 1];
              const nextStart = this.segmentedSeatingRowService.calculateNextSegmentStartPosition(lastSegment);

              this.activeSegmentStartX = nextStart.x;
              this.activeSegmentStartY = nextStart.y;

              // Calculate direction from the last segment
              const dx = lastSegment.endX - lastSegment.startX;
              const dy = lastSegment.endY - lastSegment.startY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Use the exact chair spacing from the previous segment for consistency
              const seatSpacing = lastSegment.seatSpacing;

              // Position the initial endpoint exactly one chair spacing away in the same direction
              const dirX = distance > 0 ? dx / distance : 0;
              const dirY = distance > 0 ? dy / distance : 0;

              const previewEndX = nextStart.x + (dirX * seatSpacing);
              const previewEndY = nextStart.y + (dirY * seatSpacing);

              this.previewSegment = this.segmentedSeatingRowService.createSegment(
                this.segmentedRowId,
                this.segmentedRowSegments.length,
                nextStart.x,
                nextStart.y,
                previewEndX,
                previewEndY,
                seatSpacing
              );
            }
          }
        }
      }
    }
  }

  // Handle double-click to complete segmented seating row
  @HostListener('dblclick', ['$event'])
  onDoubleClick(event: MouseEvent): void {
    if (this.isCreatingSegmentedRow && this.segmentedRowSegments.length > 0) {
      this.finalizeSegmentedSeatingRow();
    }
  }

  // Handle ESC key to cancel or complete operations
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isCreatingSegmentedRow) {
      if (this.segmentedRowSegments.length > 0) {
        // Complete the segmented row if we have segments
        this.finalizeSegmentedSeatingRow();
      } else {
        // Cancel segmented row creation if no segments yet
        this.cancelSegmentedSeatingRow();
      }
    } else if (this.isCreatingRegularRow) {
      // Cancel regular row creation
      this.cancelRegularRow();
    }
  }

  // Finalize and add the segmented seating row to the layout
  private finalizeSegmentedSeatingRow(): void {
    if (this.segmentedRowSegments.length === 0) {
      return;
    }


    // Calculate metrics for the final row
    const metrics = this.segmentedSeatingRowService.calculateSegmentedRowMetrics(this.segmentedRowSegments);

    // Create the final segmented seating row
    const newSegmentedRow = {
      id: this.segmentedRowId,
      type: 'segmentedSeatingRow',
      x: this.segmentedRowSegments[0].startX,
      y: this.segmentedRowSegments[0].startY,
      endX: this.segmentedRowSegments[0].endX,
      endY: this.segmentedRowSegments[0].endY,
      seatCount: metrics.totalSeats,
      seatSpacing: 35,
      name: `Segmented Row ${this.layoutStore.elements.length + 1}`,
      rotation: 0,
      chairLabelVisible: true,
      rowLabelVisible: true,
      isSegmented: true,
      segments: [...this.segmentedRowSegments],
      totalSegments: metrics.totalSegments,
      totalSeats: metrics.totalSeats
    };

    // Add to layout and history
    const addCmd = new AddObjectCommand(newSegmentedRow);
    this.historyStore.executeCommand(addCmd);

    // Reset state
    this.resetSegmentedSeatingRowState();

    // Deselect tool after finalizing
    this.toolStore.setActiveTool(ToolType.None);
  }

  // Cancel segmented seating row creation
  private cancelSegmentedSeatingRow(): void {
    this.resetSegmentedSeatingRowState();
  }

  // Reset segmented seating row state
  private resetSegmentedSeatingRowState(): void {
    this.isCreatingSegmentedRow = false;
    this.isCreatingRegularRow = false;
    this.activeSegmentStartX = 0;
    this.activeSegmentStartY = 0;
    this.activeSegmentEndX = 0;
    this.activeSegmentEndY = 0;
    this.segmentedRowSegments = [];
    this.previewSegment = null;
    this.segmentedRowId = `segmented-row-${Date.now()}`;

    // Reset preview table
    if (this.toolStore.activeTool === ToolType.SegmentedSeatingRow) {
      this.previewTable = {
        id: this.segmentedRowId,
        type: 'segmentedSeatingRow',
        x: 0,
        y: 0,
        endX: 35,
        endY: 0,
        seatCount: 0,
        seatSpacing: 35,
        name: `Segmented Row ${this.layoutStore.elements.length + 1}`,
        rotation: 0,
        chairLabelVisible: true,
        rowLabelVisible: true,
        isSegmented: true,
        segments: [],
        totalSegments: 0,
        totalSeats: 0
      };
    }
  }

  // Handle table selection and start dragging
  selectTable(table: TablePosition, event: Event): void {
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

    // Disable all table manipulation in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }

    // Deselect any selected chairs when selecting a table
    this.rootStore.chairStore.deselectChair();

    // Set table as selected
    this.selectionStore.selectItem(table);

    // Get the mouse event if available
    const mouseEvent = event as MouseEvent;
    if (mouseEvent && mouseEvent.clientX && mouseEvent.clientY) {
      // Only prepare for dragging by setting the potential drag item
      this.dragStore.prepareForDragging(
        table,
        mouseEvent.clientX,
        mouseEvent.clientY
      );
    }
  }

  // Handle canvas click to deselect
  handleCanvasClick(): void {
    // Only deselect if we're not in the middle of a drag operation
    // and not immediately after completing a drag
    if (!this.dragStore.isDragging && !this.dragStore.justEndedDragging) {
      this.selectionStore.deselectItem();
      // Clear any reference to the previously dragged item
      this.dragStore.draggedItem = null;

      // Also deselect any selected chairs
      this.rootStore.chairStore.deselectChair();
    }
  }

  // Delete a table by ID
  deleteTable(id: string): boolean {
    this.layoutStore.deleteElement(id);
    return true;
  }

  // Delete the currently selected table
  deleteSelectedTable(): boolean {
    const selectedItem = this.selectionStore.selectedItem;
    if (selectedItem && (selectedItem.type === 'roundTable' || selectedItem.type === 'rectangleTable' || selectedItem.type === 'seatingRow')) {
      this.layoutStore.deleteElement(selectedItem.id);
      this.selectionStore.deselectItem();
      return true;
    }
    return false;
  }

  // Handle keyboard events
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Disable keyboard shortcuts in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }

    // Delete key to remove selected table
    if (event.key === 'Delete' && this.selectionStore.hasSelection) {
      this.deleteSelectedTable();
      event.preventDefault();
    }

    // Escape key to cancel operations
    if (event.key === 'Escape') {
      if (this.isCreatingSegmentedRow) {
        this.isCreatingSegmentedRow = false;
        this.activeSegmentStartX = 0;
        this.activeSegmentStartY = 0;
        this.activeSegmentEndX = 0;
        this.activeSegmentEndY = 0;
      } else if (this.isCreatingRegularRow) {
        this.isCreatingRegularRow = false;
        this.activeSegmentStartX = 0;
        this.activeSegmentStartY = 0;
        this.activeSegmentEndX = 0;
        this.activeSegmentEndY = 0;
      }
      if (this.toolStore.activeTool !== ToolType.None) {
        this.toolStore.setActiveTool(ToolType.None);
      }
    }
  }

  // Handle regular seating row completion
  private finalizeRegularRow(): void {


    if (this.previewSegment) {
      // Calculate the seat count based on the segment length and spacing
      const segmentLength = Math.sqrt(
        Math.pow(this.activeSegmentEndX - this.activeSegmentStartX, 2) +
        Math.pow(this.activeSegmentEndY - this.activeSegmentStartY, 2)
      );
      const seatCount = Math.max(1, Math.floor(segmentLength / this.previewSegment.seatSpacing) + 1);

      // Create the regular seating row
      const newSeatingRow = {
        id: this.segmentedRowId,
        type: 'seatingRow',
        x: this.activeSegmentStartX,
        y: this.activeSegmentStartY,
        endX: this.activeSegmentEndX,
        endY: this.activeSegmentEndY,
        seatCount: seatCount,
        seatSpacing: this.previewSegment.seatSpacing,
        name: `Row ${this.layoutStore.elements.length + 1}`,
        rotation: this.previewSegment.rotation,
        chairLabelVisible: true,
        rowLabelVisible: true
      };

      // Add to layout and history
      const addCmd = new AddObjectCommand(newSeatingRow);
      this.historyStore.executeCommand(addCmd);

      // Reset regular row state
      this.isCreatingRegularRow = false;
      this.previewSegment = null;
      this.segmentedRowSegments = [];

      // Deselect tool after finalizing
      this.toolStore.setActiveTool(ToolType.None);
    }
  }

  // Handle regular seating row completion
  private finalizeSegmentedSeatingRowAsRegular(): void {
    this.finalizeSegmentedSeatingRow();
  }

  // Handle regular row creation cancellation
  private cancelRegularRow(): void {
    this.isCreatingRegularRow = false;
    this.previewSegment = null;
    this.segmentedRowSegments = [];
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

    // Convert viewport coordinates to container coordinates
    const containerX = event.clientX - containerRect.left;
    const containerY = event.clientY - containerRect.top;

    // Apply inverse transformations: first undo pan offset, then undo zoom
    const zoomFactor = this.store.zoomLevel / 100;
    const x = (containerX - this.store.panOffset.x) / zoomFactor;
    const y = (containerY - this.store.panOffset.y) / zoomFactor;

    return { x, y };
  }
}