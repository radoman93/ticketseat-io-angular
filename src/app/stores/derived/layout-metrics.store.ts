import { makeAutoObservable, computed, reaction } from 'mobx';
import { layoutStore } from '../layout.store';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties, LineProperties, PolygonProperties } from '../../services/selection.service';

// Union type for table elements - import from layout store to keep consistency
import type { TableElement } from '../layout.store';

/**
 * Interface for metrics about the current layout
 */
export interface LayoutMetrics {
  totalTables: number;
  totalSeats: number;
  totalCapacity: number;
  tableTypes: { [type: string]: number };
  averageSeatsPerTable: number;
  density: number;
  boundingBox: { x: number, y: number, width: number, height: number };
}

/**
 * LayoutMetricsStore calculates and provides computed metrics
 * derived from the base layout store.
 */
export class LayoutMetricsStore {
  constructor() {
    makeAutoObservable(this, {
      // Mark computed properties
      metrics: computed,
      totalTables: computed,
      totalSeats: computed,
      totalCapacity: computed,
      tableTypeCounts: computed,
      boundingBox: computed,
      averageSeatsPerTable: computed,
      density: computed,
      totalArea: computed,
      tablesBySize: computed,
      boundingBoxTables: computed,
      tableDistribution: computed,
      emptySpacePercentage: computed
    });

    // Setup reactions if needed
    reaction(
      () => this.metrics,
      (metrics) => {
        console.log('Layout metrics updated:', metrics);
        // Can trigger other side effects here when metrics change
      }
    );
  }

  /**
   * The total number of tables in the layout
   */
  get totalTables() {
    return layoutStore.elements.filter(e => e.type.includes('Table') || e.type === 'seatingRow').length;
  }

  /**
   * The total number of seats across all tables
   */
  get totalSeats() {
    return layoutStore.elements
      .filter(e => e.type.includes('Table') || e.type === 'seatingRow')
      .reduce((sum, element) => {
        if (element.type === 'roundTable') {
          return sum + ((element as RoundTableProperties).seats || 0);
        } else if (element.type === 'rectangleTable') {
          const rectTable = element as RectangleTableProperties;
          return sum + (rectTable.upChairs + rectTable.downChairs + rectTable.leftChairs + rectTable.rightChairs);
        } else if (element.type === 'seatingRow') {
          return sum + ((element as SeatingRowProperties).seatCount || 0);
        }
        return sum;
      }, 0);
  }

  /**
   * The total capacity including standing room elements
   */
  get totalCapacity() {
    const tableSeats = this.totalSeats;
    const standingCapacity = layoutStore.elements
      .filter(e => e.type === 'standingArea')
      .reduce((sum, area) => sum + (area['capacity'] || 0), 0);
    
    return tableSeats + standingCapacity;
  }

  /**
   * Count of each table type
   */
  get tableTypeCounts() {
    const counts: { [type: string]: number } = {};
    
    layoutStore.elements
      .filter(e => e.type.includes('Table') || e.type === 'seatingRow')
      .forEach(element => {
        counts[element.type] = (counts[element.type] || 0) + 1;
      });
    
    return counts;
  }

  /**
   * Calculate the bounding box of all elements
   */
  get boundingBox() {
    if (layoutStore.elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    layoutStore.elements.forEach(element => {
      // Handle different element types
      if (element.type.includes('Table')) {
        if (element.type === 'roundTable') {
          const radius = (element as RoundTableProperties).radius || 0;
          minX = Math.min(minX, element.x - radius);
          minY = Math.min(minY, element.y - radius);
          maxX = Math.max(maxX, element.x + radius);
          maxY = Math.max(maxY, element.y + radius);
        } else {
          const rectTable = element as RectangleTableProperties;
          const halfWidth = rectTable.width / 2;
          const halfHeight = rectTable.height / 2;
          minX = Math.min(minX, element.x - halfWidth);
          minY = Math.min(minY, element.y - halfHeight);
          maxX = Math.max(maxX, element.x + halfWidth);
          maxY = Math.max(maxY, element.y + halfHeight);
        }
      } else if (element.type === 'seatingRow') {
        const seatingRow = element as SeatingRowProperties;
        minX = Math.min(minX, Math.min(seatingRow.x, seatingRow.endX) - 20);
        minY = Math.min(minY, Math.min(seatingRow.y, seatingRow.endY) - 20);
        maxX = Math.max(maxX, Math.max(seatingRow.x, seatingRow.endX) + 20);
        maxY = Math.max(maxY, Math.max(seatingRow.y, seatingRow.endY) + 20);
      } else if (element.type === 'line') {
        const line = element as LineProperties;
        if (line.points && line.points.length > 0) {
          line.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      } else if (element.type === 'polygon') {
        const polygon = element as PolygonProperties;
        if (polygon.points && polygon.points.length > 0) {
          polygon.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      } else if (element.type === 'rectangle' || element.type === 'standingArea') {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + (element['width'] || 0));
        maxY = Math.max(maxY, element.y + (element['height'] || 0));
      }
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate average seats per table
   */
  get averageSeatsPerTable() {
    if (this.totalTables === 0) return 0;
    return this.totalSeats / this.totalTables;
  }

  /**
   * Calculate layout density (capacity per square unit)
   */
  get density() {
    const box = this.boundingBox;
    const area = box.width * box.height;
    
    if (area === 0) return 0;
    return this.totalCapacity / area;
  }

  /**
   * Combine all metrics into a single object
   */
  get metrics(): LayoutMetrics {
    return {
      totalTables: this.totalTables,
      totalSeats: this.totalSeats,
      totalCapacity: this.totalCapacity,
      tableTypes: this.tableTypeCounts,
      averageSeatsPerTable: this.averageSeatsPerTable,
      density: this.density,
      boundingBox: this.boundingBox
    };
  }

  /**
   * Group tables by size (small, medium, large)
   */
  get tablesBySize(): { small: number, medium: number, large: number } {
    const elements = layoutStore.elements.filter(e => e.type.includes('Table') || e.type === 'seatingRow');
    return {
      small: elements.filter(e => {
        if (e.type === 'roundTable') {
          return (e as RoundTableProperties).radius < 40;
        } else if (e.type === 'rectangleTable') {
          const rectTable = e as RectangleTableProperties;
          return Math.max(rectTable.width, rectTable.height) < 80;
        } else if (e.type === 'seatingRow') {
          return (e as SeatingRowProperties).seatCount <= 3;
        }
        return false;
      }).length,
      medium: elements.filter(e => {
        if (e.type === 'roundTable') {
          const radius = (e as RoundTableProperties).radius;
          return radius >= 40 && radius < 60;
        } else if (e.type === 'rectangleTable') {
          const rectTable = e as RectangleTableProperties;
          const maxDim = Math.max(rectTable.width, rectTable.height);
          return maxDim >= 80 && maxDim < 120;
        } else if (e.type === 'seatingRow') {
          const seatCount = (e as SeatingRowProperties).seatCount;
          return seatCount > 3 && seatCount <= 8;
        }
        return false;
      }).length,
      large: elements.filter(e => {
        if (e.type === 'roundTable') {
          return (e as RoundTableProperties).radius >= 60;
        } else if (e.type === 'rectangleTable') {
          const rectTable = e as RectangleTableProperties;
          return Math.max(rectTable.width, rectTable.height) >= 120;
        } else if (e.type === 'seatingRow') {
          return (e as SeatingRowProperties).seatCount > 8;
        }
        return false;
      }).length
    };
  }

  /**
   * Calculate the bounding box of all tables
   */
  get boundingBoxTables(): { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number } {
    const tables = layoutStore.elements.filter(e => e.type.includes('Table') || e.type === 'seatingRow');
    
    if (tables.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    
    tables.forEach(table => {
      if (table.type === 'roundTable') {
        const radius = (table as RoundTableProperties).radius || 0;
        minX = Math.min(minX, table.x - radius);
        minY = Math.min(minY, table.y - radius);
        maxX = Math.max(maxX, table.x + radius);
        maxY = Math.max(maxY, table.y + radius);
      } else if (table.type === 'rectangleTable') {
        const rectTable = table as RectangleTableProperties;
        const halfWidth = rectTable.width / 2;
        const halfHeight = rectTable.height / 2;
        minX = Math.min(minX, table.x - halfWidth);
        minY = Math.min(minY, table.y - halfHeight);
        maxX = Math.max(maxX, table.x + halfWidth);
        maxY = Math.max(maxY, table.y + halfHeight);
      } else if (table.type === 'seatingRow') {
        const seatingRow = table as SeatingRowProperties;
        minX = Math.min(minX, Math.min(seatingRow.x, seatingRow.endX) - 20);
        minY = Math.min(minY, Math.min(seatingRow.y, seatingRow.endY) - 20);
        maxX = Math.max(maxX, Math.max(seatingRow.x, seatingRow.endX) + 20);
        maxY = Math.max(maxY, Math.max(seatingRow.y, seatingRow.endY) + 20);
      }
    });
    
    return { 
      minX, 
      minY, 
      maxX, 
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  /**
   * Calculate distribution of tables across the layout (in quadrants)
   */
  get tableDistribution(): { topLeft: number, topRight: number, bottomLeft: number, bottomRight: number } {
    const elements = layoutStore.elements.filter(e => e.type.includes('Table') || e.type === 'seatingRow');
    const bb = this.boundingBoxTables;
    const centerX = (bb.minX + bb.maxX) / 2;
    const centerY = (bb.minY + bb.maxY) / 2;
    
    return {
      topLeft: elements.filter(t => t.x <= centerX && t.y <= centerY).length,
      topRight: elements.filter(t => t.x > centerX && t.y <= centerY).length,
      bottomLeft: elements.filter(t => t.x <= centerX && t.y > centerY).length,
      bottomRight: elements.filter(t => t.x > centerX && t.y > centerY).length
    };
  }
  
  /**
   * Calculate the total area occupied by all tables (approx)
   */
  get totalArea(): number {
    return layoutStore.elements
      .filter(e => e.type.includes('Table') || e.type === 'seatingRow')
      .reduce((sum, element) => {
        if (element.type === 'roundTable') {
          // For round tables, area = πr²
          const radius = (element as RoundTableProperties).radius || 0;
          return sum + (Math.PI * Math.pow(radius, 2));
        } else if (element.type === 'rectangleTable') {
          // For rectangle tables, area = width * height
          const rectTable = element as RectangleTableProperties;
          return sum + (rectTable.width * rectTable.height);
        } else if (element.type === 'seatingRow') {
          // For seating rows, approximate area as length * width (assuming 30px width)
          const seatingRow = element as SeatingRowProperties;
          const dx = seatingRow.endX - seatingRow.x;
          const dy = seatingRow.endY - seatingRow.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          return sum + (length * 30); // 30px width approximation
        }
        return sum;
      }, 0);
  }
  
  /**
   * Calculate percentage of empty space within the bounding box
   */
  get emptySpacePercentage(): number {
    const bb = this.boundingBoxTables;
    const totalBoundingArea = bb.width * bb.height;
    
    if (totalBoundingArea === 0) return 0;
    
    const occupiedArea = this.totalArea;
    return Math.max(0, Math.min(100, ((totalBoundingArea - occupiedArea) / totalBoundingArea) * 100));
  }
  
  /**
   * Find tables that are potentially too close to each other
   */
  getCloseProximityTables(proximityThreshold: number = 10): TableElement[][] {
    const elements = layoutStore.elements.filter(e => e.type.includes('Table') || e.type === 'seatingRow');
    const result: TableElement[][] = [];
    
    // Check each pair of elements
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const table1 = elements[i];
        const table2 = elements[j];
        
        // Calculate distance between element centers
        const distance = Math.sqrt(
          Math.pow(table1.x - table2.x, 2) + 
          Math.pow(table1.y - table2.y, 2)
        );
        
        // For different element types, calculate effective radius
        const getEffectiveRadius = (element: TableElement): number => {
          if (element.type === 'roundTable') {
            return (element as RoundTableProperties).radius;
          } else if (element.type === 'rectangleTable') {
            // For rectangle tables, use half diagonal as effective radius
            const rectTable = element as RectangleTableProperties;
            return Math.sqrt(rectTable.width * rectTable.width + rectTable.height * rectTable.height) / 2;
          } else if (element.type === 'seatingRow') {
            // For seating rows, calculate distance from start to end point
            const seatingRow = element as SeatingRowProperties;
            const dx = seatingRow.endX - seatingRow.x;
            const dy = seatingRow.endY - seatingRow.y;
            return Math.sqrt(dx * dx + dy * dy) / 2;
          } else if (element.type === 'line') {
            // For lines, calculate bounding box diagonal / 2
            const line = element as LineProperties;
            if (!line.points || line.points.length < 2) return 0;
            
            let minX = line.points[0].x, maxX = line.points[0].x;
            let minY = line.points[0].y, maxY = line.points[0].y;
            
            line.points.forEach(point => {
              minX = Math.min(minX, point.x);
              maxX = Math.max(maxX, point.x);
              minY = Math.min(minY, point.y);
              maxY = Math.max(maxY, point.y);
            });
            
            const width = maxX - minX;
            const height = maxY - minY;
            return Math.sqrt(width * width + height * height) / 2;
          } else if (element.type === 'polygon') {
            // For polygons, calculate bounding box diagonal / 2
            const polygon = element as PolygonProperties;
            if (!polygon.points || polygon.points.length < 2) return 0;
            
            let minX = polygon.points[0].x, maxX = polygon.points[0].x;
            let minY = polygon.points[0].y, maxY = polygon.points[0].y;
            
            polygon.points.forEach(point => {
              minX = Math.min(minX, point.x);
              maxX = Math.max(maxX, point.x);
              minY = Math.min(minY, point.y);
              maxY = Math.max(maxY, point.y);
            });
            
            const width = maxX - minX;
            const height = maxY - minY;
            return Math.sqrt(width * width + height * height) / 2;
          }
          return 0;
        };
        
        // Check if elements are too close (considering their effective radii)
        const minDistance = getEffectiveRadius(table1) + getEffectiveRadius(table2) + proximityThreshold;
        if (distance < minDistance) {
          result.push([table1, table2]);
        }
      }
    }
    
    return result;
  }
}

// Create singleton instance
export const layoutMetricsStore = new LayoutMetricsStore(); 