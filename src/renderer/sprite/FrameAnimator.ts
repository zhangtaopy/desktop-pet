/**
 * 帧动画逻辑
 * 管理动画帧的播放、循环和时间控制
 */

export interface FrameAnimatorConfig {
  /** 总帧数 */
  frameCount: number;
  /** 每帧持续时间（毫秒） */
  frameDuration: number;
  /** 是否循环播放 */
  loop?: boolean;
  /** 是否倒放 */
  reverse?: boolean;
}

export interface AnimationState {
  currentFrame: number;
  isPlaying: boolean;
  isFinished: boolean;
  progress: number; // 0-1
}

/**
 * 帧动画控制器
 * 负责管理动画时间进度和帧切换
 */
export class FrameAnimator {
  private config: FrameAnimatorConfig;
  private currentFrame: number = 0;
  private lastFrameTime: number = 0;
  private isPlaying: boolean = false;
  private isFinished: boolean = false;

  constructor(config: FrameAnimatorConfig) {
    this.config = {
      loop: true,
      reverse: false,
      ...config,
    };
  }

  /**
   * 更新动画
   * @param deltaTime 时间增量（毫秒）
   */
  update(deltaTime: number): void {
    if (!this.isPlaying || this.isFinished) {
      return;
    }

    this.lastFrameTime += deltaTime;

    if (this.lastFrameTime >= this.config.frameDuration) {
      this.lastFrameTime = 0;
      this.advanceFrame();
    }
  }

  /**
   * 前进到下一帧
   */
  private advanceFrame(): void {
    const { frameCount, loop } = this.config;

    if (this.config.reverse) {
      // 倒放
      this.currentFrame--;
      if (this.currentFrame < 0) {
        if (loop) {
          this.currentFrame = frameCount - 1;
        } else {
          this.currentFrame = 0;
          this.isFinished = true;
        }
      }
    } else {
      // 正放
      this.currentFrame++;
      if (this.currentFrame >= frameCount) {
        if (loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = frameCount - 1;
          this.isFinished = true;
        }
      }
    }
  }

  /**
   * 播放动画
   */
  play(): void {
    this.isPlaying = true;
    this.isFinished = false;
  }

  /**
   * 暂停动画
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * 停止动画（重置到第一帧）
   */
  stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.lastFrameTime = 0;
  }

  /**
   * 重置动画到初始状态
   */
  reset(): void {
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.isFinished = false;
  }

  /**
   * 跳转到指定帧
   */
  gotoFrame(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(frame, this.config.frameCount - 1));
  }

  /**
   * 获取当前帧索引
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * 获取动画状态
   */
  getState(): AnimationState {
    return {
      currentFrame: this.currentFrame,
      isPlaying: this.isPlaying,
      isFinished: this.isFinished,
      progress: this.currentFrame / (this.config.frameCount - 1 || 1),
    };
  }

  /**
   * 检查是否正在播放
   */
  isAnimating(): boolean {
    return this.isPlaying && !this.isFinished;
  }

  /**
   * 检查是否已完成
   */
  isComplete(): boolean {
    return this.isFinished;
  }

  /**
   * 设置播放速度倍率
   */
  setSpeed(speed: number): void {
    // 通过修改 frameDuration 来实现速度调整
    const baseDuration = this.config.frameDuration;
    this.config.frameDuration = baseDuration / speed;
  }
}
