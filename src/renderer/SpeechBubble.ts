import { DialogueEntry } from './DialogueManager';

const BUBBLE_PADDING_X = 8;
const BUBBLE_PADDING_Y = 6;
const BUBBLE_TAIL_H = 6;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;
const CHAR_WIDTH = 7;
const MAX_CHARS_PER_LINE = 14;
const CORNER_RADIUS = 4;

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
    this.lines = this.wrapText(dialogue.text);
    this.calcBubbleSize();
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

  render(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    if (!this.visible || this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.imageSmoothingEnabled = false;

    const bx = Math.max(2, Math.floor((canvasWidth - this.bubbleWidth) / 2));
    const by = 2;

    // bubble shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    this.drawRoundedRect(ctx, bx + 1, by + 1, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);

    // bubble body
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, bx, by, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);
    ctx.fill();

    // bubble border
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, bx, by, this.bubbleWidth, this.bubbleHeight, CORNER_RADIUS);
    ctx.stroke();

    // tail
    const tailCenterX = bx + this.bubbleWidth / 2;
    const tailY = by + this.bubbleHeight;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailCenterX - 4, tailY);
    ctx.lineTo(tailCenterX, tailY + BUBBLE_TAIL_H);
    ctx.lineTo(tailCenterX + 4, tailY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // cover tail seam
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(tailCenterX - 4, tailY - 1, 8, 2);

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

  private wrapText(text: string): string[] {
    const lines: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHARS_PER_LINE) {
        lines.push(remaining);
        break;
      }

      let cutIndex = MAX_CHARS_PER_LINE;
      for (let i = MAX_CHARS_PER_LINE - 1; i >= MAX_CHARS_PER_LINE - 3; i--) {
        if (i > 0 && /[\s。，,、?!！？～~]/.test(remaining[i])) {
          cutIndex = i + 1;
          break;
        }
      }

      lines.push(remaining.substring(0, cutIndex).trim());
      remaining = remaining.substring(cutIndex).trim();
    }

    return lines;
  }

  private calcBubbleSize(): void {
    const maxLineLen = Math.max(...this.lines.map(l => l.length), 1);
    this.bubbleWidth = Math.min(
      maxLineLen * CHAR_WIDTH + BUBBLE_PADDING_X * 2 + 4,
      122
    );
    this.bubbleHeight = this.lines.length * LINE_HEIGHT + BUBBLE_PADDING_Y * 2;
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
