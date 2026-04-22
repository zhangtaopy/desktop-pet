/**
 * AnimationMapping - 状态到动画的映射
 * 定义宠物状态对应的动画和方向
 */

import { PetState, PetAnimation } from '../../core/EventBus';

/**
 * 动画映射配置
 */
export interface AnimationMappingConfig {
  // 状态到动画的基础映射
  stateToAnimation: Record<PetState, PetAnimation>;
  // 追逐时使用的动画
  chaseAnimation: PetAnimation;
  // 行走速度阈值（用于切换行走/奔跑动画）
  walkSpeedThreshold: number;
}

/**
 * 默认动画映射配置
 */
export const DEFAULT_ANIMATION_MAPPING: AnimationMappingConfig = {
  stateToAnimation: {
    [PetState.Idle]: PetAnimation.Idle,
    [PetState.Walking]: PetAnimation.Walk,
    [PetState.Sleeping]: PetAnimation.Sleep,
    [PetState.Petting]: PetAnimation.Petting,
    [PetState.Happy]: PetAnimation.Happy,
    [PetState.ChasingMouse]: PetAnimation.Run,
  },
  chaseAnimation: PetAnimation.Run,
  walkSpeedThreshold: 2.0, // 速度超过此值使用奔跑动画
};

/**
 * 动画映射类
 * 负责将宠物状态和移动信息映射到对应的动画
 */
export class AnimationMapping {
  private config: AnimationMappingConfig;
  private currentState: PetState = PetState.Idle;
  private currentSpeed: number = 0;

  constructor(config: Partial<AnimationMappingConfig> = {}) {
    this.config = {
      ...DEFAULT_ANIMATION_MAPPING,
      stateToAnimation: { ...DEFAULT_ANIMATION_MAPPING.stateToAnimation, ...config.stateToAnimation },
      ...config,
    };
  }

  /**
   * 获取当前状态的动画
   */
  getAnimationForState(state: PetState, speed: number = 0): PetAnimation {
    // 追逐状态特殊处理：始终返回奔跑动画
    if (state === PetState.ChasingMouse) {
      return this.config.chaseAnimation;
    }

    // 行走状态根据速度选择动画
    if (state === PetState.Walking && speed > this.config.walkSpeedThreshold) {
      return PetAnimation.Run;
    }

    // 返回基础映射
    return this.config.stateToAnimation[state] ?? PetAnimation.Idle;
  }

  /**
   * 更新当前状态
   */
  setCurrentState(state: PetState): void {
    this.currentState = state;
  }

  /**
   * 更新当前速度
   */
  setCurrentSpeed(speed: number): void {
    this.currentSpeed = speed;
  }

  /**
   * 获取当前应该播放的动画
   */
  getCurrentAnimation(): PetAnimation {
    return this.getAnimationForState(this.currentState, this.currentSpeed);
  }

  /**
   * 检查状态变更时是否需要切换动画
   * @returns 如果需要切换动画，返回新动画；否则返回 null
   */
  onStateChange(newState: PetState): PetAnimation | null {
    const newAnimation = this.getAnimationForState(newState, this.currentSpeed);
    const currentAnimation = this.getAnimationForState(this.currentState, this.currentSpeed);

    this.currentState = newState;

    if (newAnimation !== currentAnimation) {
      return newAnimation;
    }

    return null;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AnimationMappingConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.stateToAnimation) {
      this.config.stateToAnimation = { ...this.config.stateToAnimation, ...config.stateToAnimation };
    }
  }

  /**
   * 获取所有状态的动画映射
   */
  getAllMappings(): Record<PetState, PetAnimation> {
    return { ...this.config.stateToAnimation };
  }
}
