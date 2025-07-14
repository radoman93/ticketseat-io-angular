import { action, makeAutoObservable } from 'mobx';
import { layoutStore } from './layout.store';
import { gridStore } from './grid.store';
import { selectionStore } from './selection.store';
import { MoveObjectCommand } from '../commands/move-object.command';
import { HistoryStore } from './history.store';
import { TableElement, SegmentProperties } from '../models/elements.model';

export class DragStore {
    // Track dragging state
    isDragging = false;
    draggedItem: TableElement | null = null;

    // Track initial positions for dragging calculations
    startMouseX = 0;
    startMouseY = 0;
    startElementX = 0;
    startElementY = 0;

    // Store original points for cancel functionality (legacy for future extensibility)
    originalPoints: { x: number, y: number }[] = [];

    // Track potential drag
    potentialDragItem: TableElement | null = null;

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
        item: TableElement,
        mouseX: number,
        mouseY: number
    ) => {
        // For all items, check for x and y properties
        if (!item || !('x' in item) || !('y' in item)) {
            console.warn('Cannot prepare drag for item without position properties:', item);
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
    startDragging = action('startDragging', () => {
        // Only allow dragging if item exists and has appropriate properties
        if (!this.potentialDragItem) {
            console.warn('Cannot drag: no potential drag item');
            return;
        }

        // Check if item has x/y position properties
        if (!('x' in this.potentialDragItem) || !('y' in this.potentialDragItem)) {
            console.warn('Cannot drag item without position properties');
            return;
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
        if (this.draggedItem.type === 'segmentedSeatingRow') {
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

        let oldPosition: { x: number, y: number };
        let newPosition: { x: number, y: number };

        // For regular items with x/y properties
        oldPosition = { x: this.startElementX, y: this.startElementY };
        newPosition = { x: this.draggedItem['x'], y: this.draggedItem['y'] };

        // Only create a command if the position actually changed
        if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
            const command = new MoveObjectCommand(this.draggedItem.id, oldPosition, newPosition);
            historyStore.executeCommand(command);
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

        // For all items, revert to original x/y position
        layoutStore.updateElement(this.draggedItem.id, {
            x: this.startElementX,
            y: this.startElementY
        });

        // Reset state completely when canceled
        this.isDragging = false;
        this.draggedItem = null;
        this.potentialDragItem = null;
        this.originalPoints = [];
    });
}

// Create singleton instance
export const dragStore = new DragStore();