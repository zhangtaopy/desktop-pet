/**
 * ChasingController - 鼠标追逐控制器
 * 管理追逐鼠标的行为逻辑
 */

import { Position } from '../../core/EventBus';

/**
 * 追逐配置
 */
export interface ChasingConfig {
  triggerDistance: number; // 触发追逐的距离
  triggerChance: number; // 触发追逐的概率 (0-1)
  loseInterestTime: number; // 失去兴趣的时间（毫秒）
  minCooldownAfterPet: number; // 抚摸后的最小冷却时间（毫秒）
  targetOffsetX: number; // 目标X偏移（让宠物中心对准鼠标）
  targetOffsetY: number; // 目标Y偏移
}

export const DEFAULT_CHASING_CONFIG: ChasingConfig = {
  triggerDistance: 150, // 150像素内可能触发
  triggerChance: 0.08, // 8% 概率
  loseInterestTime: 500, // 500ms 无目标后失去兴趣
  minCooldownAfterPet: 300000, // 抚摸后5分钟冷却
  targetOffsetX: 64, // 窗口半宽
  targetOffsetY: 64, // 窗口半高
};

/**
 * 追逐状态
 */
export enum ChasingState {
  Idle = 'idle', // 空闲，等待触发
  Tracking = 'tracking', // 正在追踪鼠标位置
  Chasing = 'chasing', // 正在追逐
}

/**
 * 追逐事件回调
 */
export interface ChasingCallbacks {
  onChaseStarted?: () => void;
  onChaseEnded?: () => void;
  onTargetUpdate?: (position: Position, distance: number) => void;
}

/**
 * 追逐控制器
 */
export class ChasingController {
  private config: ChasingConfig;
  private state: ChasingState = ChasingState.Idle;
  private callbacks: ChasingCallbacks;

  // 目标追踪（物理坐标）
  private targetPosition: Position | null = null;
  private lastTargetUpdateTime: number = 0;

  // 冷却结束时间（抚摸后设置）
  private cooldownEndTime: number = 0;

  // 当前宠物位置（物理坐标，用于计算距离）
  private currentPosition: Position = { x: 0, y: 0 };

  // 缩放因子
  private scaleFactor: number = 1;

  constructor(config: Partial<ChasingConfig> = {}, callbacks: ChasingCallbacks = {}) {
    this.config = { ...DEFAULT_CHASING_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  setScaleFactor(factor: number): void {
    this.scaleFactor = factor;
  }

  setCurrentPosition(position: Position): void {
    this.currentPosition = { ...position };
  }

  updateMousePosition(position: Position): void {
    this.targetPosition = {
      x: position.x - this.config.targetOffsetX * this.scaleFactor,
      y: position.y - this.config.targetOffsetY * this.scaleFactor,
    };
    this.lastTargetUpdateTime = Date.now();

    if (this.state === ChasingState.Tracking || this.state === ChasingState.Chasing) {
      const distance = this.calculateDistance();
      this.callbacks.onTargetUpdate?.(this.targetPosition, distance);
    }
  }

  clearMouseTarget(): void {
    this.targetPosition = null;
    this.lastTargetUpdateTime = 0;

    if (this.state === ChasingState.Chasing) {
      this.state = ChasingState.Idle;
      console.log('[ChasingController] Lost target, returning to Idle');
      this.callbacks.onChaseEnded?.();
    }
  }

  /**
   * 被抚摸后触发冷却
   */
  onPetted(): void {
    this.cooldownEndTime = Date.now() + this.config.minCooldownAfterPet;
    console.log(`[ChasingController] Cooldown set until ${new Date(this.cooldownEndTime).toLocaleTimeString()} (duration: ${this.config.minCooldownAfterPet / 1000}s)`);

    if (this.state === ChasingState.Chasing || this.state === ChasingState.Tracking) {
      this.state = ChasingState.Idle;
      this.callbacks.onChaseEnded?.();
    }
  }

  shouldTriggerChase(): boolean {
    // 检查冷却
    if (Date.now() < this.cooldownEndTime) return false;

    // 必须有目标
    if (!this.targetPosition) return false;

    // 目标不能太旧
    if (Date.now() - this.lastTargetUpdateTime > this.config.loseInterestTime) {
      return false;
    }

    // 检查距离
    const distance = this.calculateDistance();
    if (distance > this.config.triggerDistance) return false;

    // 概率触发
    return Math.random() < this.config.triggerChance;
  }

  startChasing(): void {
    if (this.state === ChasingState.Chasing) return;

    this.state = ChasingState.Chasing;
    console.log(`[ChasingController] Entered CHASING at ${new Date().toLocaleTimeString()}`);
    this.callbacks.onChaseStarted?.();
  }

  stopChasing(): void {
    if (this.state === ChasingState.Chasing) {
      this.state = ChasingState.Idle;
      console.log('[ChasingController] Reached target, returning to Idle');
      this.callbacks.onChaseEnded?.();
    }
  }

  update(): Position | null {
    const now = Date.now();

    // 检查目标是否过期
    if (this.targetPosition && now - this.lastTargetUpdateTime > this.config.loseInterestTime) {
      this.clearMouseTarget();
    }

    // 返回追逐目标
    if (this.state === ChasingState.Chasing && this.targetPosition) {
      const distance = this.calculateDistance();

      if (distance < 5) {
        this.stopChasing();
        return null;
      }

      return { ...this.targetPosition };
    }

    return null;
  }

  getState(): ChasingState {
    return this.state;
  }

  isChasing(): boolean {
    return this.state === ChasingState.Chasing;
  }

  isInCooldown(): boolean {
    return Date.now() < this.cooldownEndTime;
  }

  getCooldownEndTime(): number {
    return this.cooldownEndTime;
  }

  getTargetPosition(): Position | null {
    return this.targetPosition ? { ...this.targetPosition } : null;
  }

  getDistanceToTarget(): number {
    return this.calculateDistance();
  }

  forceChase(): boolean {
    if (this.isInCooldown()) return false;
    this.cooldownEndTime = 0;
    this.state = ChasingState.Idle;
    this.startChasing();
    return true;
  }

  reset(): void {
    this.state = ChasingState.Idle;
    this.targetPosition = null;
    this.lastTargetUpdateTime = 0;
    this.cooldownEndTime = 0;
  }

  updateConfig(config: Partial<ChasingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private calculateDistance(): number {
    if (!this.targetPosition) return Infinity;

    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    return Math.hypot(dx, dy);
  }
}
