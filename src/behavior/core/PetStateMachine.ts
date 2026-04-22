/**
 * PetStateMachine - 纯状态机实现
 * 负责管理宠物状态的流转，不涉及任何渲染或移动逻辑
 */

import { PetState } from '../../core/EventBus';
import { StateConfig, DEFAULT_STATE_CONFIG } from './PetState';
import { StateTransition, TransitionContext, BehaviorConfig, DEFAULT_CONFIG } from './StateTransition';

/**
 * 状态变更回调
 */
export type StateChangeCallback = (from: PetState, to: PetState) => void;

/**
 * 状态机配置
 */
export interface StateMachineConfig {
  behavior: Partial<BehaviorConfig>;
  initialState?: PetState;
}

/**
 * 纯状态机类
 */
export class PetStateMachine {
  private currentState: PetState;
  private stateStartTime: number;
  private actionEndTime: number;  // 当前动作的结束时间
  private transition: StateTransition;
  private config: BehaviorConfig;
  private stateConfig: Map<PetState, StateConfig | null>;

  // 外部状态上下文
  private chaseCooldownEndTime: number = 0;
  private hasMouseTarget: boolean = false;
  private mouseDistance: number = Infinity;
  private isBeingPetted: boolean = false;

  // 回调
  private onStateChange?: StateChangeCallback;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.transition = new StateTransition(this.config);
    this.stateConfig = new Map(Object.entries(DEFAULT_STATE_CONFIG) as [PetState, StateConfig | null][]);
    this.currentState = PetState.Idle;
    this.stateStartTime = Date.now();
    this.actionEndTime = this.calculateActionEndTime(PetState.Idle);
  }

  /**
   * 计算动作结束时间
   */
  private calculateActionEndTime(state: PetState): number {
    const config = this.stateConfig.get(state);
    if (!config) {
      // 追逐状态没有固定时长
      return Date.now() + 999999999;
    }
    const duration = this.randomBetween(config.minDuration, config.maxDuration);
    return Date.now() + duration;
  }

  /**
   * 生成指定范围内的随机数
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 注册状态变更回调
   */
  onTransition(callback: StateChangeCallback): void {
    this.onStateChange = callback;
  }

  /**
   * 获取当前状态
   */
  getState(): PetState {
    return this.currentState;
  }

  /**
   * 获取当前状态持续时间
   */
  getStateElapsedTime(): number {
    return Date.now() - this.stateStartTime;
  }

  /**
   * 获取当前状态的预计结束时间
   */
  getStateEndTime(): number | null {
    const config = this.stateConfig.get(this.currentState);
    if (!config) return null;
    return this.stateStartTime + config.maxDuration;
  }

  /**
   * 设置追逐冷却
   * @param cooldownMs 冷却时间（毫秒）
   */
  setChaseCooldown(cooldownMs: number): void {
    this.chaseCooldownEndTime = Date.now() + cooldownMs;
  }

  /**
   * 设置是否有鼠标目标
   */
  setHasMouseTarget(hasTarget: boolean, distance: number = Infinity): void {
    this.hasMouseTarget = hasTarget;
    this.mouseDistance = distance;
  }

  /**
   * 设置是否正在被抚摸
   */
  setIsBeingPetted(isPetted: boolean): void {
    this.isBeingPetted = isPetted;
  }

  /**
   * 强制切换到指定状态
   */
  forceState(newState: PetState): void {
    this.transitionTo(newState);
  }

  /**
   * 更新状态机，检查是否需要状态转换
   * @returns 如果状态发生变化返回 true
   */
  update(): boolean {
    const now = Date.now();

    // 检查是否到达动作结束时间
    if (now < this.actionEndTime) {
      return false;  // 还没到转换时间
    }

    // 时间到了，决定下一个状态
    const nextState = this.decideNextState();

    if (nextState !== this.currentState) {
      this.transitionTo(nextState);
      return true;
    }

    return false;
  }

  /**
   * 决定下一个状态
   */
  private decideNextState(): PetState {
    const random = Math.random();
    const now = Date.now();
    const inChaseCooldown = now < this.chaseCooldownEndTime;

    switch (this.currentState) {
      case PetState.Idle:
        // 检查追逐
        if (!inChaseCooldown && this.hasMouseTarget && random < this.config.chaseChance) {
          return PetState.ChasingMouse;
        }
        // 检查睡觉
        if (random < this.config.sleepChance) {
          return PetState.Sleeping;
        }
        // 默认行走
        return PetState.Walking;

      case PetState.Walking:
        // 行走后可能睡觉或空闲
        if (random < this.config.sleepChance * 0.5) {
          return PetState.Sleeping;
        }
        return PetState.Idle;

      case PetState.Sleeping:
        // 睡醒后空闲
        return PetState.Idle;

      case PetState.Petting:
        // 抚摸后开心
        return PetState.Happy;

      case PetState.Happy:
        // 开心后空闲
        return PetState.Idle;

      case PetState.ChasingMouse:
        // 追逐结束（到达目标或失去目标）
        if (!this.hasMouseTarget || this.mouseDistance < 5) {
          return PetState.Idle;
        }
        // 继续追逐
        return PetState.ChasingMouse;

      default:
        return PetState.Idle;
    }
  }

  /**
   * 检查是否可以转换到目标状态
   */
  canTransitionTo(targetState: PetState): boolean {
    const context = this.buildContext();
    const nextState = this.transition.getNextState(context);
    return nextState === targetState;
  }

  /**
   * 构建转换上下文
   */
  private buildContext(): TransitionContext {
    const now = Date.now();
    return {
      currentState: this.currentState,
      elapsedTime: now - this.stateStartTime,
      random: Math.random(),
      inChaseCooldown: now < this.chaseCooldownEndTime,
      hasMouseTarget: this.hasMouseTarget,
      mouseDistance: this.mouseDistance,
      isBeingPetted: this.isBeingPetted,
    };
  }

  /**
   * 执行状态转换
   */
  private transitionTo(newState: PetState): void {
    const oldState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();

    // 计算新状态的持续时间
    this.actionEndTime = this.calculateActionEndTime(newState);

    // 触发回调
    this.onStateChange?.(oldState, newState);

    console.log(`[PetStateMachine] ${oldState} -> ${newState}`);
  }

  /**
   * 更新行为配置
   */
  updateConfig(config: Partial<BehaviorConfig>): void {
    this.config = { ...this.config, ...config };
    this.transition.updateConfig(this.config);
  }

  /**
   * 获取状态配置
   */
  getStateConfig(state: PetState): StateConfig | null {
    return this.stateConfig.get(state) ?? null;
  }

  /**
   * 重置状态机到初始状态
   */
  reset(): void {
    this.currentState = PetState.Idle;
    this.stateStartTime = Date.now();
    this.chaseCooldownEndTime = 0;
    this.hasMouseTarget = false;
    this.mouseDistance = Infinity;
    this.isBeingPetted = false;
  }
}
