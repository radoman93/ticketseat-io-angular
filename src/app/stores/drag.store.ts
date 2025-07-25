import { action, makeAutoObservable, runInAction } from 'mobx';
import { layoutStore } from './layout.store';
import { gridStore } from './grid.store';
import { selectionStore } from './selection.store';
import { snappingStore } from './snapping.store';
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
    
    // Movement threshold for snapped objects
    private movementThreshold = 5; // pixels - base threshold
    private unsnapThreshold = 12; // pixels - higher threshold for breaking snap
    private hasExceededThreshold = false;
    private accumulatedDeltaX = 0;
    private accumulatedDeltaY = 0;
    private wasSnappedOnStart = false;

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
     * Set movement threshold for snapped objects
     */
    setMovementThreshold = action('setMovementThreshold', (threshold: number) => {
        this.movementThreshold = Math.max(0, Math.min(20, threshold)); // Clamp between 0-20 pixels
        // Unsnap threshold is always higher than movement threshold
        this.unsnapThreshold = Math.max(this.movementThreshold + 5, this.movementThreshold * 2);
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
        
        // Reset movement threshold tracking
        this.hasExceededThreshold = false;
        this.accumulatedDeltaX = 0;
        this.accumulatedDeltaY = 0;
        
        // Check if element is currently snapped by detecting snap targets at current position
        if (snappingStore.config.enableSnapping && this.draggedItem) {
            const currentSnapResult = snappingStore.detectSnapTargets(
                this.draggedItem, 
                this.startElementX, 
                this.startElementY
            );
            this.wasSnappedOnStart = currentSnapResult.guides.length > 0;
        } else {
            this.wasSnappedOnStart = false;
        }
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
        let dx = mouseX - this.startMouseX;
        let dy = mouseY - this.startMouseY;

        // Account for zoom level
        const zoomFactor = gridStore.zoomLevel / 100;
        let canvasDx = dx / zoomFactor;
        let canvasDy = dy / zoomFactor;
        
        // Apply movement threshold logic
        if (!this.hasExceededThreshold) {
            // Accumulate the movement
            this.accumulatedDeltaX = canvasDx;
            this.accumulatedDeltaY = canvasDy;
            
            // Calculate the total movement distance
            const totalMovement = Math.sqrt(
                this.accumulatedDeltaX * this.accumulatedDeltaX + 
                this.accumulatedDeltaY * this.accumulatedDeltaY
            );
            
            // Use higher threshold if element was snapped to prevent easy unsnapping
            const effectiveThreshold = this.wasSnappedOnStart ? this.unsnapThreshold : this.movementThreshold;
            
            // Check if threshold has been exceeded
            if (totalMovement < effectiveThreshold) {
                // Don't move the object yet
                // Clear guides to show element is "locked" in place
                snappingStore.setActiveGuides([]);
                return;
            }
            
            // Threshold exceeded, reset reference points to current position
            this.hasExceededThreshold = true;
            
            // Reset the mouse start position to current mouse position
            // This prevents jumping - the element will start moving from its current position
            this.startMouseX = mouseX;
            this.startMouseY = mouseY;
            
            // Since we reset mouse position, recalculate deltas
            dx = 0;
            dy = 0;
            canvasDx = 0;
            canvasDy = 0;
        }

        // Calculate proposed new position
        let newX = this.startElementX + canvasDx;
        let newY = this.startElementY + canvasDy;

        // Apply element-to-element snapping if enabled
        if (snappingStore.config.enableSnapping) {
            const snapResult = snappingStore.detectSnapTargets(this.draggedItem, newX, newY);
            newX = snapResult.x;
            newY = snapResult.y;
            snappingStore.setActiveGuides(snapResult.guides);
        } 
        // Apply grid snapping only if element snapping is disabled or didn't occur
        else if (gridStore.snapToGrid) {
            const snapped = gridStore.snapCoordinateToGrid(newX, newY);
            newX = snapped.x;
            newY = snapped.y;
            snappingStore.setActiveGuides([]); // Clear guides when grid snapping
        } else {
            snappingStore.setActiveGuides([]); // Clear guides when no snapping
        }

        // Batch all updates using runInAction for better performance
        runInAction(() => {
            // Handle different item types
            if (this.draggedItem!.type === 'line') {
                // For lines, move both start and end points by the same delta
                const deltaToEnd = {
                    x: this.originalLineEndX - this.startElementX,
                    y: this.originalLineEndY - this.startElementY
                };
                
                // Use snapped positions for lines
                const newStartX = newX;
                const newStartY = newY;
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
                Object.assign(this.draggedItem!, update);
                layoutStore.updateElement(this.draggedItem!.id, update);
            } else if (this.draggedItem!.type === 'segmentedSeatingRow') {
                // Use snapped positions for segmented seating rows

                const deltaX = newX - (this.draggedItem as any)['x'];
                const deltaY = newY - (this.draggedItem as any)['y'];

                // Update all segment positions by shifting their start and end coordinates
                if ((this.draggedItem as any)['segments']) {
                    const segments: SegmentProperties[] = (this.draggedItem as any)['segments'];
                    const updatedSegments = segments.map(segment => ({
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
                    Object.assign(this.draggedItem!, update);
                    layoutStore.updateElement(this.draggedItem!.id, update);
                }
            } else if (this.draggedItem!.type === 'polygon') {
                // Use snapped positions for polygons
                
                // Calculate the delta from the current center to the new center
                const deltaX = newX - (this.draggedItem as any)['x'];
                const deltaY = newY - (this.draggedItem as any)['y'];
                
                // Move all points by the same delta
                const currentPoints = (this.draggedItem as any)['points'] || [];
                const newPoints = currentPoints.map((point: {x: number, y: number}) => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                
                const update = { 
                    x: newX, 
                    y: newY, 
                    points: newPoints 
                };
                Object.assign(this.draggedItem!, update);
                layoutStore.updateElement(this.draggedItem!.id, update);
            } else {
                // For all other items (roundTable, rectangleTable, seatingRow), use snapped positions

                const update = { x: newX, y: newY };
                Object.assign(this.draggedItem!, update);
                layoutStore.updateElement(this.draggedItem!.id, update);
            }
        });
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

        // Clear snapping guides and snap state
        snappingStore.setActiveGuides([]);
        snappingStore.clearSnapState();

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
        
        // Clear snapping guides and snap state
        snappingStore.setActiveGuides([]);
        snappingStore.clearSnapState();
    });
}

// Create singleton instance
export const dragStore = new DragStore();