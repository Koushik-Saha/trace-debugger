import {TracerConfig} from "./types";
import {Tracer} from "./core/Tracer";
export { Trace } from './core/Trace';
export { Span } from './core/Span';
export { TraceStorage } from './core/TraceStorage';
export { MetricsCollector } from './core/MetricsCollector';
// export { TracerConfig, Trace as TraceInterface, Span as SpanInterface, PerformanceMetrics } from "./types";

/**
 * Easy way to create tracer
 */
export function createTracer(config: TracerConfig) {
    return new Tracer(config);
}
