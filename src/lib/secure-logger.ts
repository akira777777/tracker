import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type LogSeverity = "debug" | "info" | "warn" | "error" | "critical";

export type SecureLogEvent = {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  source: string;
  message: string;
  requestId: string;
  activityType?: "system" | "error" | "user";
  metadata?: Record<string, unknown>;
};

type IncomingLogEvent = Partial<Omit<SecureLogEvent, "id" | "timestamp">>;
type LogSubscriber = (event: SecureLogEvent) => void;
type RouteHandler = (request: NextRequest) => Promise<Response>;

const MAX_BUFFERED_EVENTS = 100;
const subscribers = new Set<LogSubscriber>();
const bufferedEvents: SecureLogEvent[] = [];
const requestIds = new WeakMap<NextRequest, string>();

export function createRequestId(request: NextRequest) {
  const existing = requestIds.get(request);

  if (existing) {
    return existing;
  }

  const requestId = sanitizeText(request.headers.get("x-request-id") || crypto.randomUUID(), 120);
  requestIds.set(request, requestId);

  return requestId;
}

export function emitSecureLog(event: IncomingLogEvent) {
  const sanitized = sanitizeLogEvent(event);

  bufferedEvents.unshift(sanitized);

  if (bufferedEvents.length > MAX_BUFFERED_EVENTS) {
    bufferedEvents.length = MAX_BUFFERED_EVENTS;
  }

  for (const subscriber of subscribers) {
    subscriber(sanitized);
  }

  return sanitized;
}

export async function emitSecureLogToInternalEndpoint(event: IncomingLogEvent) {
  const endpoint = process.env.INTERNAL_LOG_ENDPOINT;
  const token = process.env.INTERNAL_LOG_TOKEN;

  if (!endpoint || !token) {
    emitSecureLog(event);
    return;
  }

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(event),
    cache: "no-store",
  });
}

export function getBufferedLogEvents() {
  return bufferedEvents;
}

export function subscribeToSecureLogs(subscriber: LogSubscriber) {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function isAuthorizedLogIngest(request: NextRequest) {
  const expected = process.env.INTERNAL_LOG_TOKEN;

  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];

  return Boolean(token && timingSafeEqual(token, expected));
}

export function withSecureLogging(source: string, handler: RouteHandler): RouteHandler {
  return async (request) => {
    const startedAt = Date.now();
    const requestId = createRequestId(request);
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    emitSecureLog({
      severity: "info",
      source,
      message: "Request received",
      requestId,
      activityType: "system",
      metadata: { method, pathname },
    });

    try {
      const response = await handler(request);
      const severity: LogSeverity = response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info";

      emitSecureLog({
        severity,
        source,
        message: "Request completed",
        requestId,
        activityType: response.status >= 400 ? "error" : "system",
        metadata: {
          method,
          pathname,
          status: response.status,
          durationMs: Date.now() - startedAt,
        },
      });

      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      emitSecureLog({
        severity: "critical",
        source,
        message: error instanceof Error ? error.message : "Unhandled route error",
        requestId,
        activityType: "error",
        metadata: {
          method,
          pathname,
          durationMs: Date.now() - startedAt,
        },
      });

      return NextResponse.json({ error: "Internal server error.", requestId }, { status: 500 });
    }
  };
}

function sanitizeLogEvent(event: IncomingLogEvent): SecureLogEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    severity: sanitizeSeverity(event.severity),
    source: sanitizeText(event.source || "application", 80),
    message: sanitizeText(event.message || "Log event", 500),
    requestId: sanitizeText(event.requestId || crypto.randomUUID(), 120),
    activityType: sanitizeActivityType(event.activityType),
    metadata: sanitizeMetadata(event.metadata),
  };
}

function sanitizeSeverity(value: unknown): LogSeverity {
  return ["debug", "info", "warn", "error", "critical"].includes(String(value))
    ? (value as LogSeverity)
    : "info";
}

function sanitizeActivityType(value: unknown) {
  return ["system", "error", "user"].includes(String(value))
    ? (value as SecureLogEvent["activityType"])
    : "system";
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).slice(0, 25).map(([key, entry]) => [
    sanitizeText(key, 80),
    sanitizeValue(entry),
  ]);

  return Object.fromEntries(entries);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeText(value, 500);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map(sanitizeValue);
  }

  if (typeof value === "object" && value) {
    return sanitizeMetadata(value);
  }

  return String(value);
}

function sanitizeText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}
