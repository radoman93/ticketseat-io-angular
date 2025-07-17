import { CanvasSelectionRenderer, SelectionBox, CanvasSelectionConfig } from '../services/canvas-selection-renderer.service';
import { LoggerService } from '../services/logger.service';

/**
 * Demo class showing canvas-based selection performance vs DOM-based selection
 */
export class CanvasSelectionDemo {
  private canvasRenderer: CanvasSelectionRenderer;
  private logger: LoggerService;
  private canvas?: HTMLCanvasElement;

  constructor() {
    this.canvasRenderer = new CanvasSelectionRenderer();
    this.logger = new LoggerService();
  }

  /**
   * Initialize the demo with a canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.canvasRenderer.initializeCanvas(canvas);
    
    this.logger.info('Canvas selection demo initialized', {
      component: 'CanvasSelectionDemo',
      action: 'initialize'
    });
  }

  /**
   * Performance test: DOM vs Canvas selection rendering
   */
  async performanceComparison(elementCount: number = 50): Promise<void> {
    this.logger.info(`Starting performance comparison with ${elementCount} elements`, {
      component: 'CanvasSelectionDemo',
      action: 'performanceComparison',
      elementCount
    });

    // Generate test selection boxes
    const testSelections = this.generateTestSelections(elementCount);

    // Test DOM-based rendering (simulated)
    const domTime = await this.measureDOMPerformance(testSelections);

    // Test Canvas-based rendering
    const canvasTime = await this.measureCanvasPerformance(testSelections);

    // Log results
    const improvement = ((domTime - canvasTime) / domTime * 100).toFixed(1);
    
    this.logger.info('Performance comparison results', {
      component: 'CanvasSelectionDemo',
      action: 'performanceComparison',
      elementCount,
      domTime: `${domTime.toFixed(2)}ms`,
      canvasTime: `${canvasTime.toFixed(2)}ms`,
      improvement: `${improvement}% faster`
    });

    console.log('🚀 Canvas Selection Performance Results:');
    console.log(`📊 Elements tested: ${elementCount}`);
    console.log(`🐌 DOM approach: ${domTime.toFixed(2)}ms`);
    console.log(`⚡ Canvas approach: ${canvasTime.toFixed(2)}ms`);
    console.log(`🎯 Performance improvement: ${improvement}% faster`);
  }

  /**
   * Visual effects demo - show all canvas capabilities
   */
  visualEffectsDemo(): void {
    if (!this.canvas) {
      console.error('Canvas not initialized. Call initialize() first.');
      return;
    }

    console.log('🎨 Canvas Selection Visual Effects Demo');

    // Clear any existing selections
    this.canvasRenderer.clearSelections();

    // Demo 1: Basic selection with animation
    const basicSelection: SelectionBox = {
      id: 'demo-basic',
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      rotation: 0,
      type: 'table'
    };

    this.canvasRenderer.setSelection('demo-basic', basicSelection);
    console.log('✅ Added basic selection with animated stripes');

    // Demo 2: Rotated selection
    const rotatedSelection: SelectionBox = {
      id: 'demo-rotated',
      x: 300,
      y: 150,
      width: 150,
      height: 100,
      rotation: 45,
      type: 'table'
    };

    this.canvasRenderer.setSelection('demo-rotated', rotatedSelection);
    console.log('✅ Added rotated selection (45 degrees)');

    // Demo 3: Line selection
    const lineSelection: SelectionBox = {
      id: 'demo-line',
      x: 200,
      y: 300,
      width: 200,
      height: 40,
      rotation: 30,
      type: 'line'
    };

    this.canvasRenderer.setSelection('demo-line', lineSelection);
    console.log('✅ Added line selection');

    // Demo 4: Different visual styles
    setTimeout(() => {
      this.canvasRenderer.updateConfig({
        borderColor: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        stripesOpacity: 0.2
      });
      this.canvasRenderer.render();
      console.log('🎨 Updated to red theme');
    }, 2000);

    setTimeout(() => {
      this.canvasRenderer.updateConfig({
        borderColor: '#44ff44',
        backgroundColor: 'rgba(68, 255, 68, 0.1)',
        stripesOpacity: 0.3,
        enableAnimations: false
      });
      this.canvasRenderer.render();
      console.log('🎨 Updated to green theme (no animations)');
    }, 4000);

    // Demo 5: Performance stress test
    setTimeout(() => {
      this.stressTest(100);
    }, 6000);

    this.canvasRenderer.render();
  }

  /**
   * Stress test with many selections
   */
  stressTest(count: number): void {
    console.log(`🔥 Stress test: Adding ${count} selections`);
    
    const startTime = performance.now();
    
    // Clear existing selections
    this.canvasRenderer.clearSelections();

    // Add many selections
    for (let i = 0; i < count; i++) {
      const selection: SelectionBox = {
        id: `stress-${i}`,
        x: Math.random() * 800 + 50,
        y: Math.random() * 600 + 50,
        width: Math.random() * 100 + 50,
        height: Math.random() * 80 + 40,
        rotation: Math.random() * 360,
        type: Math.random() > 0.5 ? 'table' : 'row'
      };
      
      this.canvasRenderer.setSelection(`stress-${i}`, selection);
    }

    const addTime = performance.now() - startTime;
    
    // Render all selections
    const renderStart = performance.now();
    this.canvasRenderer.render();
    const renderTime = performance.now() - renderStart;

    const stats = this.canvasRenderer.getStats();

    console.log(`⚡ Stress test results:`);
    console.log(`  - Add ${count} selections: ${addTime.toFixed(2)}ms`);
    console.log(`  - Render ${count} selections: ${renderTime.toFixed(2)}ms`);
    console.log(`  - Total time: ${(addTime + renderTime).toFixed(2)}ms`);
    console.log(`  - Stats: ${JSON.stringify(stats)}`);

    this.logger.info('Stress test completed', {
      component: 'CanvasSelectionDemo',
      action: 'stressTest',
      selectionCount: count,
      addTime,
      renderTime,
      totalTime: addTime + renderTime,
      stats
    });
  }

  /**
   * Generate test selection boxes for performance testing
   */
  private generateTestSelections(count: number): SelectionBox[] {
    const selections: SelectionBox[] = [];
    
    for (let i = 0; i < count; i++) {
      selections.push({
        id: `test-${i}`,
        x: Math.random() * 800 + 50,
        y: Math.random() * 600 + 50,
        width: Math.random() * 100 + 50,
        height: Math.random() * 80 + 40,
        rotation: Math.random() * 360,
        type: Math.random() > 0.5 ? 'table' : 'row'
      });
    }
    
    return selections;
  }

  /**
   * Measure DOM-based selection performance (simulated)
   */
  private async measureDOMPerformance(selections: SelectionBox[]): Promise<number> {
    return new Promise(resolve => {
      const startTime = performance.now();
      
      // Simulate DOM operations (creating, positioning, styling elements)
      selections.forEach(selection => {
        // Simulate DOM element creation and style calculations
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = selection.x + 'px';
        div.style.top = selection.y + 'px';
        div.style.width = selection.width + 'px';
        div.style.height = selection.height + 'px';
        div.style.transform = `rotate(${selection.rotation}deg)`;
        div.style.border = '2px dashed #3498db';
        div.style.borderRadius = '8px';
        div.style.backgroundColor = 'rgba(59, 130, 246, 0.03)';
        
        // Simulate adding to DOM (without actually adding)
        // This simulates the reflow calculations
        div.getBoundingClientRect();
      });
      
      const endTime = performance.now();
      resolve(endTime - startTime);
    });
  }

  /**
   * Measure Canvas-based selection performance
   */
  private async measureCanvasPerformance(selections: SelectionBox[]): Promise<number> {
    return new Promise(resolve => {
      const startTime = performance.now();
      
      // Clear existing selections
      this.canvasRenderer.clearSelections();
      
      // Add all selections
      selections.forEach(selection => {
        this.canvasRenderer.setSelection(selection.id, selection);
      });
      
      // Render all selections
      this.canvasRenderer.render();
      
      const endTime = performance.now();
      resolve(endTime - startTime);
    });
  }

  /**
   * Cleanup demo resources
   */
  destroy(): void {
    this.canvasRenderer.destroy();
    
    this.logger.info('Canvas selection demo destroyed', {
      component: 'CanvasSelectionDemo',
      action: 'destroy'
    });
  }
}

// Example usage:
// const demo = new CanvasSelectionDemo();
// const canvas = document.getElementById('demo-canvas') as HTMLCanvasElement;
// demo.initialize(canvas);
// demo.visualEffectsDemo();
// demo.performanceComparison(100);