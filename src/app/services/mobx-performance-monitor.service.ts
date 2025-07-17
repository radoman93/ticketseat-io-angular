import { Injectable } from '@angular/core';
import { computed, trace, spy, IComputedValue } from 'mobx';
import { LoggerService } from './logger.service';

export interface ComputedStats {
  name: string;
  computations: number;
  totalTime: number;
  avgTime: number;
  lastComputed: number;
  dependencies: string[];
}

export interface ReactionStats {
  name: string;
  executions: number;
  totalTime: number;
  avgTime: number;
  lastExecuted: number;
}

/**
 * Service to monitor MobX performance and provide debugging insights
 */
@Injectable({
  providedIn: 'root'
})
export class MobXPerformanceMonitor {
  private computedStats = new Map<string, ComputedStats>();
  private reactionStats = new Map<string, ReactionStats>();
  private isMonitoring = false;
  private spyDisposer?: () => void;

  constructor(private logger: LoggerService) {}

  /**
   * Enable performance monitoring for MobX computeds and reactions
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting MobX performance monitoring', {
      component: 'MobXPerformanceMonitor',
      action: 'startMonitoring'
    });

    // Set up MobX spy to track all state changes and computations
    this.spyDisposer = spy((event) => {
      this.handleMobXEvent(event);
    });

    // Set up periodic reporting
    this.setupPeriodicReporting();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.spyDisposer) {
      this.spyDisposer();
      this.spyDisposer = undefined;
    }

    this.logger.info('Stopped MobX performance monitoring', {
      component: 'MobXPerformanceMonitor',
      action: 'stopMonitoring'
    });
  }

  /**
   * Get performance statistics for all monitored computeds
   */
  getComputedStats(): ComputedStats[] {
    return Array.from(this.computedStats.values())
      .sort((a, b) => b.totalTime - a.totalTime); // Sort by total time descending
  }

  /**
   * Get performance statistics for all monitored reactions
   */
  getReactionStats(): ReactionStats[] {
    return Array.from(this.reactionStats.values())
      .sort((a, b) => b.totalTime - a.totalTime); // Sort by total time descending
  }

  /**
   * Get the slowest computed properties
   */
  getSlowestComputeds(limit: number = 10): ComputedStats[] {
    return this.getComputedStats()
      .slice(0, limit)
      .filter(stat => stat.avgTime > 1); // Only show computeds taking more than 1ms
  }

  /**
   * Get computeds that are recalculating frequently
   */
  getFrequentlyRecalculatedComputeds(limit: number = 10): ComputedStats[] {
    return Array.from(this.computedStats.values())
      .sort((a, b) => b.computations - a.computations)
      .slice(0, limit)
      .filter(stat => stat.computations > 10); // Only show frequently computed ones
  }

  /**
   * Reset all performance statistics
   */
  reset(): void {
    this.computedStats.clear();
    this.reactionStats.clear();
    
    this.logger.debug('Performance statistics reset', {
      component: 'MobXPerformanceMonitor',
      action: 'reset'
    });
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const slowestComputeds = this.getSlowestComputeds(5);
    const frequentComputeds = this.getFrequentlyRecalculatedComputeds(5);
    const slowestReactions = this.getReactionStats().slice(0, 5);

    let report = '# MobX Performance Report\n\n';
    
    report += '## Slowest Computed Properties\n';
    if (slowestComputeds.length > 0) {
      slowestComputeds.forEach(stat => {
        report += `- **${stat.name}**: ${stat.avgTime.toFixed(2)}ms avg (${stat.computations} computations, ${stat.totalTime.toFixed(2)}ms total)\n`;
      });
    } else {
      report += 'No slow computed properties detected.\n';
    }

    report += '\n## Most Frequently Recalculated\n';
    if (frequentComputeds.length > 0) {
      frequentComputeds.forEach(stat => {
        report += `- **${stat.name}**: ${stat.computations} computations (${stat.avgTime.toFixed(2)}ms avg)\n`;
      });
    } else {
      report += 'No frequently recalculated computeds detected.\n';
    }

    report += '\n## Slowest Reactions\n';
    if (slowestReactions.length > 0) {
      slowestReactions.forEach(stat => {
        report += `- **${stat.name}**: ${stat.avgTime.toFixed(2)}ms avg (${stat.executions} executions)\n`;
      });
    } else {
      report += 'No slow reactions detected.\n';
    }

    return report;
  }

  /**
   * Log current performance statistics
   */
  logCurrentStats(): void {
    const report = this.generateReport();
    this.logger.info('MobX Performance Report', {
      component: 'MobXPerformanceMonitor',
      action: 'logCurrentStats',
      report
    });
  }

  /**
   * Handle MobX events from the spy
   */
  private handleMobXEvent(event: any): void {
    const startTime = performance.now();

    try {
      switch (event.type) {
        case 'compute':
          this.trackComputedExecution(event, startTime);
          break;
        case 'reaction':
          this.trackReactionExecution(event, startTime);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling MobX event', error instanceof Error ? error : new Error(String(error)), {
        component: 'MobXPerformanceMonitor',
        action: 'handleMobXEvent',
        eventType: event.type
      });
    }
  }

  /**
   * Track computed property execution
   */
  private trackComputedExecution(event: any, startTime: number): void {
    const name = event.name || event.object?.name || 'unknown-computed';
    const duration = performance.now() - startTime;

    let stats = this.computedStats.get(name);
    if (!stats) {
      stats = {
        name,
        computations: 0,
        totalTime: 0,
        avgTime: 0,
        lastComputed: 0,
        dependencies: []
      };
      this.computedStats.set(name, stats);
    }

    stats.computations++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.computations;
    stats.lastComputed = Date.now();

    // Log slow computations
    if (duration > 16) { // Slower than one frame (16ms)
      this.logger.warn('Slow computed property detected', {
        component: 'MobXPerformanceMonitor',
        action: 'trackComputedExecution',
        computedName: name,
        duration: `${duration.toFixed(2)}ms`,
        totalComputations: stats.computations
      });
    }
  }

  /**
   * Track reaction execution
   */
  private trackReactionExecution(event: any, startTime: number): void {
    const name = event.name || 'unknown-reaction';
    const duration = performance.now() - startTime;

    let stats = this.reactionStats.get(name);
    if (!stats) {
      stats = {
        name,
        executions: 0,
        totalTime: 0,
        avgTime: 0,
        lastExecuted: 0
      };
      this.reactionStats.set(name, stats);
    }

    stats.executions++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.executions;
    stats.lastExecuted = Date.now();

    // Log slow reactions
    if (duration > 16) { // Slower than one frame (16ms)
      this.logger.warn('Slow reaction detected', {
        component: 'MobXPerformanceMonitor',
        action: 'trackReactionExecution',
        reactionName: name,
        duration: `${duration.toFixed(2)}ms`,
        totalExecutions: stats.executions
      });
    }
  }

  /**
   * Set up periodic performance reporting
   */
  private setupPeriodicReporting(): void {
    if (!this.isMonitoring) {
      return;
    }

    // Report every 30 seconds in development
    if (typeof window !== 'undefined' && (window as any)['ng'] && (window as any)['ng']['ɵisDevMode']?.()) {
      setTimeout(() => {
        if (this.isMonitoring) {
          this.logCurrentStats();
          this.setupPeriodicReporting();
        }
      }, 30000);
    }
  }

  /**
   * Trace a specific computed property to see its dependencies
   */
  traceComputed(computedValue: IComputedValue<any>): string[] {
    const dependencies: string[] = [];
    
    try {
      trace(computedValue, true); // This will log dependencies to console
      // Note: MobX trace() doesn't return dependencies programmatically
      // This is mainly for development debugging
    } catch (error) {
      this.logger.error('Error tracing computed', error instanceof Error ? error : new Error(String(error)), {
        component: 'MobXPerformanceMonitor',
        action: 'traceComputed'
      });
    }

    return dependencies;
  }
}