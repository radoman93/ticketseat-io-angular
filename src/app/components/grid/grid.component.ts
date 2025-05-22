import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnDestroy, OnInit } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableComponent } from '../round-table/round-table.component';
import { ToolType } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { Selectable, RoundTableProperties } from '../../services/selection.service';
import { toolStore } from '../../stores/tool.store';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { dragStore } from '../../stores/drag.store';
import { autorun, IReactionDisposer } from 'mobx';

// Use the interface from the service
type TablePosition = RoundTableProperties;

@Component({
  selector: 'app-grid',
  imports: [MobxAngularModule, RoundTableComponent, CommonModule],
  standalone: true,
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css'
})
export class GridComponent implements AfterViewInit, OnDestroy, OnInit {
  // Reference to our MobX stores
  store = gridStore;
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

  constructor() {
    // Nothing to inject
  }

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  ngOnInit(): void {
    // Use MobX autorun to react to tool changes
    this.toolChangeDisposer = autorun(() => {
      const activeTool = this.toolStore.activeTool;
      if (activeTool !== ToolType.RoundTable) {
        this.previewTable = null;
      } else {
        // Initialize preview table when entering add mode
        this.previewTable = {
          id: `table-preview-${Date.now()}`,
          type: 'roundTable',
          x: 0,
          y: 0,
          radius: 50,
          seats: 8,
          name: `Table ${this.layoutStore.elements.length + 1}`,
          rotation: 0
        };
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
    if (event.button === 1) {
      // Middle mouse button for panning
      this.store.startPanning(event.clientX, event.clientY);
      event.preventDefault();
    } else if (event.button === 0) {
      // Left mouse button for selection/dragging/adding
      const activeTool = this.toolStore.activeTool;
      
      if (activeTool === ToolType.RoundTable && this.previewTable) {
        // We're in add mode, add a new table
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
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.store.setMousePosition(event.clientX, event.clientY);

    if (this.store.isPanning) {
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
      
      // Start dragging if moved more than 2 pixels - lower threshold for better responsiveness
      if (moveDistance > 2) {
        // Make sure the item is selected before dragging
        this.selectionStore.selectItem(this.dragStore.potentialDragItem);
        
        // Start dragging
        this.dragStore.startDragging(
          this.dragStore.potentialDragItem,
          this.dragStore.startMouseX,
          this.dragStore.startMouseY
        );
      }
    } else if (this.toolStore.activeTool === ToolType.RoundTable && this.previewTable) {
      // Handle preview table positioning in add mode
      const x = (event.clientX - this.store.panOffset.x) / (this.store.zoomLevel / 100);
      const y = (event.clientY - this.store.panOffset.y) / (this.store.zoomLevel / 100);
      
      this.previewTable.x = x;
      this.previewTable.y = y;
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 1) {
      // End panning on middle mouse release
      this.store.stopPanning();
    } else if (event.button === 0 && this.dragStore.isDragging) {
      // End dragging on left mouse release
      this.dragStore.endDragging();
    }
    
    // Reset potential drag item
    this.dragStore.potentialDragItem = null;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.store.isPanning) {
      this.store.stopPanning();
    }
    if (this.dragStore.isDragging) {
      this.dragStore.endDragging();
    }
    
    // Reset potential drag item
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
    if (this.toolStore.activeTool === ToolType.RoundTable) {
      return;
    }
    
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
    if (selectedItem && selectedItem.type === 'roundTable') {
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
    
    // Escape key to cancel dragging
    if (event.key === 'Escape' && this.dragStore.isDragging) {
      this.dragStore.cancelDragging();
      event.preventDefault();
    }
  }
}
