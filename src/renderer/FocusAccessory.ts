import { PomodoroPhase } from './PomodoroTimer';

export class FocusAccessory {
  render(
    ctx: CanvasRenderingContext2D,
    phase: PomodoroPhase,
    cx: number,
    cy: number,
    displaySize: number
  ): void {
    if (phase !== 'focus') return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const s = displaySize / 32;
    const hx = cx;
    const hy = cy - 7 * s;

    // thin headband stripe across forehead
    ctx.fillStyle = '#DD3333';
    ctx.fillRect(hx - 6 * s, hy, 12 * s, 1 * s);
    // knot tails on right side
    ctx.fillStyle = '#DD3333';
    ctx.fillRect(hx + 5 * s, hy - 1 * s, 1 * s, 3 * s);
    ctx.fillRect(hx + 4 * s, hy, 1 * s, 1 * s);

    ctx.restore();
  }
}
