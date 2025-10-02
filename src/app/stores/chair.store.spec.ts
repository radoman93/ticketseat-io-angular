import { ChairStore } from './chair.store';
import { Chair } from '../models/chair.model';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('ChairStore', () => {
  let store: ChairStore;
  let mockChair: Chair;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new ChairStore();
    mockChair = {
      id: 'chair-1',
      tableId: 'table-1',
      label: '1',
      price: 25.00,
      position: { angle: 0, distance: 70 },
      isSelected: false,
      reservationStatus: 'free'
    };
  });

  describe('initialization', () => {
    it('should initialize with empty chairs map', () => {
      expect(store.chairs.size).toBe(0);
    });

    it('should initialize with no selected chair', () => {
      expect(store.selectedChairId).toBeNull();
      expect(store.selectedChair).toBeNull();
    });

    it('should initialize with no panel position', () => {
      expect(store.panelPosition).toBeNull();
    });
  });

  describe('addChair', () => {
    it('should add a chair to the store', () => {
      store.addChair(mockChair);

      expect(store.chairs.size).toBe(1);
      expect(store.chairs.get('chair-1')).toEqual(mockChair);
    });

    it('should add multiple chairs', () => {
      const chair2: Chair = { ...mockChair, id: 'chair-2', label: '2' };

      store.addChair(mockChair);
      store.addChair(chair2);

      expect(store.chairs.size).toBe(2);
    });
  });

  describe('removeChair', () => {
    beforeEach(() => {
      store.addChair(mockChair);
    });

    it('should remove a chair from the store', () => {
      store.removeChair('chair-1');

      expect(store.chairs.size).toBe(0);
      expect(store.chairs.get('chair-1')).toBeUndefined();
    });

    it('should deselect chair if it was selected', () => {
      store.selectChair('chair-1');
      store.removeChair('chair-1');

      expect(store.selectedChairId).toBeNull();
      expect(store.panelPosition).toBeNull();
    });

    it('should not affect selection of other chairs', () => {
      const chair2: Chair = { ...mockChair, id: 'chair-2' };
      store.addChair(chair2);
      store.selectChair('chair-2');

      store.removeChair('chair-1');

      expect(store.selectedChairId).toBe('chair-2');
    });
  });

  describe('selectChair', () => {
    beforeEach(() => {
      store.addChair(mockChair);
    });

    it('should select a chair', () => {
      store.selectChair('chair-1');

      expect(store.selectedChairId).toBe('chair-1');
      const chair = store.chairs.get('chair-1');
      expect(chair?.isSelected).toBe(true);
    });

    it('should deselect previously selected chair', () => {
      const chair2: Chair = { ...mockChair, id: 'chair-2', label: '2', isSelected: false };
      store.addChair(chair2);

      store.selectChair('chair-1');
      const chair1 = store.chairs.get('chair-1');
      expect(chair1?.isSelected).toBe(true);

      store.selectChair('chair-2');
      const updatedChair1 = store.chairs.get('chair-1');
      const updatedChair2 = store.chairs.get('chair-2');
      expect(updatedChair1?.isSelected).toBe(false);
      expect(updatedChair2?.isSelected).toBe(true);
    });

    it('should handle selecting non-existent chair gracefully', () => {
      expect(() => store.selectChair('non-existent')).not.toThrow();
      expect(store.selectedChairId).toBe('non-existent');
    });
  });

  describe('deselectChair', () => {
    beforeEach(() => {
      store.addChair(mockChair);
      store.selectChair('chair-1');
    });

    it('should deselect the current chair', () => {
      store.deselectChair();

      expect(store.selectedChairId).toBeNull();
      expect(mockChair.isSelected).toBe(false);
    });

    it('should clear panel position', () => {
      store.setPanelPosition(100, 200);
      store.deselectChair();

      expect(store.panelPosition).toBeNull();
    });

    it('should be safe to call when no chair is selected', () => {
      store.deselectChair();
      expect(() => store.deselectChair()).not.toThrow();
    });
  });

  describe('updateChair', () => {
    beforeEach(() => {
      store.addChair(mockChair);
    });

    it('should update chair properties', () => {
      store.updateChair('chair-1', { label: 'A1', price: 50.00 });

      const chair = store.chairs.get('chair-1');
      expect(chair?.label).toBe('A1');
      expect(chair?.price).toBe(50.00);
    });

    it('should update chair state flags', () => {
      store.updateChair('chair-1', {
        reservationStatus: 'reserved',
        reservedBy: 'John Doe'
      });

      const chair = store.chairs.get('chair-1');
      expect(chair?.reservationStatus).toBe('reserved');
      expect(chair?.reservedBy).toBe('John Doe');
    });

    it('should handle non-existent chair gracefully', () => {
      expect(() => store.updateChair('non-existent', { label: 'X' })).not.toThrow();
    });
  });

  describe('setPanelPosition', () => {
    it('should set panel position', () => {
      store.setPanelPosition(150, 250);

      expect(store.panelPosition).toEqual({ x: 150, y: 250 });
    });

    it('should update existing panel position', () => {
      store.setPanelPosition(100, 100);
      store.setPanelPosition(200, 200);

      expect(store.panelPosition).toEqual({ x: 200, y: 200 });
    });
  });

  describe('selectedChair computed property', () => {
    beforeEach(() => {
      store.addChair(mockChair);
    });

    it('should return selected chair', () => {
      store.selectChair('chair-1');

      expect(store.selectedChair).toEqual(jasmine.objectContaining({ id: 'chair-1' }));
    });

    it('should return null when no chair is selected', () => {
      expect(store.selectedChair).toBeNull();
    });

    it('should return null when selected chair does not exist', () => {
      store.selectedChairId = 'non-existent';

      expect(store.selectedChair).toBeNull();
    });
  });

  describe('getChairsByTable', () => {
    beforeEach(() => {
      store.addChair(mockChair);
      store.addChair({ ...mockChair, id: 'chair-2', label: '2' });
      store.addChair({ ...mockChair, id: 'chair-3', tableId: 'table-2', label: '3' });
    });

    it('should return all chairs for a specific table', () => {
      const chairs = store.getChairsByTable('table-1');

      expect(chairs.length).toBe(2);
      expect(chairs.every(c => c.tableId === 'table-1')).toBe(true);
    });

    it('should return empty array for table with no chairs', () => {
      const chairs = store.getChairsByTable('table-99');

      expect(chairs).toEqual([]);
    });
  });

  describe('isChairSelected', () => {
    beforeEach(() => {
      store.addChair(mockChair);
    });

    it('should return true for selected chair', () => {
      store.selectChair('chair-1');

      expect(store.isChairSelected('chair-1')).toBe(true);
    });

    it('should return false for non-selected chair', () => {
      expect(store.isChairSelected('chair-1')).toBe(false);
    });

    it('should return false for non-existent chair', () => {
      expect(store.isChairSelected('non-existent')).toBe(false);
    });
  });

  describe('generateChairsForTable', () => {
    it('should generate chairs in circular pattern', () => {
      const chairs = store.generateChairsForTable('table-1', 8, 50);

      expect(chairs.length).toBe(8);
      expect(chairs[0].position.angle).toBe(0);
      expect(chairs[1].position.angle).toBe(45);
      expect(chairs[7].position.angle).toBe(315);
    });

    it('should set correct table association', () => {
      const chairs = store.generateChairsForTable('table-1', 4, 50);

      expect(chairs.every(c => c.tableId === 'table-1')).toBe(true);
    });

    it('should assign sequential labels', () => {
      const chairs = store.generateChairsForTable('table-1', 4, 50);

      expect(chairs[0].label).toBe('1');
      expect(chairs[1].label).toBe('2');
      expect(chairs[2].label).toBe('3');
      expect(chairs[3].label).toBe('4');
    });

    it('should set default price', () => {
      const chairs = store.generateChairsForTable('table-1', 2, 50);

      expect(chairs.every(c => c.price === 25.00)).toBe(true);
    });

    it('should position chairs at correct distance', () => {
      const radius = 50;
      const chairs = store.generateChairsForTable('table-1', 4, radius);

      // Distance should be radius + 20 (default chair offset)
      expect(chairs.every(c => c.position.distance === 70)).toBe(true);
    });
  });
});
