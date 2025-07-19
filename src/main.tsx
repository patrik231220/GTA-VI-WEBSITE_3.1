import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PerformanceMonitor, preloadCriticalResources, registerServiceWorker } from './utils/performance';

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();
performanceMonitor.measureCoreWebVitals();
performanceMonitor.measureResourceLoading();

// Preload critical resources
preloadCriticalResources();

// Register service worker
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
