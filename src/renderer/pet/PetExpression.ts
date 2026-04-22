/**
 * 宠物表情系统
 * 管理眨眼、开心、睡眠等表情状态
 */

import { PetAnimation } from '../../core/EventBus';

/**
 * 表情状态
 */
export interface ExpressionState {
  /** 眼睛状态 */
  eyes: 'open' | 'closed' | 'happy' | 'sleepy';
  /** 是否显示脸颊红晕 */
  showBlush: boolean;
  /** 是否显示爱心 */
  showHearts: boolean;
  /** 是否显示睡眠气泡 */
  showSleepBubble: boolean;
}

/**
 * 宠物表情控制器
 * 根据动画类型和帧数计算表情状态
 */
export class PetExpression {
  /**
   * 计算当前帧的表情状态
   * @param animation 当前动画类型
   * @param frame 当前帧索引
   */
  getExpression(animation: PetAnimation, frame: number): ExpressionState {
    const state: ExpressionState = {
      eyes: 'open',
      showBlush: false,
      showHearts: false,
      showSleepBubble: false,
    };

    switch (animation) {
      case PetAnimation.Sleep:
        state.eyes = 'closed';
        state.showSleepBubble = true;
        break;

      case PetAnimation.Idle:
        // Idle 动画第 2 帧眨眼
        if (frame === 2) {
          state.eyes = 'closed';
        }
        break;

      case PetAnimation.Happy:
      case PetAnimation.Petting:
        state.eyes = 'happy';
        state.showBlush = true;
        state.showHearts = true;
        break;

      default:
        break;
    }

    return state;
  }

  /**
   * 绘制眼睛
   */
  drawEyes(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: ExpressionState
  ): void {
    ctx.fillStyle = '#333333';

    const leftEyeX = x + 4;
    const rightEyeX = x + 9;
    const eyeY = y + 9;

    switch (state.eyes) {
      case 'closed':
        // 闭眼 - 横线
        ctx.fillRect(leftEyeX, eyeY + 1, 3, 1);
        ctx.fillRect(rightEyeX, eyeY + 1, 3, 1);
        break;

      case 'happy':
        // 开心眼睛 - 弯弯的（倒 V 形）
        ctx.fillRect(leftEyeX, eyeY, 2, 1);
        ctx.fillRect(leftEyeX + 1, eyeY + 1, 1, 1);
        ctx.fillRect(rightEyeX + 1, eyeY, 2, 1);
        ctx.fillRect(rightEyeX, eyeY + 1, 1, 1);
        break;

      case 'open':
      default:
        // 睁眼
        ctx.fillRect(leftEyeX, eyeY, 3, 3);
        ctx.fillRect(rightEyeX, eyeY, 3, 3);
        // 眼睛高光
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(leftEyeX + 1, eyeY, 1, 1);
        ctx.fillRect(rightEyeX + 1, eyeY, 1, 1);
        break;
    }
  }

  /**
   * 绘制脸颊红晕
   */
  drawBlush(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    intense: boolean = false
  ): void {
    ctx.fillStyle = intense ? '#FF6B8A' : '#FFB6C180';
    if (intense) {
      ctx.fillRect(x + 1, y + 10, 3, 3);
      ctx.fillRect(x + 12, y + 10, 3, 3);
    } else {
      ctx.fillRect(x + 2, y + 11, 2, 2);
      ctx.fillRect(x + 12, y + 11, 2, 2);
    }
  }

  /**
   * 绘制爱心
   */
  drawHearts(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ): void {
    ctx.fillStyle = '#FF69B4';
    const heartX = x + 18;
    const heartY = y + 2 + (frame % 2 === 0 ? -1 : 0);
    // 简单像素爱心 (5x5)
    ctx.fillRect(heartX, heartY, 2, 1);
    ctx.fillRect(heartX + 3, heartY, 2, 1);
    ctx.fillRect(heartX - 1, heartY + 1, 7, 2);
    ctx.fillRect(heartX, heartY + 3, 5, 1);
    ctx.fillRect(heartX + 1, heartY + 4, 3, 1);
    ctx.fillRect(heartX + 2, heartY + 5, 1, 1);
  }

  /**
   * 绘制睡眠气泡 (Zzz)
   */
  drawSleepBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ): void {
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 6px sans-serif';
    ctx.fillText('z', x + 16, y + 4 + (frame === 0 ? 0 : 2));
    if (frame === 1) {
      ctx.fillText('Z', x + 18, y + 1);
    }
  }
}
