import { LoggerService, LogLevel } from '../services/logger.service';
import { createLogger } from '../config/logger.config';

/**
 * Demo functions showing how to use the logging service
 */
export class LoggerDemo {
  private logger: LoggerService;

  constructor() {
    // Create a logger with development configuration
    this.logger = createLogger();
  }

  /**
   * Basic logging examples
   */
  basicLoggingDemo(): void {
    this.logger.info('Application started', {
      component: 'LoggerDemo',
      action: 'demo'
    });

    this.logger.debug('Debug information', {
      component: 'LoggerDemo',
      action: 'debug_test',
      data: { userId: '123', sessionId: 'abc' }
    });

    this.logger.warn('Warning message', {
      component: 'LoggerDemo',
      action: 'warning_test'
    });

    this.logger.error('Error occurred', new Error('Demo error'), {
      component: 'LoggerDemo',
      action: 'error_test'
    });
  }

  /**
   * Performance monitoring example
   */
  performanceDemo(): void {
    // Start a performance timer
    const endTimer = this.logger.startTimer('complex_operation', {
      component: 'LoggerDemo',
      action: 'performance'
    });

    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      // Simulate work
    }

    // End the timer (will log the duration)
    endTimer();
  }

  /**
   * User action logging example
   */
  userActionDemo(): void {
    this.logger.logUserAction('seat_selected', 'GridComponent', {
      seatId: 'table-1-chair-3',
      seatLabel: 'A3',
      price: 25
    });

    this.logger.logUserAction('layout_saved', 'EventEditorComponent', {
      layoutId: 'layout-123',
      elementCount: 15
    });
  }

  /**
   * State change logging example
   */
  stateChangeDemo(): void {
    const oldState = { selectedCount: 2, totalElements: 10 };
    const newState = { selectedCount: 3, totalElements: 10 };

    this.logger.logStateChange('SelectionStore', 'selectedCount', 
      oldState.selectedCount, newState.selectedCount);
  }

  /**
   * Configuration example
   */
  configurationDemo(): void {
    // Create a logger focused on performance monitoring
    const perfLogger = createLogger('performance');
    
    perfLogger.trace('Detailed trace information', {
      component: 'DragStore',
      action: 'mouse_move',
      mouseX: 150,
      mouseY: 200
    });

    // Create a silent logger for production-like behavior
    const silentLogger = createLogger('silent');
    
    // This debug message won't be logged due to silent mode
    silentLogger.debug('This debug message will be ignored');
    
    // But errors will still be logged
    silentLogger.error('Critical error', new Error('System failure'), {
      component: 'CriticalSystem'
    });
  }

  /**
   * Run all demos
   */
  runAllDemos(): void {
    console.log('=== Logger Service Demo ===');
    console.log('Running basic logging demo...');
    this.basicLoggingDemo();

    console.log('Running performance demo...');
    this.performanceDemo();

    console.log('Running user action demo...');
    this.userActionDemo();

    console.log('Running state change demo...');
    this.stateChangeDemo();

    console.log('Running configuration demo...');
    this.configurationDemo();

    console.log('=== Demo Complete ===');
    console.log('Check the browser console to see the logging output.');
    console.log('In production, logs would be sent to your logging service instead.');
  }
}

// Example usage:
// const demo = new LoggerDemo();
// demo.runAllDemos();