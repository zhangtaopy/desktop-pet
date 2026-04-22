/**
 * MovementController - 移动控制
 * 协调宠物移动，包括速度、方向、边界检测
 */

import { Position } from '../../core/EventBus';
import { ScreenBoundDetector, BoundCheckResult } from './ScreenBoundDetector';
import { WalkDirector, Direction } from './WalkDirector';

/**
 * 移动配置
 */
export interface MovementConfig {
  walkSpeed: number; // 普通行走速度
  chaseSpeedMultiplier: number; // 追逐时的速度倍数
  scaleFactor: number; // 屏幕缩放因子
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  walkSpeed: 1.5,
  chaseSpeedMultiplier: 2.5,
  scaleFactor: 1,
};

/**
 * 位置变更回调
 */
export type PositionChangeCallback = (position: Position, direction: number) => void;

/**
 * 移动控制器
 */
export class MovementController {
  private position: Position;
  private boundDetector: ScreenBoundDetector;
  private walkDirector: WalkDirector;
  private config: MovementConfig;

  // 移动状态
  private currentDirection: Direction;
  private isMoving: boolean = false;
  private isChasing: boolean = false;
  private chaseTarget: Position | null = null;

  // 动画相关
  private lastTimestamp: number = 0;

  // 回调
  private positionCallback?: PositionChangeCallback;

  constructor(
    initialPosition: Position = { x: 100, y: 100 },
    config: Partial<MovementConfig> = {}
  ) {
    this.position = { ...initialPosition };
    this.config = { ...DEFAULT_MOVEMENT_CONFIG, ...config };
    this.boundDetector = new ScreenBoundDetector();
    this.walkDirector = new WalkDirector();
    this.currentDirection = { x: 1, y: 0 };
  }

  /**
   * 注册位置变更回调
   */
  onPositionChange(callback: PositionChangeCallback): void {
    this.positionCallback = callback;
  }

  /**
   * 获取当前位置
   */
  getPosition(): Position {
    return { ...this.position };
  }

  /**
   * 设置位置
   */
  setPosition(position: Position): void {
    const clamped = this.boundDetector.clampPosition(position);
    this.position = clamped.clampedPosition;
    this.notifyPositionChange();
  }

  /**
   * 设置屏幕边界
   */
  setScreenBounds(bounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    this.boundDetector.setBounds(bounds);
    // 重新限制当前位置
    this.clampPosition();
  }

  /**
   * 设置窗口尺寸
   */
  setWindowSize(width: number, height: number): void {
    this.boundDetector.setWindowSize({ width, height });
    // 重新限制当前位置
    this.clampPosition();
  }

  /**
   * 设置缩放因子
   */
  setScaleFactor(factor: number): void {
    this.config.scaleFactor = factor;
  }

  /**
   * 开始随机行走
   */
  startWalking(): void {
    const instruction = this.walkDirector.generateWalk();
    this.currentDirection = instruction.direction;
    this.isMoving = true;
    this.isChasing = false;
    this.chaseTarget = null;
    this.lastTimestamp = 0;
  }

  /**
   * 开始追逐目标
   * @param target 目标位置（物理坐标）
   */
  startChasing(target: Position): void {
    this.chaseTarget = { ...target };
    this.isChasing = true;
    this.isMoving = true;
    this.lastTimestamp = 0;
    this.updateChaseDirection();
  }

  /**
   * 停止移动
   */
  stopMoving(): void {
    this.isMoving = false;
    this.isChasing = false;
    this.chaseTarget = null;
    this.lastTimestamp = 0;
  }

  /**
   * 检查是否正在移动
   */
  isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  /**
   * 检查是否正在追逐
   */
  isCurrentlyChasing(): boolean {
    return this.isChasing;
  }

  /**
   * 获取当前行走方向（用于动画方向）
   * @returns -1 表示向左，1 表示向右
   */
  getWalkDirectionX(): number {
    return this.currentDirection.x >= 0 ? 1 : -1;
  }

  /**
   * 更新移动状态
   * @param timestamp 当前时间戳
   * @returns 是否到达追逐目标
   */
  update(timestamp: number): boolean {
    if (!this.isMoving) {
      this.lastTimestamp = 0;
      return false;
    }

    // 计算时间增量（相对于60fps）
    const deltaTime = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 16.67 : 1;
    this.lastTimestamp = timestamp;

    // 如果是追逐模式，更新方向
    if (this.isChasing && this.chaseTarget) {
      const reached = this.updateChase();
      if (reached) {
        return true; // 到达目标
      }
    }

    // 计算移动速度
    const speed = this.isChasing
      ? this.config.walkSpeed * deltaTime * this.config.chaseSpeedMultiplier
      : this.config.walkSpeed * deltaTime;

    // 计算新位置
    const newPosition: Position = {
      x: this.position.x + this.currentDirection.x * speed,
      y: this.position.y + this.currentDirection.y * speed * 0.5, // Y轴移动较慢
    };

    // 边界检测和调整
    const boundResult = this.boundDetector.clampPosition(newPosition);

    // 更新位置
    this.position = boundResult.clampedPosition;

    // 如果碰到边界且不是追逐模式，反弹
    if (boundResult.isOutOfBounds && !this.isChasing) {
      this.handleBoundaryBounce(boundResult);
    }

    // 通知位置变更
    this.notifyPositionChange();

    return false;
  }

  /**
   * 更新追逐方向
   */
  private updateChaseDirection(): void {
    if (!this.chaseTarget) return;

    const instruction = this.walkDirector.generateChaseWalk(this.position, this.chaseTarget);
    this.currentDirection = instruction.direction;
  }

  /**
   * 更新追逐状态
   * @returns 是否到达目标
   */
  private updateChase(): boolean {
    if (!this.chaseTarget) return false;

    // 计算与目标的距离
    const deltaX = this.chaseTarget.x - this.position.x - 64; // 减去窗口半宽
    const deltaY = this.chaseTarget.y - this.position.y - 64; // 减去窗口半高
    const distance = Math.hypot(deltaX, deltaY);

    // 更新方向
    this.updateChaseDirection();

    // 检查是否到达目标
    if (distance < 5) {
      this.stopMoving();
      return true;
    }

    return false;
  }

  /**
   * 处理边界反弹
   */
  private handleBoundaryBounce(boundResult: BoundCheckResult): void {
    const { hitEdge } = boundResult;

    // 如果碰到左右边界，反转X方向
    if (hitEdge.left || hitEdge.right) {
      this.walkDirector.reverseX();
      this.currentDirection.x = this.walkDirector.getCurrentDirection().x;
    }

    // 如果碰到上下边界，反转Y方向
    if (hitEdge.top || hitEdge.bottom) {
      this.walkDirector.reverseY();
      this.currentDirection.y = this.walkDirector.getCurrentDirection().y;
    }
  }

  /**
   * 限制当前位置在边界内
   */
  private clampPosition(): void {
    const result = this.boundDetector.clampPosition(this.position);
    if (result.isOutOfBounds) {
      this.position = result.clampedPosition;
      this.notifyPositionChange();
    }
  }

  /**
   * 通知位置变更
   */
  private notifyPositionChange(): void {
    this.positionCallback?.(
      { ...this.position },
      this.getWalkDirectionX()
    );
  }

  /**
   * 更新移动配置
   */
  updateConfig(config: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
