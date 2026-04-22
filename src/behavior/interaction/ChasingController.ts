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
  Cooldown = 'cooldown', // 冷却中
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

  // 目标追踪
  private targetPosition: Position | null = null;
  private lastTargetUpdateTime: number = 0;
  private lastPetTime: number = 0;

  // 当前宠物位置（用于计算距离）
  private currentPosition: Position = { x: 0, y: 0 };

  constructor(config: Partial<ChasingConfig> = {}, callbacks: ChasingCallbacks = {}) {
    this.config = { ...DEFAULT_CHASING_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * 更新宠物当前位置
   */
  setCurrentPosition(position: Position): void {
    this.currentPosition = { ...position };
  }

  /**
   * 更新鼠标目标位置
   * @param position 鼠标在屏幕上的物理坐标
   */
  updateMousePosition(position: Position): void {
    // 转换为目标位置（考虑偏移）
    this.targetPosition = {
      x: position.x - this.config.targetOffsetX,
      y: position.y - this.config.targetOffsetY,
    };
    this.lastTargetUpdateTime = Date.now();

    // 如果是追踪状态，通知目标更新
    if (this.state === ChasingState.Tracking || this.state === ChasingState.Chasing) {
      const distance = this.calculateDistance();
      this.callbacks.onTargetUpdate?.(this.targetPosition, distance);
    }
  }

  /**
   * 清除鼠标目标
   */
  clearMouseTarget(): void {
    this.targetPosition = null;
    this.lastTargetUpdateTime = 0;

    // 如果正在追逐，检查是否应该停止
    if (this.state === ChasingState.Chasing) {
      this.state = ChasingState.Cooldown;
    }
  }

  /**
   * 通知被抚摸
   */
  onPetted(): void {
    this.lastPetTime = Date.now();

    // 如果正在追逐，立即停止
    if (this.state === ChasingState.Chasing || this.state === ChasingState.Tracking) {
      this.state = ChasingState.Cooldown;
      this.callbacks.onChaseEnded?.();
    }
  }

  /**
   * 检查是否应该触发追逐
   * @returns 是否应该开始追逐
   */
  shouldTriggerChase(): boolean {
    // 检查冷却
    if (this.state === ChasingState.Cooldown) {
      const inCooldown = Date.now() - this.lastPetTime < this.config.minCooldownAfterPet;
      if (inCooldown) return false;
      this.state = ChasingState.Idle;
    }

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

  /**
   * 开始追逐
   */
  startChasing(): void {
    if (this.state === ChasingState.Chasing) return;

    this.state = ChasingState.Chasing;
    this.callbacks.onChaseStarted?.();
  }

  /**
   * 停止追逐
   */
  stopChasing(): void {
    if (this.state === ChasingState.Chasing) {
      this.state = ChasingState.Cooldown;
      this.callbacks.onChaseEnded?.();
    }
  }

  /**
   * 更新追逐状态
   * @returns 追逐目标位置（如果正在追逐），null 表示停止追逐
   */
  update(): Position | null {
    const now = Date.now();

    // 检查目标是否过期
    if (this.targetPosition && now - this.lastTargetUpdateTime > this.config.loseInterestTime) {
      this.clearMouseTarget();
    }

    // 检查冷却期是否结束
    if (this.state === ChasingState.Cooldown) {
      const inCooldown = now - this.lastPetTime < this.config.minCooldownAfterPet;
      if (!inCooldown) {
        this.state = ChasingState.Idle;
      }
    }

    // 返回追逐目标
    if (this.state === ChasingState.Chasing && this.targetPosition) {
      const distance = this.calculateDistance();

      // 如果足够接近，停止追逐
      if (distance < 5) {
        this.stopChasing();
        return null;
      }

      return { ...this.targetPosition };
    }

    return null;
  }

  /**
   * 获取当前状态
   */
  getState(): ChasingState {
    return this.state;
  }

  /**
   * 是否正在追逐
   */
  isChasing(): boolean {
    return this.state === ChasingState.Chasing;
  }

  /**
   * 是否在冷却中
   */
  isInCooldown(): boolean {
    return this.state === ChasingState.Cooldown;
  }

  /**
   * 获取目标位置
   */
  getTargetPosition(): Position | null {
    return this.targetPosition ? { ...this.targetPosition } : null;
  }

  /**
   * 获取与目标的距离
   */
  getDistanceToTarget(): number {
    return this.calculateDistance();
  }

  /**
   * 强制开始追逐（测试用）
   */
  forceChase(): void {
    this.state = ChasingState.Idle;
    this.startChasing();
  }

  /**
   * 重置控制器
   */
  reset(): void {
    this.state = ChasingState.Idle;
    this.targetPosition = null;
    this.lastTargetUpdateTime = 0;
    this.lastPetTime = 0;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ChasingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 计算与目标的距离
   */
  private calculateDistance(): number {
    if (!this.targetPosition) return Infinity;

    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    return Math.hypot(dx, dy);
  }
}
