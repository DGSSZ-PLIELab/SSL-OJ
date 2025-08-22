// 性能监控工具

// 页面加载性能监控
export const measurePageLoad = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          // DNS查询时间
          dnsTime: perfData.domainLookupEnd - perfData.domainLookupStart,
          // TCP连接时间
          tcpTime: perfData.connectEnd - perfData.connectStart,
          // 请求响应时间
          requestTime: perfData.responseEnd - perfData.requestStart,
          // DOM解析时间
          domParseTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          // 页面完全加载时间
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          // 首次内容绘制时间
          fcp: 0,
          // 最大内容绘制时间
          lcp: 0
        };

        // 获取FCP和LCP
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
        });

        // 获取LCP
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.startTime;
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }

        console.log('页面性能指标:', metrics);
        
        // 可以发送到分析服务
        // sendToAnalytics(metrics);
      }, 0);
    });
  }
};

// API请求性能监控
export const measureApiCall = async <T>(
  apiCall: () => Promise<T>,
  apiName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`API调用 ${apiName} 耗时: ${duration.toFixed(2)}ms`);
    
    // 如果请求时间过长，发出警告
    if (duration > 3000) {
      console.warn(`API调用 ${apiName} 响应时间过长: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`API调用 ${apiName} 失败，耗时: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

// 组件渲染性能监控
export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16) { // 超过一帧的时间(16ms)
      console.warn(`组件 ${componentName} 渲染时间过长: ${duration.toFixed(2)}ms`);
    }
  };
};

// 内存使用监控
export const measureMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }
  return null;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};