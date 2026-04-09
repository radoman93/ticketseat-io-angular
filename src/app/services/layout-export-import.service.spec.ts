import { LayoutExportImportService, LayoutExportData, LegacyLayoutExportData } from './layout-export-import.service';
import { layoutStore } from '../stores/layout.store';
import { gridStore } from '../stores/grid.store';
import { rootStore } from '../stores/root.store';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('LayoutExportImportService', () => {
  let service: LayoutExportImportService;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    service = new LayoutExportImportService();
    // Clear state before each test
    layoutStore.clearAll();
    rootStore.chairStore.chairs.clear();
  });

  describe('exportLayout', () => {
    it('should export an empty layout with correct structure', () => {
      const result = service.exportLayout('Test Layout', 'A test');

      expect(result.meta).toBeDefined();
      expect(result.meta.version).toBe('1.0');
      expect(result.meta.name).toBe('Test Layout');
      expect(result.meta.description).toBe('A test');
      expect(result.meta.created).toBeTruthy();
      expect(result.settings).toBeDefined();
      expect(result.settings.gridSize).toBe(gridStore.gridSize);
      expect(result.settings.showGrid).toBe(gridStore.showGrid);
      expect(result.settings.showGuides).toBe(gridStore.showGuides);
      expect(result.elements).toEqual([]);
    });

    it('should export elements with nested chairs', () => {
      layoutStore.addElement({
        id: 'rt-1',
        type: 'roundTable',
        x: 100,
        y: 200,
        radius: 50,
        seats: 4,
        openSpaces: 0,
        name: 'Table 1',
        rotation: 0,
        tableLabelVisible: true,
        chairLabelVisible: true
      } as any);

      // Add a chair for this element
      rootStore.chairStore.addChair({
        id: 'rt-1-chair-1',
        tableId: 'rt-1',
        label: '1',
        price: 0,
        position: { angle: 0, distance: 70 },
        reservationStatus: 'free',
        reservedBy: ''
      });

      const result = service.exportLayout('Test');

      expect(result.elements.length).toBe(1);
      expect(result.elements[0].id).toBe('rt-1');
      expect(result.elements[0].chairs).toBeDefined();
      expect(result.elements[0].chairs.length).toBe(1);
      expect(result.elements[0].chairs[0].id).toBe('rt-1-chair-1');
    });

    it('should not add chairs to line elements', () => {
      layoutStore.addElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
        rotation: 0,
        thickness: 2,
        color: '#000'
      } as any);

      const result = service.exportLayout('Test');

      expect(result.elements.length).toBe(1);
      expect(result.elements[0].chairs).toBeUndefined();
    });
  });

  describe('importLayout', () => {
    it('should import a valid layout in replace mode', () => {
      const data: LayoutExportData = {
        meta: { version: '1.0', name: 'Imported', created: new Date().toISOString(), creator: 'test' },
        settings: { gridSize: 25, showGrid: true, showGuides: false },
        elements: [
          {
            id: 'rt-1',
            type: 'roundTable',
            x: 50,
            y: 75,
            radius: 40,
            seats: 6,
            name: 'T1',
            rotation: 0,
            chairs: [
              { id: 'rt-1-chair-1', tableId: 'rt-1', label: '1', price: 0, position: { angle: 0, distance: 60 }, reservationStatus: 'free', reservedBy: '' }
            ]
          }
        ]
      };

      service.importLayout(data, 'replace');

      expect(layoutStore.elements.length).toBe(1);
      expect(layoutStore.elements[0].x).toBe(50);
      expect(rootStore.chairStore.chairs.size).toBe(1);
    });

    it('should clear existing data in replace mode', () => {
      // Add some initial data
      layoutStore.addElement({ id: 'old-1', type: 'roundTable', x: 0, y: 0, rotation: 0, name: 'Old' } as any);

      const data: LayoutExportData = {
        meta: { version: '1.0', name: 'New', created: new Date().toISOString(), creator: 'test' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [
          { id: 'new-1', type: 'roundTable', x: 100, y: 100, rotation: 0, name: 'New' }
        ]
      };

      service.importLayout(data, 'replace');

      expect(layoutStore.elements.length).toBe(1);
      expect(layoutStore.elements[0].id).toBe('new-1');
    });

    it('should throw on invalid data', () => {
      expect(() => {
        service.importLayout({} as any);
      }).toThrowError('Invalid layout data format');
    });

    it('should throw on null data', () => {
      expect(() => {
        service.importLayout(null as any);
      }).toThrowError('Invalid layout data format');
    });

    it('should handle legacy format with separate chairs array', () => {
      const legacyData: LegacyLayoutExportData = {
        meta: { version: '1.0', name: 'Legacy', created: new Date().toISOString(), creator: 'test' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [
          { id: 'rt-1', type: 'roundTable', x: 10, y: 20, rotation: 0, name: 'T1' }
        ],
        chairs: [
          { id: 'rt-1-chair-1', tableId: 'rt-1', label: '1', price: 0, position: { angle: 0, distance: 60 }, reservationStatus: 'free', reservedBy: '' }
        ]
      };

      service.importLayout(legacyData, 'replace');

      expect(layoutStore.elements.length).toBe(1);
      expect(rootStore.chairStore.chairs.size).toBe(1);
    });
  });

  describe('round-trip export→import→export', () => {
    it('should produce identical data after round-trip', () => {
      // Set up a layout with multiple element types
      layoutStore.addElement({
        id: 'rt-1', type: 'roundTable', x: 100, y: 200, radius: 50, seats: 8, openSpaces: 0, name: 'Round 1', rotation: 45, tableLabelVisible: true, chairLabelVisible: true
      } as any);
      layoutStore.addElement({
        id: 'rect-1', type: 'rectangleTable', x: 300, y: 100, width: 120, height: 80,
        upChairs: 3, downChairs: 3, leftChairs: 1, rightChairs: 1, name: 'Rect 1', rotation: 0, tableLabelVisible: true, chairLabelVisible: true
      } as any);
      layoutStore.addElement({
        id: 'line-1', type: 'line', x: 0, y: 0, startX: 0, startY: 0, endX: 200, endY: 200, rotation: 0, thickness: 2, color: '#000'
      } as any);

      // Add chairs
      rootStore.chairStore.addChair({
        id: 'rt-1-chair-1', tableId: 'rt-1', label: '1', price: 0,
        position: { angle: 0, distance: 70 }, reservationStatus: 'free', reservedBy: ''
      });
      rootStore.chairStore.addChair({
        id: 'rt-1-chair-2', tableId: 'rt-1', label: '2', price: 0,
        position: { angle: 45, distance: 70 }, reservationStatus: 'free', reservedBy: ''
      });

      // Export
      const exported1 = service.exportLayout('Round Trip Test');

      // Clear state
      layoutStore.clearAll();
      rootStore.chairStore.chairs.clear();

      // Import
      service.importLayout(exported1, 'replace');

      // Export again
      const exported2 = service.exportLayout('Round Trip Test');

      // Compare (ignoring meta.created which changes)
      expect(exported2.elements.length).toBe(exported1.elements.length);
      expect(exported2.settings).toEqual(exported1.settings);

      // Compare elements (same order, same properties)
      for (let i = 0; i < exported1.elements.length; i++) {
        const e1 = exported1.elements[i];
        const e2 = exported2.elements[i];
        expect(e2.id).toBe(e1.id);
        expect(e2.type).toBe(e1.type);
        expect(e2.x).toBe(e1.x);
        expect(e2.y).toBe(e1.y);

        // Compare chairs if they exist
        if (e1.chairs) {
          expect(e2.chairs).toBeDefined();
          expect(e2.chairs.length).toBe(e1.chairs.length);
          for (let j = 0; j < e1.chairs.length; j++) {
            expect(e2.chairs[j].id).toBe(e1.chairs[j].id);
            expect(e2.chairs[j].tableId).toBe(e1.chairs[j].tableId);
          }
        }
      }
    });

    it('should preserve line elements without chairs in round-trip', () => {
      layoutStore.addElement({
        id: 'line-1', type: 'line', x: 0, y: 0, startX: 10, startY: 20, endX: 200, endY: 300, rotation: 0, thickness: 2, color: '#000'
      } as any);

      const exported1 = service.exportLayout('Line Test');

      layoutStore.clearAll();
      rootStore.chairStore.chairs.clear();

      service.importLayout(exported1, 'replace');

      const exported2 = service.exportLayout('Line Test');

      expect(exported2.elements.length).toBe(1);
      expect(exported2.elements[0].type).toBe('line');
      expect(exported2.elements[0].startX).toBe(10);
      expect(exported2.elements[0].endX).toBe(200);
      expect(exported2.elements[0].chairs).toBeUndefined();
    });
  });

  describe('validateLayoutData', () => {
    it('should reject null', () => {
      expect(service.validateLayoutData(null)).toBe(false);
    });

    it('should reject missing meta', () => {
      expect(service.validateLayoutData({
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: []
      })).toBe(false);
    });

    it('should reject elements with invalid type', () => {
      expect(service.validateLayoutData({
        meta: { version: '1.0', name: 'Test', created: '', creator: '' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [{ id: '1', type: 'invalidType', x: 0, y: 0 }]
      })).toBe(false);
    });

    it('should reject elements with missing id', () => {
      expect(service.validateLayoutData({
        meta: { version: '1.0', name: 'Test', created: '', creator: '' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [{ type: 'roundTable', x: 0, y: 0 }]
      })).toBe(false);
    });

    it('should reject line elements without coordinates', () => {
      expect(service.validateLayoutData({
        meta: { version: '1.0', name: 'Test', created: '', creator: '' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [{ id: '1', type: 'line', x: 0, y: 0 }]
      })).toBe(false);
    });

    it('should accept valid line element', () => {
      expect(service.validateLayoutData({
        meta: { version: '1.0', name: 'Test', created: '', creator: '' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [{ id: '1', type: 'line', x: 0, y: 0, startX: 0, startY: 0, endX: 100, endY: 100 }]
      })).toBe(true);
    });

    it('should reject invalid nested chairs', () => {
      expect(service.validateLayoutData({
        meta: { version: '1.0', name: 'Test', created: '', creator: '' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [{ id: '1', type: 'roundTable', x: 0, y: 0, chairs: [{ invalid: true }] }]
      })).toBe(false);
    });
  });

  describe('getLayoutPreview', () => {
    it('should return correct preview info', () => {
      const data: LayoutExportData = {
        meta: { version: '1.0', name: 'Preview Test', created: '2024-01-01', creator: 'test', description: 'Desc' },
        settings: { gridSize: 50, showGrid: true, showGuides: true },
        elements: [
          { id: '1', type: 'roundTable', x: 0, y: 0 },
          { id: '2', type: 'rectangleTable', x: 0, y: 0 },
          { id: '3', type: 'seatingRow', x: 0, y: 0 },
          { id: '4', type: 'line', x: 0, y: 0 },
          { id: '5', type: 'polygon', x: 0, y: 0 },
          { id: '6', type: 'text', x: 0, y: 0 }
        ]
      };

      const preview = service.getLayoutPreview(data);

      expect(preview.name).toBe('Preview Test');
      expect(preview.description).toBe('Desc');
      expect(preview.elementCount).toBe(6);
      expect(preview.tableCount).toBe(2);
      expect(preview.rowCount).toBe(1);
      expect(preview.lineCount).toBe(1);
      expect(preview.polygonCount).toBe(1);
      expect(preview.textCount).toBe(1);
    });
  });

  describe('importLayoutFromFile', () => {
    it('should reject invalid JSON', async () => {
      const file = new File(['not json'], 'test.ticketseat', { type: 'application/json' });

      await expectAsync(service.importLayoutFromFile(file)).toBeRejectedWithError(/Failed to import layout/);
    });

    it('should reject invalid layout structure', async () => {
      const file = new File(['{"foo": "bar"}'], 'test.ticketseat', { type: 'application/json' });

      await expectAsync(service.importLayoutFromFile(file)).toBeRejectedWithError(/Failed to import layout/);
    });
  });
});
