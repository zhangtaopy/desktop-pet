import { DialogueEntry } from './DialogueManager';

const BUBBLE_PADDING_X = 8;
const BUBBLE_PADDING_Y = 6;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;
const CORNER_RADIUS = 4;
const CANVAS_WIDTH = 128;

export class SpeechBubble {
  private visible: boolean = false;
  private opacity: number = 0;
  private fadePhase: 'in' | 'show' | 'out' | 'done' = 'done';
  private fadeTimer: number = 0;
  private fadeInDuration: number = 200;
  private fadeOutDuration: number = 200;
  private totalDuration: number = 3000;
  private bubbleWidth: number = 0;
  private bubbleHeight: number = 0;
  private lines: string[] = [];

  show(dialogue: DialogueEntry): void {
    this.totalDuration = dialogue.duration;
    this.visible = true;
    this.opacity = 0;
    this.fadePhase = 'in';
    this.fadeTimer = 0;
    this.prepareText(dialogue.text);
  }

  hide(): void {
    if (this.fadePhase === 'in' || this.fadePhase === 'show') {
      this.fadePhase = 'out';
      this.fadeTimer = 0;
    }
  }

  update(deltaTime: number): void {
    if (!this.visible || this.fadePhase === 'done') return;

    this.fadeTimer += deltaTime;

    switch (this.fadePhase) {
      case 'in':
        this.opacity = Math.min(1, this.fadeTimer / this.fadeInDuration);
        if (this.opacity >= 1) {
          this.opacity = 1;
          this.fadePhase = 'show';
          this.fadeTimer = 0;
        }
        break;

      case 'show':
        if (this.fadeTimer >= this.totalDuration) {
          this.fadePhase = 'out';
          this.fadeTimer = 0;
        }
        break;

      case 'out':
        this.opacity = Math.max(0, 1 - this.fadeTimer / this.fadeOutDuration);
        if (this.opacity <= 0) {
          this.opacity = 0;
          this.fadePhase = 'done';
          this.visible = false;
        }
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.imageSmoothingEnabled = false;

    const bx = Math.max(2, Math.floor((CANVAS_WIDTH - this.bubbleWidth) / 2));
    const by = 2;

    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
    ctx.clip();

    // shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    this.drawRoundedRect(ctx, bx + 1, by + 1, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);

    // body
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, bx, by, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);
    ctx.fill();

    // border
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, bx, by, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);
    ctx.stroke();

    // text
    ctx.fillStyle = '#222222';
    ctx.font = `bold ${FONT_SIZE}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    for (let i = 0; i < this.lines.length; i++) {
      const tx = bx + BUBBLE_PADDING_X;
      const ty = by + BUBBLE_PADDING_Y + i * LINE_HEIGHT;
      ctx.fillText(this.lines[i], tx, ty);
    }

    ctx.restore();
  }

  isVisible(): boolean {
    return this.visible && this.fadePhase !== 'done';
  }

  private prepareText(text: string): void {
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d')!;
    mctx.font = `bold ${FONT_SIZE}px "PingFang SC", "Microsoft YaHei", sans-serif`;

    const maxWidth = CANVAS_WIDTH - BUBBLE_PADDING_X * 2 - 4;

    const lines: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (mctx.measureText(remaining).width <= maxWidth) {
        lines.push(remaining);
        break;
      }

      let lo = 1;
      let hi = remaining.length;

      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (mctx.measureText(remaining.substring(0, mid)).width <= maxWidth) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }

      lines.push(remaining.substring(0, lo).trim());
      remaining = remaining.substring(lo).trim();
    }

    this.lines = lines;

    let maxLineW = 0;
    for (const line of lines) {
      maxLineW = Math.max(maxLineW, mctx.measureText(line).width);
    }

    this.bubbleWidth = Math.min(
      Math.ceil(maxLineW + BUBBLE_PADDING_X * 2 + 4),
      CANVAS_WIDTH - 4
    );
    this.bubbleHeight = lines.length * LINE_HEIGHT + BUBBLE_PADDING_Y * 2;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
