// 任务执行状态跟踪
const taskExecutionState = new Map<string, {
  cancelled: boolean;
  paused: boolean;
  controller: AbortController;
}>();

export function createTaskExecution(taskId: string): AbortController {
  const controller = new AbortController();
  taskExecutionState.set(taskId, {
    cancelled: false,
    paused: false,
    controller,
  });
  return controller;
}

export function isTaskCancelled(taskId: string): boolean {
  return taskExecutionState.get(taskId)?.cancelled ?? false;
}

export function cancelTask(taskId: string): void {
  const state = taskExecutionState.get(taskId);
  if (state) {
    state.cancelled = true;
    state.controller.abort();
  }
}

export function pauseTask(taskId: string): void {
  const state = taskExecutionState.get(taskId);
  if (state) {
    state.paused = true;
  }
}

export function resumeTask(taskId: string): void {
  const state = taskExecutionState.get(taskId);
  if (state) {
    state.paused = false;
  }
}

export function isTaskPaused(taskId: string): boolean {
  return taskExecutionState.get(taskId)?.paused ?? false;
}

export function cleanupTaskExecution(taskId: string): void {
  taskExecutionState.delete(taskId);
}

// 信号量实现，用于并发控制
export class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waitQueue.push(() => {
        this.permits--;
        resolve();
      });
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      this.permits++;
      next();
    } else {
      this.permits++;
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// 任务队列
export class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private concurrency: number;
  private semaphore: Semaphore;
  private taskId: string;

  constructor(taskId: string, concurrency: number = 5) {
    this.taskId = taskId;
    this.concurrency = concurrency;
    this.semaphore = new Semaphore(concurrency);
  }

  enqueue(fn: () => Promise<void>): void {
    this.queue.push(fn);
  }

  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const tasks = this.queue;
    this.queue = [];

    const promises = tasks.map((fn) =>
      this.semaphore.withLock(async () => {
        // 检查任务是否被取消
        if (isTaskCancelled(this.taskId)) {
          return;
        }

        // 检查任务是否被暂停
        while (isTaskPaused(this.taskId)) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        try {
          await fn();
        } catch (error) {
          console.error("[TaskQueue] Task execution error:", error);
        }
      })
    );

    await Promise.all(promises);
    this.running = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isRunning(): boolean {
    return this.running;
  }
}
