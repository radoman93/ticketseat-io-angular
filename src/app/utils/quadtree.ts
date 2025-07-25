/**
 * Rectangle bounds for spatial queries
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Item that can be stored in the QuadTree
 */
export interface SpatialItem {
  left: number;
  top: number;
  right: number;
  bottom: number;
  id: string;
}

/**
 * QuadTree node for spatial partitioning
 */
class QuadNode<T extends SpatialItem> {
  private items: T[] = [];
  private nodes: QuadNode<T>[] = [];
  private divided = false;
  
  constructor(
    private bounds: Bounds,
    private maxItems: number,
    private maxDepth: number,
    private depth: number = 0
  ) {}
  
  /**
   * Insert an item into the quadtree
   */
  insert(item: T): boolean {
    // Check if item is within bounds
    if (!this.contains(item)) {
      return false;
    }
    
    // If we haven't subdivided and can add more items
    if (!this.divided && this.items.length < this.maxItems) {
      this.items.push(item);
      return true;
    }
    
    // If we've reached max depth, just add to items
    if (this.depth >= this.maxDepth) {
      this.items.push(item);
      return true;
    }
    
    // Otherwise, subdivide if needed
    if (!this.divided) {
      this.subdivide();
    }
    
    // Try to insert into child nodes
    for (const node of this.nodes) {
      if (node.insert(item)) {
        return true;
      }
    }
    
    // If it doesn't fit in children (overlaps boundaries), keep in parent
    this.items.push(item);
    return true;
  }
  
  /**
   * Remove an item from the quadtree
   */
  remove(item: T): boolean {
    // Try to remove from this node
    const index = this.items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    
    // Try to remove from child nodes
    if (this.divided) {
      for (const node of this.nodes) {
        if (node.remove(item)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Query items within given bounds
   */
  query(searchBounds: Bounds, result: T[] = []): T[] {
    // Check if search bounds intersect with node bounds
    if (!this.intersects(searchBounds)) {
      return result;
    }
    
    // Add items from this node that intersect search bounds
    for (const item of this.items) {
      if (this.itemIntersects(item, searchBounds)) {
        result.push(item);
      }
    }
    
    // Query child nodes
    if (this.divided) {
      for (const node of this.nodes) {
        node.query(searchBounds, result);
      }
    }
    
    return result;
  }
  
  /**
   * Clear all items from this node and children
   */
  clear(): void {
    this.items = [];
    this.nodes = [];
    this.divided = false;
  }
  
  /**
   * Subdivide this node into 4 quadrants
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;
    
    // Create 4 child nodes
    this.nodes = [
      new QuadNode({ x, y, width: w, height: h }, this.maxItems, this.maxDepth, this.depth + 1), // NW
      new QuadNode({ x: x + w, y, width: w, height: h }, this.maxItems, this.maxDepth, this.depth + 1), // NE
      new QuadNode({ x, y: y + h, width: w, height: h }, this.maxItems, this.maxDepth, this.depth + 1), // SW
      new QuadNode({ x: x + w, y: y + h, width: w, height: h }, this.maxItems, this.maxDepth, this.depth + 1) // SE
    ];
    
    this.divided = true;
    
    // Redistribute existing items
    const items = [...this.items];
    this.items = [];
    
    for (const item of items) {
      let inserted = false;
      for (const node of this.nodes) {
        if (node.insert(item)) {
          inserted = true;
          break;
        }
      }
      // If item doesn't fit in children (overlaps boundaries), keep in parent
      if (!inserted) {
        this.items.push(item);
      }
    }
  }
  
  /**
   * Check if item is within node bounds
   */
  private contains(item: T): boolean {
    return item.left >= this.bounds.x &&
           item.top >= this.bounds.y &&
           item.right <= this.bounds.x + this.bounds.width &&
           item.bottom <= this.bounds.y + this.bounds.height;
  }
  
  /**
   * Check if bounds intersect with node bounds
   */
  private intersects(searchBounds: Bounds): boolean {
    return !(searchBounds.x > this.bounds.x + this.bounds.width ||
             searchBounds.x + searchBounds.width < this.bounds.x ||
             searchBounds.y > this.bounds.y + this.bounds.height ||
             searchBounds.y + searchBounds.height < this.bounds.y);
  }
  
  /**
   * Check if item intersects with search bounds
   */
  private itemIntersects(item: T, searchBounds: Bounds): boolean {
    return !(item.left > searchBounds.x + searchBounds.width ||
             item.right < searchBounds.x ||
             item.top > searchBounds.y + searchBounds.height ||
             item.bottom < searchBounds.y);
  }
}

/**
 * QuadTree implementation for efficient spatial queries
 */
export class QuadTree<T extends SpatialItem> {
  private root: QuadNode<T>;
  
  constructor(
    bounds: Bounds,
    private maxItems: number = 10,
    private maxDepth: number = 8
  ) {
    this.root = new QuadNode(bounds, maxItems, maxDepth);
  }
  
  /**
   * Insert an item into the quadtree
   */
  insert(item: T): void {
    this.root.insert(item);
  }
  
  /**
   * Remove an item from the quadtree
   */
  remove(item: T): void {
    this.root.remove(item);
  }
  
  /**
   * Update an item's position
   */
  update(item: T): void {
    this.remove(item);
    this.insert(item);
  }
  
  /**
   * Query items within given bounds
   */
  query(bounds: Bounds): T[] {
    return this.root.query(bounds);
  }
  
  /**
   * Clear all items from the quadtree
   */
  clear(): void {
    this.root.clear();
  }
  
  /**
   * Create search bounds with padding
   */
  static createSearchBounds(x: number, y: number, width: number, height: number, padding: number): Bounds {
    return {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2
    };
  }
}