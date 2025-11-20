/**
 * Performance: Memoization Utilities
 * 
 * Helper functions and hooks for React memoization
 */

import { memo } from 'react';

/**
 * Custom memo comparison for objects
 * Only re-render if specific props change
 */
export const arePropsEqual = <T extends Record<string, unknown>>(
  prevProps: T,
  nextProps: T,
  keys: (keyof T)[]
): boolean => {
  return keys.every(key => prevProps[key] === nextProps[key]);
};

/**
 * Create a memoized component with custom comparison
 * 
 * @example
 * const MemoizedComponent = createMemoComponent(MyComponent, ['id', 'name']);
 */
export const createMemoComponent = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  compareKeys?: (keyof P)[]
) => {
  if (compareKeys) {
    return memo(Component, (prev, next) => arePropsEqual(prev, next, compareKeys));
  }
  return memo(Component);
};

/**
 * Shallow comparison for objects
 */
export const shallowEqual = <T extends Record<string, unknown>>(
  obj1: T,
  obj2: T
): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key => obj1[key] === obj2[key]);
};
