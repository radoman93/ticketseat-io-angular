/**
 * Serialization utilities for converting MobX proxy objects to plain objects
 * suitable for JSON serialization
 */

/**
 * Deep serializes an object, converting MobX proxy objects to plain objects
 * @param obj The object to serialize
 * @returns Plain object suitable for JSON serialization
 */
export function toJS<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle dates
  if (obj instanceof Date) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => toJS(item)) as T;
  }
  
  // Handle Maps
  if (obj instanceof Map) {
    const result: any = {};
    obj.forEach((value, key) => {
      result[key] = toJS(value);
    });
    return result;
  }
  
  // Handle Sets
  if (obj instanceof Set) {
    return Array.from(obj).map(item => toJS(item)) as T;
  }
  
  // Handle regular objects (including MobX proxy objects)
  const result: any = {};
  
  // Get all enumerable properties, including those from MobX proxies
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      
      // Skip functions and undefined values
      if (typeof value !== 'function' && value !== undefined) {
        result[key] = toJS(value);
      }
    }
  }
  
  return result;
}

/**
 * Serializes an object to a JSON string, handling MobX proxy objects
 * @param obj The object to serialize
 * @param space Optional spacing for pretty printing
 * @returns JSON string
 */
export function toJSONString(obj: any, space?: string | number): string {
  const plainObj = toJS(obj);
  return JSON.stringify(plainObj, null, space);
}

/**
 * Creates a deep clone of an object, converting MobX proxies to plain objects
 * @param obj The object to clone
 * @returns Deep cloned plain object
 */
export function deepClone<T>(obj: T): T {
  return toJS(obj);
}

/**
 * Checks if an object is a MobX proxy
 * @param obj The object to check
 * @returns true if the object is a MobX proxy
 */
export function isMobXProxy(obj: any): boolean {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  // Check for MobX proxy indicators
  return (
    obj.constructor &&
    obj.constructor.name === 'Proxy' ||
    '$mobx' in obj ||
    typeof obj.$mobx !== 'undefined'
  );
}