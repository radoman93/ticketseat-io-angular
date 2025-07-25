import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableComponent } from '../round-table/round-table.component';
import { RectangleTableComponent } from '../rectangle-table/rectangle-table.component';
import { SeatingRowComponent } from '../seating-row/seating-row.component';
import { SegmentedSeatingRowComponent } from '../segmented-seating-row/segmented-seating-row.component';
import { LineComponent } from '../line/line.component';
import { PolygonComponent } from '../polygon/polygon.component';
import { TextComponent } from '../text/text.component';
import { ToolType } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { Selectable, RoundTableProperties, RectangleTableProperties, SeatingRowProperties, SegmentProperties } from '../../services/selection.service';
import { LineElement, PolygonElement, TextElement } from '../../models/elements.model';
import { ElementType } from '../../models/layout.model';
import { toolStore } from '../../stores/tool.store';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { dragStore } from '../../stores/drag.store';
import { snappingStore } from '../../stores/snapping.store';
import { rootStore } from '../../stores/root.store';
import { HistoryStore } from '../../stores/history.store';
import { AddObjectCommand } from '../../commands/add-object.command';
import { SegmentedSeatingRowService } from '../../services/segmented-seating-row.service';
import viewerStore from '../../stores/viewer.store';
import { LoggerService } from '../../services/logger.service';
import { CanvasSelectionRenderer, SelectionBox } from '../../services/canvas-selection-renderer.service';
import { AlignmentGuideRenderer } from '../../services/alignment-guide-renderer.service';
import { ElementBoundsService } from '../../services/element-bounds.service';
import { MobXComponentBase } from '../../base/mobx-component.base';

// Use union type for table positions  
type TablePosition = RoundTableProperties | RectangleTableProperties | SeatingRowProperties | LineElement | PolygonElement | TextElement;

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
    TextComponent,
    CommonModule
  ],
  standalone: true,
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css'
})
export class GridComponent extends MobXComponentBase implements AfterViewInit, OnInit {
  // Reference to our MobX stores
  store = gridStore;
  rootStore = rootStore;
  toolStore = toolStore;
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  dragStore = dragStore;
  viewerStore = viewerStore;
  snappingStore = snappingStore;

  // Make enum available in template
  ToolType = ToolType;

  // Preview table for add mode
  previewTable: TablePosition | null = null;

  private previousTool: ToolType = ToolType.None;

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
  isDrawingLine: boolean = false;
  lineStartX: number = 0;
  lineStartY: number = 0;

  // Polygon drawing state
  isDrawingPolygon: boolean = false;
  polygonPoints: Array<{x: number, y: number}> = [];
  isHoveringStartPoint: boolean = false;

  constructor(
    private historyStore: HistoryStore,
    private segmentedSeatingRowService: SegmentedSeatingRowService,
    protected override logger: LoggerService,
    private canvasSelectionRenderer: CanvasSelectionRenderer,
    private alignmentGuideRenderer: AlignmentGuideRenderer,
    private elementBoundsService: ElementBoundsService
  ) { 
    super('GridComponent');
  }

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('selectionCanvas') selectionCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('alignmentCanvas') alignmentCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gridContainer') gridContainerRef!: ElementRef<HTMLDivElement>;
  private ctx!: CanvasRenderingContext2D;

  ngOnInit(): void {
    // Use managed MobX autorun to react to tool changes
    this.createAutorun(() => {
      const activeTool = this.toolStore.activeTool;
      
      // Only reset state when actually switching tools
      if (this.previousTool !== activeTool) {

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
      } else if (activeTool === ToolType.Line) {
        // Initialize line drawing state
        this.isDrawingLine = false;
        this.lineStartX = 0;
        this.lineStartY = 0;
        this.previewTable = null;
      } else if (activeTool === ToolType.Polygon) {
        // Initialize polygon drawing state
        this.isDrawingPolygon = false;
        this.polygonPoints = [];
        this.isHoveringStartPoint = false;
        this.previewTable = null;
      } else if (activeTool === ToolType.Text) {
        // Initialize text element preview
        this.previewTable = {
          id: `text-preview-${Date.now()}`,
          type: 'text',
          x: 0,
          y: 0,
          rotation: 0,
          text: 'Text Label',
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: '#000000',
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          padding: 4,
          name: `Text ${this.layoutStore.elements.length + 1}`
        } as TextElement;
      } else {
        this.previewTable = null;
        this.previewSegment = null;
        // Reset line drawing state when switching tools
        this.isDrawingLine = false;
        this.lineStartX = 0;
        this.lineStartY = 0;
        // Reset polygon drawing state when switching tools
        this.isDrawingPolygon = false;
        this.polygonPoints = [];
        this.isHoveringStartPoint = false;
      }
      
      // Update previous tool
      this.previousTool = activeTool;
      }
    }, 'tool-change-watcher');

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

    // Initialize selection canvas renderer
    this.initializeSelectionCanvas();

    // Initialize alignment guide renderer with a small delay to ensure canvas is ready
    setTimeout(() => {
      this.initializeAlignmentCanvas();
    }, 100);

    // Set up selection state watching
    this.setupSelectionWatcher();

    // Set up alignment guide watching
    this.setupAlignmentGuideWatcher();
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
    
    // Only draw the grid if showGrid is true
    if (!this.store.showGrid) return;

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

  // Get actual text element dimensions from DOM
  private getTextElementDimensions(textElement: any): { width: number, height: number } {
    try {
      // Find the text element using the specific data-text-id attribute
      if (textElement.id) {
        const textDiv = document.querySelector(`[data-text-id="${textElement.id}"]`) as HTMLElement;
        if (textDiv) {
          const rect = textDiv.getBoundingClientRect();
          // Only use DOM dimensions if they're reasonable (not zero or tiny)
          if (rect.width > 10 && rect.height > 5) {
            // Convert screen pixels back to logical grid units by accounting for current zoom
            const currentZoom = this.store.zoomLevel / 100;
            return {
              width: rect.width / currentZoom,
              height: rect.height / currentZoom
            };
          }
        }
      }
    } catch (error) {
      // Fallback to estimation if DOM query fails
    }
    
    // Fallback estimation
    const fontSize = textElement.fontSize || 14;
    const padding = (textElement.padding || 4) * 2;
    
    if (textElement.width && textElement.width > 0) {
      const lineHeight = fontSize * 1.2;
      const charWidth = fontSize * 0.6;
      const effectiveWidth = textElement.width - padding;
      const charsPerLine = Math.max(1, Math.floor(effectiveWidth / charWidth));
      const estimatedLines = Math.max(1, Math.ceil((textElement.text?.length || 0) / charsPerLine));
      
      return {
        width: textElement.width,
        height: (estimatedLines * lineHeight) + padding
      };
    } else {
      const estimatedWidth = Math.min((textElement.text?.length || 0) * fontSize * 0.6 + padding, 300);
      return {
        width: Math.max(estimatedWidth, 60),
        height: fontSize * 1.2 + padding
      };
    }
  }

  // Calculate selection indicator width for different table types
  getSelectionWidth(table: any): number {
    const bounds = this.elementBoundsService.getElementBounds(table);
    // Use visual bounds that include chairs and other visual elements
    const padding = 20; // Padding for selection box
    // No need to scale by zoom - the parent container handles scaling
    return bounds.visualRight - bounds.visualLeft + padding;
  }

  // Calculate selection indicator height for different table types
  getSelectionHeight(table: any): number {
    const bounds = this.elementBoundsService.getElementBounds(table);
    // Use visual bounds that include chairs and other visual elements
    const padding = 20; // Padding for selection box
    // No need to scale by zoom - the parent container handles scaling
    return bounds.visualBottom - bounds.visualTop + padding;
  }

  // Calculate selection indicator left position
  getSelectionLeft(table: any): number {
    const bounds = this.elementBoundsService.getElementBounds(table);
    // For center-based positioning with translate(-50%, -50%)
    // Return the center X coordinate
    return bounds.centerX;
  }

  // Calculate selection indicator top position
  getSelectionTop(table: any): number {
    const bounds = this.elementBoundsService.getElementBounds(table);
    // For center-based positioning with translate(-50%, -50%)
    // Return the center Y coordinate
    return bounds.centerY;
  }

  protected override onMobXDestroy(): void {
    // Unregister the callback when component is destroyed
    this.store.unregisterRedrawCallback(this.drawGrid.bind(this));

    // Cleanup canvas selection renderer
    if (this.canvasSelectionRenderer) {
      this.canvasSelectionRenderer.destroy();
    }

    this.logger.debug('GridComponent custom cleanup complete', {
      component: 'GridComponent',
      action: 'onMobXDestroy'
    });
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
            this.logger.error('Expected segments array not to be empty', new Error('Empty segments array'), { component: 'GridComponent', action: 'handleGridClick', activeTool: 'SegmentedSeatingRow' });
          }
        }

        event.preventDefault();
      } else if (activeTool === ToolType.Line) {
        // Handle line drawing with two clicks
        const gridCoords = this.getGridCoordinates(event);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (!this.isDrawingLine) {
          // First click: start drawing the line
          this.isDrawingLine = true;
          this.lineStartX = x;
          this.lineStartY = y;

          // Create preview line
          this.previewTable = {
            id: `line-preview-${Date.now()}`,
            type: 'line',
            x: x,
            y: y,
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            thickness: 2,
            color: '#000000',
            name: 'Line Preview'
          } as LineElement;

        } else {
          // Second click: finish the line
          this.finalizeLine();
        }

        event.preventDefault();
        event.stopPropagation();
      } else if (activeTool === ToolType.Polygon) {
        // Handle polygon drawing with multi-click
        const gridCoords = this.getGridCoordinates(event);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (!this.isDrawingPolygon) {
          // First click: start drawing the polygon
          this.isDrawingPolygon = true;
          this.polygonPoints = [{x, y}];

          // Create preview polygon
          this.previewTable = {
            id: `polygon-preview-${Date.now()}`,
            type: 'polygon',
            x: x,
            y: y,
            rotation: 0,
            points: [{x, y}],
            fillColor: '#0000ff',
            fillOpacity: 0.3,
            borderColor: '#000000',
            borderThickness: 2,
            showBorder: true,
            name: 'Polygon Preview'
          } as PolygonElement;

        } else {
          // Check if clicking near starting point to close polygon
          const startPoint = this.polygonPoints[0];
          const distanceToStart = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
          );

          if (distanceToStart <= 10 && this.polygonPoints.length >= 3) {
            // Close the polygon
            this.finalizePolygon();
          } else {
            // Add new point to polygon
            this.polygonPoints.push({x, y});
            
            // Update preview polygon
            if (this.previewTable && this.previewTable.type === 'polygon') {
              (this.previewTable as PolygonElement).points = [...this.polygonPoints];
            }
          }
        }

        event.preventDefault();
        event.stopPropagation();
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
      } else if (activeTool === ToolType.Text) {
        // We're in add mode for text elements, add a new text element
        const gridCoords = this.getGridCoordinates(event);
        const newTextElement: TextElement = {
          id: `text-${Date.now()}`,
          type: ElementType.TEXT,
          x: gridCoords.x,
          y: gridCoords.y,
          rotation: 0,
          text: 'Text Label',
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: '#000000',
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          padding: 4,
          name: `Text ${this.layoutStore.elements.length + 1}`
        };

        // Add to layout and history
        const addCmd = new AddObjectCommand(newTextElement);
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
        if (!this.isCreatingSegmentedRow && !this.isCreatingRegularRow && !this.isDrawingLine && !this.isDrawingPolygon) {
          this.previewTable.x = x;
          this.previewTable.y = y;

          // For line tool, also update the line coordinates to show preview
          if (this.previewTable.type === 'line') {
            const previewLine = this.previewTable as LineElement;
            previewLine.startX = x;
            previewLine.startY = y;
            previewLine.endX = x + 100; // Default length for preview
            previewLine.endY = y;
          }
        }

        // Handle line drawing preview (after first click)
        if (this.isDrawingLine && this.previewTable && this.previewTable.type === 'line') {
          // Update the end point of the line being drawn
          const linePreview = this.previewTable as LineElement;
          linePreview.endX = x;
          linePreview.endY = y;
        }

        // Handle polygon drawing preview (after first click)
        if (this.isDrawingPolygon && this.previewTable && this.previewTable.type === 'polygon') {
          // Check if hovering near starting point
          if (this.polygonPoints.length >= 3) {
            const startPoint = this.polygonPoints[0];
            const distanceToStart = Math.sqrt(
              Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
            );
            this.isHoveringStartPoint = distanceToStart <= 10;
          } else {
            this.isHoveringStartPoint = false;
          }

          // Update the preview polygon with current mouse position as next point
          const polygonPreview = this.previewTable as PolygonElement;
          const previewPoints = [...this.polygonPoints, {x, y}];
          polygonPreview.points = previewPoints;
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
    } else if (this.toolStore.activeTool === ToolType.SeatingRow && this.previewTable && !this.isCreatingRegularRow) {
      // Only create seating row if NOT in two-click drawing mode
      // This handles the old drag-to-create workflow (if it exists)
      
      const seatingRowData = this.previewTable as SeatingRowProperties;

      // Safety validation: ensure seatCount > 0
      if (!seatingRowData.seatCount || seatingRowData.seatCount <= 0) {
        this.logger.warn('Cannot create seating row with invalid seat count', { component: 'GridComponent', action: 'createSeatingRow', seatCount: seatingRowData.seatCount });
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
    } else if (this.isDrawingLine) {
      // Cancel line drawing
      this.cancelLineDrawing();
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
    if (this.toolStore.activeTool === ToolType.RoundTable || this.toolStore.activeTool === ToolType.RectangleTable || this.toolStore.activeTool === ToolType.SeatingRow || this.toolStore.activeTool === ToolType.Line || this.toolStore.activeTool === ToolType.Polygon || this.toolStore.activeTool === ToolType.Text) {
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
    // Don't deselect if we're drawing a line
    if (this.isDrawingLine) {
      return;
    }

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
    if (selectedItem && (selectedItem.type === 'roundTable' || selectedItem.type === 'rectangleTable' || selectedItem.type === 'seatingRow' || selectedItem.type === 'line' || selectedItem.type === 'polygon' || selectedItem.type === 'text')) {
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
      } else if (this.isDrawingPolygon) {
        // Cancel polygon drawing
        this.isDrawingPolygon = false;
        this.polygonPoints = [];
        this.isHoveringStartPoint = false;
        this.previewTable = null;
        event.preventDefault();
      } else if (this.isDrawingLine) {
        // Cancel line drawing
        this.isDrawingLine = false;
        this.previewTable = null;
        event.preventDefault();
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

  // Handle line drawing cancellation
  private cancelLineDrawing(): void {
    this.isDrawingLine = false;
    this.lineStartX = 0;
    this.lineStartY = 0;
    this.previewTable = null;
    // Reset tool to None
    this.toolStore.setActiveTool(ToolType.None);
  }

  // Finalize and add the line to the layout
  private finalizeLine(): void {
    if (this.previewTable && this.previewTable.type === 'line') {
      const linePreview = this.previewTable as LineElement;

      // Create the line element
      const newLine: LineElement = {
        id: `line-${Date.now()}`,
        type: ElementType.LINE,
        x: this.lineStartX,
        y: this.lineStartY,
        startX: this.lineStartX,
        startY: this.lineStartY,
        endX: linePreview.endX,
        endY: linePreview.endY,
        thickness: 2,
        color: '#000000',
        rotation: 0,
        name: `Line ${this.layoutStore.elements.length + 1}`
      };

      // Add to layout and history
      const addCmd = new AddObjectCommand(newLine);
      this.historyStore.executeCommand(addCmd);

      // Reset drawing state
      this.isDrawingLine = false;
      this.previewTable = null;
      this.toolStore.setActiveTool(ToolType.None);
    }
  }

  private finalizePolygon(): void {
    if (this.previewTable && this.previewTable.type === 'polygon' && this.polygonPoints.length >= 3) {
      // Calculate bounding box center for x, y position
      const minX = Math.min(...this.polygonPoints.map(p => p.x));
      const maxX = Math.max(...this.polygonPoints.map(p => p.x));
      const minY = Math.min(...this.polygonPoints.map(p => p.y));
      const maxY = Math.max(...this.polygonPoints.map(p => p.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Create the polygon element
      const newPolygon: PolygonElement = {
        id: `polygon-${Date.now()}`,
        type: ElementType.POLYGON,
        x: centerX,
        y: centerY,
        rotation: 0,
        points: [...this.polygonPoints],
        fillColor: '#0000ff',
        fillOpacity: 0.3,
        borderColor: '#000000',
        borderThickness: 2,
        showBorder: true,
        name: `Polygon ${this.layoutStore.elements.length + 1}`
      };

      // Add to layout and history
      const addCmd = new AddObjectCommand(newPolygon);
      this.historyStore.executeCommand(addCmd);

      // Reset drawing state
      this.isDrawingPolygon = false;
      this.polygonPoints = [];
      this.isHoveringStartPoint = false;
      this.previewTable = null;
      this.toolStore.setActiveTool(ToolType.None);
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


  // Helper methods for line preview
  getLinePreviewLength(): number {
    if (!this.previewTable || this.previewTable.type !== 'line') return 0;
    const line = this.previewTable as any;
    const dx = line.endX - line.startX;
    const dy = line.endY - line.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getLinePreviewAngle(): number {
    if (!this.previewTable || this.previewTable.type !== 'line') return 0;
    const line = this.previewTable as any;
    const dx = line.endX - line.startX;
    const dy = line.endY - line.startY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
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

  /**
   * Initialize the selection canvas renderer
   */
  private initializeSelectionCanvas(): void {
    if (!this.selectionCanvasRef) return;

    const selectionCanvas = this.selectionCanvasRef.nativeElement;
    this.canvasSelectionRenderer.initializeCanvas(selectionCanvas);

    // Match canvas size to container
    this.updateSelectionCanvasSize();

    this.logger.debug('Selection canvas initialized', {
      component: 'GridComponent',
      action: 'initializeSelectionCanvas'
    });
  }

  /**
   * Update selection canvas size to match container
   */
  private updateSelectionCanvasSize(): void {
    if (this.selectionCanvasRef && this.gridContainerRef) {
      const container = this.gridContainerRef.nativeElement;
      this.canvasSelectionRenderer.resizeCanvas(container.clientWidth, container.clientHeight);
    }
  }

  /**
   * Set up MobX reactions to watch selection state changes
   */
  private setupSelectionWatcher(): void {
    // React to selection changes
    this.createAutorun(() => {
      this.updateCanvasSelections();
    }, 'selection-changes');

    // React to layout element changes (position, size, rotation)
    this.createAutorun(() => {
      // Watch layout store elements for changes
      this.layoutStore.elements.forEach(element => {
        // Access properties to make MobX track them
        element.x;
        element.y;
        element.rotation;
        if ('width' in element) element.width;
        if ('height' in element) element.height;
        if ('radius' in element) element.radius;
      });
      
      this.updateCanvasSelections();
    }, 'layout-element-changes');

    // React to grid transform changes (pan/zoom)
    this.createAutorun(() => {
      this.store.panOffset.x;
      this.store.panOffset.y;
      this.store.zoomLevel;
      
      this.updateCanvasSelections();
    }, 'grid-transform-changes');

    this.logger.debug('Selection watcher setup complete', {
      component: 'GridComponent',
      action: 'setupSelectionWatcher'
    });
  }

  /**
   * Update canvas selection boxes based on current selection state
   */
  private updateCanvasSelections(): void {
    if (!this.canvasSelectionRenderer || viewerStore.isViewerMode) {
      return;
    }

    const performanceTimer = this.logger.startTimer('update_canvas_selections', {
      component: 'GridComponent',
      action: 'updateCanvasSelections'
    });

    // Clear all existing selections
    this.canvasSelectionRenderer.clearSelections();

    // Add selection boxes for all selected elements
    this.layoutStore.elements.forEach(element => {
      if (selectionStore.isItemSelected(element.id)) {
        const selectionBox = this.calculateSelectionBox(element);
        if (selectionBox) {
          this.canvasSelectionRenderer.setSelection(element.id, selectionBox);
        }
      }
    });

    // Render updated selections
    this.canvasSelectionRenderer.render();

    performanceTimer();
  }

  /**
   * Calculate selection box geometry for an element
   */
  private calculateSelectionBox(element: any): SelectionBox | null {
    // Check cache first for performance
    const cached = this.canvasSelectionRenderer.getCachedGeometry(element.id);
    if (cached && this.isGeometryCurrent(element, cached)) {
      return cached;
    }

    // Apply grid transforms (pan/zoom) to coordinates
    const panX = this.store.panOffset.x;
    const panY = this.store.panOffset.y;
    const zoom = this.store.zoomLevel / 100;

    let box: SelectionBox | null = null;

    // Calculate geometry based on element type
    switch (element.type) {
      case 'roundTable':
        const roundBounds = this.elementBoundsService.getElementBounds(element);
        box = {
          id: element.id,
          x: (element.x * zoom) + panX,
          y: (element.y * zoom) + panY,
          width: (roundBounds.visualRight - roundBounds.visualLeft + 10) * zoom,
          height: (roundBounds.visualBottom - roundBounds.visualTop + 10) * zoom,
          rotation: element.rotation || 0,
          type: 'table'
        };
        break;

      case 'rectangleTable':
        const rectBounds = this.elementBoundsService.getElementBounds(element);
        box = {
          id: element.id,
          x: (element.x * zoom) + panX,
          y: (element.y * zoom) + panY,
          width: (rectBounds.visualRight - rectBounds.visualLeft + 10) * zoom,
          height: (rectBounds.visualBottom - rectBounds.visualTop + 10) * zoom,
          rotation: element.rotation || 0,
          type: 'table'
        };
        break;

      case 'seatingRow':
        const seatingBounds = this.elementBoundsService.getElementBounds(element);
        const centerX = (seatingBounds.visualLeft + seatingBounds.visualRight) / 2;
        const centerY = (seatingBounds.visualTop + seatingBounds.visualBottom) / 2;
        
        box = {
          id: element.id,
          x: (centerX * zoom) + panX,
          y: (centerY * zoom) + panY,
          width: (seatingBounds.visualRight - seatingBounds.visualLeft + 10) * zoom,
          height: (seatingBounds.visualBottom - seatingBounds.visualTop + 10) * zoom,
          rotation: element.rotation || 0,
          type: 'row'
        };
        break;

      case 'line':
        const lineBounds = this.elementBoundsService.getElementBounds(element);
        const lineCenterX = (lineBounds.visualLeft + lineBounds.visualRight) / 2;
        const lineCenterY = (lineBounds.visualTop + lineBounds.visualBottom) / 2;
        
        box = {
          id: element.id,
          x: (lineCenterX * zoom) + panX,
          y: (lineCenterY * zoom) + panY,
          width: (lineBounds.visualRight - lineBounds.visualLeft + 10) * zoom,
          height: (lineBounds.visualBottom - lineBounds.visualTop + 10) * zoom,
          rotation: Math.atan2(
            element.endY - element.startY, 
            element.endX - element.startX
          ) * 180 / Math.PI,
          type: 'line'
        };
        break;

      case 'polygon':
        if (element.points && element.points.length > 0) {
          const polygonBounds = this.elementBoundsService.getElementBounds(element);
          const polygonCenterX = (polygonBounds.visualLeft + polygonBounds.visualRight) / 2;
          const polygonCenterY = (polygonBounds.visualTop + polygonBounds.visualBottom) / 2;
          
          box = {
            id: element.id,
            x: (polygonCenterX * zoom) + panX,
            y: (polygonCenterY * zoom) + panY,
            width: (polygonBounds.visualRight - polygonBounds.visualLeft + 10) * zoom,
            height: (polygonBounds.visualBottom - polygonBounds.visualTop + 10) * zoom,
            rotation: 0,
            type: 'polygon'
          };
        }
        break;

      case 'segmentedSeatingRow':
        // Use ElementBoundsService for consistent bounds calculation
        const segmentedBounds = this.elementBoundsService.getElementBounds(element);
        const segmentedCenterX = (segmentedBounds.visualLeft + segmentedBounds.visualRight) / 2;
        const segmentedCenterY = (segmentedBounds.visualTop + segmentedBounds.visualBottom) / 2;
        
        box = {
          id: element.id,
          x: (segmentedCenterX * zoom) + panX,
          y: (segmentedCenterY * zoom) + panY,
          width: (segmentedBounds.visualRight - segmentedBounds.visualLeft + 10) * zoom,
          height: (segmentedBounds.visualBottom - segmentedBounds.visualTop + 10) * zoom,
          rotation: element.rotation || 0,
          type: 'row'
        };
        break;

      case 'text':
        // Calculate text selection box based on content
        const textWidth = this.getSelectionWidth(element);
        const textHeight = this.getSelectionHeight(element);
        
        box = {
          id: element.id,
          x: (element.x * zoom) + panX,
          y: (element.y * zoom) + panY,
          width: textWidth * zoom,
          height: textHeight * zoom,
          rotation: element.rotation || 0,
          type: 'text'
        };
        break;
    }

    return box;
  }

  /**
   * Calculate bounding box for segmented seating row
   */
  private calculateSegmentedRowBoundingBox(element: any): { 
    centerX: number; centerY: number; width: number; height: number; 
  } {
    if (!element.segments || element.segments.length === 0) {
      return { centerX: element.x, centerY: element.y, width: 100, height: 50 };
    }

    const points: {x: number, y: number}[] = [];
    element.segments.forEach((segment: any) => {
      points.push({ x: segment.startX, y: segment.startY });
      points.push({ x: segment.endX, y: segment.endY });
    });

    if (points.length === 0) {
      return { centerX: element.x, centerY: element.y, width: 100, height: 50 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Check if cached geometry is still current
   */
  private isGeometryCurrent(element: any, cached: SelectionBox): boolean {
    // Simple check - in a real implementation you might want more sophisticated caching
    const currentTime = Date.now();
    return (currentTime - (cached as any).lastUpdated) < 100; // 100ms cache
  }


  // Control whether to use canvas-based selection rendering (public for template access)
  public useCanvasSelection: boolean = true;

  /**
   * Handle window resize to update canvas sizes
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    this.setCanvasSize();
    this.updateSelectionCanvasSize();
    this.updateAlignmentCanvasSize();
    
    // Redraw after resize
    this.drawGrid();
    this.updateCanvasSelections();
    this.updateAlignmentGuides();
  }

  /**
   * Initialize the alignment guide canvas renderer
   */
  private initializeAlignmentCanvas(): void {
    if (!this.alignmentCanvasRef) return;

    const alignmentCanvas = this.alignmentCanvasRef.nativeElement;
    this.alignmentGuideRenderer.initializeCanvas(alignmentCanvas);

    // Match canvas size to container
    this.updateAlignmentCanvasSize();

    this.logger.debug('Alignment canvas initialized', {
      component: 'GridComponent',
      action: 'initializeAlignmentCanvas'
    });
  }

  /**
   * Update alignment canvas size to match container
   */
  private updateAlignmentCanvasSize(): void {
    if (this.alignmentCanvasRef && this.gridContainerRef) {
      const container = this.gridContainerRef.nativeElement;
      this.alignmentGuideRenderer.resizeCanvas(container.clientWidth, container.clientHeight);
    }
  }

  /**
   * Set up MobX reactions to watch alignment guide state changes
   */
  private setupAlignmentGuideWatcher(): void {
    // React to active guides changes
    this.createAutorun(() => {
      // Watch snapping store active guides
      const guides = this.snappingStore.activeGuides;
      guides.length; // Access to make MobX track it
      
      this.updateAlignmentGuides();
    }, 'alignment-guides-changes');

    // React to grid transform changes (pan/zoom)
    this.createAutorun(() => {
      if (this.snappingStore.activeGuides.length > 0) {
        this.store.panOffset.x;
        this.store.panOffset.y;
        this.store.zoomLevel;
        
        this.updateAlignmentGuides();
      }
    }, 'alignment-grid-transform-changes');

    this.logger.debug('Alignment guide watcher setup complete', {
      component: 'GridComponent',
      action: 'setupAlignmentGuideWatcher'
    });
  }

  /**
   * Update alignment guides rendering
   */
  private updateAlignmentGuides(): void {
    if (!this.alignmentGuideRenderer || viewerStore.isViewerMode) {
      return;
    }

    const guides = this.snappingStore.activeGuides;
    const zoom = this.store.zoomLevel / 100;
    const pan = this.store.panOffset;

    this.alignmentGuideRenderer.renderGuides(guides, zoom, pan);
  }

}