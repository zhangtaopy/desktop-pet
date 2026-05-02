import { PomodoroPhase } from './PomodoroTimer';

export class FocusAccessory {
  render(
    ctx: CanvasRenderingContext2D,
    phase: PomodoroPhase,
    remainingMs: number,
    cx: number,
    cy: number,
    displaySize: number
  ): void {
    if (phase === 'idle') return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const s = displaySize / 32;

    if (phase === 'focus') {
      const hx = cx;
      const hy = cy - 7 * s;
      ctx.fillStyle = '#DD3333';
      ctx.fillRect(hx - 6 * s, hy, 12 * s, 1 * s);
      ctx.fillRect(hx + 4 * s, hy, 1 * s, 1 * s);
      ctx.fillRect(hx + 5 * s, hy - 1 * s, 1 * s, 3 * s);
    } else {
      const cupX = cx - 8 * s;
      const cupY = cy - 6 * s;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(cupX, cupY, 4 * s, 3 * s);
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(cupX + 4 * s, cupY + 1 * s, 1 * s, 2 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(cupX + 1 * s, cupY - 1 * s, 1 * s, 1 * s);
      ctx.fillRect(cupX + 2 * s, cupY - 2 * s, 1 * s, 1 * s);
    }

    const mins = Math.max(1, Math.ceil(remainingMs / 60000));
    const label = phase === 'focus' ? '专注' : phase === 'shortBreak' ? '休息' : '长休';
    const text = `${label} ${mins}分`;

    ctx.font = 'bold 8px "PingFang SC", sans-serif';
    const tw = ctx.measureText(text).width;
    const tx = cx - tw / 2 - 3;
    const ty = 1;
    const th = 10;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(tx, ty, tw + 6, th);
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, tx + 3, ty + 1);

    ctx.restore();
  }
}
