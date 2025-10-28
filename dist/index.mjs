// src/core/Span.ts
var Span = class {
  constructor(traceId, name, parentId) {
    this.status = "started";
    this.attributes = {};
    this.children = [];
    this.id = `span-${Date.now()}-${Math.random()}`;
    this.traceId = traceId;
    this.name = name;
    this.parentId = parentId;
    this.startTime = Date.now();
  }
  /**
   * Add a child span
   */
  addChild(span) {
    this.children.push(span);
  }
  /**
   * Mark as complete
   */
  end(error) {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.status = error ? "error" : "completed";
    this.error = error;
  }
  /**
   * Add custom attribute
   */
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  /**
   * Get formatted output
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      duration: this.duration,
      status: this.status,
      error: this.error?.message,
      attributes: this.attributes,
      children: this.children.map((c) => c.toJSON())
    };
  }
};

// src/core/Trace.ts
var Trace = class {
  constructor(traceId, rootSpanName) {
    this.allSpans = [];
    this.status = "running";
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
  startSpan(name) {
    const span = new Span(this.traceId, name, this.currentSpan.id);
    this.currentSpan.addChild(span);
    this.allSpans.push(span);
    this.currentSpan = span;
    return span;
  }
  /**
   * End current span
   */
  endSpan(error) {
    this.currentSpan.end(error);
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
  finish(error) {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.status = error ? "failed" : "completed";
  }
  /**
   * Get all spans as tree
   */
  getSpanTree() {
    return this.rootSpan.toJSON();
  }
  /**
   * Find slow operations
   */
  getSlowOperations(thresholdMs = 100) {
    return this.allSpans.filter((s) => (s.duration || 0) > thresholdMs);
  }
  /**
   * Get trace visualization
   */
  visualize(indent = 0) {
    let output = "";
    const formatSpan = (span, level) => {
      const prefix = "  ".repeat(level) + "\u251C\u2500 ";
      output += `${prefix}${span.name} (${span.duration}ms)
`;
      span.children.forEach((child) => formatSpan(child, level + 1));
    };
    formatSpan(this.rootSpan, 0);
    return output;
  }
};

// src/core/TraceStorage.ts
var TraceStorage = class {
  constructor() {
    this.traces = /* @__PURE__ */ new Map();
    this.maxTraces = 1e3;
  }
  /**
   * Store a trace
   */
  store(trace) {
    this.traces.set(trace.traceId, trace);
    if (this.traces.size > this.maxTraces) {
      const firstKey = this.traces.keys().next().value;
      this.traces.delete(firstKey);
    }
  }
  /**
   * Get a trace by ID
   */
  get(traceId) {
    return this.traces.get(traceId);
  }
  /**
   * Get all traces
   */
  getAll() {
    return Array.from(this.traces.values());
  }
  /**
   * Get slow traces (took longer than threshold)
   */
  getSlowTraces(thresholdMs = 1e3) {
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
      fastestTrace: Math.min(...durations)
    };
  }
};

// src/core/MetricsCollector.ts
var MetricsCollector = class {
  /**
   * Analyze a trace and extract metrics
   */
  static analyzeTrace(trace) {
    const allSpans = trace.allSpans;
    let slowestSpan = allSpans[0];
    allSpans.forEach((span) => {
      if ((span.duration || 0) > (slowestSpan.duration || 0)) {
        slowestSpan = span;
      }
    });
    const totalTime = allSpans.reduce((sum, span) => sum + (span.duration || 0), 0);
    const averageTime = totalTime / allSpans.length;
    const dbQueries = allSpans.filter((span) => span.name.includes("database") || span.name.includes("query")).map((span) => ({
      query: span.attributes.query || span.name,
      duration: span.duration || 0
    }));
    return {
      totalDuration: trace.duration || 0,
      slowestOperation: {
        name: slowestSpan.name,
        duration: slowestSpan.duration || 0
      },
      operationCount: allSpans.length,
      averageOperationTime: averageTime,
      databaseQueries: dbQueries,
      memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024
      // MB
    };
  }
  /**
   * Print metrics
   */
  static printMetrics(metrics) {
    console.log("\n\u{1F4CA} Performance Metrics:");
    console.log(`Total Duration: ${metrics.totalDuration}ms`);
    console.log(`Operations: ${metrics.operationCount}`);
    console.log(`Average per Op: ${metrics.averageOperationTime.toFixed(2)}ms`);
    console.log(`Slowest: ${metrics.slowestOperation.name} (${metrics.slowestOperation.duration}ms)`);
    console.log(`Memory: ${metrics.memoryUsed.toFixed(2)}MB`);
    if (metrics.databaseQueries.length > 0) {
      console.log("\n\u{1F5C4}\uFE0F  Database Queries:");
      metrics.databaseQueries.forEach((q) => {
        console.log(`  - ${q.query} (${q.duration}ms)`);
      });
    }
    console.log("");
  }
};

// src/core/Tracer.ts
var Tracer = class {
  constructor(config) {
    this.activeTraces = /* @__PURE__ */ new Map();
    this.config = {
      exportTo: "console",
      captureMetrics: true,
      sampleRate: 1,
      ...config
    };
    this.storage = new TraceStorage();
  }
  /**
   * Start a new trace
   *
   * Usage:
   * const trace = tracer.startTrace('GET /users/123');
   */
  startTrace(name) {
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
  startSpan(name, traceId) {
    let trace = traceId ? this.activeTraces.get(traceId) : Array.from(this.activeTraces.values())[0];
    if (!trace) throw new Error("No active trace");
    return trace.startSpan(name);
  }
  /**
   * End current span
   */
  endSpan(error) {
    const trace = Array.from(this.activeTraces.values())[0];
    if (!trace) throw new Error("No active trace");
    trace.endSpan(error);
  }
  /**
   * Finish trace and export
   */
  finishTrace(traceId, error) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.finish(error);
    this.storage.store(trace);
    this.activeTraces.delete(traceId);
    this.exportTrace(trace);
    return trace;
  }
  /**
   * Export trace
   */
  exportTrace(trace) {
    if (this.config.exportTo === "console") {
      console.log("\n\u{1F50D} Trace Visualization:");
      console.log(trace.visualize());
      if (this.config.captureMetrics) {
        const metrics = MetricsCollector.analyzeTrace(trace);
        MetricsCollector.printMetrics(metrics);
      }
    }
  }
  /**
   * Instrument a function - automatically trace it
   *
   * Usage:
   * tracer.instrument('getUserProfile', async (userId) => {
   *   return await db.query(`SELECT * FROM users WHERE id = ${userId}`);
   * });
   */
  instrument(name, fn) {
    return (async (...args) => {
      const trace = this.startTrace(name);
      try {
        const span = trace.startSpan("execution");
        const result = await fn(...args);
        span.end();
        this.finishTrace(trace.traceId);
        return result;
      } catch (error) {
        this.finishTrace(trace.traceId, error);
        throw error;
      }
    });
  }
  /**
   * Get trace by ID
   */
  getTrace(traceId) {
    return this.storage.get(traceId);
  }
  /**
   * Get slow traces
   */
  getSlowTraces(threshold) {
    return this.storage.getSlowTraces(threshold);
  }
  /**
   * Get statistics
   */
  getStats() {
    return this.storage.getStats();
  }
};

// src/index.ts
function createTracer(config) {
  return new Tracer(config);
}
export {
  MetricsCollector,
  Span,
  Trace,
  TraceStorage,
  createTracer
};
