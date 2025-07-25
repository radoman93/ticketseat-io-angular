import { Injectable } from '@angular/core';
import { AlignmentGuide } from '../models/element-bounds.model';
import { LoggerService } from './logger.service';

export interface GuideRendererConfig {
  lineColor: string;
  lineWidth: number;
  dashPattern: number[];
  opacity: number;
  extendBeyondElements: number;
  enableAnimation: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlignmentGuideRenderer {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private logger: LoggerService;
  private animationFrame?: number;
  
  // Visual configuration
  private config: GuideRendererConfig = {
    lineColor: '#3498db',
    lineWidth: 2, // Increased for better visibility
    dashPattern: [5, 5],
    opacity: 1.0, // Full opacity
    extendBeyondElements: 50,
    enableAnimation: false
  };
  
  constructor() {
    this.logger = new LoggerService();
  }
  
  /**
   * Initialize canvas for guide rendering
   */
  initializeCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      this.logger.error('Failed to get canvas 2D context', new Error('Canvas context is null'), {
        component: 'AlignmentGuideRenderer',
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
    
    this.logger.debug('Alignment guide renderer initialized', {
      component: 'AlignmentGuideRenderer',
      action: 'initializeCanvas',
      width: canvas.width,
      height: canvas.height,
      dpr
    });
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<GuideRendererConfig>): void {
    this.config = { ...this.config, ...config };
    
    this.logger.debug('Guide renderer config updated', {
      component: 'AlignmentGuideRenderer',
      action: 'updateConfig',
      config: this.config
    });
  }
  
  /**
   * Render alignment guides
   */
  renderGuides(guides: AlignmentGuide[], zoom: number, pan: { x: number; y: number }): void {
    if (!this.ctx || !this.canvas) {
      this.logger.warn('Canvas context not available', {
        component: 'AlignmentGuideRenderer',
        action: 'renderGuides',
        hasCtx: !!this.ctx,
        hasCanvas: !!this.canvas
      });
      return;
    }
    
    // Cancel any pending animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (guides.length === 0) return;
    
    this.logger.debug('Rendering alignment guides', {
      component: 'AlignmentGuideRenderer',
      action: 'renderGuides',
      guideCount: guides.length,
      guides: guides,
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
      zoom: zoom,
      pan: pan
    });
    
    const performanceTimer = this.logger.startTimer('guide_render', {
      component: 'AlignmentGuideRenderer',
      action: 'renderGuides',
      guideCount: guides.length
    });
    
    // Set up rendering context
    this.ctx.save();
    
    // Set line style
    this.ctx.strokeStyle = this.config.lineColor;
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.setLineDash(this.config.dashPattern);
    this.ctx.globalAlpha = this.config.opacity;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Render each guide
    for (const guide of guides) {
      this.renderGuide(guide, zoom, pan);
    }
    
    // Restore context
    this.ctx.restore();
    
    performanceTimer();
  }
  
  /**
   * Render a single alignment guide
   */
  private renderGuide(guide: AlignmentGuide, zoom: number, pan: { x: number; y: number }): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Don't override line style here - it's already set in renderGuides
    // Just begin the path
    ctx.beginPath();
    
    let endpointCoords: { x1: number, y1: number, x2: number, y2: number };
    
    if (guide.type === 'vertical') {
      // Vertical guide line
      const x = (guide.position * zoom) + pan.x;
      const startY = (guide.start * zoom) + pan.y - this.config.extendBeyondElements;
      const endY = (guide.end * zoom) + pan.y + this.config.extendBeyondElements;
      
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      
      endpointCoords = { x1: x, y1: startY, x2: x, y2: endY };
    } else {
      // Horizontal guide line
      const y = (guide.position * zoom) + pan.y;
      const startX = (guide.start * zoom) + pan.x - this.config.extendBeyondElements;
      const endX = (guide.end * zoom) + pan.x + this.config.extendBeyondElements;
      
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      
      endpointCoords = { x1: startX, y1: y, x2: endX, y2: y };
    }
    
    // Stroke the line FIRST
    ctx.stroke();
    
    // THEN draw endpoints (which use beginPath and would clear our line path)
    this.drawEndpoint(ctx, endpointCoords.x1, endpointCoords.y1);
    this.drawEndpoint(ctx, endpointCoords.x2, endpointCoords.y2);
    
    // Optionally draw alignment type label
    if (this.shouldDrawLabel(guide)) {
      this.drawAlignmentLabel(ctx, guide, zoom, pan);
    }
  }
  
  /**
   * Draw subtle endpoint indicators
   */
  private drawEndpoint(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.setLineDash([]); // Solid line for endpoints
    ctx.globalAlpha = this.config.opacity * 0.5;
    
    // Small circle at endpoint
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * Determine if we should draw alignment label
   */
  private shouldDrawLabel(guide: AlignmentGuide): boolean {
    // Only draw labels for center alignments
    return guide.alignmentType.includes('center');
  }
  
  /**
   * Draw alignment type label
   */
  private drawAlignmentLabel(
    ctx: CanvasRenderingContext2D, 
    guide: AlignmentGuide, 
    zoom: number, 
    pan: { x: number; y: number }
  ): void {
    ctx.save();
    
    // Setup text style
    ctx.font = '10px sans-serif';
    ctx.fillStyle = this.config.lineColor;
    ctx.globalAlpha = this.config.opacity * 0.6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate label position
    let labelX: number, labelY: number;
    
    if (guide.type === 'vertical') {
      labelX = (guide.position * zoom) + pan.x;
      labelY = ((guide.start + guide.end) / 2 * zoom) + pan.y;
      
      // Add small background for readability
      const metrics = ctx.measureText('center');
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.8;
      ctx.fillRect(labelX - metrics.width / 2 - 2, labelY - 6, metrics.width + 4, 12);
      
      // Draw text
      ctx.fillStyle = this.config.lineColor;
      ctx.globalAlpha = this.config.opacity * 0.6;
      ctx.fillText('center', labelX, labelY);
    } else {
      labelX = ((guide.start + guide.end) / 2 * zoom) + pan.x;
      labelY = (guide.position * zoom) + pan.y;
      
      // Add small background for readability
      const metrics = ctx.measureText('center');
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.8;
      ctx.fillRect(labelX - metrics.width / 2 - 2, labelY - 6, metrics.width + 4, 12);
      
      // Draw text
      ctx.fillStyle = this.config.lineColor;
      ctx.globalAlpha = this.config.opacity * 0.6;
      ctx.fillText('center', labelX, labelY);
    }
    
    ctx.restore();
  }
  
  /**
   * Clear all guides
   */
  clearGuides(): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.logger.trace('Guides cleared', {
      component: 'AlignmentGuideRenderer',
      action: 'clearGuides'
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
    
    this.logger.debug('Alignment guide renderer resized', {
      component: 'AlignmentGuideRenderer',
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
    this.canvas.style.pointerEvents = 'none'; // Prevent interaction
    
    this.logger.debug('Canvas optimizations applied', {
      component: 'AlignmentGuideRenderer',
      action: 'optimizeCanvas'
    });
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.clearGuides();
    
    this.logger.debug('Alignment guide renderer destroyed', {
      component: 'AlignmentGuideRenderer',
      action: 'destroy'
    });
  }
}