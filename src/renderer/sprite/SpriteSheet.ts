/**
 * 精灵图集管理
 * 负责加载和管理精灵图资源
 */

export interface SpriteSheetConfig {
  src?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 精灵图集类
 * 管理精灵图的加载和帧位置计算
 */
export class SpriteSheet {
  private image: HTMLImageElement | HTMLCanvasElement | null = null;
  private config: SpriteSheetConfig;
  private isLoaded: boolean = false;
  private loadError: Error | null = null;

  constructor(config: SpriteSheetConfig) {
    this.config = config;
  }

  /**
   * 从 URL 加载精灵图
   */
  async load(): Promise<void> {
    if (this.config.src) {
      await this.loadFromImage(this.config.src);
    } else {
      throw new Error('No sprite source provided');
    }
  }

  /**
   * 设置已生成的图片
   */
  setImage(image: HTMLCanvasElement): void {
    this.image = image;
    this.isLoaded = true;
    this.loadError = null;
  }

  /**
   * 从图片文件加载
   */
  private async loadFromImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.image = image;
        this.isLoaded = true;
        this.loadError = null;
        resolve();
      };
      image.onerror = () => {
        const error = new Error(`Failed to load sprite: ${src}`);
        this.loadError = error;
        reject(error);
      };
      image.src = src;
    });
  }

  /**
   * 获取指定帧的矩形区域
   */
  getFrameRect(frameIndex: number): FrameRect {
    const { frameWidth, frameHeight } = this.config;
    return {
      x: frameIndex * frameWidth,
      y: 0,
      width: frameWidth,
      height: frameHeight,
    };
  }

  /**
   * 获取总帧数
   */
  getFrameCount(): number {
    return this.config.frameCount;
  }

  /**
   * 获取帧尺寸
   */
  getFrameSize(): { width: number; height: number } {
    return {
      width: this.config.frameWidth,
      height: this.config.frameHeight,
    };
  }

  /**
   * 获取图片
   */
  getImage(): HTMLImageElement | HTMLCanvasElement | null {
    return this.image;
  }

  /**
   * 检查是否已加载
   */
  loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 获取加载错误
   */
  getError(): Error | null {
    return this.loadError;
  }

  /**
   * 重置加载状态
   */
  reset(): void {
    this.isLoaded = false;
    this.loadError = null;
    this.image = null;
  }
}
