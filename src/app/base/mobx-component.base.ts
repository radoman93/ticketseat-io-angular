import { OnDestroy, inject, Injectable } from '@angular/core';
import { MobXReactionManager } from '../services/mobx-reaction-manager.service';
import { LoggerService } from '../services/logger.service';

/**
 * Base class for Angular components that use MobX reactions
 * Provides automatic cleanup and reaction management
 */
@Injectable()
export abstract class MobXComponentBase implements OnDestroy {
  protected reactionManager = inject(MobXReactionManager);
  protected logger = inject(LoggerService);
  private componentReactions: string[] = [];
  private componentName: string;

  constructor(componentName?: string) {
    this.componentName = componentName || this.constructor.name;
    
    this.logger.debug('MobX component initialized', {
      component: this.componentName,
      action: 'constructor'
    });
  }

  /**
   * Create a managed autorun reaction that will be automatically disposed
   */
  protected createAutorun(
    view: () => void,
    name?: string
  ): string {
    const reactionId = this.reactionManager.createAutorun(
      view,
      this.componentName,
      name
    );
    
    this.componentReactions.push(reactionId);
    return reactionId;
  }

  /**
   * Create a managed reaction that will be automatically disposed
   */
  protected createReaction<T>(
    expression: () => T,
    effect: (value: T) => void,
    name?: string
  ): string {
    const reactionId = this.reactionManager.createReaction(
      expression,
      effect,
      this.componentName,
      name
    );
    
    this.componentReactions.push(reactionId);
    return reactionId;
  }

  /**
   * Create a managed when reaction that will be automatically disposed
   */
  protected createWhen(
    predicate: () => boolean,
    effect: () => void,
    name?: string
  ): string {
    const reactionId = this.reactionManager.createWhen(
      predicate,
      effect,
      this.componentName,
      name
    );
    
    this.componentReactions.push(reactionId);
    return reactionId;
  }

  /**
   * Manually dispose a specific reaction
   */
  protected disposeReaction(reactionId: string): boolean {
    const index = this.componentReactions.indexOf(reactionId);
    if (index !== -1) {
      this.componentReactions.splice(index, 1);
    }
    
    return this.reactionManager.disposeReaction(reactionId);
  }

  /**
   * Get statistics about this component's reactions
   */
  protected getReactionStats(): {
    total: number;
    active: number;
    disposed: number;
  } {
    const allReactions = this.reactionManager.getComponentReactions(this.componentName);
    
    return {
      total: allReactions.length,
      active: allReactions.filter(r => !r.disposed).length,
      disposed: allReactions.filter(r => r.disposed).length
    };
  }

  /**
   * Lifecycle hook that subclasses can override for additional cleanup
   */
  protected onMobXDestroy(): void {
    // Override in subclasses for custom cleanup
  }

  /**
   * Angular OnDestroy implementation - automatically disposes all reactions
   */
  ngOnDestroy(): void {
    const startTime = performance.now();
    
    // Call custom cleanup hook
    this.onMobXDestroy();

    // Dispose all component reactions
    const disposedCount = this.reactionManager.disposeComponentReactions(this.componentName);
    
    const duration = performance.now() - startTime;
    
    this.logger.debug('MobX component destroyed', {
      component: this.componentName,
      action: 'ngOnDestroy',
      reactionsDisposed: disposedCount,
      cleanupDuration: `${duration.toFixed(2)}ms`
    });

    // Clear local tracking
    this.componentReactions = [];
  }
}

/**
 * Decorator to automatically track reaction disposal for class methods
 */
export function TrackReaction(reactionName?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(this: MobXComponentBase, ...args: any[]) {
      const name = reactionName || `${target.constructor.name}.${propertyKey}`;
      
      // If the method returns a reaction disposer, track it
      const result = originalMethod.apply(this, args);
      
      if (typeof result === 'function') {
        // Assume it's a disposer function and wrap it
        const originalDisposer = result;
        return () => {
          this.logger.trace('Tracked reaction disposed', {
            component: target.constructor.name,
            action: 'disposer_called',
            method: propertyKey,
            reactionName: name
          });
          return originalDisposer();
        };
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Utility function to create batch updates using runInAction
 */
export function createBatchedAction<T extends any[], R>(
  name: string,
  action: (...args: T) => R,
  logger?: LoggerService
): (...args: T) => R {
  const log = logger || new LoggerService();
  
  return (...args: T): R => {
    const performanceTimer = log.startTimer(`batched_action_${name}`, {
      component: 'MobXComponentBase',
      action: 'batched_action'
    });

    try {
      // Import runInAction dynamically to avoid circular dependencies
      const { runInAction } = require('mobx');
      
      const result = runInAction(name, () => action(...args));
      
      performanceTimer();
      return result;
    } catch (error) {
      performanceTimer();
      log.error(`Batched action failed: ${name}`, error instanceof Error ? error : new Error(String(error)), {
        component: 'MobXComponentBase',
        action: 'batched_action_error',
        actionName: name
      });
      throw error;
    }
  };
}