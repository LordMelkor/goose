/**
 * Safe localStorage utilities that handle cases where localStorage is unavailable
 * (e.g., SSR, Storybook, unit tests, or browser restrictions)
 */

/**
 * Safely get an item from localStorage with a default fallback
 * @param key - The localStorage key to read
 * @param defaultValue - Value to return if localStorage is unavailable or key doesn't exist
 * @returns The stored value or the default value
 */
export const getLocalStorageItem = (key: string, defaultValue: string = ''): string => {
  try {
    if (typeof localStorage === 'undefined') {
      return defaultValue;
    }
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.warn(`Failed to read from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 * @param key - The localStorage key to write
 * @param value - The value to store
 * @returns true if successful, false if localStorage is unavailable or write failed
 */
export const setLocalStorageItem = (key: string, value: string): boolean => {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely get a boolean value from localStorage
 * @param key - The localStorage key to read
 * @param defaultValue - Default boolean value if key doesn't exist or localStorage unavailable
 * @returns The stored boolean value or the default
 */
export const getLocalStorageBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getLocalStorageItem(key, String(defaultValue));
  return value === 'true';
};

/**
 * Safely set a boolean value in localStorage
 * @param key - The localStorage key to write
 * @param value - The boolean value to store
 * @returns true if successful, false if localStorage is unavailable or write failed
 */
export const setLocalStorageBoolean = (key: string, value: boolean): boolean => {
  return setLocalStorageItem(key, String(value));
};
