import { LogLevel, LogConfig, LoggerService } from '../services/logger.service';
import { environment } from '../../environments/environment';

/**
 * Predefined logger configurations for different use cases
 */
export const LoggerConfigs = {
  // Development configuration - verbose logging
  development: {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableRemote: false,
    contexts: [],
    batchSize: 10,
    flushInterval: 2000
  } as LogConfig,

  // Production configuration - minimal logging
  production: {
    level: LogLevel.ERROR,
    enableConsole: false,
    enableRemote: true,
    contexts: [],
    batchSize: 100,
    flushInterval: 10000
  } as LogConfig,

  // Performance debugging - focus on specific components
  performance: {
    level: LogLevel.TRACE,
    enableConsole: true,
    enableRemote: false,
    contexts: ['DragStore', 'GridComponent', 'SelectionStore'],
    batchSize: 5,
    flushInterval: 1000
  } as LogConfig,

  // Silent mode - only critical errors
  silent: {
    level: LogLevel.ERROR,
    enableConsole: false,
    enableRemote: false,
    contexts: [],
    batchSize: 1,
    flushInterval: 1000
  } as LogConfig
};

/**
 * Get the appropriate logger configuration based on environment and debug mode
 */
export function getLoggerConfig(debugMode?: 'performance' | 'silent'): LogConfig {
  if (debugMode === 'performance') {
    return LoggerConfigs.performance;
  }
  
  if (debugMode === 'silent') {
    return LoggerConfigs.silent;
  }

  return environment.production 
    ? LoggerConfigs.production 
    : LoggerConfigs.development;
}

/**
 * Create a preconfigured logger instance
 */
export function createLogger(debugMode?: 'performance' | 'silent'): LoggerService {
  const config = getLoggerConfig(debugMode);
  return LoggerService.create(config);
}