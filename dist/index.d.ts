/**
 * Tracer configuration
 */
interface TracerConfig {
    serviceName: string;
    exportTo?: 'console' | 'jaeger';
    jaegerEndpoint?: string;
    captureMetrics?: boolean;
    sampleRate?: number;
}
/**
 * A single span (one operation)
 */
interface Span$1 {
    id: string;
    traceId: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'started' | 'completed' | 'error';
    error?: Error;
    attributes: Record<string, any>;
    children: Span$1[];
    parentId?: string;
}
/**
 * Complete trace (all operations)
 */
interface Trace$1 {
    traceId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    rootSpan: Span$1;
    allSpans: Span$1[];
    status: 'running' | 'completed' | 'failed';
}
/**
 * Performance metrics
 */
interface PerformanceMetrics {
    totalDuration: number;
    slowestOperation: {
        name: string;
        duration: number;
    };
    operationCount: number;
    averageOperationTime: number;
    databaseQueries: {
        query: string;
        duration: number;
    }[];
    memoryUsed: number;
}

/**
 * A Span represents one operation
 *
 * Example:
 * - Getting user from database = 1 span
 * - Calling external API = 1 span
 * - Processing response = 1 span
 */
declare class Span implements Span$1 {
    id: string;
    traceId: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'started' | 'completed' | 'error';
    error?: Error;
    attributes: Record<string, any>;
    children: Span[];
    parentId?: string;
    constructor(traceId: string, name: string, parentId?: string);
    /**
     * Add a child span
     */
    addChild(span: Span): void;
    /**
     * Mark as complete
     */
    end(error?: Error): void;
    /**
     * Add custom attribute
     */
    setAttribute(key: string, value: any): void;
    /**
     * Get formatted output
     */
    toJSON(): any;
}

/**
 * A Trace represents a complete request
 *
 * Example flow:
 * GET /users/123
 *   ├─ Validate request (100ms)
 *   ├─ Query database (500ms)
 *   │  └─ Parse results (50ms)
 *   └─ Send response (10ms)
 */
declare class Trace implements Trace$1 {
    traceId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    rootSpan: Span;
    allSpans: Span[];
    status: 'running' | 'completed' | 'failed';
    currentSpan: Span;
    constructor(traceId: string, rootSpanName: string);
    /**
     * Start a new child span
     *
     * Usage:
     * trace.startSpan('database_query');
     */
    startSpan(name: string): Span;
    /**
     * End current span
     */
    endSpan(error?: Error): void;
    /**
     * Finish the entire trace
     */
    finish(error?: Error): void;
    /**
     * Get all spans as tree
     */
    getSpanTree(): any;
    /**
     * Find slow operations
     */
    getSlowOperations(thresholdMs?: number): Span[];
    /**
     * Get trace visualization
     */
    visualize(indent?: number): string;
}

/**
 * Main Tracer - orchestrates tracing
 */
declare class Tracer {
    private config;
    private storage;
    private activeTraces;
    constructor(config: TracerConfig);
    /**
     * Start a new trace
     *
     * Usage:
     * const trace = tracer.startTrace('GET /users/123');
     */
    startTrace(name: string): Trace;
    /**
     * Start a span within current trace
     *
     * Usage:
     * tracer.startSpan('database_query');
     * // ... do query ...
     * tracer.endSpan();
     */
    startSpan(name: string, traceId?: string): Span;
    /**
     * End current span
     */
    endSpan(error?: Error): void;
    /**
     * Finish trace and export
     */
    finishTrace(traceId: string, error?: Error): Trace;
    /**
     * Export trace
     */
    private exportTrace;
    /**
     * Instrument a function - automatically trace it
     *
     * Usage:
     * tracer.instrument('getUserProfile', async (userId) => {
     *   return await db.query(`SELECT * FROM users WHERE id = ${userId}`);
     * });
     */
    instrument<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): T;
    /**
     * Get trace by ID
     */
    getTrace(traceId: string): Trace$1;
    /**
     * Get slow traces
     */
    getSlowTraces(threshold?: number): Trace$1[];
    /**
     * Get statistics
     */
    getStats(): {
        totalTraces: number;
        averageDuration: string;
        slowestTrace: number;
        fastestTrace: number;
    };
}

/**
 * Stores and retrieves traces
 */
declare class TraceStorage {
    private traces;
    private maxTraces;
    /**
     * Store a trace
     */
    store(trace: Trace$1): void;
    /**
     * Get a trace by ID
     */
    get(traceId: string): Trace$1 | undefined;
    /**
     * Get all traces
     */
    getAll(): Trace$1[];
    /**
     * Get slow traces (took longer than threshold)
     */
    getSlowTraces(thresholdMs?: number): Trace$1[];
    /**
     * Clear storage
     */
    clear(): void;
    /**
     * Get statistics
     */
    getStats(): {
        totalTraces: number;
        averageDuration: string;
        slowestTrace: number;
        fastestTrace: number;
    };
}

/**
 * Collects performance metrics from traces
 */
declare class MetricsCollector {
    /**
     * Analyze a trace and extract metrics
     */
    static analyzeTrace(trace: Trace$1): PerformanceMetrics;
    /**
     * Print metrics
     */
    static printMetrics(metrics: PerformanceMetrics): void;
}

/**
 * Easy way to create tracer
 */
declare function createTracer(config: TracerConfig): Tracer;

export { MetricsCollector, Span, Trace, TraceStorage, createTracer };
