import { PomodoroPhase } from './PomodoroTimer';

export class FocusAccessory {
  render(
    ctx: CanvasRenderingContext2D,
    phase: PomodoroPhase,
    remainingMs: number,
    totalMs: number,
    cx: number,
    cy: number,
    displaySize: number
  ): void {
    if (phase === 'idle') return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const s = displaySize / 32;
    const mins = Math.max(0, Math.ceil(remainingMs / 60000));
    const percent = totalMs > 0 ? remainingMs / totalMs : 0;
    const diameter = 13 * s;
    const radius = diameter / 2;
    const centerX = cx;
    const centerY = cy - 20 * s;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // background
    const bgColor = phase === 'focus' ? '#5c1b1b' : '#1b5c2b';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // progress ring
    const ringWidth = 1.5 * s;
    const ringColor = phase === 'focus' ? '#ff4444' : '#44dd44';
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (percent * Math.PI * 2);
    ctx.arc(centerX, centerY, radius - ringWidth / 2, startAngle, endAngle);
    ctx.stroke();

    // number
    const text = String(mins);
    ctx.font = `bold ${7 * s}px "PingFang SC", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, centerX, centerY + 0.5 * s);

    ctx.restore();
  }
}
