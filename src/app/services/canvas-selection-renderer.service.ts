import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

export interface SelectionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'table' | 'row' | 'line' | 'polygon';
  centerX?: number;
  centerY?: number;
}

export interface CanvasSelectionConfig {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backgroundColor: string;
  shadowColor: string;
  shadowBlur: number;
  enableAnimations: boolean;
  stripesOpacity: number;
  dashPattern: number[];
}

@Injectable({
  providedIn: 'root'
})
export class CanvasSelectionRenderer {
  private animationFrame?: number;
  private stripesOffset = 0;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private logger: LoggerService;
  private selectionBoxes: Map<string, SelectionBox> = new Map();
  private geometryCache: Map<string, SelectionBox> = new Map();

  // Visual configuration matching current CSS styles
  private config: CanvasSelectionConfig = {
    borderColor: '#3498db',           // CSS: #3498db
    borderWidth: 2,                   // CSS: 2px dashed
    borderRadius: 8,                  // CSS: 8px border-radius
    backgroundColor: 'rgba(59, 130, 246, 0.03)', // CSS: rgba(59, 130, 246, 0.03)
    shadowColor: 'rgba(37, 99, 235, 0.2)',       // CSS: box-shadow color
    shadowBlur: 1,                    // CSS: box-shadow blur
    enableAnimations: true,           // CSS: animation enabled
    stripesOpacity: 0.05,            // CSS: rgba(59, 130, 246, 0.05)
    dashPattern: [8, 4]              // CSS: 2px dashed ~ 8px dash, 4px gap
  };

  constructor() {
    this.logger = new LoggerService();
    this.startAnimationLoop();
  }

  /**
   * Initialize canvas for selection rendering
   */
  initializeCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      this.logger.error('Failed to get canvas 2D context', new Error('Canvas context is null'), {
        component: 'CanvasSelectionRenderer',
        action: 'initializeCanvas'
      });
      return;
    }
    
    this.ctx = context;

    // Set high DPI scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    // Set canvas CSS size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Apply performance optimizations
    this.optimizeCanvas();

    this.logger.debug('Canvas selection renderer initialized', {
      component: 'CanvasSelectionRenderer',
      action: 'initializeCanvas',
      width: canvas.width,
      height: canvas.height,
      dpr
    });
  }

  /**
   * Add or update a selection box
   */
  setSelection(id: string, box: SelectionBox): void {
    // Cache geometry to avoid recalculations
    this.geometryCache.set(id, { ...box });
    this.selectionBoxes.set(id, box);
    
    this.logger.trace('Selection box updated', {
      component: 'CanvasSelectionRenderer',
      action: 'setSelection',
      elementId: id,
      box
    });
  }

  /**
   * Remove a selection box
   */
  removeSelection(id: string): void {
    this.selectionBoxes.delete(id);
    this.geometryCache.delete(id);
    
    this.logger.trace('Selection box removed', {
      component: 'CanvasSelectionRenderer',
      action: 'removeSelection',
      elementId: id
    });
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    this.selectionBoxes.clear();
    this.geometryCache.clear();
    
    this.logger.debug('All selection boxes cleared', {
      component: 'CanvasSelectionRenderer',
      action: 'clearSelections'
    });
  }

  /**
   * Get cached geometry for an element (performance optimization)
   */
  getCachedGeometry(id: string): SelectionBox | undefined {
    return this.geometryCache.get(id);
  }

  /**
   * Update visual configuration
   */
  updateConfig(config: Partial<CanvasSelectionConfig>): void {
    this.config = { ...this.config, ...config };
    
    this.logger.debug('Selection renderer config updated', {
      component: 'CanvasSelectionRenderer',
      action: 'updateConfig',
      config: this.config
    });
  }

  /**
   * Render all selection boxes
   */
  render(): void {
    if (!this.ctx || !this.canvas) return;

    const performanceTimer = this.logger.startTimer('selection_render', {
      component: 'CanvasSelectionRenderer',
      action: 'render',
      selectionCount: this.selectionBoxes.size
    });

    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render each selection box
    this.selectionBoxes.forEach((box, id) => {
      this.renderSelectionBox(box);
    });

    performanceTimer();
  }

  /**
   * Render a single selection box with all visual effects
   */
  private renderSelectionBox(box: SelectionBox): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    
    // Save canvas state
    ctx.save();

    // Apply rotation if needed
    if (box.rotation) {
      const centerX = box.centerX || box.x;
      const centerY = box.centerY || box.y;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((box.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Calculate position (center-based like CSS transform)
    const x = box.x - box.width / 2;
    const y = box.y - box.height / 2;

    // Draw background with animated stripes (if enabled)
    this.drawBackground(ctx, x, y, box.width, box.height);

    // Draw dashed border
    this.drawDashedBorder(ctx, x, y, box.width, box.height);

    // Draw subtle shadow/glow effect
    this.drawShadowGlow(ctx, x, y, box.width, box.height);

    // Restore canvas state
    ctx.restore();
  }

  /**
   * Draw background with animated diagonal stripes
   */
  private drawBackground(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // Fill background color
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(x, y, width, height);

    // Draw animated diagonal stripes (matching CSS animation)
    if (this.config.enableAnimations) {
      ctx.save();
      
      // Create clipping path for rounded rectangle
      this.createRoundedRectPath(ctx, x, y, width, height, this.config.borderRadius);
      ctx.clip();

      // Draw diagonal stripes pattern
      ctx.fillStyle = `rgba(59, 130, 246, ${this.config.stripesOpacity})`;
      
      const stripeWidth = 16;
      const stripeSpacing = 24;
      
      // Calculate stripe pattern with animation offset
      for (let i = -stripeSpacing; i < width + height + stripeSpacing; i += stripeSpacing) {
        const offsetX = i + this.stripesOffset;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4); // -45 degrees
        
        ctx.fillRect(offsetX, -height, stripeWidth, width + height * 2);
        
        ctx.restore();
      }
      
      ctx.restore();
    }
  }

  /**
   * Draw dashed border matching CSS dashed style
   */
  private drawDashedBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = this.config.borderWidth;
    ctx.setLineDash(this.config.dashPattern);
    
    // Draw rounded rectangle border
    this.createRoundedRectPath(ctx, x, y, width, height, this.config.borderRadius);
    ctx.stroke();
    
    // Reset line dash for other drawings
    ctx.setLineDash([]);
  }

  /**
   * Draw subtle shadow/glow effect
   */
  private drawShadowGlow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.save();
    
    // Outer glow effect
    ctx.shadowColor = this.config.shadowColor;
    ctx.shadowBlur = this.config.shadowBlur;
    ctx.strokeStyle = this.config.shadowColor;
    ctx.lineWidth = 1;
    
    this.createRoundedRectPath(ctx, x - 1, y - 1, width + 2, height + 2, this.config.borderRadius);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Create rounded rectangle path helper
   */
  private createRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Animation loop for moving stripes effect
   */
  private startAnimationLoop(): void {
    const animate = () => {
      // Update stripes animation offset (matching CSS 3s duration)
      this.stripesOffset = (this.stripesOffset + 0.5) % 24; // 24px pattern repeat
      
      // Render if we have selections and animations are enabled
      if (this.selectionBoxes.size > 0 && this.config.enableAnimations) {
        this.render();
      }
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop and clean up
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    
    this.clearSelections();
    
    this.logger.debug('Canvas selection renderer destroyed', {
      component: 'CanvasSelectionRenderer',
      action: 'destroy'
    });
  }

  /**
   * Resize canvas to match container
   */
  resizeCanvas(width: number, height: number): void {
    if (!this.canvas || !this.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.ctx.scale(dpr, dpr);
    
    this.logger.debug('Canvas selection renderer resized', {
      component: 'CanvasSelectionRenderer',
      action: 'resizeCanvas',
      width,
      height,
      dpr
    });
  }

  /**
   * Optimize canvas for better performance
   */
  private optimizeCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    // Enable hardware acceleration hints
    this.ctx.imageSmoothingEnabled = false; // Crisp pixel rendering
    
    // Set canvas CSS for better compositing
    this.canvas.style.willChange = 'transform'; // GPU layer hint
    this.canvas.style.transform = 'translateZ(0)'; // Force GPU layer
    
    this.logger.debug('Canvas optimizations applied', {
      component: 'CanvasSelectionRenderer',
      action: 'optimizeCanvas'
    });
  }

  /**
   * Get performance statistics
   */
  getStats(): { selectionCount: number; cacheSize: number; animationEnabled: boolean } {
    return {
      selectionCount: this.selectionBoxes.size,
      cacheSize: this.geometryCache.size,
      animationEnabled: this.config.enableAnimations
    };
  }
}