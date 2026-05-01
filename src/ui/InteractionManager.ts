/**
 * InteractionManager - 用户交互管理
 * 处理鼠标点击抚摸、窗口拖拽等用户交互
 */

import { PetBehavior } from '../behavior/PetBehavior';
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
  ) {}

  /**
   * 设置所有交互（拖拽 + 点击抚摸）
   */
  setup(): void {
    this.setupDrag();
    this.setupClickPetting();
  }

  /**
   * 当前是否正在拖拽
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * 清理资源
   */
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

  /**
   * 点击抚摸：仅在非拖拽的点击（mouseup）时触发，拖拽不触发抚摸
   */
  private setupClickPetting(): void {
    let lastClickTime = 0;

    const onMouseUp = () => {
      if (this.isDragging) return;
      const now = Date.now();
      if (now - lastClickTime < 300) return;
      lastClickTime = now;

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
