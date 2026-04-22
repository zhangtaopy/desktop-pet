/**
 * PettingController - 抚摸逻辑
 * 管理抚摸交互的状态和计时
 */

/**
 * 抚摸配置
 */
export interface PettingConfig {
  minDuration: number; // 最小抚摸持续时间
  happyDuration: number; // 开心状态持续时间
  cooldownDuration: number; // 抚摸后的追逐冷却时间
}

export const DEFAULT_PETTING_CONFIG: PettingConfig = {
  minDuration: 500, // 500ms 视为有效抚摸
  happyDuration: 1000, // 开心1秒
  cooldownDuration: 300000, // 5分钟冷却
};

/**
 * 抚摸状态
 */
export enum PettingState {
  None = 'none',
  Petting = 'petting',
  Happy = 'happy',
  Cooldown = 'cooldown',
}

/**
 * 抚摸事件回调
 */
export interface PettingCallbacks {
  onPetStart?: () => void;
  onPetEnd?: () => void;
  onHappyStart?: () => void;
  onHappyEnd?: () => void;
  onCooldownStart?: () => void;
}

/**
 * 抚摸控制器
 */
export class PettingController {
  private config: PettingConfig;
  private state: PettingState = PettingState.None;
  private petStartTime: number = 0;
  private stateEndTime: number = 0;
  private callbacks: PettingCallbacks;

  constructor(config: Partial<PettingConfig> = {}, callbacks: PettingCallbacks = {}) {
    this.config = { ...DEFAULT_PETTING_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * 开始抚摸
   */
  startPetting(): void {
    if (this.state !== PettingState.None) {
      // 如果已经在抚摸中，重新开始计时
      this.petStartTime = Date.now();
      return;
    }

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

    this.callbacks.onPetEnd?.();

    if (isValid) {
      // 有效抚摸，进入开心状态
      this.enterHappyState();
    } else {
      // 无效抚摸，直接回到无状态
      this.state = PettingState.None;
    }

    return isValid;
  }

  /**
   * 更新状态
   * @returns 如果状态发生变化返回 true
   */
  update(): boolean {
    const now = Date.now();

    if (this.state === PettingState.Petting) {
      // 抚摸状态持续中，不需要自动转换
      return false;
    }

    if (this.state === PettingState.Happy && now >= this.stateEndTime) {
      this.enterCooldownState();
      return true;
    }

    if (this.state === PettingState.Cooldown && now >= this.stateEndTime) {
      this.state = PettingState.None;
      return true;
    }

    return false;
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
   * 是否处于冷却期
   */
  isInCooldown(): boolean {
    return this.state === PettingState.Cooldown;
  }

  /**
   * 获取冷却结束时间
   */
  getCooldownEndTime(): number {
    if (this.state !== PettingState.Cooldown) return 0;
    return this.stateEndTime;
  }

  /**
   * 获取剩余冷却时间
   */
  getRemainingCooldown(): number {
    if (this.state !== PettingState.Cooldown) return 0;
    return Math.max(0, this.stateEndTime - Date.now());
  }

  /**
   * 重置到无状态
   */
  reset(): void {
    this.state = PettingState.None;
    this.petStartTime = 0;
    this.stateEndTime = 0;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PettingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 进入开心状态
   */
  private enterHappyState(): void {
    this.state = PettingState.Happy;
    this.stateEndTime = Date.now() + this.config.happyDuration;
    this.callbacks.onHappyStart?.();
  }

  /**
   * 进入冷却状态
   */
  private enterCooldownState(): void {
    this.callbacks.onHappyEnd?.();
    this.state = PettingState.Cooldown;
    this.stateEndTime = Date.now() + this.config.cooldownDuration;
    this.callbacks.onCooldownStart?.();
  }
}
