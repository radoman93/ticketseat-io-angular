import { action, makeAutoObservable } from 'mobx';
import { layoutStore } from './layout.store';
import { gridStore } from './grid.store';
import { selectionStore } from './selection.store';
import { MoveObjectCommand } from '../commands/move-object.command';
import { HistoryStore } from './history.store';
import { SegmentProperties } from '../models/elements.model';
import { TableElement } from './layout.store';
import { LoggerService } from '../services/logger.service';

export class DragStore {
    // Track dragging state
    isDragging = false;
    draggedItem: TableElement | null = null;

    // Track initial positions for dragging calculations
    startMouseX = 0;
    startMouseY = 0;
    startElementX = 0;
    startElementY = 0;
    
    // Store original line dimensions for lines
    originalLineEndX = 0;
    originalLineEndY = 0;

    // Store original points for cancel functionality (legacy for future extensibility)
    originalPoints: { x: number, y: number }[] = [];

    // Track potential drag
    potentialDragItem: TableElement | null = null;

    // Track when dragging has just ended (to prevent immediate deselection)
    justEndedDragging = false;

    private logger: LoggerService;

    constructor() {
        this.logger = new LoggerService();
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
        item: TableElement,
        mouseX: number,
        mouseY: number
    ) => {
        // Check if item has appropriate position properties
        if (!item) {
            this.logger.warn('Cannot prepare drag for null item', { store: 'DragStore', action: 'prepareForDragging' });
            return;
        }

        // For lines, check for startX/startY properties
        if (item.type === 'line') {
            if (!('startX' in item) || !('startY' in item)) {
                this.logger.warn('Cannot prepare drag for line without startX/startY properties', { store: 'DragStore', action: 'prepareForDragging', itemType: item.type, itemId: (item as any).id });
                return;
            }
        } else {
            // For other items, check for x and y properties
            if (!('x' in item) || !('y' in item)) {
                this.logger.warn('Cannot prepare drag for item without position properties', { store: 'DragStore', action: 'prepareForDragging', itemType: (item as any).type, itemId: (item as any).id });
                return;
            }
        }

        // Store the potential drag item
        this.potentialDragItem = item;

        // Store initial positions
        this.startMouseX = mouseX;
        this.startMouseY = mouseY;
        
        if (item.type === 'line') {
            this.startElementX = item['startX'];
            this.startElementY = item['startY'];
            this.originalLineEndX = item['endX'];
            this.originalLineEndY = item['endY'];
        } else if (item.type === 'polygon') {
            this.startElementX = item['x'];
            this.startElementY = item['y'];
            // Store original points for polygon dragging
            this.originalPoints = [...(item['points'] || [])];
        } else {
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
            this.logger.warn('Cannot drag: no potential drag item', { store: 'DragStore', action: 'startDragging' });
            return;
        }

        // Check if item has appropriate position properties
        if (this.potentialDragItem.type === 'line') {
            if (!('startX' in this.potentialDragItem) || !('startY' in this.potentialDragItem)) {
                this.logger.warn('Cannot drag line without startX/startY properties', { store: 'DragStore', action: 'startDragging', itemType: this.potentialDragItem.type, itemId: (this.potentialDragItem as any).id });
                return;
            }
        } else if (this.potentialDragItem.type === 'polygon') {
            if (!('x' in this.potentialDragItem) || !('y' in this.potentialDragItem) || !('points' in this.potentialDragItem)) {
                this.logger.warn('Cannot drag polygon without position or points properties', { store: 'DragStore', action: 'startDragging', itemType: this.potentialDragItem.type, itemId: (this.potentialDragItem as any).id });
                return;
            }
        } else {
            if (!('x' in this.potentialDragItem) || !('y' in this.potentialDragItem)) {
                this.logger.warn('Cannot drag item without position properties', { store: 'DragStore', action: 'startDragging', itemType: (this.potentialDragItem as any).type, itemId: (this.potentialDragItem as any).id });
                return;
            }
        }

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

        // Account for zoom level
        const zoomFactor = gridStore.zoomLevel / 100;
        const canvasDx = dx / zoomFactor;
        const canvasDy = dy / zoomFactor;

        // Handle different item types
        if (this.draggedItem.type === 'line') {
            // For lines, move both start and end points by the same delta
            const deltaToEnd = {
                x: this.originalLineEndX - this.startElementX,
                y: this.originalLineEndY - this.startElementY
            };
            
            // Calculate new positions
            const newStartX = this.startElementX + canvasDx;
            const newStartY = this.startElementY + canvasDy;
            const newEndX = newStartX + deltaToEnd.x;
            const newEndY = newStartY + deltaToEnd.y;

            const update = { 
                x: newStartX, // Keep x/y for compatibility with selection system
                y: newStartY,
                startX: newStartX, 
                startY: newStartY, 
                endX: newEndX, 
                endY: newEndY 
            };
            Object.assign(this.draggedItem, update);
            layoutStore.updateElement(this.draggedItem.id, update);
        } else if (this.draggedItem.type === 'segmentedSeatingRow') {
            // Calculate new position
            const newX = this.startElementX + canvasDx;
            const newY = this.startElementY + canvasDy;

            const deltaX = newX - this.draggedItem['x'];
            const deltaY = newY - this.draggedItem['y'];

            // Update all segment positions
            if (this.draggedItem['segments']) {
                const segments: SegmentProperties[] = this.draggedItem['segments'];
                const updatedSegments = segments.map(segment => ({
                    ...segment,
                    chairs: segment.chairs.map(chair => ({
                        ...chair,
                        x: chair.x + deltaX,
                        y: chair.y + deltaY
                    }))
                }));

                const update = {
                    x: newX,
                    y: newY,
                    segments: updatedSegments
                };
                Object.assign(this.draggedItem, update);

                layoutStore.updateElement(this.draggedItem.id, update);
            }
        } else if (this.draggedItem.type === 'polygon') {
            // For polygons, move all vertices by the same delta
            const newX = this.startElementX + canvasDx;
            const newY = this.startElementY + canvasDy;
            
            // Calculate the delta from the current center to the new center
            const deltaX = newX - this.draggedItem['x'];
            const deltaY = newY - this.draggedItem['y'];
            
            // Move all points by the same delta
            const currentPoints = this.draggedItem['points'] || [];
            const newPoints = currentPoints.map((point: {x: number, y: number}) => ({
                x: point.x + deltaX,
                y: point.y + deltaY
            }));
            
            const update = { 
                x: newX, 
                y: newY, 
                points: newPoints 
            };
            Object.assign(this.draggedItem, update);
            layoutStore.updateElement(this.draggedItem.id, update);
        } else {
            // For all other items (roundTable, rectangleTable, seatingRow), update x and y
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

        // ('Finished dragging item:', this.draggedItem?.id);

        if (this.draggedItem.type === 'line') {
            // For lines, include all coordinate properties
            const oldPosition = {
                x: this.startElementX,
                y: this.startElementY,
                startX: this.startElementX,
                startY: this.startElementY,
                endX: this.originalLineEndX,
                endY: this.originalLineEndY
            };
            const newPosition = {
                x: this.draggedItem['startX'],
                y: this.draggedItem['startY'],
                startX: this.draggedItem['startX'],
                startY: this.draggedItem['startY'],
                endX: this.draggedItem['endX'],
                endY: this.draggedItem['endY']
            };

            // Only create a command if the position actually changed
            if (oldPosition.startX !== newPosition.startX || oldPosition.startY !== newPosition.startY) {
                const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
                historyStore.executeCommand(command);
            }
        } else if (this.draggedItem.type === 'polygon') {
            // For polygons, include both position and points
            const oldPosition = { 
                x: this.startElementX, 
                y: this.startElementY,
                points: this.originalPoints
            };
            const newPosition = { 
                x: this.draggedItem['x'], 
                y: this.draggedItem['y'],
                points: this.draggedItem['points']
            };

            // Only create a command if the position actually changed
            if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
                const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
                historyStore.executeCommand(command);
            }
        } else {
            // For regular items with x/y properties
            const oldPosition = { x: this.startElementX, y: this.startElementY };
            const newPosition = { x: this.draggedItem['x'], y: this.draggedItem['y'] };

            // Only create a command if the position actually changed
            if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
                const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
                historyStore.executeCommand(command);
            }
        }

        // Reset state
        this.isDragging = false;
        this.potentialDragItem = null;
        this.originalPoints = [];

        // Set the flag to prevent immediate deselection
        this.justEndedDragging = true;

        // Reset the flag after a short delay
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

        if (this.draggedItem.type === 'line') {
            // For lines, revert to original positions
            layoutStore.updateElement(this.draggedItem.id, {
                x: this.startElementX,
                y: this.startElementY,
                startX: this.startElementX,
                startY: this.startElementY,
                endX: this.originalLineEndX,
                endY: this.originalLineEndY
            });
        } else {
            // For all other items, revert to original x/y position
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