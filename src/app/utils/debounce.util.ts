import { action, runInAction } from 'mobx';

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
  immediate: boolean = false
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let args: Parameters<T> | null = null;
  let context: any = null;
  let result: ReturnType<T>;

  const later = () => {
    timeout = null;
    if (!immediate && args) {
      result = func.apply(context, args);
    }
  };

  const debounced = function (this: any, ...newArgs: Parameters<T>) {
    context = this;
    args = newArgs;
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      result = func.apply(context, args);
    }
    
    return result;
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = () => {
    if (timeout && args) {
      clearTimeout(timeout);
      result = func.apply(context, args);
      timeout = null;
    }
  };

  return debounced as DebouncedFunction<T>;
}

export function debouncedAction<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
  immediate: boolean = false
): DebouncedFunction<T> {
  const wrappedFunc = action(func);
  return debounce(wrappedFunc, wait, immediate);
}

export function debouncedPropertyUpdate<T>(
  updateFn: (property: string, value: T) => void,
  wait: number = 300
): (property: string, value: T) => void {
  const debouncedUpdates = new Map<string, DebouncedFunction<(value: T) => void>>();
  
  return (property: string, value: T) => {
    if (!debouncedUpdates.has(property)) {
      const updateAction = action((val: T) => {
        runInAction(() => {
          updateFn(property, val);
        });
      });
      
      debouncedUpdates.set(property, debounce(updateAction, wait));
    }
    
    const debouncedUpdate = debouncedUpdates.get(property)!;
    debouncedUpdate(value);
  };
}

export function batchedPropertyUpdate<T>(
  updateFn: (updates: Record<string, T>) => void,
  wait: number = 300
): (property: string, value: T) => void {
  let pendingUpdates: Record<string, T> = {};
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const flushUpdates = action(() => {
    if (Object.keys(pendingUpdates).length > 0) {
      runInAction(() => {
        updateFn(pendingUpdates);
        pendingUpdates = {};
      });
    }
    timeout = null;
  });
  
  return (property: string, value: T) => {
    pendingUpdates[property] = value;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(flushUpdates, wait);
  };
}