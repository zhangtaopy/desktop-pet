/**
 * WalkDirector - 随机游走算法
 * 负责生成随机行走的方向和持续时间
 */

import { Position } from '../../core/EventBus';

/**
 * 移动方向
 */
export interface Direction {
  x: number; // -1, 0, 1
  y: number; // -1, 0, 1
}

/**
 * 行走指令
 */
export interface WalkInstruction {
  direction: Direction;
  duration: number; // 持续时间（毫秒）
}

/**
 * 游走配置
 */
export interface WalkConfig {
  minDuration: number;
  maxDuration: number;
  horizontalBias: number; // 水平移动倾向 (0-1)
  verticalChance: number; // 垂直移动概率 (0-1)
  changeDirectionOnEdge: boolean; // 到达边界时是否改变方向
}

/**
 * 默认游走配置
 */
export const DEFAULT_WALK_CONFIG: WalkConfig = {
  minDuration: 2000,
  maxDuration: 6000,
  horizontalBias: 0.8, // 80%倾向水平移动
  verticalChance: 0.6, // 60%概率有垂直分量
  changeDirectionOnEdge: true,
};

/**
 * 随机游走导演类
 */
export class WalkDirector {
  private config: WalkConfig;
  private currentDirection: Direction;

  constructor(config: Partial<WalkConfig> = {}) {
    this.config = { ...DEFAULT_WALK_CONFIG, ...config };
    this.currentDirection = { x: 1, y: 0 };
  }

  /**
   * 生成新的行走指令
   */
  generateWalk(): WalkInstruction {
    const direction = this.generateDirection();
    this.currentDirection = direction;

    return {
      direction,
      duration: this.randomBetween(this.config.minDuration, this.config.maxDuration),
    };
  }

  /**
   * 生成特定方向的行走（用于边界反弹）
   * @param preferredX X方向偏好 (-1, 0, 1)
   * @param preferredY Y方向偏好 (-1, 0, 1)
   */
  generateWalkTowards(preferredX?: number, preferredY?: number): WalkInstruction {
    const direction: Direction = {
      x: preferredX ?? (Math.random() > 0.5 ? 1 : -1),
      y: preferredY ?? this.generateYDirection(),
    };

    this.currentDirection = direction;

    return {
      direction,
      duration: this.randomBetween(this.config.minDuration, this.config.maxDuration),
    };
  }

  /**
   * 生成追逐目标的行走指令
   * @param currentPos 当前位置
   * @param targetPos 目标位置
   * @returns 指向目标的行走指令（无持续时间限制）
   */
  generateChaseWalk(currentPos: Position, targetPos: Position): WalkInstruction {
    const deltaX = targetPos.x - currentPos.x;
    const deltaY = targetPos.y - currentPos.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < 1) {
      return {
        direction: { x: 0, y: 0 },
        duration: 100,
      };
    }

    // 归一化方向向量
    const direction: Direction = {
      x: deltaX / distance,
      y: deltaY / distance,
    };

    this.currentDirection = direction;

    return {
      direction,
      duration: -1, // 追逐持续到到达目标
    };
  }

  /**
   * 获取当前方向
   */
  getCurrentDirection(): Direction {
    return { ...this.currentDirection };
  }

  /**
   * 反转当前方向（用于边界反弹）
   */
  reverseDirection(): void {
    this.currentDirection = {
      x: -this.currentDirection.x,
      y: -this.currentDirection.y,
    };
  }

  /**
   * 只在X轴上反转方向
   */
  reverseX(): void {
    this.currentDirection.x = -this.currentDirection.x;
  }

  /**
   * 只在Y轴上反转方向
   */
  reverseY(): void {
    this.currentDirection.y = -this.currentDirection.y;
  }

  /**
   * 生成随机方向
   */
  private generateDirection(): Direction {
    // X方向：随机左右
    const x = Math.random() > 0.5 ? 1 : -1;

    // Y方向：根据配置决定是否移动
    const y = this.generateYDirection();

    return { x, y };
  }

  /**
   * 生成Y方向
   */
  private generateYDirection(): number {
    const rand = Math.random();
    if (rand < 0.4) return 0; // 40% 不上下移动
    if (rand < 0.7) return -1; // 30% 向上
    return 1; // 30% 向下
  }

  /**
   * 生成指定范围内的随机数
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WalkConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
