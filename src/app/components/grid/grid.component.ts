import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnDestroy, OnInit } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableComponent } from '../round-table/round-table.component';
import { RectangleTableComponent } from '../rectangle-table/rectangle-table.component';
import { SeatingRowComponent } from '../seating-row/seating-row.component';
import { SegmentedSeatingRowComponent } from '../segmented-seating-row/segmented-seating-row.component';
import { LineComponent } from '../line/line.component';
import { ToolType } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { Selectable, RoundTableProperties, RectangleTableProperties, SeatingRowProperties, SegmentProperties, LineProperties, PolygonProperties } from '../../services/selection.service';
import { toolStore } from '../../stores/tool.store';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { dragStore } from '../../stores/drag.store';
import { rootStore } from '../../stores/root.store';
import { autorun, IReactionDisposer } from 'mobx';
import { HistoryStore } from '../../stores/history.store';
import { AddObjectCommand } from '../../commands/add-object.command';
import { SegmentedSeatingRowService } from '../../services/segmented-seating-row.service';
import { LineService } from '../../services/line.service';
import { RotateObjectCommand } from '../../commands/rotate-object.command';
import { rotationStore } from '../../stores';
import viewerStore from '../../stores/viewer.store';
import { PolygonComponent } from '../polygon/polygon.component';
import { PolygonService } from '../../services/polygon.service';

// Use union type for table positions  
type TablePosition = RoundTableProperties | RectangleTableProperties | SeatingRowProperties | LineProperties | PolygonProperties;

@Component({
  selector: 'app-grid',
  imports: [
    MobxAngularModule, 
    RoundTableComponent, 
    RectangleTableComponent, 
    SeatingRowComponent, 
    SegmentedSeatingRowComponent, 
    LineComponent,
    PolygonComponent,
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
  dragStore = dragStore;
  viewerStore = viewerStore;
  
  // Make enum available in template
  ToolType = ToolType;
  
  // Preview table for add mode
  previewTable: TablePosition | null = null;
  
  // MobX reaction disposer for tool changes
  private toolChangeDisposer: IReactionDisposer | null = null;

  // Rotation state
  isRotating: boolean = false;
  rotatingItem: TablePosition | null = null;
  originalRotatingItem: TablePosition | null = null;
  rotationItemCenter: { x: number, y: number } = { x: 0, y: 0 };
  initialMouseAngleForRotation: number = 0;
  originalItemRotationValue: number = 0;

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

  // Line drawing state
  isCreatingLine: boolean = false;
  previewLine: LineProperties | null = null;

  // Polygon drawing state
  isCreatingPolygon: boolean = false;
  previewPolygon: PolygonProperties | null = null;

  constructor(
    private historyStore: HistoryStore,
    private segmentedSeatingRowService: SegmentedSeatingRowService,
    private lineService: LineService,
    private polygonService: PolygonService
  ) {}

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gridContainer') gridContainerRef!: ElementRef<HTMLDivElement>;
  private ctx!: CanvasRenderingContext2D;

  ngOnInit(): void {
    // Use MobX autorun to react to tool changes
    this.toolChangeDisposer = autorun(() => {
      const activeTool = this.toolStore.activeTool;
      const previousTool = this.toolStore.previousTool;
      
      // Check if we're switching away from the Polygon tool
      if (previousTool === ToolType.Polygon && activeTool !== ToolType.Polygon) {
        // Auto-complete the polygon if it exists and has at least 3 points
        this.autoCompletePolygon();
      }

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
          rotation: 0
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
          rotation: 0
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
      } else if (activeTool === ToolType.Line) {
        this.previewTable = null;
        this.previewSegment = null;
        this.previewLine = null;
        this.isCreatingLine = false;
      } else if (activeTool === ToolType.Polygon) {
        this.previewTable = null;
        this.previewSegment = null;
        this.previewLine = null;
        this.previewPolygon = null;
        this.isCreatingPolygon = false;
      } else {
        this.previewTable = null;
        this.previewSegment = null;
        this.previewLine = null;
        this.isCreatingLine = false;
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
    if (this.isRotating) return; // Already handling rotation, ignore other mousedown events

    // Disable all table manipulation and creation in viewer mode
    if (this.viewerStore.isViewerMode) {
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
        const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
        const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
        
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
          
          console.log('Starting regular row drawing mode at', x, y);
        } else {
          // Second click: finish the row
          this.finalizeRegularRow();
        }
        
        event.preventDefault();
      } else if (activeTool === ToolType.SegmentedSeatingRow) {
        // Start or continue creating a segmented seating row
        const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
        const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
        
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
          
          console.log('Starting new segmented row with first segment at', x, y);
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
            
            console.log('Starting new segment in existing row from', 
                      this.activeSegmentStartX, this.activeSegmentStartY, 
                      'to', x, y);
          } else {
            console.error('Expected segments array not to be empty');
          }
        }
        
        event.preventDefault();
      } else if ((activeTool === ToolType.RoundTable || activeTool === ToolType.RectangleTable) && this.previewTable) {
        // We're in add mode for round/rectangle tables, add a new table
        const newTable: TablePosition = {
          ...this.previewTable,
          id: `table-${Date.now()}`,
          x: (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100),
          y: (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100)
        };

        // Add to layout and history
        const addCmd = new AddObjectCommand(newTable);
        this.historyStore.executeCommand(addCmd);

        // Deselect tool after placing
        this.toolStore.setActiveTool(ToolType.None);
      } else if (activeTool === ToolType.Line) {
        // Line tool: click to add points, double-click to finish
        const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
        const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
        
        if (!this.isCreatingLine) {
          // First click: start creating a line with two points (start point and current mouse position)
          this.isCreatingLine = true;
          this.previewLine = this.lineService.createLine(x, y);
          // Add a second point immediately so we can see the line
          this.previewLine = this.lineService.addPoint(this.previewLine, x, y);
          console.log('Starting line creation at', x, y);
        } else if (this.previewLine) {
          // Subsequent clicks: add points to the line
          this.previewLine = this.lineService.addPoint(this.previewLine, x, y);
          console.log('Added point to line at', x, y);
        }
        
        event.preventDefault();
      } else if (activeTool === ToolType.Polygon) {
        const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
        const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
        
        if (!this.isCreatingPolygon) {
          // First click: start creating a polygon
          this.isCreatingPolygon = true;
          this.previewPolygon = this.polygonService.createPolygon(x, y);
          console.log('Starting polygon creation at', x, y, 'polygon:', this.previewPolygon);
        } else if (this.previewPolygon) {
          // Subsequent clicks: add points to the polygon
          const originalPolygon = this.previewPolygon;
          this.previewPolygon = this.polygonService.addPoint(this.previewPolygon, x, y);
          
          // Check if the polygon was just closed
          if (!originalPolygon.closed && this.previewPolygon.closed) {
            console.log('Polygon was closed via snapping, finalizing...');
            this.finalizePolygon();
          } else {
            console.log('Added point to polygon at', x, y, 'total points:', this.previewPolygon.points.length);
          }
        }
        
        event.preventDefault();
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    // Update grid store mouse coordinates for any listeners
    this.store.setMousePosition(event.clientX, event.clientY);

    if (this.store.isPanning) {
      // Handle panning
      this.store.pan(event.clientX, event.clientY);
      this.drawGrid();
    } else if (this.isRotating && this.rotatingItem) {
      // Handle rotation of selected item
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      // Calculate angle between center and current mouse position
      const dx = x - this.rotationItemCenter.x;
      const dy = y - this.rotationItemCenter.y;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate angle difference and apply to original rotation
      let newRotation = this.originalItemRotationValue + (currentAngle - this.initialMouseAngleForRotation);
      
      // Snap to 15-degree increments if Shift key is pressed
      if (event.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      
      // Update rotation in store
      if (this.rotatingItem?.type === 'segmentedSeatingRow' && this.originalRotatingItem?.segments) {
        // For segmented rows, we need to rotate each segment around the center point
        const segmentedRow = this.layoutStore.elements.find(el => el.id === this.rotatingItem?.id);
        if (segmentedRow && segmentedRow.segments) {
          // Calculate rotation difference from the original rotation
          const rotationDiff = newRotation - this.originalItemRotationValue;
          const angleInRadians = rotationDiff * (Math.PI / 180);

          // Get original segments to avoid cumulative rotation errors
          const originalSegments = this.originalRotatingItem.segments;
          
          // Rotate each segment's start and end points around the center
          const updatedSegments = originalSegments.map((segment: SegmentProperties) => {
            // Rotate start point
            const startDx = segment.startX - this.rotationItemCenter.x;
            const startDy = segment.startY - this.rotationItemCenter.y;
            const newStartX = this.rotationItemCenter.x + startDx * Math.cos(angleInRadians) - startDy * Math.sin(angleInRadians);
            const newStartY = this.rotationItemCenter.y + startDx * Math.sin(angleInRadians) + startDy * Math.cos(angleInRadians);
            
            // Rotate end point
            const endDx = segment.endX - this.rotationItemCenter.x;
            const endDy = segment.endY - this.rotationItemCenter.y;
            const newEndX = this.rotationItemCenter.x + endDx * Math.cos(angleInRadians) - endDy * Math.sin(angleInRadians);
            const newEndY = this.rotationItemCenter.y + endDx * Math.sin(angleInRadians) + endDy * Math.cos(angleInRadians);

            // Calculate new segment rotation
            const originalSegmentRotation = Math.atan2(segment.endY - segment.startY, segment.endX - segment.startX) * (180 / Math.PI);
            const newSegmentRotation = originalSegmentRotation + rotationDiff;
            
            return {
              ...segment,
              startX: newStartX,
              startY: newStartY,
              endX: newEndX,
              endY: newEndY,
              rotation: newSegmentRotation
            };
          });
          
          // Update the segmented row with new segment positions and rotation
          if(this.rotatingItem) {
            this.layoutStore.updateElement(this.rotatingItem.id, {
              rotation: newRotation,
              segments: updatedSegments
            });
          }
        }
      } else if (this.rotatingItem) {
        // For other elements, just update the rotation
        this.layoutStore.updateElement(this.rotatingItem.id, { rotation: newRotation });
      }
    } else if (this.dragStore.isDragging) {
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
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
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
        
        // console.log('Updated regular row preview segment:', this.previewSegment);
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
        
        console.log('Updated preview segment:', this.previewSegment);
      }
    } else if (this.isCreatingLine && this.previewLine) {
      // Update the last point of the line being created for live preview
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      this.previewLine = this.lineService.updateLastPoint(this.previewLine, x, y);
    } else if (this.isCreatingPolygon && this.previewPolygon) {
      // Update the last point of the polygon being created for live preview
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      // If the polygon only has one point, add a second point for the preview
      if (this.previewPolygon.points.length === 1) {
        this.previewPolygon.points.push({x, y});
      } else {
        // Update the last point position for preview
        const wasClosedBefore = this.previewPolygon.closed;
        this.previewPolygon = this.polygonService.updateLastPoint(this.previewPolygon, x, y);
        
        // Check if the polygon was just closed by the mouse movement
        if (!wasClosedBefore && this.previewPolygon.closed && this.previewPolygon.points.length >= 3) {
          console.log('Polygon was closed via mouse movement, finalizing...');
          // Add a small delay to allow the visual feedback of closing before finalizing
          setTimeout(() => this.finalizePolygon(), 200);
        }
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 1) {
      // End panning on middle mouse release
      this.store.stopPanning();
    } else if (event.button === 0) {
      // End rotation if in rotation mode
      if (this.isRotating) {
        if (this.rotatingItem && this.originalRotatingItem) {
          const oldState = {
            rotation: this.originalRotatingItem.rotation || 0,
            segments: this.originalRotatingItem.segments
          };
          const newState = {
            rotation: this.rotatingItem.rotation || 0,
            segments: this.layoutStore.getElementById(this.rotatingItem.id)?.segments
          };
          
          // Only create a command if the rotation actually changed
          if (oldState.rotation !== newState.rotation) {
            const command = new RotateObjectCommand(this.rotatingItem.id, oldState, newState);
            this.historyStore.executeCommand(command);
          }
        }
        this.isRotating = false;
        this.rotatingItem = null;
        this.originalRotatingItem = null;
        rotationStore.endRotation();
      }
      // End dragging if in drag mode
      else if (this.dragStore.isDragging) {
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
            
            console.log('Added segment. Total segments:', metrics.totalSegments, 
                      'Total seats:', metrics.totalSeats);
            console.log('Current segments:', this.segmentedRowSegments);
            
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
              // This creates a consistent visual appearance for the preview
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
    } else if (this.isCreatingLine && this.previewLine && this.previewLine.points.length >= 2) {
      this.finalizeLine();
    } else if (this.isCreatingPolygon && this.previewPolygon && this.previewPolygon.points.length >= 3) {
      this.finalizePolygon();
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
    } else if (this.isCreatingLine) {
      // Cancel line creation
      this.cancelLine();
    } else if (this.isCreatingPolygon) {
      // Auto-complete the polygon if it has enough points, otherwise cancel
      if (this.previewPolygon && this.previewPolygon.points.length >= 3) {
        this.finalizePolygon();
      } else {
        // Cancel polygon creation
        this.cancelPolygon();
      }
    }
  }
  
  // Finalize and add the segmented seating row to the layout
  private finalizeSegmentedSeatingRow(): void {
    if (this.segmentedRowSegments.length === 0) {
      console.log('No segments to finalize');
      return;
    }
    
    console.log('Finalizing segmented seating row with', this.segmentedRowSegments.length, 'segments');
    
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
    console.log('Canceling segmented seating row creation');
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
      } else if (this.isCreatingLine) {
        this.isCreatingLine = false;
        this.previewLine = null;
      } else if (this.isCreatingPolygon) {
        // Auto-complete the polygon if it has enough points, otherwise cancel
        if (this.previewPolygon && this.previewPolygon.points.length >= 3) {
          this.finalizePolygon();
        } else {
          this.isCreatingPolygon = false;
          this.previewPolygon = null;
        }
      }
      if (this.toolStore.activeTool !== ToolType.None) {
        this.toolStore.setActiveTool(ToolType.None);
      }
    }
  }

  // Start rotating an item
  startRotate(item: TablePosition, event: MouseEvent): void {
    event.stopPropagation();
    
    // Disable rotation in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }
    
    this.isRotating = true;
    this.rotatingItem = item;
    this.originalRotatingItem = JSON.parse(JSON.stringify(item)); // Deep copy
    this.originalItemRotationValue = item.rotation || 0;
    
    // Store original position for rotation reference
    this.activeSegmentStartX = item.x;
    this.activeSegmentStartY = item.y;

    // Calculate center point based on item type
    if (item.type === 'segmentedSeatingRow') {
      // Get the segmented row component reference
      const segmentedRow = this.layoutStore.elements.find(el => el.id === item.id);
      if (segmentedRow && segmentedRow.segments) {
        // Calculate center from all segments
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const segments: SegmentProperties[] = segmentedRow.segments;
        segments.forEach((segment: SegmentProperties) => {
          minX = Math.min(minX, segment.startX, segment.endX);
          minY = Math.min(minY, segment.startY, segment.endY);
          maxX = Math.max(maxX, segment.startX, segment.endX);
          maxY = Math.max(maxY, segment.startY, segment.endY);
        });
        
        this.rotationItemCenter = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        };
        rotationStore.startRotation(this.rotationItemCenter);
      }
    } else {
      // For other items, use their center point
      this.rotationItemCenter = {
        x: item.x,
        y: item.y
      };
    }
    
    // Calculate initial angle between center and mouse position
    const mouseX = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
    const mouseY = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
    const dx = mouseX - this.rotationItemCenter.x;
    const dy = mouseY - this.rotationItemCenter.y;
    this.initialMouseAngleForRotation = Math.atan2(dy, dx) * (180 / Math.PI);
  }

  // Handle zoom in button
  zoomIn(): void {
    this.store.adjustZoom(5);
  }
  
  // Handle zoom out button
  zoomOut(): void {
    this.store.adjustZoom(-5);
  }

  // Handle regular seating row completion
  private finalizeRegularRow(): void {
    console.log('Finalizing regular seating row');
    
    if (this.previewSegment) {
      // Add the current segment to our segments array
      this.segmentedRowSegments.push(this.previewSegment);
      
      // Complete the regular row immediately
      this.finalizeSegmentedSeatingRow();
      
      // Reset regular row state
      this.isCreatingRegularRow = false;
      this.previewSegment = null;
      this.segmentedRowSegments = [];
    }
  }

  // Handle regular seating row completion
  private finalizeSegmentedSeatingRowAsRegular(): void {
    console.log('Finalizing regular seating row');
    this.finalizeSegmentedSeatingRow();
  }

  // Handle regular row creation cancellation
  private cancelRegularRow(): void {
    console.log('Canceling regular seating row creation');
    this.isCreatingRegularRow = false;
    this.previewSegment = null;
    this.segmentedRowSegments = [];
  }

  // Handle line completion
  private finalizeLine(): void {
    console.log('Finalizing line');
    
    if (this.previewLine && this.previewLine.points.length >= 2) {
      // Create the final line object
      const newLine: LineProperties = {
        ...this.previewLine,
        id: `line-${Date.now()}`,
        name: `Line ${this.layoutStore.elements.length + 1}`
      };
      
      // Add to layout and history
      const addCmd = new AddObjectCommand(newLine);
      this.historyStore.executeCommand(addCmd);
      
      console.log('Line added to layout:', newLine);
    }
    
    // Reset line creation state
    this.isCreatingLine = false;
    this.previewLine = null;
    
    // Deselect tool after finalizing
    this.toolStore.setActiveTool(ToolType.None);
  }

  // Handle line cancellation
  private cancelLine(): void {
    console.log('Canceling line creation');
    this.isCreatingLine = false;
    this.previewLine = null;
  }

  // Handle line selection
  selectLine(line: LineProperties, event?: MouseEvent): void {
    console.log('SelectLine called with', line);
    
    // Prevent starting a drag if we're in line creation mode
    if (this.toolStore.activeTool === ToolType.Line) {
      return;
    }
    
    // Disable all line manipulation in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }
    
    // Deselect any selected chairs when selecting a line
    this.rootStore.chairStore.deselectChair();
    
    // Set line as selected
    this.selectionStore.selectItem(line);
    
    // Get the mouse event if available for drag preparation
    if (event && event.clientX && event.clientY) {
      // Only prepare for dragging by setting the potential drag item
      this.dragStore.prepareForDragging(
        line, 
        event.clientX, 
        event.clientY
      );
    }
  }

  // Handle line rotation start
  startLineRotate(event: { line: LineProperties, event: MouseEvent }): void {
    event.event.stopPropagation();
    
    // Disable rotation in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }
    
    this.startRotate(event.line, event.event);
  }

  // Handle polygon completion
  private finalizePolygon(): void {
    if (!this.previewPolygon || this.previewPolygon.points.length < 3) {
      console.log('Not enough points to create polygon');
      return;
    }

    console.log('Finalizing polygon with', this.previewPolygon.points.length, 'points');

    // Create the final polygon
    const newPolygon = {
      ...this.previewPolygon,
      id: `polygon-${Date.now()}`
    };

    // Add to layout and history
    const addCmd = new AddObjectCommand(newPolygon);
    this.historyStore.executeCommand(addCmd);

    // Reset state
    this.isCreatingPolygon = false;
    this.previewPolygon = null;

    // Deselect tool after finalizing
    this.toolStore.setActiveTool(ToolType.None);
  }

  // Handle polygon cancellation
  private cancelPolygon(): void {
    console.log('Canceling polygon creation');
    this.isCreatingPolygon = false;
    this.previewPolygon = null;
  }

  // Handle polygon selection
  selectPolygon(polygon: PolygonProperties, event?: MouseEvent): void {
    console.log('SelectPolygon called with', polygon);
    
    // Prevent starting a drag if we're in polygon creation mode
    if (this.toolStore.activeTool === ToolType.Polygon) {
      return;
    }
    
    // Disable all polygon manipulation in viewer mode
    if (this.viewerStore.isViewerMode) {
      return;
    }
    
    // Deselect any selected chairs when selecting a polygon
    this.rootStore.chairStore.deselectChair();
    
    // Set polygon as selected
    this.selectionStore.selectItem(polygon);
    
    // Get the mouse event if available for drag preparation
    if (event && event.clientX && event.clientY) {
      // Only prepare for dragging by setting the potential drag item
      this.dragStore.prepareForDragging(
        polygon, 
        event.clientX, 
        event.clientY
      );
    }
  }

  // Handle polygon auto-completion
  private autoCompletePolygon(): void {
    if (this.isCreatingPolygon && this.previewPolygon && this.previewPolygon.points.length >= 3) {
      console.log('Auto-completing polygon');
      this.finalizePolygon();
    }
  }
} 