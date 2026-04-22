/**
 * ScreenBoundDetector - 屏幕边界检测
 * 负责检测位置是否超出屏幕边界并计算合法位置
 */

import { Position } from '../../core/EventBus';

/**
 * 屏幕边界信息
 */
export interface ScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 窗口尺寸信息
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * 边界检测结果
 */
export interface BoundCheckResult {
  isOutOfBounds: boolean;
  clampedPosition: Position;
  hitEdge: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  };
}

/**
 * 屏幕边界检测器
 */
export class ScreenBoundDetector {
  private bounds: ScreenBounds;
  private windowSize: WindowSize;

  constructor(bounds?: Partial<ScreenBounds>, windowSize?: Partial<WindowSize>) {
    this.bounds = {
      minX: 0,
      minY: 0,
      maxX: 1920,
      maxY: 1080,
      ...bounds,
    };
    this.windowSize = {
      width: 128,
      height: 128,
      ...windowSize,
    };
  }

  /**
   * 设置屏幕边界
   */
  setBounds(bounds: Partial<ScreenBounds>): void {
    this.bounds = { ...this.bounds, ...bounds };
  }

  /**
   * 设置窗口尺寸
   */
  setWindowSize(size: Partial<WindowSize>): void {
    this.windowSize = { ...this.windowSize, ...size };
  }

  /**
   * 获取屏幕边界
   */
  getBounds(): ScreenBounds {
    return { ...this.bounds };
  }

  /**
   * 检查位置是否在边界内，返回限制后的位置
   */
  clampPosition(position: Position): BoundCheckResult {
    const { minX, maxX, minY, maxY } = this.bounds;
    const { width, height } = this.windowSize;

    // 计算合法范围（考虑到窗口尺寸）
    const legalMaxX = maxX - width;
    const legalMaxY = maxY - height;

    // 限制位置
    const clampedX = Math.max(minX, Math.min(legalMaxX, position.x));
    const clampedY = Math.max(minY, Math.min(legalMaxY, position.y));

    // 检测碰撞的边界
    const hitEdge = {
      left: position.x <= minX,
      right: position.x >= legalMaxX,
      top: position.y <= minY,
      bottom: position.y >= legalMaxY,
    };

    return {
      isOutOfBounds: position.x !== clampedX || position.y !== clampedY,
      clampedPosition: { x: clampedX, y: clampedY },
      hitEdge,
    };
  }

  /**
   * 检查位置是否完全在边界内
   */
  isInBounds(position: Position): boolean {
    const result = this.clampPosition(position);
    return !result.isOutOfBounds;
  }

  /**
   * 获取屏幕中心位置
   */
  getScreenCenter(): Position {
    const { minX, maxX, minY, maxY } = this.bounds;
    const { width, height } = this.windowSize;

    return {
      x: minX + (maxX - minX - width) / 2,
      y: minY + (maxY - minY - height) / 2,
    };
  }

  /**
   * 获取一个随机的屏幕内位置
   */
  getRandomPosition(margin: number = 50): Position {
    const { minX, maxX, minY, maxY } = this.bounds;
    const { width, height } = this.windowSize;

    return {
      x: minX + margin + Math.random() * (maxX - minX - width - margin * 2),
      y: minY + margin + Math.random() * (maxY - minY - height - margin * 2),
    };
  }
}
