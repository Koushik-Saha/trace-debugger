import { TracerConfig } from '../types';
import { Trace } from './Trace';
import { TraceStorage } from './TraceStorage';
import { MetricsCollector } from './MetricsCollector';

/**
 * Main Tracer - orchestrates tracing
 */
export class Tracer {
    private config: TracerConfig;
    private storage: TraceStorage;
    private activeTraces: Map<string, Trace> = new Map();

    constructor(config: TracerConfig) {
        this.config = {
            exportTo: 'console',
            captureMetrics: true,
            sampleRate: 1,
            ...config,
        };
        this.storage = new TraceStorage();
    }

    /**
     * Start a new trace
     *
     * Usage:
     * const trace = tracer.startTrace('GET /users/123');
     */
    startTrace(name: string): Trace {
        const traceId = `trace-${Date.now()}-${Math.random()}`;
        const trace = new Trace(traceId, name);
        this.activeTraces.set(traceId, trace);
        return trace;
    }

    /**
     * Start a span within current trace
     *
     * Usage:
     * tracer.startSpan('database_query');
     * // ... do query ...
     * tracer.endSpan();
     */
    startSpan(name: string, traceId?: string) {
        let trace = traceId ? this.activeTraces.get(traceId) : Array.from(this.activeTraces.values())[0];
        if (!trace) throw new Error('No active trace');
        return trace.startSpan(name);
    }

    /**
     * End current span
     */
    endSpan(error?: Error) {
        const trace = Array.from(this.activeTraces.values())[0];
        if (!trace) throw new Error('No active trace');
        trace.endSpan(error);
    }

    /**
     * Finish trace and export
     */
    finishTrace(traceId: string, error?: Error) {
        const trace = this.activeTraces.get(traceId);
        if (!trace) throw new Error(`Trace not found: ${traceId}`);

        trace.finish(error);
        this.storage.store(trace);
        this.activeTraces.delete(traceId);

        // Export
        this.exportTrace(trace);

        return trace;
    }

    /**
     * Export trace
     */
    private exportTrace(trace: Trace) {
        if (this.config.exportTo === 'console') {
            console.log('\n🔍 Trace Visualization:');
            console.log(trace.visualize());

            if (this.config.captureMetrics) {
                const metrics = MetricsCollector.analyzeTrace(trace);
                MetricsCollector.printMetrics(metrics);
            }
        }
        // Add Jaeger export here if needed
    }

    /**
     * Instrument a function - automatically trace it
     *
     * Usage:
     * tracer.instrument('getUserProfile', async (userId) => {
     *   return await db.query(`SELECT * FROM users WHERE id = ${userId}`);
     * });
     */
    instrument<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): T {
        return (async (...args: any[]) => {
            const trace = this.startTrace(name);
            try {
                const span = trace.startSpan('execution');
                const result = await fn(...args);
                span.end();
                this.finishTrace(trace.traceId);
                return result;
            } catch (error) {
                this.finishTrace(trace.traceId, error as Error);
                throw error;
            }
        }) as T;
    }

    /**
     * Get trace by ID
     */
    getTrace(traceId: string) {
        return this.storage.get(traceId);
    }

    /**
     * Get slow traces
     */
    getSlowTraces(threshold?: number) {
        return this.storage.getSlowTraces(threshold);
    }

    /**
     * Get statistics
     */
    getStats() {
        return this.storage.getStats();
    }
}
