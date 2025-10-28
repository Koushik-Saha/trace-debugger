import { PerformanceMetrics, Trace } from '../types';
import { Span } from './Span';

/**
 * Collects performance metrics from traces
 */
export class MetricsCollector {
    /**
     * Analyze a trace and extract metrics
     */
    static analyzeTrace(trace: Trace): PerformanceMetrics {
        const allSpans = trace.allSpans;

        // Find slowest operation
        let slowestSpan = allSpans[0];
        allSpans.forEach((span) => {
            if ((span.duration || 0) > (slowestSpan.duration || 0)) {
                slowestSpan = span;
            }
        });

        // Calculate average
        const totalTime = allSpans.reduce((sum, span) => sum + (span.duration || 0), 0);
        const averageTime = totalTime / allSpans.length;

        // Get database queries
        const dbQueries = allSpans
            .filter((span) => span.name.includes('database') || span.name.includes('query'))
            .map((span) => ({
                query: span.attributes.query || span.name,
                duration: span.duration || 0,
            }));

        return {
            totalDuration: trace.duration || 0,
            slowestOperation: {
                name: slowestSpan.name,
                duration: slowestSpan.duration || 0,
            },
            operationCount: allSpans.length,
            averageOperationTime: averageTime,
            databaseQueries: dbQueries,
            memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        };
    }

    /**
     * Print metrics
     */
    static printMetrics(metrics: PerformanceMetrics) {
        console.log('\n📊 Performance Metrics:');
        console.log(`Total Duration: ${metrics.totalDuration}ms`);
        console.log(`Operations: ${metrics.operationCount}`);
        console.log(`Average per Op: ${metrics.averageOperationTime.toFixed(2)}ms`);
        console.log(`Slowest: ${metrics.slowestOperation.name} (${metrics.slowestOperation.duration}ms)`);
        console.log(`Memory: ${metrics.memoryUsed.toFixed(2)}MB`);

        if (metrics.databaseQueries.length > 0) {
            console.log('\n🗄️  Database Queries:');
            metrics.databaseQueries.forEach((q) => {
                console.log(`  - ${q.query} (${q.duration}ms)`);
            });
        }
        console.log('');
    }
}
