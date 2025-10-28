import { Trace as TraceInterface } from '../types';
import { Span } from './Span';

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
export class Trace implements TraceInterface {
    traceId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    rootSpan: Span;
    allSpans: Span[] = [];
    status: 'running' | 'completed' | 'failed' = 'running';
    currentSpan: Span;

    constructor(traceId: string, rootSpanName: string) {
        this.traceId = traceId;
        this.startTime = Date.now();
        this.rootSpan = new Span(traceId, rootSpanName);
        this.currentSpan = this.rootSpan;
        this.allSpans.push(this.rootSpan);
    }

    /**
     * Start a new child span
     *
     * Usage:
     * trace.startSpan('database_query');
     */
    startSpan(name: string): Span {
        const span = new Span(this.traceId, name, this.currentSpan.id);
        this.currentSpan.addChild(span);
        this.allSpans.push(span);
        this.currentSpan = span;
        return span;
    }

    /**
     * End current span
     */
    endSpan(error?: Error) {
        this.currentSpan.end(error);

        // Go back to parent
        if (this.currentSpan.parentId) {
            const parent = this.allSpans.find((s) => s.id === this.currentSpan.parentId);
            if (parent) {
                this.currentSpan = parent;
            }
        }
    }

    /**
     * Finish the entire trace
     */
    finish(error?: Error) {
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        this.status = error ? 'failed' : 'completed';
    }

    /**
     * Get all spans as tree
     */
    getSpanTree(): any {
        return this.rootSpan.toJSON();
    }

    /**
     * Find slow operations
     */
    getSlowOperations(thresholdMs: number = 100): Span[] {
        return this.allSpans.filter((s) => (s.duration || 0) > thresholdMs);
    }

    /**
     * Get trace visualization
     */
    visualize(indent: number = 0): string {
        let output = '';

        const formatSpan = (span: Span, level: number) => {
            const prefix = '  '.repeat(level) + '├─ ';
            output += `${prefix}${span.name} (${span.duration}ms)\n`;
            span.children.forEach((child) => formatSpan(child, level + 1));
        };

        formatSpan(this.rootSpan, 0);
        return output;
    }
}
