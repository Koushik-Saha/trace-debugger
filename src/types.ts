/**
 * Tracer configuration
 */
export interface TracerConfig {
    serviceName: string;              // Your service name (e.g., 'user-service')
    exportTo?: 'console' | 'jaeger';  // Where to send traces
    jaegerEndpoint?: string;          // Jaeger URL
    captureMetrics?: boolean;         // Track performance metrics
    sampleRate?: number;              // % of requests to trace (0-1)
}

/**
 * A single span (one operation)
 */
export interface Span {
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
}

/**
 * Complete trace (all operations)
 */
export interface Trace {
    traceId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    rootSpan: Span;
    allSpans: Span[];
    status: 'running' | 'completed' | 'failed';
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    totalDuration: number;
    slowestOperation: { name: string; duration: number };
    operationCount: number;
    averageOperationTime: number;
    databaseQueries: { query: string; duration: number }[];
    memoryUsed: number;
}
