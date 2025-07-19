// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure Core Web Vitals
  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.set('FID', entry.processingStart - entry.startTime);
        this.reportMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('CLS', clsValue);
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Resource loading performance
  measureResourceLoading() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      // Page load metrics
      this.metrics.set('TTFB', navigation.responseStart - navigation.requestStart);
      this.metrics.set('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.navigationStart);
      this.metrics.set('LoadComplete', navigation.loadEventEnd - navigation.navigationStart);

      // Resource breakdown
      const imageResources = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i));
      const jsResources = resources.filter(r => r.name.match(/\.js$/i));
      const cssResources = resources.filter(r => r.name.match(/\.css$/i));

      this.reportResourceMetrics({
        totalResources: resources.length,
        imageCount: imageResources.length,
        jsCount: jsResources.length,
        cssCount: cssResources.length,
        totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      });
    });
  }

  // Report metrics to analytics
  private reportMetric(name: string, value: number) {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        custom_parameter: window.location.pathname
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}: ${Math.round(value)}ms`);
    }
  }

  private reportResourceMetrics(metrics: any) {
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }
  }

  // Get current metrics
  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}

// Lazy loading utility
export const lazyLoad = (target: HTMLElement, callback: () => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(target);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/TRANSPARENT_LOGO/GTA-6-Logo-PNG-from-Grand-Theft-Auto-VI-Transparent.webp',
    '/posters_background/poster1-optimized.webp',
    '/AUDIO/Tom Petty - Love Is A Long Road (Official Audio).mp3'
  ];

  criticalResources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.includes('.webp') || resource.includes('.jpg')) {
      link.as = 'image';
    } else if (resource.includes('.mp3')) {
      link.as = 'audio';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Service Worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};