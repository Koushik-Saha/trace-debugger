import { Trace } from '../types';

/**
 * Stores and retrieves traces
 */
export class TraceStorage {
    private traces: Map<string, Trace> = new Map();
    private maxTraces: number = 1000;

    /**
     * Store a trace
     */
    store(trace: Trace) {
        this.traces.set(trace.traceId, trace);

        // Remove oldest if we exceed max
        if (this.traces.size > this.maxTraces) {
            const firstKey = this.traces.keys().next().value;
            this.traces.delete(firstKey);
        }
    }

    /**
     * Get a trace by ID
     */
    get(traceId: string): Trace | undefined {
        return this.traces.get(traceId);
    }

    /**
     * Get all traces
     */
    getAll(): Trace[] {
        return Array.from(this.traces.values());
    }

    /**
     * Get slow traces (took longer than threshold)
     */
    getSlowTraces(thresholdMs: number = 1000): Trace[] {
        return Array.from(this.traces.values()).filter((t) => (t.duration || 0) > thresholdMs);
    }

    /**
     * Clear storage
     */
    clear() {
        this.traces.clear();
    }

    /**
     * Get statistics
     */
    getStats() {
        const allTraces = Array.from(this.traces.values());
        const durations = allTraces.map((t) => t.duration || 0);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        return {
            totalTraces: allTraces.length,
            averageDuration: avgDuration.toFixed(2),
            slowestTrace: Math.max(...durations),
            fastestTrace: Math.min(...durations),
        };
    }
}
