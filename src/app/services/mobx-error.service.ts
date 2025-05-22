import { Injectable } from '@angular/core';
import { makeAutoObservable } from 'mobx';

export interface MobXError {
  id: string;
  message: string;
  timestamp: Date;
  context?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MobxErrorService {
  errors: MobXError[] = [];
  
  constructor() {
    // Make properties observable
    makeAutoObservable(this);
    
    // Set up a global error handler for MobX actions
    window.addEventListener('error', (event) => {
      // Only intercept errors from MobX
      if (event.error && event.error.message && event.error.message.includes('MobX')) {
        this.logError({
          id: Date.now().toString(),
          message: event.error.message,
          timestamp: new Date(),
          context: event.error.stack
        });
        
        // Prevent the error from propagating further
        event.preventDefault();
      }
    });
  }
  
  /**
   * Log a MobX-related error
   */
  logError(error: MobXError): void {
    this.errors.push(error);
    
    // Log to console
    console.error('[MobX Error]', error.message, error.context);
  }
  
  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }
  
  /**
   * Get all errors
   */
  getErrors(): MobXError[] {
    return this.errors;
  }
  
  /**
   * Create a wrapper for actions that catches MobX-related errors
   */
  safeAction<T>(action: (...args: any[]) => T): (...args: any[]) => T | null {
    return (...args: any[]): T | null => {
      try {
        return action(...args);
      } catch (error: any) {
        this.logError({
          id: Date.now().toString(),
          message: error.message || 'Unknown MobX error',
          timestamp: new Date(),
          context: { action, args, stack: error.stack }
        });
        return null;
      }
    };
  }
} 