import { DragStore } from './drag.store';
import { layoutStore, TableElement } from './layout.store';
import { gridStore } from './grid.store';
import { selectionStore } from './selection.store';
import { snappingStore } from './snapping.store';
import { HistoryStore } from './history.store';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('DragStore', () => {
  let store: DragStore;
  let historyStore: HistoryStore;
  let testElement: TableElement;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new DragStore();
    historyStore = new HistoryStore();

    // Clear layout
    layoutStore.clearAll();

    // Add a test element using 'as any' to match the union type
    testElement = layoutStore.addElement({
      id: 'test-rt-1',
      type: 'roundTable',
      x: 100,
      y: 200,
      radius: 50,
      seats: 8,
      openSpaces: 0,
      name: 'Test Table',
      rotation: 0,
      tableLabelVisible: true,
      chairLabelVisible: true
    } as any);
  });

  describe('initial state', () => {
    it('should not be dragging initially', () => {
      expect(store.isDragging).toBe(false);
      expect(store.draggedItem).toBeNull();
      expect(store.potentialDragItem).toBeNull();
      expect(store.justEndedDragging).toBe(false);
    });
  });

  describe('prepareForDragging', () => {
    it('should set potential drag item', () => {
      store.prepareForDragging(testElement, 150, 250);

      expect(store.potentialDragItem?.id).toBe(testElement.id);
      expect(store.startMouseX).toBe(150);
      expect(store.startMouseY).toBe(250);
      expect(store.startElementX).toBe(100);
      expect(store.startElementY).toBe(200);
      expect(store.isDragging).toBe(false);
    });

    it('should not prepare for null item', () => {
      store.prepareForDragging(null as any, 0, 0);

      expect(store.potentialDragItem).toBeNull();
    });

    it('should store line coordinates for line elements', () => {
      const lineElement = layoutStore.addElement({
        id: 'line-1',
        type: 'line',
        x: 10,
        y: 20,
        startX: 10,
        startY: 20,
        endX: 110,
        endY: 120,
        rotation: 0,
        thickness: 2,
        color: '#000'
      } as any);

      store.prepareForDragging(lineElement, 50, 60);

      expect(store.startElementX).toBe(10);
      expect(store.startElementY).toBe(20);
      expect(store.originalLineEndX).toBe(110);
      expect(store.originalLineEndY).toBe(120);
    });
  });

  describe('startDragging', () => {
    it('should transition from prepare to dragging', () => {
      store.prepareForDragging(testElement, 150, 250);
      store.startDragging();

      expect(store.isDragging).toBe(true);
      expect(store.draggedItem?.id).toBe(testElement.id);
      expect(store.potentialDragItem).toBeNull();
    });

    it('should not start without a potential drag item', () => {
      store.startDragging();

      expect(store.isDragging).toBe(false);
      expect(store.draggedItem).toBeNull();
    });

    it('should select the dragged item', () => {
      store.prepareForDragging(testElement, 150, 250);
      store.startDragging();

      expect(selectionStore.selectedItem?.id).toBe(testElement.id);
    });
  });

  describe('updateDragPosition', () => {
    beforeEach(() => {
      gridStore.zoomLevel = 100;
    });

    it('should not update if not dragging', () => {
      store.updateDragPosition(200, 300);
      expect(store.isDragging).toBe(false);
    });

    it('should update element position after threshold exceeded', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();

      // Move beyond the threshold
      store.updateDragPosition(120, 220);

      expect(store.isDragging).toBe(true);
    });

    it('should not move element before threshold is exceeded', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();

      // Move less than threshold
      store.updateDragPosition(101, 201);

      // Element should not have moved
      expect(testElement.x).toBe(100);
      expect(testElement.y).toBe(200);
    });
  });

  describe('endDragging', () => {
    it('should end dragging state', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();
      store.updateDragPosition(200, 300);

      store.endDragging(historyStore);

      expect(store.isDragging).toBe(false);
      expect(store.justEndedDragging).toBe(true);
    });

    it('should not create history command if position unchanged', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();

      store.endDragging(historyStore);

      expect(store.isDragging).toBe(false);
      expect(historyStore.canUndo).toBe(false);
    });

    it('should clear snapping guides on end', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();
      store.endDragging(historyStore);

      expect(snappingStore.activeGuides).toEqual([]);
    });

    it('should set justEndedDragging flag on end', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();
      store.endDragging(historyStore);

      expect(store.justEndedDragging).toBe(true);
    });
  });

  describe('cancelDragging', () => {
    it('should revert to original position', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();
      store.updateDragPosition(300, 400);

      store.cancelDragging();

      expect(store.isDragging).toBe(false);
      expect(store.draggedItem).toBeNull();
      expect(testElement.x).toBe(100);
      expect(testElement.y).toBe(200);
    });

    it('should do nothing if not dragging', () => {
      store.cancelDragging();
      expect(store.isDragging).toBe(false);
    });
  });

  describe('full drag lifecycle', () => {
    it('should complete prepare→start→update→end cycle', () => {
      gridStore.zoomLevel = 100;

      store.prepareForDragging(testElement, 100, 200);
      expect(store.potentialDragItem).toBeTruthy();

      store.startDragging();
      expect(store.isDragging).toBe(true);
      expect(store.potentialDragItem).toBeNull();

      store.updateDragPosition(120, 220);
      store.updateDragPosition(150, 250);
      store.updateDragPosition(200, 300);

      store.endDragging(historyStore);
      expect(store.isDragging).toBe(false);
    });

    it('should complete prepare→start→cancel cycle', () => {
      store.prepareForDragging(testElement, 100, 200);
      store.startDragging();
      store.updateDragPosition(300, 400);

      store.cancelDragging();

      expect(store.isDragging).toBe(false);
      expect(testElement.x).toBe(100);
      expect(testElement.y).toBe(200);
    });
  });
});
