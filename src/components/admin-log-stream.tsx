"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";

type LogSeverity = "debug" | "info" | "warn" | "error" | "critical";

type SecureLogEvent = {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  source: string;
  message: string;
  requestId: string;
  activityType?: "system" | "error" | "user";
  metadata?: Record<string, unknown>;
};

const severityClassName: Record<LogSeverity, string> = {
  debug: "bg-zinc-100 text-zinc-700",
  info: "bg-sky-50 text-sky-800",
  warn: "bg-amber-50 text-amber-800",
  error: "bg-rose-50 text-rose-800",
  critical: "bg-red-100 text-red-900",
};

export function AdminLogStream() {
  const [events, setEvents] = useState<SecureLogEvent[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");

  useEffect(() => {
    const source = new EventSource("/api/internal/logs");

    source.onopen = () => {
      setStatus("live");
    };

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as SecureLogEvent;
        setEvents((current) => [event, ...current.filter((item) => item.id !== event.id)].slice(0, 50));
      } catch {
        setStatus("offline");
      }
    };

    source.onerror = () => {
      setStatus("offline");
    };

    return () => {
      source.close();
    };
  }, []);

  const errorCount = events.filter((event) => ["error", "critical"].includes(event.severity)).length;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity aria-hidden className="text-emerald-700" size={18} />
            <h2 className="text-lg font-semibold">Журнал безопасности</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            Поток системных событий, ошибок и действий пользователей в структурированном JSON.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={status === "live" ? "text-emerald-700" : "text-amber-700"}>
            {status === "live" ? "live" : status}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{events.length} events</span>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">{errorCount} errors</span>
        </div>
      </div>

      <div className="max-h-[460px] overflow-y-auto p-5">
        {events.length ? (
          <div className="grid gap-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium uppercase ${severityClassName[event.severity]}`}
                    >
                      {event.severity}
                    </span>
                    <span className="font-medium text-zinc-900">{event.source}</span>
                    <span className="text-xs text-zinc-500">{event.activityType}</span>
                  </div>
                  <time className="text-xs text-zinc-500">{formatDate(event.timestamp)}</time>
                </div>
                <p className="mt-2 text-sm text-zinc-800">{event.message}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <code className="rounded bg-white px-2 py-1">requestId: {event.requestId}</code>
                  <code className="rounded bg-white px-2 py-1">eventId: {event.id}</code>
                </div>
                {event.metadata ? (
                  <pre className="mt-3 overflow-x-auto rounded bg-zinc-950 p-3 text-xs text-zinc-100">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2 text-zinc-700">
              {status === "offline" ? <AlertTriangle aria-hidden size={16} /> : <ShieldCheck aria-hidden size={16} />}
              {status === "offline" ? "Поток журнала недоступен." : "Ожидание событий журнала."}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}
