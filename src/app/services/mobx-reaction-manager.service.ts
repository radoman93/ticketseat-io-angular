import { Injectable, OnDestroy } from '@angular/core';
import { IReactionDisposer, autorun, reaction, when, Reaction } from 'mobx';
import { LoggerService } from './logger.service';

export interface ReactionInfo {
  id: string;
  name: string;
  component: string;
  created: number;
  disposed: boolean;
  disposer: IReactionDisposer;
}

/**
 * Centralized MobX reaction management service to prevent memory leaks
 * and provide debugging capabilities for reaction lifecycle
 */
@Injectable({
  providedIn: 'root'
})
export class MobXReactionManager implements OnDestroy {
  private reactions = new Map<string, ReactionInfo>();
  private logger: LoggerService;
  private globalReactionId = 0;

  constructor() {
    this.logger = new LoggerService();
    this.setupGlobalReactionMonitoring();
  }

  /**
   * Create a managed autorun reaction
   */
  createAutorun(
    view: () => void,
    component: string,
    name?: string
  ): string {
    const reactionId = this.generateReactionId();
    const reactionName = name || `autorun-${reactionId}`;

    const disposer = autorun(() => {
      try {
        view();
      } catch (error) {
        this.logger.error(`Autorun error in ${component}`, error instanceof Error ? error : new Error(String(error)), {
          component: 'MobXReactionManager',
          action: 'autorun_error',
          reactionId,
          reactionName,
          sourceComponent: component
        });
      }
    }, {
      name: reactionName
    });

    this.registerReaction(reactionId, reactionName, component, disposer);
    return reactionId;
  }

  /**
   * Create a managed reaction
   */
  createReaction<T>(
    expression: () => T,
    effect: (value: T) => void,
    component: string,
    name?: string
  ): string {
    const reactionId = this.generateReactionId();
    const reactionName = name || `reaction-${reactionId}`;

    const disposer = reaction(
      expression,
      (value) => {
        try {
          effect(value);
        } catch (error) {
          this.logger.error(`Reaction error in ${component}`, error instanceof Error ? error : new Error(String(error)), {
            component: 'MobXReactionManager',
            action: 'reaction_error',
            reactionId,
            reactionName,
            sourceComponent: component
          });
        }
      },
      {
        name: reactionName
      }
    );

    this.registerReaction(reactionId, reactionName, component, disposer);
    return reactionId;
  }

  /**
   * Create a managed when reaction
   */
  createWhen(
    predicate: () => boolean,
    effect: () => void,
    component: string,
    name?: string
  ): string {
    const reactionId = this.generateReactionId();
    const reactionName = name || `when-${reactionId}`;

    const disposer = when(
      predicate,
      () => {
        try {
          effect();
          // Auto-dispose when reactions after they fire
          this.disposeReaction(reactionId);
        } catch (error) {
          this.logger.error(`When effect error in ${component}`, error instanceof Error ? error : new Error(String(error)), {
            component: 'MobXReactionManager',
            action: 'when_error',
            reactionId,
            reactionName,
            sourceComponent: component
          });
        }
      },
      {
        name: reactionName
      }
    );

    this.registerReaction(reactionId, reactionName, component, disposer);
    return reactionId;
  }

  /**
   * Dispose a specific reaction by ID
   */
  disposeReaction(reactionId: string): boolean {
    const reactionInfo = this.reactions.get(reactionId);
    if (!reactionInfo) {
      this.logger.warn('Attempted to dispose non-existent reaction', {
        component: 'MobXReactionManager',
        action: 'disposeReaction',
        reactionId
      });
      return false;
    }

    if (reactionInfo.disposed) {
      this.logger.warn('Attempted to dispose already disposed reaction', {
        component: 'MobXReactionManager',
        action: 'disposeReaction',
        reactionId,
        reactionName: reactionInfo.name
      });
      return false;
    }

    try {
      reactionInfo.disposer();
      reactionInfo.disposed = true;

      this.logger.debug('Reaction disposed', {
        component: 'MobXReactionManager',
        action: 'disposeReaction',
        reactionId,
        reactionName: reactionInfo.name,
        sourceComponent: reactionInfo.component,
        lifespan: Date.now() - reactionInfo.created
      });

      return true;
    } catch (error) {
      this.logger.error('Error disposing reaction', error instanceof Error ? error : new Error(String(error)), {
        component: 'MobXReactionManager',
        action: 'disposeReaction',
        reactionId,
        reactionName: reactionInfo.name
      });
      return false;
    }
  }

  /**
   * Dispose all reactions for a specific component
   */
  disposeComponentReactions(component: string): number {
    const componentReactions = Array.from(this.reactions.values())
      .filter(r => r.component === component && !r.disposed);

    const disposedCount = componentReactions.reduce((count, reaction) => {
      return this.disposeReaction(reaction.id) ? count + 1 : count;
    }, 0);

    this.logger.debug('Component reactions disposed', {
      component: 'MobXReactionManager',
      action: 'disposeComponentReactions',
      sourceComponent: component,
      disposedCount,
      totalReactions: componentReactions.length
    });

    return disposedCount;
  }

  /**
   * Get statistics about current reactions
   */
  getReactionStats(): {
    total: number;
    active: number;
    disposed: number;
    byComponent: Map<string, number>;
    oldestActive: ReactionInfo | null;
  } {
    const stats = {
      total: this.reactions.size,
      active: 0,
      disposed: 0,
      byComponent: new Map<string, number>(),
      oldestActive: null as ReactionInfo | null
    };

    let oldestTime = Date.now();

    this.reactions.forEach(reaction => {
      if (reaction.disposed) {
        stats.disposed++;
      } else {
        stats.active++;
        
        // Track by component
        const componentCount = stats.byComponent.get(reaction.component) || 0;
        stats.byComponent.set(reaction.component, componentCount + 1);

        // Find oldest active reaction
        if (reaction.created < oldestTime) {
          oldestTime = reaction.created;
          stats.oldestActive = reaction;
        }
      }
    });

    return stats;
  }

  /**
   * Get all reactions for a specific component
   */
  getComponentReactions(component: string): ReactionInfo[] {
    return Array.from(this.reactions.values())
      .filter(r => r.component === component);
  }

  /**
   * Clean up disposed reactions from memory
   */
  cleanupDisposedReactions(): number {
    const disposedReactions = Array.from(this.reactions.entries())
      .filter(([_, reaction]) => reaction.disposed);

    disposedReactions.forEach(([id]) => {
      this.reactions.delete(id);
    });

    if (disposedReactions.length > 0) {
      this.logger.debug('Cleaned up disposed reactions', {
        component: 'MobXReactionManager',
        action: 'cleanupDisposedReactions',
        cleanedCount: disposedReactions.length
      });
    }

    return disposedReactions.length;
  }

  /**
   * Enable development mode debugging features
   */
  enableDebugMode(): void {
    // Log reaction creation/disposal in development
    const originalCreateAutorun = this.createAutorun.bind(this);
    this.createAutorun = (view, component, name) => {
      const id = originalCreateAutorun(view, component, name);
      console.log(`🔄 Created autorun: ${name || id} in ${component}`);
      return id;
    };

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupDisposedReactions();
      const stats = this.getReactionStats();
      
      if (stats.active > 50) {
        console.warn(`⚠️ High number of active reactions: ${stats.active}`);
        console.table(Array.from(stats.byComponent.entries()));
      }
    }, 30000); // Check every 30 seconds

    this.logger.info('MobX debug mode enabled', {
      component: 'MobXReactionManager',
      action: 'enableDebugMode'
    });
  }

  /**
   * Private methods
   */
  private generateReactionId(): string {
    return `reaction-${++this.globalReactionId}-${Date.now()}`;
  }

  private registerReaction(
    id: string,
    name: string,
    component: string,
    disposer: IReactionDisposer
  ): void {
    const reactionInfo: ReactionInfo = {
      id,
      name,
      component,
      created: Date.now(),
      disposed: false,
      disposer
    };

    this.reactions.set(id, reactionInfo);

    this.logger.trace('Reaction registered', {
      component: 'MobXReactionManager',
      action: 'registerReaction',
      reactionId: id,
      reactionName: name,
      sourceComponent: component
    });
  }

  private setupGlobalReactionMonitoring(): void {
    // Enable MobX reaction tracking in development
    if (!process.env['production']) {
      // Monitor for reactions that take too long
      const originalReactionScheduler = (Reaction as any).prototype.schedule;
      (Reaction as any).prototype.schedule = function() {
        const start = performance.now();
        const result = originalReactionScheduler.call(this);
        const duration = performance.now() - start;
        
        if (duration > 16) { // Longer than 1 frame (16ms)
          console.warn(`🐌 Slow reaction: ${this.name} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      };
    }

    this.logger.debug('Global reaction monitoring setup complete', {
      component: 'MobXReactionManager',
      action: 'setupGlobalReactionMonitoring'
    });
  }

  ngOnDestroy(): void {
    // Dispose all remaining reactions
    const activeReactions = Array.from(this.reactions.values())
      .filter(r => !r.disposed);

    activeReactions.forEach(reaction => {
      this.disposeReaction(reaction.id);
    });

    this.logger.info('MobX Reaction Manager destroyed', {
      component: 'MobXReactionManager',
      action: 'ngOnDestroy',
      totalReactions: this.reactions.size,
      disposedOnDestroy: activeReactions.length
    });

    this.reactions.clear();
  }
}