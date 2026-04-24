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

    this.pettingController = new PettingController(config.petting, {
      onPetStart: () => this.callbacks.onPetStarted?.(),
      onPetEnd: () => this.callbacks.onPetEnded?.(),
    });

    this.chasingController = new ChasingController(config.chasing, {
      onChaseStarted: () => this.callbacks.onChaseStarted?.(),
      onChaseEnded: () => this.callbacks.onChaseEnded?.(),
      onTargetUpdate: (pos, distance) => {
        console.log('[InteractionHandler] Chase target updated:', pos, 'distance:', Math.round(distance));
      },
    });
  }

  setPetPosition(position: Position): void {
    this.chasingController.setCurrentPosition(position);
  }

  /**
   * 开始抚摸
   */
  startPetting(): void {
    // 被抚摸后设置冷却（并停止正在进行的追逐）
    this.chasingController.onPetted();
    this.pettingController.startPetting();
  }

  /**
   * 停止抚摸
   * @returns 是否产生了有效抚摸
   */
  stopPetting(): boolean {
    return this.pettingController.stopPetting();
  }

  updateMousePosition(position: Position): void {
    this.chasingController.updateMousePosition(position);
  }

  shouldTriggerChase(): boolean {
    // 如果正在抚摸，不追逐
    if (this.pettingController.isBeingPetted()) return false;

    return this.chasingController.shouldTriggerChase();
  }

  startChasing(): void {
    this.chasingController.startChasing();
  }

  stopChasing(): void {
    this.chasingController.stopChasing();
  }

  /**
   * 更新交互状态
   */
  update(): {
    isInteracting: boolean;
    isPetting: boolean;
    isChasing: boolean;
    chaseTarget: Position | null;
  } {
    const chaseTarget = this.chasingController.update();

    const isPetting = this.pettingController.isBeingPetted();
    const isChasing = this.chasingController.isChasing();

    return {
      isInteracting: isPetting || isChasing,
      isPetting,
      isChasing,
      chaseTarget,
    };
  }

  getDominantInteraction(): 'none' | 'petting' | 'chasing' | 'cooldown' {
    const pettingState = this.pettingController.getState();

    if (pettingState === PettingState.Petting) return 'petting';
    if (this.chasingController.isChasing()) return 'chasing';
    if (this.chasingController.isInCooldown()) return 'cooldown';

    return 'none';
  }

  isInCooldown(): boolean {
    return this.chasingController.isInCooldown();
  }

  getCooldownEndTime(): number {
    return this.chasingController.getCooldownEndTime();
  }

  getPettingController(): PettingController {
    return this.pettingController;
  }

  getChasingController(): ChasingController {
    return this.chasingController;
  }

  reset(): void {
    this.pettingController.reset();
    this.chasingController.reset();
  }

  forceChase(): boolean {
    return this.chasingController.forceChase();
  }

  setScaleFactor(factor: number): void {
    this.chasingController.setScaleFactor(factor);
  }
}
