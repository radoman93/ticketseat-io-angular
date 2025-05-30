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
import { dragStore } from '../../stores/drag.store';
import { rootStore } from '../../stores/root.store';
import { autorun, IReactionDisposer } from 'mobx';

// Use union type for table positions  
type TablePosition = RoundTableProperties | RectangleTableProperties | SeatingRowProperties;

@Component({
  selector: 'app-grid',
  imports: [MobxAngularModule, RoundTableComponent, RectangleTableComponent, SeatingRowComponent, CommonModule],
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
  
  // Make enum available in template
  ToolType = ToolType;
  
  // Table preview for showing at cursor position in add mode
  previewTable: TablePosition | null = null;
  
  // MobX reaction disposers
  private toolChangeDisposer: IReactionDisposer | null = null;

  // Rotation state
  isRotating: boolean = false;
  rotatingItem: TablePosition | null = null;
  rotationItemCenter: { x: number, y: number } = { x: 0, y: 0 };
  initialMouseAngleForRotation: number = 0;
  originalItemRotationValue: number = 0;

  // Seating row drag-to-create state
  isCreatingSeatingRow: boolean = false;
  seatingRowStartX: number = 0;
  seatingRowStartY: number = 0;
  seatingRowCurrentX: number = 0;
  seatingRowCurrentY: number = 0;

  constructor() {
    // Nothing to inject
  }

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
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
        // Initialize preview seating row when entering add mode
        this.previewTable = {
          id: `seatingrow-preview-${Date.now()}`,
          type: 'seatingRow',
          x: 0,
          y: 0,
          endX: 35, // Start with just one seat width
          endY: 0,
          seatCount: 1,
          seatSpacing: 35,
          name: `Row ${this.layoutStore.elements.length + 1}`,
          rotation: 0,
          chairLabelVisible: true,
          rowLabelVisible: true
        };
      } else {
        this.previewTable = null;
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
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.store.canvasWidth;
    canvas.height = this.store.canvasHeight;
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

    if (event.button === 1) {
      // Middle mouse button for panning
      this.store.startPanning(event.clientX, event.clientY);
      event.preventDefault();
    } else if (event.button === 0) {
      // Left mouse button for selection/dragging/adding
      const activeTool = this.toolStore.activeTool;
      
      if (activeTool === ToolType.SeatingRow && this.previewTable) {
        // Start drag-to-create seating row mode
        const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
        const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
        
        this.isCreatingSeatingRow = true;
        this.seatingRowStartX = x;
        this.seatingRowStartY = y;
        this.seatingRowCurrentX = x;
        this.seatingRowCurrentY = y;
        
        // Update preview table to start point, centered at mouse
        this.previewTable.x = x;
        this.previewTable.y = y;
        this.previewTable.endX = x;
        this.previewTable.endY = y;
        (this.previewTable as SeatingRowProperties).seatCount = 1;
        
        event.preventDefault();
      } else if ((activeTool === ToolType.RoundTable || activeTool === ToolType.RectangleTable) && this.previewTable) {
        // We're in add mode for round/rectangle tables, add a new table
        const newTable: TablePosition = {
          ...this.previewTable,
          id: `table-${Date.now()}`
        };
        
        this.layoutStore.addElement(newTable);
        this.toolStore.setActiveTool(ToolType.None);
        this.selectionStore.selectItem(newTable);
        event.preventDefault();
      }
      // Note: Dragging is handled by the table element's click event
      // and rotation is handled by its own mousedown handler (startRotate)
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.store.setMousePosition(event.clientX, event.clientY);

    if (this.isCreatingSeatingRow && this.previewTable) {
      // Handle seating row drag-to-create with free rotation
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      this.seatingRowCurrentX = x;
      this.seatingRowCurrentY = y;
      
      // Calculate distance and angle from start to current position
      const dx = x - this.seatingRowStartX;
      const dy = y - this.seatingRowStartY;
      const totalDistance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      const seatSpacing = (this.previewTable as SeatingRowProperties).seatSpacing || 35;
      const seatCount = Math.max(1, Math.floor(totalDistance / seatSpacing) + 1);
      
      // Calculate the end position based on the actual number of seats and direction
      const actualDistance = (seatCount - 1) * seatSpacing;
      const normalizedDx = dx / totalDistance || 0;
      const normalizedDy = dy / totalDistance || 0;
      
      // Update preview table - keep start position fixed, calculate end based on actual seats
      this.previewTable.x = this.seatingRowStartX;
      this.previewTable.y = this.seatingRowStartY;
      this.previewTable.endX = this.seatingRowStartX + (normalizedDx * actualDistance);
      this.previewTable.endY = this.seatingRowStartY + (normalizedDy * actualDistance);
      (this.previewTable as SeatingRowProperties).seatCount = seatCount;
      (this.previewTable as SeatingRowProperties).rotation = angle;
      
    } else if (this.isRotating && this.rotatingItem) {
      const currentMouseX = event.clientX;
      const currentMouseY = event.clientY;

      // Calculate angle between item center and current mouse position
      const deltaX = currentMouseX - this.rotationItemCenter.x;
      const deltaY = currentMouseY - this.rotationItemCenter.y;
      let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Calculate the change in angle from the initial mouse angle
      let angleDiff = currentAngle - this.initialMouseAngleForRotation;

      // New rotation is original rotation + difference
      let newRotation = this.originalItemRotationValue + angleDiff;

      // Normalize rotation to be between 0 and 360
      newRotation = (newRotation % 360 + 360) % 360;

      // Optional: Snap to increments (e.g., 15 degrees)
      // newRotation = Math.round(newRotation / 15) * 15;

      this.layoutStore.updateElement(this.rotatingItem.id, { rotation: newRotation });

    } else if (this.store.isPanning) {
      // Handle canvas panning
      this.store.pan(event.clientX, event.clientY);
      this.drawGrid();
    } else if (this.dragStore.isDragging) {
      // Handle element dragging
      this.dragStore.updateDragPosition(event.clientX, event.clientY);
    } else if (this.dragStore.potentialDragItem && event.buttons === 1) {
      // Check if we should start dragging (mouse has moved while button is pressed)
      const dx = event.clientX - this.dragStore.startMouseX;
      const dy = event.clientY - this.dragStore.startMouseY;
      const moveDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (moveDistance > 2) {
        this.selectionStore.selectItem(this.dragStore.potentialDragItem);
        this.dragStore.startDragging(
          this.dragStore.potentialDragItem,
          this.dragStore.startMouseX,
          this.dragStore.startMouseY
        );
      }
    } else if ((this.toolStore.activeTool === ToolType.RoundTable || this.toolStore.activeTool === ToolType.RectangleTable || this.toolStore.activeTool === ToolType.SeatingRow) && this.previewTable && !this.isCreatingSeatingRow) {
      // Handle preview table positioning in add mode (only if not creating seating row)
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      if (this.toolStore.activeTool === ToolType.SeatingRow) {
        // For seating row, center the first chair at mouse position
        this.previewTable.x = x;
        this.previewTable.y = y;
        this.previewTable.endX = x;
        this.previewTable.endY = y;
      } else {
        this.previewTable.x = x;
        this.previewTable.y = y;
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.isCreatingSeatingRow && this.previewTable) {
      // Complete seating row creation
      const newSeatingRow: SeatingRowProperties = {
        ...this.previewTable as SeatingRowProperties,
        id: `seatingrow-${Date.now()}`,
        chairLabelVisible: true,
        rowLabelVisible: true
      };
      
      this.layoutStore.addElement(newSeatingRow);
      this.toolStore.setActiveTool(ToolType.None);
      this.selectionStore.selectItem(newSeatingRow);
      
      // Reset seating row creation state
      this.isCreatingSeatingRow = false;
      this.seatingRowStartX = 0;
      this.seatingRowStartY = 0;
      this.seatingRowCurrentX = 0;
      this.seatingRowCurrentY = 0;
      
      event.preventDefault();
    }
    
    if (this.isRotating) {
      this.isRotating = false;
      this.rotatingItem = null;
      event.stopPropagation(); // Prevent other mouseup actions like deselecting
    }
    if (event.button === 1) {
      this.store.stopPanning();
    } else if (event.button === 0 && this.dragStore.isDragging) {
      this.dragStore.endDragging();
    }
    this.dragStore.potentialDragItem = null;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    // Cancel seating row creation if mouse leaves
    if (this.isCreatingSeatingRow) {
      this.isCreatingSeatingRow = false;
      this.seatingRowStartX = 0;
      this.seatingRowStartY = 0;
      this.seatingRowCurrentX = 0;
      this.seatingRowCurrentY = 0;
    }
    
    if (this.isRotating) {
      this.isRotating = false;
      this.rotatingItem = null;
    }
    if (this.store.isPanning) {
      this.store.stopPanning();
    }
    if (this.dragStore.isDragging) {
      this.dragStore.endDragging();
    }
    this.dragStore.potentialDragItem = null;
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomChange = event.deltaY > 0 ? -5 : 5;
    this.store.adjustZoom(zoomChange);
  }

  zoomIn(): void {
    this.store.zoomIn();
  }

  zoomOut(): void {
    this.store.zoomOut();
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
    // Delete key to remove selected table
    if (event.key === 'Delete' && this.selectionStore.hasSelection) {
      this.deleteSelectedTable();
      event.preventDefault();
    }
    
    // Escape key to cancel operations
    if (event.key === 'Escape') {
      if (this.isCreatingSeatingRow) {
        this.isCreatingSeatingRow = false;
        this.seatingRowStartX = 0;
        this.seatingRowStartY = 0;
        this.seatingRowCurrentX = 0;
        this.seatingRowCurrentY = 0;
      }
      if (this.toolStore.activeTool !== ToolType.None) {
        this.toolStore.setActiveTool(ToolType.None);
      }
    }
  }

  // Start rotation mode for an item
  startRotate(item: TablePosition, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.isRotating = true;
    this.rotatingItem = item;

    // Calculate the center point of the item for rotation
    if (item.type === 'roundTable') {
      this.rotationItemCenter = { x: item.x, y: item.y };
    } else if (item.type === 'rectangleTable') {
      this.rotationItemCenter = { x: item.x, y: item.y };
    } else if (item.type === 'seatingRow') {
      // For seating rows, use the start point (x, y) as rotation center
      // This matches the transformOrigin: '0 0' set in the component
      this.rotationItemCenter = { x: item.x, y: item.y };
    }

    // Convert to screen coordinates
    const screenX = this.rotationItemCenter.x * (this.store.zoomLevel / 100) + this.store.panOffset.x;
    const screenY = this.rotationItemCenter.y * (this.store.zoomLevel / 100) + this.store.panOffset.y;
    this.rotationItemCenter = { x: screenX, y: screenY };

    // Calculate initial angle between center and mouse
    const deltaX = event.clientX - this.rotationItemCenter.x;
    const deltaY = event.clientY - this.rotationItemCenter.y;
    this.initialMouseAngleForRotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Store the original rotation value
    this.originalItemRotationValue = item.rotation || 0;
  }
} 