/**
 * AnimationScheduler - 动画切换调度
 * 负责协调动画状态的切换和调度
 */

import { PetState, PetAnimation } from '../../core/EventBus';
import { AnimationMapping } from './AnimationMapping';

/**
 * 动画切换回调
 */
export interface AnimationCallbacks {
  onAnimationStart?: (animation: PetAnimation) => void;
  onAnimationEnd?: (animation: PetAnimation) => void;
  onDirectionChange?: (flipX: boolean) => void;
}

/**
 * 动画调度配置
 */
export interface AnimationSchedulerConfig {
  defaultAnimation: PetAnimation;
  transitionSmoothing: boolean; // 是否平滑过渡
}

export const DEFAULT_SCHEDULER_CONFIG: AnimationSchedulerConfig = {
  defaultAnimation: PetAnimation.Idle,
  transitionSmoothing: false,
};

/**
 * 动画调度器
 */
export class AnimationScheduler {
  private animationMapping: AnimationMapping;
  private config: AnimationSchedulerConfig;
  private callbacks: AnimationCallbacks;

  // 当前状态
  private currentAnimation: PetAnimation;
  private currentDirectionX: number = 1; // 1 = 右, -1 = 左

  // 下一帧要切换的动画（用于延迟切换）
  private pendingAnimation: PetAnimation | null = null;
  private pendingDirection: boolean | null = null;

  constructor(
    config: Partial<AnimationSchedulerConfig> = {},
    callbacks: AnimationCallbacks = {}
  ) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.callbacks = callbacks;
    this.animationMapping = new AnimationMapping();
    this.currentAnimation = this.config.defaultAnimation;
  }

  /**
   * 注册状态变更回调
   */
  onStateChange(_from: PetState, to: PetState): void {
    // 获取新动画
    const newAnimation = this.animationMapping.getAnimationForState(to);

    // 更新内部状态
    this.animationMapping.setCurrentState(to);

    // 切换动画（始终调度，即使相同也要通知回调）
    this.scheduleAnimationChange(newAnimation);
  }

  /**
   * 设置行走方向
   * @param direction 方向值，正数向右，负数向左
   */
  setWalkDirection(direction: number): void {
    const newFlipX = direction < 0;

    if (this.currentDirectionX < 0 !== newFlipX) {
      this.currentDirectionX = direction >= 0 ? 1 : -1;
      this.scheduleDirectionChange(newFlipX);
    }
  }

  /**
   * 获取当前动画
   */
  getCurrentAnimation(): PetAnimation {
    return this.pendingAnimation ?? this.currentAnimation;
  }

  /**
   * 获取当前方向
   * @returns 1 表示向右，-1 表示向左
   */
  getCurrentDirection(): number {
    return this.currentDirectionX;
  }

  /**
   * 检查是否需要水平翻转
   */
  shouldFlipX(): boolean {
    return this.pendingDirection ?? this.currentDirectionX < 0;
  }

  /**
   * 强制切换到指定动画
   */
  forceAnimation(animation: PetAnimation): void {
    this.scheduleAnimationChange(animation);
  }

  /**
   * 强制设置方向
   */
  forceDirection(flipX: boolean): void {
    this.currentDirectionX = flipX ? -1 : 1;
    this.scheduleDirectionChange(flipX);
  }

  /**
   * 更新调度器（应用待处理的变更）
   * @returns 如果动画或方向发生变化，返回变更信息
   */
  update(): {
    animationChanged: boolean;
    directionChanged: boolean;
    newAnimation: PetAnimation | null;
    newFlipX: boolean | null;
  } {
    let animationChanged = false;
    let directionChanged = false;

    // 应用待处理的动画变更
    if (this.pendingAnimation) {
      if (this.pendingAnimation !== this.currentAnimation) {
        this.callbacks.onAnimationEnd?.(this.currentAnimation);
        this.currentAnimation = this.pendingAnimation;
        animationChanged = true;
        this.callbacks.onAnimationStart?.(this.currentAnimation);
      }
      this.pendingAnimation = null;
    }

    // 应用待处理的方向变更
    if (this.pendingDirection !== null) {
      const newFlipX = this.pendingDirection;
      this.callbacks.onDirectionChange?.(newFlipX);
      this.pendingDirection = null;
      directionChanged = true;
    }

    return {
      animationChanged,
      directionChanged,
      newAnimation: animationChanged ? this.currentAnimation : null,
      newFlipX: directionChanged ? this.currentDirectionX < 0 : null,
    };
  }

  /**
   * 重置到默认状态
   */
  reset(): void {
    this.currentAnimation = this.config.defaultAnimation;
    this.currentDirectionX = 1;
    this.pendingAnimation = null;
    this.pendingDirection = null;

    this.animationMapping.setCurrentState(PetState.Idle);
  }

  /**
   * 获取动画映射实例（用于高级配置）
   */
  getAnimationMapping(): AnimationMapping {
    return this.animationMapping;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AnimationSchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 调度动画变更
   */
  private scheduleAnimationChange(animation: PetAnimation): void {
    if (this.config.transitionSmoothing) {
      // 平滑过渡：在当前动画完成后切换
      this.pendingAnimation = animation;
    } else {
      // 立即切换
      if (animation !== this.currentAnimation) {
        this.callbacks.onAnimationEnd?.(this.currentAnimation);
        this.currentAnimation = animation;
        this.callbacks.onAnimationStart?.(this.currentAnimation);
      }
    }
  }

  /**
   * 调度方向变更
   */
  private scheduleDirectionChange(flipX: boolean): void {
    this.pendingDirection = flipX;
  }
}
