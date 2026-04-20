import { PetAnimation } from './PetRenderer';

export enum PetState {
  Idle = 'idle',
  Walking = 'walking',
  Sleeping = 'sleeping',
  Petting = 'petting',  // 被抚摸
  Happy = 'happy',      // 开心状态
  ChasingMouse = 'chasing',  // 追逐鼠标
}

export interface BehaviorConfig {
  idleMinTime: number;      // 站立最短时间
  idleMaxTime: number;      // 站立最长时间
  walkMinTime: number;      // 行走最短时间
  walkMaxTime: number;      // 行走最长时间
  sleepChance: number;      // 睡觉概率 (0-1)
  sleepMinTime: number;     // 睡觉最短时间
  sleepMaxTime: number;     // 睡觉最长时间
  walkSpeed: number;        // 行走速度 (像素/帧)
  chaseChance: number;      // 追逐鼠标概率 (0-1)
  chaseCooldown: number;    // 追逐后冷却时间（被抚摸后多久才会再次追逐）
}

const DEFAULT_CONFIG: BehaviorConfig = {
  idleMinTime: 3000,    // 3秒
  idleMaxTime: 8000,    // 8秒
  walkMinTime: 2000,    // 2秒
  walkMaxTime: 6000,    // 6秒
  sleepChance: 0.2,     // 20% 概率睡觉
  sleepMinTime: 5000,   // 5秒
  sleepMaxTime: 15000,  // 15秒
  walkSpeed: 1,         // 每帧1像素
  chaseChance: 0.08,    // 8% 概率追逐鼠标
  chaseCooldown: 300000, // 抚摸后5分钟内不会追逐 (300000ms = 5分钟)
};

export type PositionCallback = (x: number, y: number) => void;
export type AnimationCallback = (animation: PetAnimation) => void;

export class PetBehavior {
  private config: BehaviorConfig;
  private state: PetState = PetState.Idle;
  private currentAnimation: PetAnimation = PetAnimation.Idle;
  private actionEndTime: number = 0;
  private walkDirectionX: number = 1; // 1 = 右, -1 = 左
  private walkDirectionY: number = 0; // 1 = 下, -1 = 上, 0 = 不动
  private lastTimestamp: number = 0;

  private _onPositionChange?: PositionCallback;
  private _onAnimationChange?: AnimationCallback;

  // 屏幕边界
  private minX: number = 0;
  private maxX: number = 1920;
  private minY: number = 0;
  private maxY: number = 1080;
  private windowWidth: number = 128;
  private windowHeight: number = 128;

  // 当前位置
  private posX: number = 100;
  private posY: number = 100;

  // 目标位置（鼠标位置）
  private targetX: number | null = null;
  private targetY: number | null = null;
  private lastTargetTime: number = 0;

  // 追逐冷却
  private lastPetTime: number = 0;  // 上次被抚摸的时间

  // 屏幕缩放因子（用于将逻辑坐标转换为物理坐标）
  private scaleFactor: number = 1;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scheduleNextAction();
  }

  setScaleFactor(factor: number): void {
    this.scaleFactor = factor;
    console.log('[PetBehavior] Scale factor set to:', factor);
  }

  setPosition(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
  }

  setScreenBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    console.log('[PetBehavior] Screen bounds set:', { minX, maxX, minY, maxY });
  }

  setWindowSize(width: number, height: number): void {
    this.windowWidth = width;
    this.windowHeight = height;
    console.log('[PetBehavior] Window size set:', { width, height });
  }

  onPositionChange(callback: PositionCallback): void {
    this._onPositionChange = callback;
  }

  onAnimationChange(callback: AnimationCallback): void {
    this._onAnimationChange = callback;
  }

  getState(): PetState {
    return this.state;
  }

  getCurrentAnimation(): PetAnimation {
    return this.currentAnimation;
  }

  getWalkDirection(): number {
    return this.walkDirectionX;
  }

  // 设置目标位置（鼠标位置）
  setTarget(x: number, y: number): void {
    // 乘以缩放因子，因为鼠标位置可能是逻辑坐标
    // 而窗口位置使用的是物理坐标
    this.targetX = x * this.scaleFactor;
    this.targetY = y * this.scaleFactor;
    this.lastTargetTime = Date.now();
  }

  // 清除目标
  clearTarget(): void {
    this.targetX = null;
    this.targetY = null;
    this.lastTargetTime = 0;
  }

  // 外部事件：开始抚摸
  startPetting(): void {
    // 记录抚摸时间，用于冷却追逐
    this.lastPetTime = Date.now();
    // 清除追逐目标
    this.targetX = null;
    this.targetY = null;

    if (this.state === PetState.Sleeping) {
      // 被叫醒，变得开心
      this.state = PetState.Petting;
      this.setAnimation(PetAnimation.Petting);
      this.actionEndTime = Date.now() + 1500;
    } else {
      this.state = PetState.Petting;
      this.setAnimation(PetAnimation.Petting);
      this.actionEndTime = Date.now() + 1500;
    }
  }

  // 外部事件：停止抚摸（鼠标释放）
  stopPetting(): void {
    if (this.state === PetState.Petting) {
      this.startIdle();
    }
  }

  // 测试用：强制进入行走状态
  forceWalk(): void {
    this.startWalking();
  }

  // 测试用：强制进入站立状态
  forceIdle(): void {
    this.startIdle();
  }

  // 测试用：强制进入睡眠状态
  forceSleep(): void {
    this.startSleeping();
  }

  update(timestamp: number): void {
    const now = Date.now();

    // 检查是否需要切换状态
    if (now >= this.actionEndTime) {
      this.decideNextAction();
    }

    // 如果在行走或追逐，更新位置
    if (this.state === PetState.Walking || this.state === PetState.ChasingMouse) {
      this.updateWalking(timestamp);
    } else {
      // 非行走状态时重置时间戳，避免下次行走时瞬移
      this.lastTimestamp = 0;
    }
  }

  private updateWalking(timestamp: number): void {
    const deltaTime = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 16.67 : 1;
    this.lastTimestamp = timestamp;

    // 追逐状态速度更快
    const speed = this.state === PetState.ChasingMouse
      ? this.config.walkSpeed * deltaTime * 2.5  // 追逐时速度是行走的2.5倍
      : this.config.walkSpeed * deltaTime;

    // 追逐鼠标状态：朝鼠标绝对位置移动
    if (this.state === PetState.ChasingMouse) {
      if (this.targetX !== null && this.targetY !== null) {
        // 目标位置：让宠物中心对准鼠标
        let targetPosX = this.targetX - this.windowWidth / 2;
        let targetPosY = this.targetY - this.windowHeight / 2;

        console.log('[PetBehavior] Chase debug:', {
          mousePos: { x: this.targetX, y: this.targetY },
          windowSize: { w: this.windowWidth, h: this.windowHeight },
          targetPosBefore: { x: Math.round(targetPosX), y: Math.round(targetPosY) },
          screenBounds: { minX: this.minX, maxX: this.maxX, minY: this.minY, maxY: this.maxY }
        });

        // 限制目标位置在边界内
        targetPosX = Math.max(this.minX, Math.min(this.maxX - this.windowWidth, targetPosX));
        targetPosY = Math.max(this.minY, Math.min(this.maxY - this.windowHeight, targetPosY));

        console.log('[PetBehavior] Target pos after clamp:', { x: Math.round(targetPosX), y: Math.round(targetPosY) });

        const deltaX = targetPosX - this.posX;
        const deltaY = targetPosY - this.posY;
        const distance = Math.hypot(deltaX, deltaY);

        console.log('delta:', { x: Math.round(deltaX), y: Math.round(deltaY) }, 'distance:', Math.round(distance));

        if (distance <= Math.max(speed, 2)) {
          this.posX = targetPosX;
          this.posY = targetPosY;
          this.startIdle();
        } else {
          const moveX = (deltaX / distance) * speed;
          const moveY = (deltaY / distance) * speed;

          this.walkDirectionX = moveX >= 0 ? 1 : -1;
          this.walkDirectionY = Math.abs(moveY) > 0.1 ? (moveY > 0 ? 1 : -1) : 0;

          this.posX += moveX;
          this.posY += moveY;
        }
      } else if (Date.now() - this.lastTargetTime > 500) {
        this.startIdle();
      }
    } else {
      // 普通随机移动
      this.posX += this.walkDirectionX * speed;
      this.posY += this.walkDirectionY * speed * 0.5;
    }

    // X边界检测
    if (this.posX <= this.minX) {
      this.posX = this.minX;
      this.walkDirectionX = 1;
    } else if (this.posX >= this.maxX - this.windowWidth) {
      this.posX = this.maxX - this.windowWidth;
      this.walkDirectionX = -1;
    }

    // Y边界检测
    if (this.posY <= this.minY) {
      this.posY = this.minY;
      this.walkDirectionY = 1;
    } else if (this.posY >= this.maxY - this.windowHeight) {
      this.posY = this.maxY - this.windowHeight;
      this.walkDirectionY = -1;
    }

    // 通知位置变化（转换为整数）
    this._onPositionChange?.(Math.round(this.posX), Math.round(this.posY));
  }

  private decideNextAction(): void {
    const random = Math.random();
    const now = Date.now();

    if (this.state === PetState.Idle) {
      // 检查是否在冷却期内
      const inCooldown = (now - this.lastPetTime) < this.config.chaseCooldown;

      // 从空闲状态决定下一个动作
      if (!inCooldown && random < this.config.chaseChance) {
        // 追逐鼠标
        this.startChasing();
      } else if (random < this.config.sleepChance) {
        this.startSleeping();
      } else {
        this.startWalking();
      }
    } else if (this.state === PetState.Walking) {
      // 行走后可能空闲或睡觉
      if (random < this.config.sleepChance * 0.5) {
        this.startSleeping();
      } else {
        this.startIdle();
      }
    } else if (this.state === PetState.Sleeping) {
      // 睡醒后空闲
      this.startIdle();
    } else if (this.state === PetState.Petting) {
      // 抚摸结束后进入开心状态
      this.startHappy();
    } else if (this.state === PetState.Happy) {
      // 开心结束后空闲
      this.startIdle();
    } else if (this.state === PetState.ChasingMouse) {
      // 追逐结束后空闲（到达鼠标位置）
      this.startIdle();
    }
  }

  private startIdle(): void {
    this.clearTarget();
    this.state = PetState.Idle;
    this.setAnimation(PetAnimation.Idle);
    const duration = this.randomBetween(this.config.idleMinTime, this.config.idleMaxTime);
    this.actionEndTime = Date.now() + duration;
  }

  private startWalking(): void {
    this.state = PetState.Walking;
    this.setAnimation(PetAnimation.Walk);
    this.lastTimestamp = 0;  // 重置时间戳，避免瞬移

    // 随机X方向
    this.walkDirectionX = Math.random() > 0.5 ? 1 : -1;

    // 随机Y方向 (有概率不移动，有概率上下)
    const yRand = Math.random();
    if (yRand < 0.4) {
      this.walkDirectionY = 0;  // 40% 概率不纵向移动
    } else if (yRand < 0.7) {
      this.walkDirectionY = -1; // 30% 概率向上
    } else {
      this.walkDirectionY = 1;  // 30% 概率向下
    }

    const duration = this.randomBetween(this.config.walkMinTime, this.config.walkMaxTime);
    this.actionEndTime = Date.now() + duration;
  }

  private startChasing(): void {
    this.state = PetState.ChasingMouse;
    this.setAnimation(PetAnimation.Run);
    this.lastTimestamp = 0;
    // 追逐没有时间限制，直到到达鼠标位置
    this.actionEndTime = Date.now() + 999999999; // 设置一个很大的值
  }

  // 测试用：强制进入追逐状态
  forceChase(): void {
    this.startChasing();
  }

  private startSleeping(): void {
    this.state = PetState.Sleeping;
    this.setAnimation(PetAnimation.Sleep);
    const duration = this.randomBetween(this.config.sleepMinTime, this.config.sleepMaxTime);
    this.actionEndTime = Date.now() + duration;
  }

  private startHappy(): void {
    this.state = PetState.Happy;
    this.setAnimation(PetAnimation.Happy);
    const duration = 1000; // 开心1秒
    this.actionEndTime = Date.now() + duration;
  }

  private setAnimation(animation: PetAnimation): void {
    this.currentAnimation = animation;
    this._onAnimationChange?.(animation);
  }

  private scheduleNextAction(): void {
    this.actionEndTime = Date.now() + this.randomBetween(
      this.config.idleMinTime,
      this.config.idleMaxTime
    );
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
