import { Response } from "express";

// SSE 客户端连接管理
const sseClients = new Map<string, Response>();

export function registerSSEClient(taskId: string, res: Response) {
  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 发送初始连接确认
  res.write("data: {\"type\":\"connected\",\"message\":\"SSE connected\"}\n\n");

  sseClients.set(taskId, res);

  // 客户端断开连接时清理
  res.on("close", () => {
    sseClients.delete(taskId);
  });

  res.on("error", () => {
    sseClients.delete(taskId);
  });
}

export function broadcastTaskUpdate(taskId: string, data: any) {
  const client = sseClients.get(taskId);
  if (client && !client.destroyed) {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`[SSE] Error sending data to task ${taskId}:`, error);
      sseClients.delete(taskId);
    }
  }
}

export function broadcastTaskLog(taskId: string, log: string) {
  broadcastTaskUpdate(taskId, {
    type: "log",
    message: log,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastTaskProgress(
  taskId: string,
  successCount: number,
  failCount: number,
  totalCount: number
) {
  broadcastTaskUpdate(taskId, {
    type: "progress",
    successCount,
    failCount,
    totalCount,
    successRate: ((successCount / totalCount) * 100).toFixed(1),
    timestamp: new Date().toISOString(),
  });
}

export function broadcastTaskComplete(taskId: string, status: string, finalStats: any) {
  broadcastTaskUpdate(taskId, {
    type: "complete",
    status,
    stats: finalStats,
    timestamp: new Date().toISOString(),
  });

  // 完成后关闭连接
  setTimeout(() => {
    const client = sseClients.get(taskId);
    if (client && !client.destroyed) {
      client.end();
    }
    sseClients.delete(taskId);
  }, 1000);
}

export function closeSSEConnection(taskId: string) {
  const client = sseClients.get(taskId);
  if (client && !client.destroyed) {
    client.end();
  }
  sseClients.delete(taskId);
}
