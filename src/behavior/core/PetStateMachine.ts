/**
 * PetStateMachine - 纯状态机实现
 * 负责管理宠物状态的流转，不涉及任何渲染或移动逻辑
 */

import { PetState } from '../../core/EventBus';
import { StateConfig, DEFAULT_STATE_CONFIG } from './PetState';
import { StateTransition, BehaviorConfig, DEFAULT_CONFIG } from './StateTransition';

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
  private hasMouseTarget: boolean = false;
  private mouseDistance: number = Infinity;
  private isBeingPetted: boolean = false;
  private inChaseCooldown: boolean = false;

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
   * 设置是否在追逐冷却期
   */
  setInChaseCooldown(inCooldown: boolean): void {
    this.inChaseCooldown = inCooldown;
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

    switch (this.currentState) {
      case PetState.Idle:
        // 检查追逐（冷却期内不触发）
        if (this.hasMouseTarget && !this.inChaseCooldown && random < this.config.chaseChance) {
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
}
