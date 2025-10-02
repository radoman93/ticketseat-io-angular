import { SelectionStore } from './selection.store';
import { Selectable } from '../services/selection.service';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('SelectionStore', () => {
  let store: SelectionStore;
  let mockSelectable: Selectable;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new SelectionStore();
    mockSelectable = {
      id: 'test-item-1',
      type: 'roundTable',
      x: 100,
      y: 100
    } as Selectable;
  });

  describe('initialization', () => {
    it('should initialize with no selected item', () => {
      expect(store.selectedItem).toBeNull();
    });

    it('should initialize with hasSelection false', () => {
      expect(store.hasSelection).toBe(false);
    });
  });

  describe('selectItem', () => {
    it('should select an item', () => {
      store.selectItem(mockSelectable);

      expect(store.selectedItem).toEqual(mockSelectable);
      expect(store.hasSelection).toBe(true);
    });

    it('should replace previously selected item', () => {
      const firstItem: Selectable = { id: 'item-1', type: 'roundTable', x: 0, y: 0 } as Selectable;
      const secondItem: Selectable = { id: 'item-2', type: 'roundTable', x: 100, y: 100 } as Selectable;

      store.selectItem(firstItem);
      expect(store.selectedItem).toEqual(firstItem);

      store.selectItem(secondItem);
      expect(store.selectedItem).toEqual(secondItem);
      expect(store.selectedItem).not.toEqual(firstItem);
    });
  });

  describe('deselectItem', () => {
    it('should deselect the current item', () => {
      store.selectItem(mockSelectable);
      store.deselectItem();

      expect(store.selectedItem).toBeNull();
      expect(store.hasSelection).toBe(false);
    });

    it('should be safe to call when nothing is selected', () => {
      expect(() => store.deselectItem()).not.toThrow();
      expect(store.selectedItem).toBeNull();
    });
  });

  describe('isItemSelected', () => {
    it('should return true for selected item', () => {
      store.selectItem(mockSelectable);

      expect(store.isItemSelected('test-item-1')).toBe(true);
    });

    it('should return false for non-selected item', () => {
      store.selectItem(mockSelectable);

      expect(store.isItemSelected('other-item')).toBe(false);
    });

    it('should return false when nothing is selected', () => {
      expect(store.isItemSelected('test-item-1')).toBe(false);
    });
  });

  describe('getSelectedItem', () => {
    it('should return the selected item', () => {
      store.selectItem(mockSelectable);

      expect(store.getSelectedItem()).toEqual(mockSelectable);
    });

    it('should return null when nothing is selected', () => {
      expect(store.getSelectedItem()).toBeNull();
    });
  });

  describe('delete handlers', () => {
    let handlerStore: SelectionStore;
    let deleteHandler1: jasmine.Spy;
    let deleteHandler2: jasmine.Spy;

    beforeEach(() => {
      // Create fresh store and spies for delete handler tests to avoid pollution
      handlerStore = new SelectionStore();
      deleteHandler1 = jasmine.createSpy('deleteHandler1');
      deleteHandler2 = jasmine.createSpy('deleteHandler2');
    });

    describe('registerDeleteHandler', () => {
      it('should register a delete handler', () => {
        handlerStore.registerDeleteHandler(deleteHandler1);
        handlerStore.selectItem(mockSelectable);
        handlerStore.requestDeleteItem(mockSelectable);

        expect(deleteHandler1).toHaveBeenCalledWith(mockSelectable);
      });

      it('should allow multiple handlers to be registered', () => {
        handlerStore.registerDeleteHandler(deleteHandler1);
        handlerStore.registerDeleteHandler(deleteHandler2);

        handlerStore.requestDeleteItem(mockSelectable);

        expect(deleteHandler1).toHaveBeenCalledWith(mockSelectable);
        expect(deleteHandler2).toHaveBeenCalledWith(mockSelectable);
      });
    });

    describe('unregisterDeleteHandler', () => {
      it('should unregister a delete handler', () => {
        // Use completely fresh store instance
        const testStore = new SelectionStore();
        const testHandler = jasmine.createSpy('testHandler');

        testStore.registerDeleteHandler(testHandler);

        // Verify registration worked by triggering a delete
        testStore.requestDeleteItem(mockSelectable);
        expect(testHandler).toHaveBeenCalledTimes(1);

        // Reset spy counter
        testHandler.calls.reset();

        // Now unregister and verify it's not called again
        testStore.unregisterDeleteHandler(testHandler);
        testStore.requestDeleteItem(mockSelectable);

        expect(testHandler).not.toHaveBeenCalled();
      });

      it('should only unregister the specified handler', () => {
        // Use completely fresh store instance
        const testStore = new SelectionStore();
        const testHandler1 = jasmine.createSpy('testHandler1');
        const testHandler2 = jasmine.createSpy('testHandler2');

        testStore.registerDeleteHandler(testHandler1);
        testStore.registerDeleteHandler(testHandler2);

        // Verify both are registered by triggering delete
        testStore.requestDeleteItem(mockSelectable);
        expect(testHandler1).toHaveBeenCalledTimes(1);
        expect(testHandler2).toHaveBeenCalledTimes(1);

        // Reset spy counters
        testHandler1.calls.reset();
        testHandler2.calls.reset();

        // Unregister handler1 only
        testStore.unregisterDeleteHandler(testHandler1);
        testStore.requestDeleteItem(mockSelectable);

        // Handler1 should NOT be called, Handler2 SHOULD be called
        expect(testHandler1).not.toHaveBeenCalled();
        expect(testHandler2).toHaveBeenCalledTimes(1);
      });

      it('should be safe to unregister non-existent handler', () => {
        expect(() => handlerStore.unregisterDeleteHandler(deleteHandler1)).not.toThrow();
      });
    });

    describe('requestDeleteItem', () => {
      it('should call all registered handlers', () => {
        handlerStore.registerDeleteHandler(deleteHandler1);
        handlerStore.registerDeleteHandler(deleteHandler2);

        handlerStore.requestDeleteItem(mockSelectable);

        expect(deleteHandler1).toHaveBeenCalledWith(mockSelectable);
        expect(deleteHandler2).toHaveBeenCalledWith(mockSelectable);
      });

      it('should deselect the item after deletion', () => {
        handlerStore.selectItem(mockSelectable);
        handlerStore.requestDeleteItem(mockSelectable);

        expect(handlerStore.selectedItem).toBeNull();
        expect(handlerStore.hasSelection).toBe(false);
      });

      it('should work even with no handlers registered', () => {
        expect(() => handlerStore.requestDeleteItem(mockSelectable)).not.toThrow();
      });
    });

    describe('deleteSelectedItem', () => {
      it('should delete the currently selected item', () => {
        handlerStore.registerDeleteHandler(deleteHandler1);
        handlerStore.selectItem(mockSelectable);

        handlerStore.deleteSelectedItem();

        expect(deleteHandler1).toHaveBeenCalledWith(mockSelectable);
        expect(handlerStore.selectedItem).toBeNull();
      });

      it('should do nothing if no item is selected', () => {
        handlerStore.registerDeleteHandler(deleteHandler1);

        handlerStore.deleteSelectedItem();

        expect(deleteHandler1).not.toHaveBeenCalled();
      });
    });
  });

  describe('hasSelection computed property', () => {
    it('should reactively update when selection changes', () => {
      expect(store.hasSelection).toBe(false);

      store.selectItem(mockSelectable);
      expect(store.hasSelection).toBe(true);

      store.deselectItem();
      expect(store.hasSelection).toBe(false);
    });
  });
});
