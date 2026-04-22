/**
 * 精灵渲染器
 * 纯精灵渲染引擎 - 负责将精灵帧绘制到画布
 */

import { SpriteSheet } from './SpriteSheet';
import { FrameAnimator } from './FrameAnimator';

export interface SpriteRendererConfig {
  src?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameDuration: number;
  loop?: boolean;
}

/**
 * 精灵渲染器
 * 组合 SpriteSheet 和 FrameAnimator 提供完整的精灵渲染功能
 */
export class SpriteRenderer {
  private spriteSheet: SpriteSheet;
  private animator: FrameAnimator;
  private isInitialized: boolean = false;

  constructor(config: SpriteRendererConfig) {
    this.spriteSheet = new SpriteSheet({
      src: config.src,
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
      frameCount: config.frameCount,
    });

    this.animator = new FrameAnimator({
      frameCount: config.frameCount,
      frameDuration: config.frameDuration,
      loop: config.loop ?? true,
    });
  }

  /**
   * 从文件加载精灵
   */
  async load(): Promise<void> {
    await this.spriteSheet.load();
    this.isInitialized = true;
    this.animator.play();
  }

  /**
   * 设置生成的图片（后备方案）
   */
  setImage(image: HTMLCanvasElement): void {
    this.spriteSheet.setImage(image);
    this.isInitialized = true;
    this.animator.play();
  }

  /**
   * 更新动画状态
   * @param deltaTime 时间增量（毫秒）
   */
  update(deltaTime: number): void {
    if (!this.isInitialized) return;
    this.animator.update(deltaTime);
  }

  /**
   * 渲染当前帧到画布
   * @param ctx 画布上下文
   * @param x 目标 X 坐标
   * @param y 目标 Y 坐标
   * @param scale 缩放比例
   */
  render(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1): void {
    const image = this.spriteSheet.getImage();
    if (!image || !this.isInitialized) return;

    const frameRect = this.spriteSheet.getFrameRect(this.animator.getCurrentFrame());
    const { width, height } = this.spriteSheet.getFrameSize();

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      frameRect.x,
      frameRect.y,
      frameRect.width,
      frameRect.height,
      x,
      y,
      width * scale,
      height * scale
    );
  }

  /**
   * 检查是否已加载
   */
  loaded(): boolean {
    return this.spriteSheet.loaded();
  }

  /**
   * 重置动画
   */
  reset(): void {
    this.animator.reset();
  }

  /**
   * 获取当前帧索引
   */
  getCurrentFrame(): number {
    return this.animator.getCurrentFrame();
  }

  /**
   * 获取帧尺寸
   */
  getFrameSize(): { width: number; height: number } {
    return this.spriteSheet.getFrameSize();
  }

  /**
   * 获取动画器（用于高级控制）
   */
  getAnimator(): FrameAnimator {
    return this.animator;
  }

  /**
   * 获取精灵图（用于高级操作）
   */
  getSpriteSheet(): SpriteSheet {
    return this.spriteSheet;
  }
}

// 重新导出子模块
export { SpriteSheet } from './SpriteSheet';
export { FrameAnimator } from './FrameAnimator';
export type { SpriteSheetConfig, FrameRect } from './SpriteSheet';
export type { FrameAnimatorConfig, AnimationState } from './FrameAnimator';
