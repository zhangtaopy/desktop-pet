/**
 * StateTransition - 状态流转规则
 * 定义状态之间的转换条件和目标状态
 */

import { PetState } from '../../core/EventBus';

/**
 * 状态转换条件函数类型
 */
export type TransitionCondition = (context: TransitionContext) => boolean;

/**
 * 状态转换上下文
 * 包含转换决策需要的所有信息
 */
export interface TransitionContext {
  currentState: PetState;
  elapsedTime: number; // 当前状态持续时间
  random: number; // 随机数 0-1
  inChaseCooldown: boolean; // 是否在追逐冷却期
  hasMouseTarget: boolean; // 是否有鼠标目标
  mouseDistance: number; // 与鼠标的距离
  isBeingPetted: boolean; // 是否正在被抚摸
}

/**
 * 状态转换规则
 */
export interface TransitionRule {
  from: PetState;
  to: PetState;
  condition: TransitionCondition;
  priority: number; // 优先级，数字越大越优先
}

/**
 * 默认行为配置
 */
export interface BehaviorConfig {
  idleMinTime: number;
  idleMaxTime: number;
  walkMinTime: number;
  walkMaxTime: number;
  sleepChance: number;
  sleepMinTime: number;
  sleepMaxTime: number;
  walkSpeed: number;
  chaseChance: number;
  chaseCooldown: number;
}

export const DEFAULT_CONFIG: BehaviorConfig = {
  idleMinTime: 3000,
  idleMaxTime: 8000,
  walkMinTime: 2000,
  walkMaxTime: 6000,
  sleepChance: 0.2,
  sleepMinTime: 5000,
  sleepMaxTime: 15000,
  walkSpeed: 1,
  chaseChance: 0.08,
  chaseCooldown: 300000, // 5分钟
};

/**
 * 创建默认的状态转换规则
 */
export function createDefaultTransitions(config: BehaviorConfig): TransitionRule[] {
  return [
    // IDLE 状态的转换
    {
      from: PetState.Idle,
      to: PetState.ChasingMouse,
      condition: (ctx) =>
        !ctx.inChaseCooldown &&
        ctx.random < config.chaseChance &&
        ctx.hasMouseTarget,
      priority: 100, // 追逐优先级最高
    },
    {
      from: PetState.Idle,
      to: PetState.Sleeping,
      condition: (ctx) => ctx.random < config.sleepChance,
      priority: 50,
    },
    {
      from: PetState.Idle,
      to: PetState.Walking,
      condition: (ctx) => ctx.elapsedTime >= config.idleMinTime,
      priority: 10,
    },

    // WALKING 状态的转换
    {
      from: PetState.Walking,
      to: PetState.Sleeping,
      condition: (ctx) =>
        ctx.elapsedTime >= config.walkMinTime &&
        ctx.random < config.sleepChance * 0.5,
      priority: 50,
    },
    {
      from: PetState.Walking,
      to: PetState.Idle,
      condition: (ctx) => ctx.elapsedTime >= config.walkMinTime,
      priority: 10,
    },

    // SLEEPING 状态的转换
    {
      from: PetState.Sleeping,
      to: PetState.Idle,
      condition: (ctx) => ctx.elapsedTime >= config.sleepMinTime,
      priority: 10,
    },

    // PETTING 状态的转换 (被抚摸唤醒)
    {
      from: PetState.Petting,
      to: PetState.Happy,
      condition: (ctx) => ctx.elapsedTime >= 1500,
      priority: 10,
    },

    // HAPPY 状态的转换
    {
      from: PetState.Happy,
      to: PetState.Idle,
      condition: (ctx) => ctx.elapsedTime >= 1000,
      priority: 10,
    },

    // CHASING_MOUSE 状态的转换
    {
      from: PetState.ChasingMouse,
      to: PetState.Idle,
      condition: (ctx) =>
        // 到达目标或失去目标
        (!ctx.hasMouseTarget && ctx.elapsedTime > 500) ||
        ctx.mouseDistance < 5,
      priority: 10,
    },
  ];
}

/**
 * 状态转换管理器
 */
export class StateTransition {
  private rules: TransitionRule[];
  private config: BehaviorConfig;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rules = createDefaultTransitions(this.config);
  }

  /**
   * 获取下一个状态
   * @param context 转换上下文
   * @returns 下一个状态，如果不能转换则返回当前状态
   */
  getNextState(context: TransitionContext): PetState {
    // 按优先级排序
    const applicableRules = this.rules
      .filter(rule => rule.from === context.currentState && rule.condition(context))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length > 0) {
      return applicableRules[0].to;
    }

    return context.currentState;
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: TransitionRule): void {
    this.rules.push(rule);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<BehaviorConfig>): void {
    this.config = { ...this.config, ...config };
    // 重新生成规则
    this.rules = createDefaultTransitions(this.config);
  }
}
