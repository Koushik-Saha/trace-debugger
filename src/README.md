# trace-debugger 🔍

Distributed request tracing and performance debugging for Node.js and microservices.

## Features

- ✅ Auto-trace function calls
- ✅ Cross-service tracing
- ✅ Performance metrics
- ✅ Database query tracking
- ✅ Memory monitoring
- ✅ Visual trace tree
- ✅ Slow operation detection

## Installation

\`\`\`bash
npm install trace-debugger
\`\`\`

## Usage

\`\`\`typescript
import { createTracer } from 'trace-debugger';

const tracer = createTracer({
serviceName: 'user-service',
captureMetrics: true,
});

// Method 1: Manual tracing
const trace = tracer.startTrace('GET /users/123');
trace.startSpan('database_query');
// ... query database ...
trace.endSpan();
tracer.finishTrace(trace.traceId);

// Method 2: Auto-instrument
const getUserProfile = tracer.instrument('getUserProfile', async (userId) => {
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
return user;
});

// Method 3: Get metrics
const slowTraces = tracer.getSlowTraces(1000); // Traces > 1 second
const stats = tracer.getStats();
\`\`\`

## License

MIT
