/**
 * 宠物外观配置
 * 定义宠物的颜色、尺寸等外观属性
 */

/**
 * 像素颜色配置
 */
export interface PixelColor {
  body: string;
  eye: string;
  nose: string;
  cheek: string;
}

/**
 * 默认宠物颜色
 */
export const DEFAULT_PET_COLORS: PixelColor = {
  body: '#FFB6C1',     // Light pink
  eye: '#333333',      // Dark gray
  nose: '#FF69B4',     // Hot pink
  cheek: '#FFB6C180',  // Semi-transparent pink
};

/**
 * 宠物外观配置
 */
export interface PetAppearanceConfig {
  /** 像素颜色 */
  colors?: PixelColor;
  /** 显示尺寸 */
  displaySize?: number;
  /** 帧尺寸 */
  frameSize?: number;
}

/**
 * 宠物外观管理
 * 负责管理宠物的颜色、尺寸等外观属性
 */
export class PetAppearance {
  private colors: PixelColor;
  private displaySize: number;
  private frameSize: number;

  constructor(config: PetAppearanceConfig = {}) {
    this.colors = config.colors ?? DEFAULT_PET_COLORS;
    this.displaySize = config.displaySize ?? 64;
    this.frameSize = config.frameSize ?? 32;
  }

  /**
   * 获取颜色配置
   */
  getColors(): PixelColor {
    return { ...this.colors };
  }

  /**
   * 设置颜色配置
   */
  setColors(colors: Partial<PixelColor>): void {
    this.colors = { ...this.colors, ...colors };
  }

  /**
   * 获取显示尺寸
   */
  getDisplaySize(): number {
    return this.displaySize;
  }

  /**
   * 设置显示尺寸
   */
  setDisplaySize(size: number): void {
    this.displaySize = size;
  }

  /**
   * 获取帧尺寸
   */
  getFrameSize(): number {
    return this.frameSize;
  }

  /**
   * 获取缩放比例
   */
  getScale(): number {
    return this.displaySize / this.frameSize;
  }

  /**
   * 应用颜色到绘制上下文
   */
  applyBodyColor(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.colors.body;
  }

  /**
   * 应用眼睛颜色
   */
  applyEyeColor(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.colors.eye;
  }

  /**
   * 应用鼻子颜色
   */
  applyNoseColor(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.colors.nose;
  }

  /**
   * 应用脸颊颜色
   */
  applyCheekColor(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.colors.cheek;
  }
}
