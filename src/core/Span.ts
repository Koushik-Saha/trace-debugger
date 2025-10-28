import { Span as SpanInterface } from '../types';

/**
 * A Span represents one operation
 *
 * Example:
 * - Getting user from database = 1 span
 * - Calling external API = 1 span
 * - Processing response = 1 span
 */
export class Span implements SpanInterface {
    id: string;
    traceId: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'started' | 'completed' | 'error' = 'started';
    error?: Error;
    attributes: Record<string, any> = {};
    children: Span[] = [];
    parentId?: string;

    constructor(traceId: string, name: string, parentId?: string) {
        this.id = `span-${Date.now()}-${Math.random()}`;
        this.traceId = traceId;
        this.name = name;
        this.parentId = parentId;
        this.startTime = Date.now();
    }

    /**
     * Add a child span
     */
    addChild(span: Span) {
        this.children.push(span);
    }

    /**
     * Mark as complete
     */
    end(error?: Error) {
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        this.status = error ? 'error' : 'completed';
        this.error = error;
    }

    /**
     * Add custom attribute
     */
    setAttribute(key: string, value: any) {
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
            children: this.children.map((c) => c.toJSON()),
        };
    }
}
