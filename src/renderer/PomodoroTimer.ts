export type PomodoroPhase = 'idle' | 'focus' | 'shortBreak' | 'longBreak';

export const DEFAULT_FOCUS_MIN = 25;
export const DEFAULT_SHORT_BREAK_MIN = 5;
export const DEFAULT_LONG_BREAK_MIN = 15;
export const CYCLES_BEFORE_LONG_BREAK = 4;

export type TickCallback = (phase: PomodoroPhase, remainingMs: number, totalMs: number, justChanged: boolean) => void;

export class PomodoroTimer {
  private phase: PomodoroPhase = 'idle';
  private remainingMs: number = 0;
  private totalMs: number = 0;
  private cyclesCompleted: number = 0;
  private running: boolean = false;
  private lastTimestamp: number = 0;
  private justChanged: boolean = false;

  private focusMs: number;
  private shortBreakMs: number;
  private longBreakMs: number;

  private onTick: TickCallback | null = null;

  constructor(focusMin = DEFAULT_FOCUS_MIN, shortBreakMin = DEFAULT_SHORT_BREAK_MIN, longBreakMin = DEFAULT_LONG_BREAK_MIN) {
    this.focusMs = focusMin * 60 * 1000;
    this.shortBreakMs = shortBreakMin * 60 * 1000;
    this.longBreakMs = longBreakMin * 60 * 1000;
  }

  setTickHandler(handler: TickCallback): void {
    this.onTick = handler;
  }

  getPhase(): PomodoroPhase {
    return this.phase;
  }

  getRemainingMs(): number {
    return this.remainingMs;
  }

  getTotalMs(): number {
    return this.totalMs;
  }

  getCyclesCompleted(): number {
    return this.cyclesCompleted;
  }

  isRunning(): boolean {
    return this.running;
  }

  startOrRestart(): void {
    this.phase = 'focus';
    this.remainingMs = this.focusMs;
    this.totalMs = this.focusMs;
    this.running = true;
    this.lastTimestamp = 0;
    this.justChanged = true;
    this.onTick?.(this.phase, this.remainingMs, this.totalMs, this.justChanged);
    this.justChanged = false;
  }

  stop(): void {
    this.running = false;
    this.phase = 'idle';
    this.lastTimestamp = 0;
    this.justChanged = true;
    this.onTick?.(this.phase, this.remainingMs, this.totalMs, this.justChanged);
    this.justChanged = false;
  }

  update(timestamp: number): void {
    if (!this.running) {
      this.lastTimestamp = 0;
      return;
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      return;
    }

    const dt = timestamp - this.lastTimestamp;
    if (dt <= 0) return;
    this.lastTimestamp = timestamp;

    this.remainingMs -= dt;

    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      this.advance();
      return;
    }

    this.onTick?.(this.phase, this.remainingMs, this.totalMs, false);
  }

  private advance(): void {
    switch (this.phase) {
      case 'focus':
        this.cyclesCompleted++;
        if (this.cyclesCompleted % CYCLES_BEFORE_LONG_BREAK === 0) {
          this.phase = 'longBreak';
          this.remainingMs = this.longBreakMs;
          this.totalMs = this.longBreakMs;
        } else {
          this.phase = 'shortBreak';
          this.remainingMs = this.shortBreakMs;
          this.totalMs = this.shortBreakMs;
        }
        break;

      case 'shortBreak':
      case 'longBreak':
        this.phase = 'focus';
        this.remainingMs = this.focusMs;
        this.totalMs = this.focusMs;
        break;

      case 'idle':
        this.running = false;
        return;
    }

    this.lastTimestamp = 0;
    this.justChanged = true;
    this.onTick?.(this.phase, this.remainingMs, this.totalMs, this.justChanged);
    this.justChanged = false;
  }

  reset(): void {
    this.stop();
    this.phase = 'idle';
    this.remainingMs = 0;
    this.totalMs = 0;
    this.cyclesCompleted = 0;
    this.lastTimestamp = 0;
  }
}
