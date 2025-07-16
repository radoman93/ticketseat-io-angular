import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  component?: string;
  store?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  contexts: string[];
  batchSize: number;
  flushInterval: number;
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private config: LogConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer?: number;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
    this.startBatchFlush();
  }

  /**
   * Static method to create a logger with specific configuration
   */
  static create(config?: Partial<LogConfig>): LoggerService {
    const logger = new LoggerService();
    if (config) {
      logger.configure(config);
    }
    return logger;
  }

  private getDefaultConfig(): LogConfig {
    return {
      level: environment.production ? LogLevel.ERROR : LogLevel.DEBUG,
      enableConsole: !environment.production,
      enableRemote: environment.production,
      contexts: [],
      batchSize: 50,
      flushInterval: 5000
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Early return for performance - no work if log level is below threshold
    if (level > this.config.level) {
      return;
    }

    // Filter by context if specified
    if (this.config.contexts.length > 0 && context) {
      const hasMatchingContext = this.config.contexts.some(ctx => 
        context.component?.includes(ctx) || 
        context.store?.includes(ctx) ||
        context.action?.includes(ctx)
      );
      if (!hasMatchingContext) {
        return;
      }
    }

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId
      },
      error
    };

    // Console output for development
    if (this.config.enableConsole) {
      this.writeToConsole(logEntry);
    }

    // Queue for remote logging
    if (this.config.enableRemote) {
      this.queueForRemote(logEntry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const contextStr = entry.context ? ` [${this.formatContext(entry.context)}]` : '';
    const fullMessage = `${timestamp}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        if (entry.error) {
          console.error(fullMessage, entry.error);
        } else {
          console.error(fullMessage);
        }
        break;
      case LogLevel.WARN:
        console.warn(fullMessage);
        break;
      case LogLevel.INFO:
        console.info(fullMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(fullMessage);
        break;
      case LogLevel.TRACE:
        console.trace(fullMessage);
        break;
    }
  }

  private formatContext(context: LogContext): string {
    const parts: string[] = [];
    if (context.component) parts.push(`${context.component}`);
    if (context.store) parts.push(`${context.store}`);
    if (context.action) parts.push(`${context.action}`);
    return parts.join(':');
  }

  private queueForRemote(entry: LogEntry): void {
    this.logQueue.push(entry);
    
    if (this.logQueue.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  private startBatchFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = window.setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushLogs();
      }
    }, this.config.flushInterval);
  }

  private flushLogs(): void {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    // In a real implementation, you would send these to your logging service
    // For now, we'll just clear the queue
    this.sendToRemoteService(logsToSend);
  }

  private sendToRemoteService(logs: LogEntry[]): void {
    // TODO: Implement actual remote logging service integration
    // This could be Sentry, LogRocket, DataDog, etc.
    
    // Example implementation:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logs)
    // }).catch(err => {
    //   // Fallback to console for critical errors
    //   console.error('Failed to send logs to remote service:', err);
    // });
  }

  // Performance monitoring helpers
  startTimer(name: string, context?: LogContext): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.debug(`Timer [${name}]: ${duration.toFixed(2)}ms`, {
        ...context,
        action: 'performance',
        duration
      });
    };
  }

  // Utility for logging state changes
  logStateChange<T>(storeName: string, property: string, oldValue: T, newValue: T): void {
    if (oldValue !== newValue) {
      this.trace(`State change in ${storeName}.${property}`, {
        store: storeName,
        action: 'state_change',
        property,
        oldValue: this.safeStringify(oldValue),
        newValue: this.safeStringify(newValue)
      });
    }
  }

  // Utility for logging user interactions
  logUserAction(action: string, component: string, details?: any): void {
    this.info(`User action: ${action}`, {
      component,
      action: 'user_interaction',
      details: this.safeStringify(details)
    });
  }

  private safeStringify(value: any): string {
    try {
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return JSON.stringify(value);
    } catch {
      return '[Circular Reference]';
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs(); // Final flush
  }
}