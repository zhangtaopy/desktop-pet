/**
 * 宠物渲染器
 * 协调外观、表情和精灵渲染
 */

import { SpriteRenderer, SpriteRendererConfig } from '../sprite';
import { PetAnimation } from '../../core/EventBus';
import { PetAppearance, DEFAULT_PET_COLORS } from './PetAppearance';
import { PetExpression } from './PetExpression';
import { SpeechBubble } from '../SpeechBubble';
import { DialogueEntry } from '../DialogueManager';
import { WeatherAccessory } from '../WeatherAccessory';
import { WeatherCondition } from '../WeatherService';
import { FocusAccessory } from '../FocusAccessory';
import { PomodoroPhase } from '../PomodoroTimer';

/**
 * 动画配置映射
 */
const ANIMATION_CONFIGS: Record<PetAnimation, SpriteRendererConfig> = {
  [PetAnimation.Idle]: {
    src: '/sprites/idle.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameDuration: 200,
  },
  [PetAnimation.Walk]: {
    src: '/sprites/walk.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameDuration: 150,
  },
  [PetAnimation.Run]: {
    src: '/sprites/run.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameDuration: 80,
  },
  [PetAnimation.Sleep]: {
    src: '/sprites/sleep.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 2,
    frameDuration: 500,
  },
  [PetAnimation.Petting]: {
    src: '/sprites/petting.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameDuration: 120,
  },
  [PetAnimation.Happy]: {
    src: '/sprites/happy.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameDuration: 150,
  },
};

/**
 * 宠物渲染器配置
 */
export interface PetRendererConfig {
  /** 目标画布 */
  canvas: HTMLCanvasElement;
  /** 显示尺寸 */
  displaySize?: number;
  /** 颜色配置 */
  colors?: typeof DEFAULT_PET_COLORS;
}

/**
 * 宠物渲染器
 * 管理宠物动画、外观和渲染
 */
export class PetRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Map<PetAnimation, SpriteRenderer> = new Map();
  private appearance: PetAppearance;
  private expression: PetExpression;
  private currentAnimation: PetAnimation = PetAnimation.Idle;
  private lastTime: number = 0;
  private flipX: boolean = false;
  private currentFrame: number = 0;
  private bubble: SpeechBubble = new SpeechBubble();
  private weatherAccessory: WeatherAccessory = new WeatherAccessory();
  private focusAccessory: FocusAccessory = new FocusAccessory();
  private weatherCondition: WeatherCondition = 'unknown';
  private pomodoroPhase: PomodoroPhase = 'idle';
  private pomodoroRemainingMs: number = 0;

  constructor(config: PetRendererConfig) {
    this.canvas = config.canvas;
    this.ctx = config.canvas.getContext('2d')!;
    this.appearance = new PetAppearance({
      displaySize: config.displaySize,
      colors: config.colors,
    });
    this.expression = new PetExpression();
  }

  /**
   * 加载所有动画
   */
  async loadAnimations(): Promise<void> {
    for (const [anim, config] of Object.entries(ANIMATION_CONFIGS)) {
      const renderer = new SpriteRenderer(config);
      this.sprites.set(anim as PetAnimation, renderer);

      try {
        await renderer.load();
      } catch {
        console.warn(`Sprite ${anim} not found, using generated sprite`);
        const generatedImage = this.generateSprite(anim as PetAnimation, config);
        renderer.setImage(generatedImage);
      }
    }
  }

  /**
   * 生成后备精灵图
   */
  private generateSprite(
    animation: PetAnimation,
    config: SpriteRendererConfig
  ): HTMLCanvasElement {
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = config.frameWidth * config.frameCount;
    spriteCanvas.height = config.frameHeight;
    const spriteCtx = spriteCanvas.getContext('2d')!;

    for (let frame = 0; frame < config.frameCount; frame++) {
      this.drawFrame(spriteCtx, frame * config.frameWidth, 0, animation, frame);
    }

    return spriteCanvas;
  }

  /**
   * 绘制单个帧
   */
  private drawFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    animation: PetAnimation,
    frame: number
  ): void {
    ctx.imageSmoothingEnabled = false;
    const colors = this.appearance.getColors();

    const offsetX = x + 8;
    const offsetY = y + 4;

    // 计算垂直偏移（跳动效果）
    let bobY = 0;
    if (animation === PetAnimation.Walk) {
      bobY = frame % 2 === 0 ? -1 : 0;
    } else if (animation === PetAnimation.Run) {
      bobY = frame % 2 === 0 ? -3 : 0;
    } else if (animation === PetAnimation.Idle) {
      bobY = frame === 1 || frame === 3 ? 1 : 0;
    } else if (animation === PetAnimation.Petting || animation === PetAnimation.Happy) {
      bobY = frame % 2 === 0 ? -2 : 0;
    }

    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(offsetX + 8, offsetY + 24, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 绘制尾巴
    ctx.fillStyle = colors.body;
    let tailWag: number;
    if (animation === PetAnimation.Run) {
      tailWag = frame % 2 === 0 ? 4 : 2;
    } else if (animation === PetAnimation.Walk) {
      tailWag = frame % 2 === 0 ? 0 : 2;
    } else if (animation === PetAnimation.Petting || animation === PetAnimation.Happy) {
      tailWag = frame % 2 === 0 ? 3 : 0;
    } else {
      tailWag = frame % 2;
    }
    ctx.fillRect(offsetX + 14 + tailWag, offsetY + 14 + bobY, 3, 8);
    ctx.fillRect(offsetX + 15 + tailWag, offsetY + 12 + bobY, 2, 3);

    // 绘制身体
    ctx.fillStyle = colors.body;
    ctx.fillRect(offsetX + 2, offsetY + 16 + bobY, 12, 8);
    ctx.fillRect(offsetX + 3, offsetY + 14 + bobY, 10, 2);

    // 绘制头部
    ctx.fillRect(offsetX + 1, offsetY + 4 + bobY, 14, 12);
    ctx.fillRect(offsetX + 2, offsetY + 2 + bobY, 12, 2);

    // 绘制耳朵
    ctx.fillRect(offsetX + 1, offsetY + bobY, 3, 4);
    ctx.fillRect(offsetX + 12, offsetY + bobY, 3, 4);

    // 内耳
    ctx.fillStyle = colors.nose;
    ctx.fillRect(offsetX + 2, offsetY + 1 + bobY, 1, 2);
    ctx.fillRect(offsetX + 13, offsetY + 1 + bobY, 1, 2);

    // 绘制脸部
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(offsetX + 3, offsetY + 8 + bobY, 10, 6);

    // 绘制眼睛
    const expressionState = this.expression.getExpression(animation, frame);
    this.expression.drawEyes(ctx, offsetX, offsetY + bobY, expressionState);

    // 绘制鼻子
    ctx.fillStyle = colors.nose;
    ctx.fillRect(offsetX + 7, offsetY + 12 + bobY, 2, 1);

    // 绘制脸颊
    if (expressionState.showBlush) {
      this.expression.drawBlush(ctx, offsetX, offsetY + bobY, true);
    } else {
      ctx.fillStyle = colors.cheek;
      ctx.fillRect(offsetX + 2, offsetY + 11 + bobY, 2, 2);
      ctx.fillRect(offsetX + 12, offsetY + 11 + bobY, 2, 2);
    }

    // 绘制腿部
    ctx.fillStyle = colors.body;
    if (animation === PetAnimation.Run) {
      const legOffset = frame % 2 === 0 ? 3 : -3;
      ctx.fillRect(offsetX + 3, offsetY + 23 + (frame % 2 === 0 ? -1 : 0), 3, 3);
      ctx.fillRect(offsetX + 10 + legOffset, offsetY + 23 + (frame % 2 === 0 ? 0 : -1), 3, 3);
    } else if (animation === PetAnimation.Walk) {
      const legOffset = frame % 2 === 0 ? 1 : -1;
      ctx.fillRect(offsetX + 3, offsetY + 23, 3, 3);
      ctx.fillRect(offsetX + 10 + legOffset, offsetY + 23, 3, 3);
    } else {
      ctx.fillRect(offsetX + 3, offsetY + 23, 3, 3);
      ctx.fillRect(offsetX + 10, offsetY + 23, 3, 3);
    }

    // 绘制表情特效
    if (expressionState.showSleepBubble) {
      this.expression.drawSleepBubble(ctx, offsetX, offsetY + bobY, frame);
    }

    if (expressionState.showHearts) {
      this.expression.drawHearts(ctx, offsetX, offsetY + bobY, frame);
    }
  }

  /**
   * 获取当前帧的垂直跳动偏移
   */
  getBobY(): number {
    const frame = this.currentFrame;
    if (this.currentAnimation === PetAnimation.Walk) {
      return frame % 2 === 0 ? -1 : 0;
    } else if (this.currentAnimation === PetAnimation.Run) {
      return frame % 2 === 0 ? -3 : 0;
    } else if (this.currentAnimation === PetAnimation.Idle) {
      return frame === 1 || frame === 3 ? 1 : 0;
    } else if (this.currentAnimation === PetAnimation.Petting ||
               this.currentAnimation === PetAnimation.Happy) {
      return frame % 2 === 0 ? -2 : 0;
    }
    return 0;
  }
  setAnimation(animation: PetAnimation): void {
    if (this.currentAnimation !== animation) {
      this.currentAnimation = animation;
      this.sprites.get(animation)?.reset();
    }
  }

  /**
   * 设置水平翻转
   */
  setFlipX(flip: boolean): void {
    this.flipX = flip;
  }

  /**
   * 更新动画状态
   */
  update(timestamp: number): void {
    const deltaTime = this.lastTime ? timestamp - this.lastTime : 0;
    this.lastTime = timestamp;

    const sprite = this.sprites.get(this.currentAnimation);
    if (sprite?.loaded()) {
      sprite.update(deltaTime);
      this.currentFrame = sprite.getCurrentFrame();
    }

    this.bubble.update(deltaTime);
  }

  /**
   * 渲染当前帧
   */
  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sprite = this.sprites.get(this.currentAnimation);
    const displaySize = this.appearance.getDisplaySize();
    const scale = this.appearance.getScale();

    if (sprite?.loaded()) {
      const x = (this.canvas.width - displaySize) / 2;
      const y = (this.canvas.height - displaySize) / 2;

      this.ctx.save();

      if (this.flipX) {
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);
      }

      sprite.render(
        this.ctx,
        this.flipX ? this.canvas.width - x - displaySize : x,
        y,
        scale
      );

      this.ctx.restore();

      const bobPx = this.getBobY() * scale;
      const eyeCenterX = x + displaySize * 15.5 / 32;
      const eyeCenterY = y + displaySize * 13.5 / 32 + bobPx;
      this.weatherAccessory.render(this.ctx, this.weatherCondition, eyeCenterX, eyeCenterY, displaySize);
      this.focusAccessory.render(this.ctx, this.pomodoroPhase, this.pomodoroRemainingMs, eyeCenterX, eyeCenterY, displaySize);
    } else {
      this.drawFallback();
    }

    this.bubble.render(this.ctx);
  }

  /**
   * 绘制后备图形
   */
  private drawFallback(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = '#4ecdc4';
    const displaySize = this.appearance.getDisplaySize();
    const x = (this.canvas.width - displaySize) / 2;
    const y = (this.canvas.height - displaySize) / 2;
    this.ctx.fillRect(x, y, displaySize, displaySize);
  }

  /**
   * 启动渲染循环
   */
  start(): void {
    const loop = (timestamp: number) => {
      this.update(timestamp);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * 获取外观管理器
   */
  getAppearance(): PetAppearance {
    return this.appearance;
  }

  /**
   * 获取表情管理器
   */
  getExpression(): PetExpression {
    return this.expression;
  }

  /**
   * 获取当前动画
   */
  getCurrentAnimation(): PetAnimation {
    return this.currentAnimation;
  }

  /**
   * 获取是否水平翻转
   */
  getFlipX(): boolean {
    return this.flipX;
  }

  /**
   * 显示对话气泡
   */
  showBubble(dialogue: DialogueEntry): void {
    this.bubble.show(dialogue);
  }

  /**
   * 隐藏对话气泡
   */
  hideBubble(): void {
    this.bubble.hide();
  }

  /**
   * 获取气泡是否可见
   */
  isBubbleVisible(): boolean {
    return this.bubble.isVisible();
  }

  /**
   * 设置天气状态
   */
  setWeather(condition: WeatherCondition): void {
    this.weatherCondition = condition;
  }

  /**
   * 设置番茄钟状态
   */
  setPomodoroState(state: PomodoroPhase, remainingMs: number = 0): void {
    this.pomodoroPhase = state;
    this.pomodoroRemainingMs = remainingMs;
  }

  getPomodoroState(): PomodoroPhase {
    return this.pomodoroPhase;
  }

  showHearts(): void {
    this.expression.showHeartsOverride = true;
    setTimeout(() => {
      this.expression.showHeartsOverride = false;
    }, 2000);
  }
}

// 重新导出子模块
export { PetAppearance } from './PetAppearance';
export { PetExpression } from './PetExpression';
export { DEFAULT_PET_COLORS } from './PetAppearance';
export type { PixelColor, PetAppearanceConfig } from './PetAppearance';
export type { ExpressionState } from './PetExpression';
