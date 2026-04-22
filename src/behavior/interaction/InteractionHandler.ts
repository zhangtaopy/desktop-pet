/**
 * InteractionHandler - 交互协调器
 * 统一管理宠物与用户的交互：抚摸、追逐鼠标等
 */

import { Position } from '../../core/EventBus';
import { PettingController, PettingState } from './PettingController';
import { ChasingController } from './ChasingController';

/**
 * 交互配置
 */
export interface InteractionConfig {
  petting: {
    minDuration: number;
    happyDuration: number;
    cooldownDuration: number;
  };
  chasing: {
    triggerDistance: number;
    triggerChance: number;
    loseInterestTime: number;
    minCooldownAfterPet: number;
    targetOffsetX: number;
    targetOffsetY: number;
  };
}

/**
 * 交互事件回调
 */
export interface InteractionCallbacks {
  onPetStarted?: () => void;
  onPetEnded?: () => void;
  onHappyStarted?: () => void;
  onHappyEnded?: () => void;
  onChaseStarted?: () => void;
  onChaseEnded?: () => void;
}

/**
 * 交互处理器
 */
export class InteractionHandler {
  private pettingController: PettingController;
  private chasingController: ChasingController;
  private callbacks: InteractionCallbacks;

  constructor(config: Partial<InteractionConfig> = {}, callbacks: InteractionCallbacks = {}) {
    this.callbacks = callbacks;

    // 初始化抚摸控制器
    this.pettingController = new PettingController(config.petting, {
      onPetStart: () => this.callbacks.onPetStarted?.(),
      onPetEnd: () => this.callbacks.onPetEnded?.(),
      onHappyStart: () => this.callbacks.onHappyStarted?.(),
      onHappyEnd: () => this.callbacks.onHappyEnded?.(),
      onCooldownStart: () => {
        // 抚摸进入冷却，同步到追逐控制器
        this.chasingController.onPetted();
      },
    });

    // 初始化追逐控制器
    this.chasingController = new ChasingController(config.chasing, {
      onChaseStarted: () => this.callbacks.onChaseStarted?.(),
      onChaseEnded: () => this.callbacks.onChaseEnded?.(),
      onTargetUpdate: (pos, distance) => {
        // 目标更新时触发
        console.log('[InteractionHandler] Chase target updated:', pos, 'distance:', Math.round(distance));
      },
    });
  }

  /**
   * 更新宠物位置（用于追逐距离计算）
   */
  setPetPosition(position: Position): void {
    this.chasingController.setCurrentPosition(position);
  }

  /**
   * 开始抚摸
   */
  startPetting(): void {
    // 如果正在追逐，停止它
    if (this.chasingController.isChasing()) {
      this.chasingController.onPetted();
    }

    this.pettingController.startPetting();
  }

  /**
   * 停止抚摸
   * @returns 是否产生了有效抚摸
   */
  stopPetting(): boolean {
    return this.pettingController.stopPetting();
  }

  /**
   * 更新鼠标位置
   * @param position 鼠标屏幕坐标
   */
  updateMousePosition(position: Position): void {
    this.chasingController.updateMousePosition(position);
  }

  /**
   * 检查是否应该开始追逐
   */
  shouldTriggerChase(): boolean {
    // 如果正在抚摸或开心中，不追逐
    if (this.pettingController.isBeingPetted()) return false;

    return this.chasingController.shouldTriggerChase();
  }

  /**
   * 开始追逐
   */
  startChasing(): void {
    this.chasingController.startChasing();
  }

  /**
   * 停止追逐
   */
  stopChasing(): void {
    this.chasingController.stopChasing();
  }

  /**
   * 更新交互状态
   * @returns 当前活跃的交互类型
   */
  update(): {
    isInteracting: boolean;
    isPetting: boolean;
    isChasing: boolean;
    chaseTarget: Position | null;
    isHappy: boolean;
  } {
    // 更新控制器
    this.pettingController.update();
    const chaseTarget = this.chasingController.update();

    const isPetting = this.pettingController.isBeingPetted();
    const isChasing = this.chasingController.isChasing();
    const isHappy = this.pettingController.getState() === PettingState.Happy;

    return {
      isInteracting: isPetting || isChasing || isHappy,
      isPetting,
      isChasing,
      chaseTarget,
      isHappy,
    };
  }

  /**
   * 获取当前交互主导的状态
   */
  getDominantInteraction(): 'none' | 'petting' | 'chasing' | 'happy' | 'cooldown' {
    const pettingState = this.pettingController.getState();

    if (pettingState === PettingState.Petting) return 'petting';
    if (pettingState === PettingState.Happy) return 'happy';
    if (this.chasingController.isChasing()) return 'chasing';
    if (pettingState === PettingState.Cooldown) return 'cooldown';

    return 'none';
  }

  /**
   * 是否在冷却中（抚摸后）
   */
  isInCooldown(): boolean {
    return this.pettingController.isInCooldown() || this.chasingController.isInCooldown();
  }

  /**
   * 获取抚摸控制器（用于高级控制）
   */
  getPettingController(): PettingController {
    return this.pettingController;
  }

  /**
   * 获取追逐控制器（用于高级控制）
   */
  getChasingController(): ChasingController {
    return this.chasingController;
  }

  /**
   * 重置所有交互状态
   */
  reset(): void {
    this.pettingController.reset();
    this.chasingController.reset();
  }

  /**
   * 强制开始追逐（测试用）
   */
  forceChase(): void {
    this.chasingController.forceChase();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<InteractionConfig>): void {
    if (config.petting) {
      this.pettingController.updateConfig(config.petting);
    }
    if (config.chasing) {
      this.chasingController.updateConfig(config.chasing);
    }
  }

  /**
   * 设置缩放因子
   */
  setScaleFactor(factor: number): void {
    this.chasingController.setScaleFactor(factor);
  }
}
