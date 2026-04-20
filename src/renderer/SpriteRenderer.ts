export interface SpriteConfig {
  src?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameDuration: number;
}

export class SpriteRenderer {
  private image: HTMLImageElement | HTMLCanvasElement | null = null;
  private config: SpriteConfig;
  private currentFrame: number = 0;
  private lastFrameTime: number = 0;
  private isLoaded: boolean = false;

  constructor(config: SpriteConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    if (this.config.src) {
      return this.loadFromImage(this.config.src);
    }
    return Promise.reject(new Error('No sprite source provided'));
  }

  private async loadFromImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.image = image;
        this.isLoaded = true;
        resolve();
      };
      image.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
      image.src = src;
    });
  }

  setImage(image: HTMLCanvasElement): void {
    this.image = image;
    this.isLoaded = true;
  }

  update(deltaTime: number): void {
    if (!this.isLoaded) return;
    this.lastFrameTime += deltaTime;

    if (this.lastFrameTime >= this.config.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
      this.lastFrameTime = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1): void {
    if (!this.isLoaded || !this.image) return;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      this.image,
      this.currentFrame * this.config.frameWidth,
      0,
      this.config.frameWidth,
      this.config.frameHeight,
      x,
      y,
      this.config.frameWidth * scale,
      this.config.frameHeight * scale
    );
  }

  loaded(): boolean {
    return this.isLoaded;
  }

  reset(): void {
    this.currentFrame = 0;
    this.lastFrameTime = 0;
  }
}
