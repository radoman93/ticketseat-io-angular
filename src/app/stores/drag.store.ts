import { makeAutoObservable, action } from 'mobx';
import { Selectable } from '../services/selection.service';
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
    // Only prepare if item exists and has position properties
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
  });

  /**
   * Start dragging an element
   */
  startDragging = action('startDragging', (
    item: Selectable, 
    mouseX: number, 
    mouseY: number
  ) => {
    // Only allow dragging if item exists and has position properties
    if (!item || !('x' in item) || !('y' in item)) {
      console.warn('Cannot drag item without position properties');
      return;
    }

    console.log('Starting to drag item:', item.id);
    
    // Clear previous dragged item reference
    this.draggedItem = null;
    
    // Store the initial state
    this.isDragging = true;
    this.draggedItem = item;
    
    // Store start positions
    this.startMouseX = mouseX;
    this.startMouseY = mouseY;
    this.startElementX = item['x'];
    this.startElementY = item['y'];
    
    // Ensure item is selected
    selectionStore.selectItem(item);
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
    
    // Calculate new position
    const newX = this.startElementX + canvasDx;
    const newY = this.startElementY + canvasDy;
    
    // Directly update the object in memory for visual feedback
    // This requires the layoutStore.elements to be a deep observable
    Object.assign(this.draggedItem, { x: newX, y: newY });
  });

  /**
   * End dragging operation
   */
  endDragging = action('endDragging', (historyStore: HistoryStore) => {
    if (!this.isDragging || !this.draggedItem) return;
    
    console.log('Finished dragging item:', this.draggedItem?.id);
    
    const oldPosition = { x: this.startElementX, y: this.startElementY };
    const newPosition = { x: this.draggedItem['x'], y: this.draggedItem['y'] };

    // Only create a command if the position actually changed
    if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
      const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
      historyStore.executeCommand(command);
    }
    
    // Reset dragging state but keep the item selected
    this.isDragging = false;
    
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
    
    // Revert to original position
    layoutStore.updateElement(this.draggedItem.id, {
      x: this.startElementX,
      y: this.startElementY
    });
    
    // Reset state completely when canceled
    this.isDragging = false;
    this.draggedItem = null;
    this.potentialDragItem = null;
  });
}

// Create singleton instance
export const dragStore = new DragStore(); 