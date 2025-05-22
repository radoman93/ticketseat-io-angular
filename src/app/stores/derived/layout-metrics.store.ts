import { makeAutoObservable, computed, reaction } from 'mobx';
import { layoutStore } from '../layout.store';
import { RoundTableProperties } from '../../services/selection.service';

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
    return layoutStore.elements.filter(e => e.type.includes('Table')).length;
  }

  /**
   * The total number of seats across all tables
   */
  get totalSeats() {
    return layoutStore.elements
      .filter(e => e.type.includes('Table') && e.seats)
      .reduce((sum, table) => sum + (table.seats || 0), 0);
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
      .filter(e => e.type.includes('Table'))
      .forEach(table => {
        counts[table.type] = (counts[table.type] || 0) + 1;
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
        const radius = element.radius || 0;
        minX = Math.min(minX, element.x - radius);
        minY = Math.min(minY, element.y - radius);
        maxX = Math.max(maxX, element.x + radius);
        maxY = Math.max(maxY, element.y + radius);
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
    const tables = layoutStore.elements.filter(e => e.type.includes('Table'));
    return {
      small: tables.filter(t => t.radius < 40).length,
      medium: tables.filter(t => t.radius >= 40 && t.radius < 60).length,
      large: tables.filter(t => t.radius >= 60).length
    };
  }

  /**
   * Calculate the bounding box of all tables
   */
  get boundingBoxTables(): { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number } {
    const tables = layoutStore.elements.filter(e => e.type.includes('Table'));
    
    if (tables.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    
    tables.forEach(table => {
      const radius = table.radius || 0;
      minX = Math.min(minX, table.x - radius);
      minY = Math.min(minY, table.y - radius);
      maxX = Math.max(maxX, table.x + radius);
      maxY = Math.max(maxY, table.y + radius);
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
    const tables = layoutStore.elements.filter(e => e.type.includes('Table'));
    const bb = this.boundingBoxTables;
    const centerX = (bb.minX + bb.maxX) / 2;
    const centerY = (bb.minY + bb.maxY) / 2;
    
    return {
      topLeft: tables.filter(t => t.x <= centerX && t.y <= centerY).length,
      topRight: tables.filter(t => t.x > centerX && t.y <= centerY).length,
      bottomLeft: tables.filter(t => t.x <= centerX && t.y > centerY).length,
      bottomRight: tables.filter(t => t.x > centerX && t.y > centerY).length
    };
  }
  
  /**
   * Calculate the total area occupied by all tables (approx)
   */
  get totalArea(): number {
    return layoutStore.elements
      .filter(e => e.type.includes('Table'))
      .reduce((sum, table) => {
        // For round tables, area = πr²
        return sum + (Math.PI * Math.pow(table.radius || 0, 2));
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
  getCloseProximityTables(proximityThreshold: number = 10): RoundTableProperties[][] {
    const tables = layoutStore.elements.filter(e => e.type.includes('Table'));
    const result: RoundTableProperties[][] = [];
    
    // Check each pair of tables
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = tables[i];
        const table2 = tables[j];
        
        // Calculate distance between table centers
        const distance = Math.sqrt(
          Math.pow(table1.x - table2.x, 2) + 
          Math.pow(table1.y - table2.y, 2)
        );
        
        // Check if tables are too close (considering their radii)
        const minDistance = table1.radius + table2.radius + proximityThreshold;
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