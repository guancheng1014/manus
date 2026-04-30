import { useEffect, useRef, useState, useCallback } from "react";

export interface SSEMessage {
  type: "progress" | "log" | "complete" | "error";
  data: any;
  timestamp: string;
}

export interface UseSSEOptions {
  url: string;
  enabled?: boolean;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * SSE 实时推送 Hook
 */
export function useSSE({
  url,
  enabled = true,
  onMessage,
  onError,
  onComplete,
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) {
      return;
    }

    try {
      const eventSource = new EventSource(url);

      eventSource.addEventListener("progress", (event) => {
        const message: SSEMessage = {
          type: "progress",
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
        onMessage?.(message);
      });

      eventSource.addEventListener("log", (event) => {
        const message: SSEMessage = {
          type: "log",
          data: event.data,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
        onMessage?.(message);
      });

      eventSource.addEventListener("complete", (event) => {
        const message: SSEMessage = {
          type: "complete",
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
        onMessage?.(message);
        onComplete?.();
        disconnect();
      });

      eventSource.addEventListener("error", (event: any) => {
        const message: SSEMessage = {
          type: "error",
          data: event.data,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
        const error = new Error(event.data || "SSE connection error");
        setError(error);
        onError?.(error);
        disconnect();
      });

      eventSource.onerror = () => {
        const error = new Error("SSE connection lost");
        setError(error);
        onError?.(error);
        disconnect();
      };

      eventSourceRef.current = eventSource;
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  }, [url, enabled, onMessage, onError, onComplete]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    messages,
    error,
    connect,
    disconnect,
  };
}
