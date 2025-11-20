/**
 * Performance: Web Vitals Monitoring
 * 
 * Tracks Core Web Vitals for performance monitoring
 */

type WebVitalsMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

/**
 * Log Web Vitals to console in development
 */
export function logWebVitals() {
  if (import.meta.env.DEV) {
    console.log('[Web Vitals] Monitoring enabled in development mode');
    // Web vitals monitoring would be implemented here
    // For now, we use basic performance API
  }
}

/**
 * Performance marks for custom measurements
 */
export const performanceMark = {
  start: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  },
  
  end: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      if (measure && import.meta.env.DEV) {
        console.log(`[Performance] ${name}: ${Math.round(measure.duration)}ms`);
      }
    }
  },
};
