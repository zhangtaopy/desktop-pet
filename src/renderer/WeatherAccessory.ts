import { WeatherCondition } from './WeatherService';

export class WeatherAccessory {
  render(
    ctx: CanvasRenderingContext2D,
    condition: WeatherCondition,
    cx: number,
    cy: number,
    displaySize: number
  ): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    switch (condition) {
      case 'sunny':
        this.drawSunglasses(ctx, cx, cy, displaySize);
        break;
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        this.drawUmbrella(ctx, cx, cy, displaySize);
        break;
      case 'snow':
        this.drawScarf(ctx, cx, cy, displaySize);
        break;
      case 'fog':
      case 'mist':
        this.drawMist(ctx, cx, cy, displaySize);
        break;
      case 'partly-cloudy':
        this.drawCloud(ctx, cx, cy, displaySize);
        break;
      case 'cloudy':
      case 'overcast':
        this.drawCloud(ctx, cx, cy, displaySize);
        break;
      default:
        break;
    }

    ctx.restore();
  }

  private drawSunglasses(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, ds: number
  ): void {
    const s = ds / 32;
    ctx.fillStyle = '#222222';
    ctx.fillRect(cx - 7 * s, cy - 1 * s, 5 * s, 2 * s);
    ctx.fillRect(cx + 2 * s, cy - 1 * s, 5 * s, 2 * s);
    ctx.fillRect(cx - 2 * s, cy - 1 * s, 4 * s, 2 * s);
    ctx.fillStyle = '#1a1a2eba';
    ctx.fillRect(cx - 6 * s, cy + 0 * s, 3 * s, 2 * s);
    ctx.fillRect(cx + 3 * s, cy + 0 * s, 3 * s, 2 * s);
  }

  private drawUmbrella(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, ds: number
  ): void {
    const s = ds / 32;
    const ux = cx + 6 * s;
    const uy = cy - 14 * s;
    ctx.fillStyle = '#4488DD';
    ctx.fillRect(ux - 6 * s, uy, 12 * s, 1 * s);
    ctx.fillRect(ux - 5 * s, uy + 1 * s, 10 * s, 1 * s);
    ctx.fillRect(ux - 4 * s, uy + 2 * s, 8 * s, 1 * s);
    ctx.fillRect(ux - 3 * s, uy + 3 * s, 6 * s, 1 * s);
    ctx.fillRect(ux - 2 * s, uy + 4 * s, 4 * s, 1 * s);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(ux - 1 * s, uy + 4 * s, 1 * s, 6 * s);
    ctx.fillRect(ux - 1 * s, uy + 10 * s, 4 * s, 1 * s);
  }

  private drawScarf(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, ds: number
  ): void {
    const s = ds / 32;
    const sy = cy + 5 * s;
    ctx.fillStyle = '#DD3333';
    ctx.fillRect(cx - 6 * s, sy, 12 * s, 2 * s);
    ctx.fillStyle = '#33AA33';
    ctx.fillRect(cx - 6 * s, sy, 12 * s, 1 * s);
    ctx.fillStyle = '#DD3333';
    ctx.fillRect(cx + 4 * s, sy + 2 * s, 2 * s, 5 * s);
    ctx.fillStyle = '#33AA33';
    ctx.fillRect(cx + 4 * s, sy + 4 * s, 2 * s, 1 * s);
  }

  private drawMist(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, ds: number
  ): void {
    const s = ds / 32;
    ctx.fillStyle = 'rgba(200, 200, 220, 0.3)';
    ctx.fillRect(cx - 8 * s, cy - 5 * s, 6 * s, 1 * s);
    ctx.fillRect(cx - 3 * s, cy - 7 * s, 8 * s, 1 * s);
    ctx.fillRect(cx + 2 * s, cy - 4 * s, 6 * s, 1 * s);
  }

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, ds: number
  ): void {
    const s = ds / 32;
    const clx = cx - 9 * s;
    const cly = cy - 16 * s;
    ctx.fillStyle = 'rgba(200, 200, 220, 0.5)';
    ctx.fillRect(clx + 2 * s, cly, 8 * s, 2 * s);
    ctx.fillRect(clx + 1 * s, cly + 1 * s, 10 * s, 1 * s);
    ctx.fillRect(clx + 3 * s, cly - 1 * s, 6 * s, 1 * s);
    ctx.fillRect(clx + 4 * s, cly - 2 * s, 4 * s, 1 * s);
  }
}
