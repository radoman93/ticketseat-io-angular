import { makeAutoObservable, action } from 'mobx';
import { Selectable, SegmentProperties } from '../services/selection.service';
import { layoutStore } from './layout.store';
import { selectionStore } from './selection.store';
import { gridStore } from './grid.store';
import { HistoryStore } from './history.store';
import { MoveObjectCommand } from '../commands/move-object.command';

/**
 * Store that manages dragging state for elements on the canvas
 */
export class DragStore {
  // Track dragging state
  isDragging = false;
  draggedItem: Selectable | null = null;
  
  // Store initial positions
  startMouseX = 0;
  startMouseY = 0;
  startElementX = 0;
  startElementY = 0;
  
  // Store original points for lines (for cancel functionality)
  originalPoints: {x: number, y: number}[] = [];
  
  // Track potential drag
  potentialDragItem: Selectable | null = null;
  
  // Track when dragging has just ended (to prevent immediate deselection)
  justEndedDragging = false;
  
  constructor() {
    makeAutoObservable(this, {
      // Actions
      prepareForDragging: action,
      startDragging: action,
      updateDragPosition: action,
      endDragging: action,
      cancelDragging: action,
      resetJustEndedDragging: action
    });
  }

  /**
   * Reset the justEndedDragging flag
   */
  resetJustEndedDragging = action('resetJustEndedDragging', () => {
    this.justEndedDragging = false;
  });

  /**
   * Prepare for potential dragging without actually starting it
   */
  prepareForDragging = action('prepareForDragging', (
    item: Selectable, 
    mouseX: number, 
    mouseY: number
  ) => {
    // Handle different item types
    if (item.type === 'line' || item.type === 'polygon') {
      // For lines and polygons, check if they have points
      if (!item['points'] || !Array.isArray(item['points']) || item['points'].length === 0) {
        console.warn(`Cannot prepare drag for ${item.type} without points`);
        return;
      }
      
      // Calculate center point of the line/polygon for dragging reference
      const points = item['points'];
      const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
      const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
      
      // Store original points for cancel functionality
      this.originalPoints = points.map(point => ({ x: point.x, y: point.y }));
      
      // Store the potential drag item
      this.potentialDragItem = item;
      
      // Store initial positions (using calculated center for lines/polygons)
      this.startMouseX = mouseX;
      this.startMouseY = mouseY;
      this.startElementX = centerX;
      this.startElementY = centerY;
    } else {
      // For other items, check for x and y properties
      if (!item || !('x' in item) || !('y' in item)) {
        console.warn('Cannot prepare drag for item without position properties');
        return;
      }
      
      // Store the potential drag item
      this.potentialDragItem = item;
      
      // Store initial positions
      this.startMouseX = mouseX;
      this.startMouseY = mouseY;
      this.startElementX = item['x'];
      this.startElementY = item['y'];
    }
  });

  /**
   * Start dragging an element
   */
  startDragging = action('startDragging', () => {
    // Only allow dragging if item exists and has appropriate properties
    if (!this.potentialDragItem) {
      console.warn('Cannot drag: no potential drag item');
      return;
    }
    
    // Check if it's a line/polygon (has points) or regular item (has x/y)
    const isPointsBased = this.potentialDragItem.type === 'line' || this.potentialDragItem.type === 'polygon';
    const hasPoints = isPointsBased && this.potentialDragItem['points'] && Array.isArray(this.potentialDragItem['points']);
    const hasPosition = !isPointsBased && 'x' in this.potentialDragItem && 'y' in this.potentialDragItem;
    
    if (!hasPoints && !hasPosition) {
      console.warn('Cannot drag item without position properties or points');
      return;
    }

    // console.log('Starting to drag item:', this.potentialDragItem.id);
    
    // Clear previous dragged item reference
    this.draggedItem = null;
    
    // Store the initial state
    this.isDragging = true;
    this.draggedItem = this.potentialDragItem;
    this.potentialDragItem = null;
        
    // Ensure item is selected
    selectionStore.selectItem(this.draggedItem);
  });

  /**
   * Update position while dragging
   */
  updateDragPosition = action('updateDragPosition', (
    mouseX: number, 
    mouseY: number
  ) => {
    if (!this.isDragging || !this.draggedItem) return;
    
    // Calculate the mouse movement delta
    const dx = mouseX - this.startMouseX;
    const dy = mouseY - this.startMouseY;
    
    // Convert to canvas coordinates by adjusting for zoom
    const zoomFactor = gridStore.zoomLevel / 100;
    const canvasDx = dx / zoomFactor;
    const canvasDy = dy / zoomFactor;
    
    // Handle different item types
    if (this.draggedItem.type === 'line' || this.draggedItem.type === 'polygon') {
      // For lines and polygons, move all points by the same delta
      const currentPoints = this.draggedItem['points'];
      if (currentPoints && Array.isArray(currentPoints)) {
        // Calculate the current center to determine how much we need to move
        const currentCenterX = currentPoints.reduce((sum, point) => sum + point.x, 0) / currentPoints.length;
        const currentCenterY = currentPoints.reduce((sum, point) => sum + point.y, 0) / currentPoints.length;
        
        // Calculate target center
        const targetCenterX = this.startElementX + canvasDx;
        const targetCenterY = this.startElementY + canvasDy;
        
        // Calculate the delta needed to reach target center
        const pointsDx = targetCenterX - currentCenterX;
        const pointsDy = targetCenterY - currentCenterY;
        
        // Move all points by this delta
        const updatedPoints = currentPoints.map(point => ({
          x: point.x + pointsDx,
          y: point.y + pointsDy
        }));
        
        const update = { points: updatedPoints };
        Object.assign(this.draggedItem, update);
        layoutStore.updateElement(this.draggedItem.id, update);
      }
    } else if (this.draggedItem.type === 'segmentedSeatingRow') {
      // Calculate new position
      const newX = this.startElementX + canvasDx;
      const newY = this.startElementY + canvasDy;
      
      const deltaX = newX - this.draggedItem['x'];
      const deltaY = newY - this.draggedItem['y'];
      
      // Update all segment positions
      if (this.draggedItem['segments']) {
        const segments: SegmentProperties[] = this.draggedItem['segments'];
        const updatedSegments = segments.map((segment: SegmentProperties) => ({
          ...segment,
          startX: segment.startX + deltaX,
          startY: segment.startY + deltaY,
          endX: segment.endX + deltaX,
          endY: segment.endY + deltaY
        }));
        
        const update = { 
          x: newX, 
          y: newY,
          segments: updatedSegments
        };

        // Update the dragged item with new segment positions
        Object.assign(this.draggedItem, update);
        // Also update layoutStore to trigger re-render
        layoutStore.updateElement(this.draggedItem.id, update);
      }
    } else {
      // For other elements, just update x and y
      const newX = this.startElementX + canvasDx;
      const newY = this.startElementY + canvasDy;
      
      const update = { x: newX, y: newY };
      Object.assign(this.draggedItem, update);
      layoutStore.updateElement(this.draggedItem.id, update);
    }
  });

  /**
   * End dragging operation
   */
  endDragging = action('endDragging', (historyStore: HistoryStore) => {
    if (!this.isDragging || !this.draggedItem) return;
    
    // console.log('Finished dragging item:', this.draggedItem?.id);
    
    let oldPosition: { x: number, y: number };
    let newPosition: { x: number, y: number };
    
    if (this.draggedItem.type === 'line' || this.draggedItem.type === 'polygon') {
      // For lines and polygons, use the center points for history tracking
      const currentPoints = this.draggedItem['points'];
      if (currentPoints && Array.isArray(currentPoints)) {
        const newCenterX = currentPoints.reduce((sum, point) => sum + point.x, 0) / currentPoints.length;
        const newCenterY = currentPoints.reduce((sum, point) => sum + point.y, 0) / currentPoints.length;
        
        oldPosition = { x: this.startElementX, y: this.startElementY };
        newPosition = { x: newCenterX, y: newCenterY };
      } else {
        // If no points, skip history command
        this.isDragging = false;
        this.potentialDragItem = null;
        this.justEndedDragging = true;
        setTimeout(() => this.resetJustEndedDragging(), 100);
        return;
      }
    } else {
      // For regular items with x/y properties
      oldPosition = { x: this.startElementX, y: this.startElementY };
      newPosition = { x: this.draggedItem['x'], y: this.draggedItem['y'] };
    }

    // Only create a command if the position actually changed
    if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
      const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
      historyStore.executeCommand(command);
    }
    
    // Reset dragging state but keep the item selected
    this.isDragging = false;
    this.potentialDragItem = null;
    this.originalPoints = [];
    
    // Set the justEndedDragging flag
    this.justEndedDragging = true;
    
    // Reset the flag after a short timeout
    setTimeout(() => {
      this.resetJustEndedDragging();
    }, 100);
    
    // We don't set draggedItem to null here
    // because we want to keep the reference to what was last dragged
    // but we do indicate dragging is over
  });

  /**
   * Cancel dragging and revert position
   */
  cancelDragging = action('cancelDragging', () => {
    if (!this.isDragging || !this.draggedItem) return;
    
    // Revert to original position based on item type
    if (this.draggedItem.type === 'line' || this.draggedItem.type === 'polygon') {
      // For lines and polygons, revert to original points
      if (this.originalPoints.length > 0) {
        layoutStore.updateElement(this.draggedItem.id, {
          points: this.originalPoints
        });
      }
    } else {
      // For other items, revert to original x/y
      layoutStore.updateElement(this.draggedItem.id, {
        x: this.startElementX,
        y: this.startElementY
      });
    }
    
    // Reset state completely when canceled
    this.isDragging = false;
    this.draggedItem = null;
    this.potentialDragItem = null;
    this.originalPoints = [];
  });
}

// Create singleton instance
export const dragStore = new DragStore(); 