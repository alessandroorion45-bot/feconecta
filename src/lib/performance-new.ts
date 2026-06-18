/**
 * Sistema de Medição de Performance
 * Identifica gargalos em rotas, banco de dados e APIs
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'route' | 'query' | 'api' | 'render';
  details?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled = process.env.NODE_ENV === 'development';

  /**
   * Inicia medição de uma operação
   */
  start(name: string, type: PerformanceMetric['type'] = 'route') {
    if (!this.enabled) return () => {};

    const startTime = performance.now();

    return (details?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: Date.now(),
        type,
        details
      };

      this.metrics.push(metric);

      // Log automático se demorar muito
      if (duration > 1000) {
        console.warn(`⚠️ LENTO: ${name} demorou ${duration.toFixed(0)}ms`, details);
      } else if (duration > 500) {
        console.log(`⏱️ ${name}: ${duration.toFixed(0)}ms`, details);
      } else {
        console.log(`✅ ${name}: ${duration.toFixed(0)}ms`);
      }

      return metric;
    };
  }

  /**
   * Mede uma query do Supabase
   */
  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const end = this.start(name, 'query');

    try {
      const result = await queryFn();
      end({ success: true });
      return result;
    } catch (error: any) {
      end({ success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Retorna relatório de performance
   */
  getReport() {
    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      total: this.metrics.length,
      slowest,
      recommendations: this.getRecommendations(slowest)
    };
  }

  /**
   * Gera recomendações
   */
  private getRecommendations(slowest: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];

    const slowQueries = slowest.filter(m => m.type === 'query' && m.duration > 500);
    if (slowQueries.length > 0) {
      recommendations.push(
        `🔴 ${slowQueries.length} queries lentas (>500ms). Adicione índices.`
      );
    }

    return recommendations.length > 0 ? recommendations : ['✅ Performance OK'];
  }

  /**
   * Exporta métricas
   */
  exportMetrics() {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

// Singleton
export const performanceMonitor = new PerformanceMonitor();
