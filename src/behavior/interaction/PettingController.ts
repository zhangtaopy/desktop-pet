/**
 * PettingController - 抚摸逻辑
 * 管理抚摸交互的状态和计时
 */

/**
 * 抚摸配置
 */
export interface PettingConfig {
  minDuration: number; // 最小抚摸持续时间
}

export const DEFAULT_PETTING_CONFIG: PettingConfig = {
  minDuration: 500, // 500ms 视为有效抚摸
};

/**
 * 抚摸状态
 */
export enum PettingState {
  None = 'none',
  Petting = 'petting',
}

/**
 * 抚摸事件回调
 */
export interface PettingCallbacks {
  onPetStart?: () => void;
  onPetEnd?: () => void;
}

/**
 * 抚摸控制器
 */
export class PettingController {
  private config: PettingConfig;
  private state: PettingState = PettingState.None;
  private petStartTime: number = 0;
  private callbacks: PettingCallbacks;

  constructor(config: Partial<PettingConfig> = {}, callbacks: PettingCallbacks = {}) {
    this.config = { ...DEFAULT_PETTING_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * 开始抚摸
   */
  startPetting(): void {
    if (this.state !== PettingState.None) return;

    this.state = PettingState.Petting;
    this.petStartTime = Date.now();
    this.callbacks.onPetStart?.();
  }

  /**
   * 停止抚摸
   * @returns 是否产生了有效抚摸（持续时间超过最小值）
   */
  stopPetting(): boolean {
    if (this.state !== PettingState.Petting) {
      return false;
    }

    const duration = Date.now() - this.petStartTime;
    const isValid = duration >= this.config.minDuration;

    this.state = PettingState.None;
    this.callbacks.onPetEnd?.();

    return isValid;
  }

  /**
   * 获取当前状态
   */
  getState(): PettingState {
    return this.state;
  }

  /**
   * 是否正在抚摸中
   */
  isBeingPetted(): boolean {
    return this.state === PettingState.Petting;
  }

  /**
   * 重置到无状态
   */
  reset(): void {
    this.state = PettingState.None;
    this.petStartTime = 0;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PettingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
