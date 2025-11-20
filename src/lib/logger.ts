/**
 * Logger Service
 * Prevents console logs in production and provides structured logging
 */

const isDev = import.meta.env.DEV;

export const logger = {
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
    // In production, you can send to error tracking service (e.g., Sentry)
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
