/**
 * Test helpers for MobX stores
 */
import { configure } from 'mobx';

/**
 * Configure MobX for testing environment
 */
export function setupMobXForTesting(): void {
  configure({
    enforceActions: 'never', // Allow direct mutations in tests
    computedRequiresReaction: false,
    reactionRequiresObservable: false,
    observableRequiresReaction: false,
    disableErrorBoundaries: true
  });
}

/**
 * Reset MobX configuration to default after tests
 */
export function resetMobXConfiguration(): void {
  configure({
    enforceActions: 'observed',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: false
  });
}

/**
 * Wait for MobX reactions to complete
 */
export async function waitForMobXReactions(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock RootStore for testing
 */
export function createMockRootStore() {
  return {
    layoutStore: {
      elements: [],
      addElement: jasmine.createSpy('addElement'),
      removeElement: jasmine.createSpy('removeElement'),
      updateElement: jasmine.createSpy('updateElement'),
      clear: jasmine.createSpy('clear')
    },
    chairStore: {
      chairs: new Map(),
      getChair: jasmine.createSpy('getChair'),
      updateChair: jasmine.createSpy('updateChair')
    },
    selectionStore: {
      selectedElements: [],
      selectElement: jasmine.createSpy('selectElement'),
      deselectAll: jasmine.createSpy('deselectAll')
    },
    gridStore: {
      zoom: 1,
      panX: 0,
      panY: 0,
      gridSize: 20,
      showGrid: true
    },
    toolStore: {
      activeTool: null,
      setActiveTool: jasmine.createSpy('setActiveTool')
    },
    historyStore: {
      canUndo: false,
      canRedo: false,
      undo: jasmine.createSpy('undo'),
      redo: jasmine.createSpy('redo'),
      executeCommand: jasmine.createSpy('executeCommand')
    },
    dragStore: {
      isDragging: false,
      startDrag: jasmine.createSpy('startDrag'),
      endDrag: jasmine.createSpy('endDrag')
    },
    viewerStore: {
      reservedSeats: new Set(),
      selectedSeats: new Set(),
      maxSeats: null,
      toggleSeatSelection: jasmine.createSpy('toggleSeatSelection')
    }
  };
}
