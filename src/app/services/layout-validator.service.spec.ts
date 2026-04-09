import { LayoutValidatorService } from './layout-validator.service';
import { ElementType } from '../models/layout.model';

describe('LayoutValidatorService', () => {
  let service: LayoutValidatorService;

  beforeEach(() => {
    service = new LayoutValidatorService();
  });

  describe('validateLayout', () => {
    it('should reject null layout', () => {
      const result = service.validateLayout(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout data is empty');
    });

    it('should reject undefined layout', () => {
      const result = service.validateLayout(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout data is empty');
    });

    it('should reject empty object', () => {
      const result = service.validateLayout({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject layout without version', () => {
      const result = service.validateLayout({
        name: 'Test',
        elements: []
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout version is missing');
    });

    it('should reject layout without name', () => {
      const result = service.validateLayout({
        version: '1.0',
        elements: []
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout name is missing');
    });

    it('should reject layout with non-array elements', () => {
      const result = service.validateLayout({
        version: '1.0',
        name: 'Test',
        elements: 'not an array'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout elements must be an array');
    });

    it('should accept valid layout with no elements', () => {
      const result = service.validateLayout({
        version: '1.0',
        name: 'Test',
        elements: []
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate all elements in the array', () => {
      const result = service.validateLayout({
        version: '1.0',
        name: 'Test',
        elements: [
          { id: '1', type: ElementType.ROUND_TABLE, x: 0, y: 0, rotation: 0, radius: 50, seats: 8 },
          { type: ElementType.ROUND_TABLE, x: 0, y: 0, rotation: 0 } // Missing id, radius, seats
        ]
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('index 1'))).toBe(true);
    });
  });

  describe('element validation', () => {
    function validateWithElement(element: any) {
      return service.validateLayout({
        version: '1.0',
        name: 'Test',
        elements: [element]
      });
    }

    it('should reject element without id', () => {
      const result = validateWithElement({ type: 'roundTable', x: 0, y: 0, rotation: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing id');
    });

    it('should reject element without type', () => {
      const result = validateWithElement({ id: '1', x: 0, y: 0, rotation: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing type');
    });

    it('should reject element without coordinates', () => {
      const result = validateWithElement({ id: '1', type: 'roundTable', rotation: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing x');
    });

    it('should reject element without rotation', () => {
      const result = validateWithElement({ id: '1', type: 'roundTable', x: 0, y: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing rotation');
    });

    describe('round table validation', () => {
      it('should accept valid round table', () => {
        const result = validateWithElement({
          id: '1', type: ElementType.ROUND_TABLE, x: 0, y: 0, rotation: 0, radius: 50, seats: 8
        });
        expect(result.valid).toBe(true);
      });

      it('should reject round table without radius', () => {
        const result = validateWithElement({
          id: '1', type: ElementType.ROUND_TABLE, x: 0, y: 0, rotation: 0, seats: 8
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('radius');
      });

      it('should reject round table without seats', () => {
        const result = validateWithElement({
          id: '1', type: ElementType.ROUND_TABLE, x: 0, y: 0, rotation: 0, radius: 50
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('seats');
      });
    });

    describe('rectangle table validation', () => {
      it('should accept valid rectangle table', () => {
        const result = validateWithElement({
          id: '1', type: ElementType.RECTANGLE_TABLE, x: 0, y: 0, rotation: 0,
          width: 120, height: 80, upChairs: 4, downChairs: 4, leftChairs: 0, rightChairs: 0
        });
        expect(result.valid).toBe(true);
      });

      it('should reject rectangle table without dimensions', () => {
        const result = validateWithElement({
          id: '1', type: ElementType.RECTANGLE_TABLE, x: 0, y: 0, rotation: 0,
          upChairs: 4, downChairs: 4, leftChairs: 0, rightChairs: 0
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('width');
      });
    });

    describe('unknown type handling', () => {
      it('should reject unknown element type', () => {
        const result = validateWithElement({
          id: '1', type: 'unknownType', x: 0, y: 0, rotation: 0
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Unknown element type');
      });
    });
  });
});
