import { createTracer } from '../index';

describe('Trace Debugger', () => {
    it('should create a tracer', () => {
        const tracer = createTracer({ serviceName: 'test-service' });
        expect(tracer).toBeDefined();
    });

    it('should start and finish a trace', () => {
        const tracer = createTracer({ serviceName: 'test-service' });
        const trace = tracer.startTrace('test-operation');

        expect(trace).toBeDefined();
        expect(trace.status).toBe('running');

        const finished = tracer.finishTrace(trace.traceId);
        expect(finished.status).toBe('completed');
    });

    it('should track nested spans', () => {
        const tracer = createTracer({ serviceName: 'test-service' });
        const trace = tracer.startTrace('main-operation');

        trace.startSpan('child-operation-1');
        trace.endSpan();

        trace.startSpan('child-operation-2');
        trace.endSpan();

        tracer.finishTrace(trace.traceId);

        expect(trace.rootSpan.children.length).toBe(2);
    });

    it('should collect metrics', () => {
        const tracer = createTracer({
            serviceName: 'test-service',
            captureMetrics: true,
        });

        const trace = tracer.startTrace('performance-test');
        trace.startSpan('operation');
        trace.endSpan();

        tracer.finishTrace(trace.traceId);

        const stats = tracer.getStats();
        expect(stats.totalTraces).toBe(1);
    });
});
