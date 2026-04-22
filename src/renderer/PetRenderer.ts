import { SpriteRenderer, SpriteConfig } from './SpriteRenderer';
import { PetAnimation } from '../core/EventBus';

// 重新导出 PetAnimation 以保持兼容性
export { PetAnimation };

interface PixelColor {
  body: string;
  eye: string;
  nose: string;
  cheek: string;
}

const PET_COLORS: PixelColor = {
  body: '#FFB6C1',     // Light pink
  eye: '#333333',      // Dark gray
  nose: '#FF69B4',     // Hot pink
  cheek: '#FFB6C180',  // Semi-transparent pink
};

export class PetRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Map<PetAnimation, SpriteRenderer> = new Map();
  private currentAnimation: PetAnimation = PetAnimation.Idle;
  private lastTime: number = 0;
  private displaySize: number = 64;
  private frameSize: number = 32;
  private flipX: boolean = false; // 是否水平翻转

  constructor(canvas: HTMLCanvasElement, displaySize: number = 64) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.displaySize = displaySize;
  }

  async loadAnimations(): Promise<void> {
    const configs: Record<PetAnimation, SpriteConfig> = {
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
        frameDuration: 80,  // 更快的奔跑动画
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

    for (const [anim, config] of Object.entries(configs)) {
      const renderer = new SpriteRenderer(config);
      this.sprites.set(anim as PetAnimation, renderer);

      // Try to load from file, fallback to generated
      try {
        await renderer.load();
      } catch {
        console.warn(`Sprite ${anim} not found, using generated sprite`);
        const generatedImage = this.generateSprite(anim as PetAnimation, config);
        renderer.setImage(generatedImage);
      }
    }
  }

  private generateSprite(animation: PetAnimation, config: SpriteConfig): HTMLCanvasElement {
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = config.frameWidth * config.frameCount;
    spriteCanvas.height = config.frameHeight;
    const spriteCtx = spriteCanvas.getContext('2d')!;

    for (let frame = 0; frame < config.frameCount; frame++) {
      this.drawFrame(spriteCtx, frame * config.frameWidth, 0, animation, frame);
    }

    return spriteCanvas;
  }

  private drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, animation: PetAnimation, frame: number): void {
    ctx.imageSmoothingEnabled = false;

    const offsetX = x + 8;
    const offsetY = y + 4;

    // Animation-specific offsets
    let bobY = 0;
    if (animation === PetAnimation.Walk) {
      bobY = frame % 2 === 0 ? -1 : 0;
    } else if (animation === PetAnimation.Run) {
      // 奔跑时跳动更大
      bobY = frame % 2 === 0 ? -3 : 0;
    } else if (animation === PetAnimation.Idle) {
      bobY = frame === 1 || frame === 3 ? 1 : 0;
    } else if (animation === PetAnimation.Petting || animation === PetAnimation.Happy) {
      // 抚摸和开心时有轻微抖动
      bobY = frame % 2 === 0 ? -2 : 0;
    }

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(offsetX + 8, offsetY + 24, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw tail
    ctx.fillStyle = PET_COLORS.body;
    let tailWag: number;
    if (animation === PetAnimation.Run) {
      // 奔跑时尾巴飘起
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

    // Draw body
    ctx.fillStyle = PET_COLORS.body;
    ctx.fillRect(offsetX + 2, offsetY + 16 + bobY, 12, 8);
    ctx.fillRect(offsetX + 3, offsetY + 14 + bobY, 10, 2);

    // Draw head
    ctx.fillRect(offsetX + 1, offsetY + 4 + bobY, 14, 12);
    ctx.fillRect(offsetX + 2, offsetY + 2 + bobY, 12, 2);

    // Draw ears
    ctx.fillRect(offsetX + 1, offsetY + bobY, 3, 4);
    ctx.fillRect(offsetX + 12, offsetY + bobY, 3, 4);

    // Inner ears
    ctx.fillStyle = PET_COLORS.nose;
    ctx.fillRect(offsetX + 2, offsetY + 1 + bobY, 1, 2);
    ctx.fillRect(offsetX + 13, offsetY + 1 + bobY, 1, 2);

    // Draw face
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(offsetX + 3, offsetY + 8 + bobY, 10, 6);

    // Draw eyes
    ctx.fillStyle = PET_COLORS.eye;
    if (animation === PetAnimation.Sleep) {
      // Closed eyes (lines)
      ctx.fillRect(offsetX + 4, offsetY + 10 + bobY, 3, 1);
      ctx.fillRect(offsetX + 9, offsetY + 10 + bobY, 3, 1);
    } else if (animation === PetAnimation.Idle && frame === 2) {
      // Blinking
      ctx.fillRect(offsetX + 4, offsetY + 10 + bobY, 3, 1);
      ctx.fillRect(offsetX + 9, offsetY + 10 + bobY, 3, 1);
    } else if (animation === PetAnimation.Happy || animation === PetAnimation.Petting) {
      // 开心眼睛 - 弯弯的眼睛 (倒V形)
      ctx.fillRect(offsetX + 4, offsetY + 9 + bobY, 2, 1);
      ctx.fillRect(offsetX + 5, offsetY + 10 + bobY, 1, 1);
      ctx.fillRect(offsetX + 10, offsetY + 9 + bobY, 2, 1);
      ctx.fillRect(offsetX + 9, offsetY + 10 + bobY, 1, 1);
    } else {
      // Open eyes
      ctx.fillRect(offsetX + 4, offsetY + 9 + bobY, 3, 3);
      ctx.fillRect(offsetX + 9, offsetY + 9 + bobY, 3, 3);
      // Eye shine
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(offsetX + 5, offsetY + 9 + bobY, 1, 1);
      ctx.fillRect(offsetX + 10, offsetY + 9 + bobY, 1, 1);
    }

    // Draw nose
    ctx.fillStyle = PET_COLORS.nose;
    ctx.fillRect(offsetX + 7, offsetY + 12 + bobY, 2, 1);

    // Draw cheeks
    if (animation === PetAnimation.Petting || animation === PetAnimation.Happy) {
      // 抚摸时脸颊更红
      ctx.fillStyle = '#FF6B8A';  // 更红的颜色
      ctx.fillRect(offsetX + 1, offsetY + 10 + bobY, 3, 3);
      ctx.fillRect(offsetX + 12, offsetY + 10 + bobY, 3, 3);
    } else {
      ctx.fillStyle = PET_COLORS.cheek;
      ctx.fillRect(offsetX + 2, offsetY + 11 + bobY, 2, 2);
      ctx.fillRect(offsetX + 12, offsetY + 11 + bobY, 2, 2);
    }

    // Draw legs (simple)
    ctx.fillStyle = PET_COLORS.body;
    if (animation === PetAnimation.Run) {
      // 奔跑时腿部动作更大
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

    // Sleep animation: add Z's
    if (animation === PetAnimation.Sleep) {
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('z', offsetX + 16, offsetY + 4 + (frame === 0 ? 0 : 2));
      if (frame === 1) {
        ctx.fillText('Z', offsetX + 18, offsetY + 1);
      }
    }

    // Petting animation: add hearts
    if (animation === PetAnimation.Petting || animation === PetAnimation.Happy) {
      // 爱心在宠物右侧
      ctx.fillStyle = '#FF69B4';
      const heartX = offsetX + 18;
      const heartY = offsetY + 2 + (frame % 2 === 0 ? -1 : 0); // 轻微上下浮动
      // 简单像素爱心 (5x5)
      ctx.fillRect(heartX, heartY, 2, 1);
      ctx.fillRect(heartX + 3, heartY, 2, 1);
      ctx.fillRect(heartX - 1, heartY + 1, 7, 2);
      ctx.fillRect(heartX, heartY + 3, 5, 1);
      ctx.fillRect(heartX + 1, heartY + 4, 3, 1);
      ctx.fillRect(heartX + 2, heartY + 5, 1, 1);
    }
  }

  setAnimation(animation: PetAnimation): void {
    if (this.currentAnimation !== animation) {
      this.currentAnimation = animation;
      this.sprites.get(animation)?.reset();
    }
  }

  setFlipX(flip: boolean): void {
    this.flipX = flip;
  }

  update(timestamp: number): void {
    const deltaTime = this.lastTime ? timestamp - this.lastTime : 0;
    this.lastTime = timestamp;

    const sprite = this.sprites.get(this.currentAnimation);
    if (sprite?.loaded()) {
      sprite.update(deltaTime);
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sprite = this.sprites.get(this.currentAnimation);

    if (sprite?.loaded()) {
      const scale = this.displaySize / this.frameSize;
      const x = (this.canvas.width - this.displaySize) / 2;
      const y = (this.canvas.height - this.displaySize) / 2;

      // 保存当前状态
      this.ctx.save();

      if (this.flipX) {
        // 水平翻转
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);
      }

      sprite.render(this.ctx, this.flipX ? this.canvas.width - x - this.displaySize : x, y, scale);

      // 恢复状态
      this.ctx.restore();
    } else {
      this.drawFallback();
    }
  }

  private drawFallback(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = '#4ecdc4';
    const x = (this.canvas.width - this.displaySize) / 2;
    const y = (this.canvas.height - this.displaySize) / 2;
    this.ctx.fillRect(x, y, this.displaySize, this.displaySize);
  }

  start(): void {
    const loop = (timestamp: number) => {
      this.update(timestamp);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
