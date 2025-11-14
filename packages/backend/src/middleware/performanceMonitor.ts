import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  middleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any) {
        const duration = Date.now() - startTime;

        // Store metrics
        self.storeMetric({
          endpoint: req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
          timestamp: new Date(),
        });

        return originalSend.call(this, data);
      };

      next();
    };
  }

  private storeMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow requests (> 1 second)
    if (metric.duration > 1000) {
      console.warn(`⚠️  Slow request: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        avgDuration: 0,
        slowestEndpoints: [],
        errorRate: 0,
      };
    }

    const totalRequests = this.metrics.length;
    const avgDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;

    // Group by endpoint
    const endpointStats = new Map<string, { count: number; totalDuration: number }>();
    this.metrics.forEach((m) => {
      const key = `${m.method} ${m.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, totalDuration: 0 };
      existing.count++;
      existing.totalDuration += m.duration;
      endpointStats.set(key, existing);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
        requestCount: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    const errorCount = this.metrics.filter((m) => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    return {
      totalRequests,
      avgDuration: Math.round(avgDuration),
      slowestEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
