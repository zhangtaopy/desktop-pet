/**
 * InteractionManager - 用户交互管理
 * 处理鼠标点击抚摸、窗口拖拽等用户交互
 */

import { PetBehavior } from '../behavior/PetBehavior';
import { PetRenderer } from '../renderer/pet/PetRenderer';
import { PomodoroTimer } from '../renderer/PomodoroTimer';
import { initDrag } from '../drag';
import { eventBus } from '../core/EventBus';

/** 抚摸状态持续时间（与 PetState.Petting 的 minDuration 对齐） */
const PETTING_DURATION = 1500;

export class InteractionManager {
  private isDragging: boolean = false;
  private cleanupFns: Array<() => void> = [];
  private pettingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private behavior: PetBehavior,
    private petRenderer?: PetRenderer,
    private pomodoroTimer?: PomodoroTimer,
  ) {}

  setup(): void {
    this.setupDrag();
    this.setupClickPetting();
  }

  getIsDragging(): boolean {
    return this.isDragging;
  }

  destroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
    this.cancelPetting();
  }

  private setupDrag(): void {
    initDrag(this.canvas, {
      onDragMove: () => {
        this.isDragging = true;
        this.cancelPetting();
      },
      onDragEnd: async (x: number, y: number) => {
        if (!this.isDragging) return;
        eventBus.emit('user:dragEnd', { x, y });
        this.isDragging = false;
      },
    });
  }

  private cancelPetting(): void {
    if (this.pettingTimer) {
      clearTimeout(this.pettingTimer);
      this.pettingTimer = null;
    }
    this.behavior.stopPetting();
  }

  private setupClickPetting(): void {
    let lastClickTime = 0;

    const onMouseUp = () => {
      if (this.isDragging) return;
      const now = Date.now();
      if (now - lastClickTime < 300) return;
      lastClickTime = now;

      if (this.pomodoroTimer?.isRunning()) {
        this.petRenderer?.showBubble({
          text: `还剩 ${Math.ceil(this.pomodoroTimer.getRemainingMs() / 60000)} 分钟`,
          duration: 2000,
          priority: 'interaction',
        });
        return;
      }

      this.behavior.startPetting();

      if (this.pettingTimer) clearTimeout(this.pettingTimer);
      this.pettingTimer = setTimeout(() => {
        this.behavior.stopPetting();
        this.pettingTimer = null;
      }, PETTING_DURATION);
    };

    const onMouseLeave = () => {
      this.cancelPetting();
    };

    this.canvas.addEventListener('mouseup', onMouseUp);
    this.canvas.addEventListener('mouseleave', onMouseLeave);

    this.cleanupFns.push(
      () => this.canvas.removeEventListener('mouseup', onMouseUp),
      () => this.canvas.removeEventListener('mouseleave', onMouseLeave),
    );
  }
}
