import { LayoutStore, TableElement } from './layout.store';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('LayoutStore', () => {
  let store: LayoutStore;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new LayoutStore();
  });

  describe('initialization', () => {
    it('should initialize with empty elements array', () => {
      expect(store.elements).toEqual([]);
    });

    it('should initialize with null lastAddedId', () => {
      expect(store.lastAddedId).toBeNull();
    });

    it('should have elementCount of 0', () => {
      expect(store.elementCount).toBe(0);
    });
  });

  describe('addElement', () => {
    it('should add a round table with default visibility properties', () => {
      const roundTable: any = {
        id: 'table-1',
        type: 'roundTable',
        x: 100,
        y: 100,
        radius: 50
      };

      const added = store.addElement(roundTable);

      expect(store.elements.length).toBe(1);
      expect((added as any).tableLabelVisible).toBe(true);
      expect((added as any).chairLabelVisible).toBe(true);
      expect(store.lastAddedId).toBe('table-1');
    });

    it('should add a rectangle table with default visibility properties', () => {
      const rectangleTable: any = {
        id: 'table-2',
        type: 'rectangleTable',
        x: 200,
        y: 200,
        width: 100,
        height: 60
      };

      const added = store.addElement(rectangleTable);

      expect(store.elements.length).toBe(1);
      expect((added as any).tableLabelVisible).toBe(true);
      expect((added as any).chairLabelVisible).toBe(true);
    });

    it('should add a seating row with default visibility properties', () => {
      const seatingRow: any = {
        id: 'row-1',
        type: 'seatingRow',
        x: 300,
        y: 300,
        chairCount: 10
      };

      const added = store.addElement(seatingRow);

      expect(store.elements.length).toBe(1);
      expect((added as any).rowLabelVisible).toBe(true);
      expect((added as any).chairLabelVisible).toBe(true);
    });

    it('should add a line with default properties', () => {
      const line: any = {
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0
      };

      const added = store.addElement(line);

      expect(store.elements.length).toBe(1);
      expect((added as any).thickness).toBe(2);
      expect((added as any).color).toBe('#000000');
    });

    it('should add a polygon with default properties', () => {
      const polygon: any = {
        id: 'polygon-1',
        type: 'polygon',
        x: 0,
        y: 0
      };

      const added = store.addElement(polygon);

      expect(store.elements.length).toBe(1);
      expect((added as any).fillColor).toBe('#0000ff');
      expect((added as any).fillOpacity).toBe(0.3);
      expect((added as any).borderColor).toBe('#000000');
      expect((added as any).borderThickness).toBe(2);
      expect((added as any).showBorder).toBe(true);
      expect((added as any).points).toEqual([]);
    });

    it('should add a text element with default properties', () => {
      const text: any = {
        id: 'text-1',
        type: 'text',
        x: 0,
        y: 0
      };

      const added = store.addElement(text);

      expect(store.elements.length).toBe(1);
      expect((added as any).text).toBe('Text Label');
      expect((added as any).fontSize).toBe(14);
      expect((added as any).fontFamily).toBe('Arial');
      expect((added as any).color).toBe('#000000');
    });

    it('should preserve existing visibility properties', () => {
      const table: any = {
        id: 'table-3',
        type: 'roundTable',
        x: 100,
        y: 100,
        radius: 50,
        tableLabelVisible: false,
        chairLabelVisible: false
      };

      const added = store.addElement(table);

      expect((added as any).tableLabelVisible).toBe(false);
      expect((added as any).chairLabelVisible).toBe(false);
    });

    it('should create a copy of the element', () => {
      const original: any = { id: 'test', type: 'roundTable', x: 0, y: 0, radius: 50 };
      const added = store.addElement(original);

      expect(added).not.toBe(original);
      expect(added).toEqual(jasmine.objectContaining(original));
    });
  });

  describe('updateElement', () => {
    beforeEach(() => {
      store.addElement({ id: 'table-1', type: 'roundTable', x: 100, y: 100, radius: 50 } as any);
    });

    it('should update an existing element', () => {
      const updated = store.updateElement('table-1', { x: 200, y: 200 });

      expect(updated).toBeTruthy();
      expect(updated!.x).toBe(200);
      expect(updated!.y).toBe(200);
      expect((updated as any).radius).toBe(50); // Original property preserved
    });

    it('should create a new object reference for change detection', () => {
      const original = store.elements[0];
      const updated = store.updateElement('table-1', { x: 200 });

      expect(updated).not.toBe(original);
    });

    it('should return null for non-existent element', () => {
      const updated = store.updateElement('non-existent', { x: 200 });

      expect(updated).toBeNull();
    });

    it('should update multiple properties at once', () => {
      const updated = store.updateElement('table-1', {
        x: 300,
        y: 400,
        radius: 75,
        rotation: 45
      } as any);

      expect(updated!.x).toBe(300);
      expect(updated!.y).toBe(400);
      expect((updated as any).radius).toBe(75);
      expect((updated as any).rotation).toBe(45);
    });
  });

  describe('deleteElement', () => {
    beforeEach(() => {
      store.addElement({ id: 'table-1', type: 'roundTable', x: 100, y: 100, radius: 50 } as any);
      store.addElement({ id: 'table-2', type: 'roundTable', x: 200, y: 200, radius: 50 } as any);
    });

    it('should delete an existing element', () => {
      const result = store.deleteElement('table-1');

      expect(result).toBe(true);
      expect(store.elements.length).toBe(1);
      expect(store.elements[0].id).toBe('table-2');
    });

    it('should return false for non-existent element', () => {
      const result = store.deleteElement('non-existent');

      expect(result).toBe(false);
      expect(store.elements.length).toBe(2);
    });

    it('should handle deleting the last element', () => {
      store.deleteElement('table-1');
      store.deleteElement('table-2');

      expect(store.elements.length).toBe(0);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      store.addElement({ id: 'table-1', type: 'roundTable', x: 0, y: 0, radius: 50 } as any);
      store.addElement({ id: 'table-2', type: 'rectangleTable', x: 0, y: 0, width: 100, height: 60 } as any);
      store.addElement({ id: 'row-1', type: 'seatingRow', x: 0, y: 0, chairCount: 10 } as any);
      store.addElement({ id: 'line-1', type: 'line', x: 0, y: 0 } as any);
      store.addElement({ id: 'polygon-1', type: 'polygon', x: 0, y: 0 } as any);
      store.addElement({ id: 'text-1', type: 'text', x: 0, y: 0 } as any);
    });

    it('should calculate elementCount correctly', () => {
      expect(store.elementCount).toBe(6);
    });

    it('should calculate roundTableCount correctly', () => {
      expect(store.roundTableCount).toBe(1);
    });

    it('should calculate rectangleTableCount correctly', () => {
      expect(store.rectangleTableCount).toBe(1);
    });

    it('should calculate seatingRowCount correctly', () => {
      expect(store.seatingRowCount).toBe(1);
    });

    it('should calculate lineCount correctly', () => {
      expect(store.lineCount).toBe(1);
    });

    it('should calculate polygonCount correctly', () => {
      expect(store.polygonCount).toBe(1);
    });

    it('should calculate textCount correctly', () => {
      expect(store.textCount).toBe(1);
    });
  });

  describe('getElements', () => {
    it('should return all elements', () => {
      store.addElement({ id: 'table-1', type: 'roundTable', x: 0, y: 0, radius: 50 } as any);
      store.addElement({ id: 'table-2', type: 'roundTable', x: 0, y: 0, radius: 50 } as any);

      const elements = store.getElements();

      expect(elements.length).toBe(2);
      expect(elements).toBe(store.elements);
    });
  });

  describe('clearAll', () => {
    it('should clear all elements', () => {
      store.addElement({ id: 'table-1', type: 'roundTable', x: 0, y: 0, radius: 50 } as any);
      store.addElement({ id: 'table-2', type: 'roundTable', x: 0, y: 0, radius: 50 } as any);

      store.clearAll();

      expect(store.elements.length).toBe(0);
      expect(store.elementCount).toBe(0);
    });
  });
});
