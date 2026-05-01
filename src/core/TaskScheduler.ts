/**
 * TaskScheduler - 定期任务调度器
 * 管理应用中的周期性任务，与主循环解耦
 */

export interface TaskSchedulerConfig {
  timeCheckInterval: number;
  mouseUpdateInterval: number;
}

export interface TaskCallbacks {
  onTimeCheck: () => void;
  onMouseUpdate: () => Promise<unknown> | void;
}

const DEFAULT_CONFIG: TaskSchedulerConfig = {
  timeCheckInterval: 60000,
  mouseUpdateInterval: 100,
};

export class TaskScheduler {
  private lastTimeCheck: number = 0;
  private lastMouseUpdate: number = 0;
  private config: TaskSchedulerConfig;

  constructor(
    private callbacks: TaskCallbacks,
    config?: Partial<TaskSchedulerConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 执行定期任务（主循环中调用）
   */
  run(now: number): void {
    if (now - this.lastTimeCheck > this.config.timeCheckInterval) {
      this.lastTimeCheck = now;
      this.callbacks.onTimeCheck();
    }

    if (now - this.lastMouseUpdate > this.config.mouseUpdateInterval) {
      this.lastMouseUpdate = now;
      this.callbacks.onMouseUpdate();
    }
  }

  /**
   * 重置所有计时器
   */
  reset(): void {
    this.lastTimeCheck = 0;
    this.lastMouseUpdate = 0;
  }
}