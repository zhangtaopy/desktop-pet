/**
 * PetBehavior - 协调者模式
 * 负责协调状态机、移动控制、交互处理和动画调度
 *
 * 这是重构后的 PetBehavior，职责已拆分到各个子模块：
 * - PetStateMachine: 状态管理
 * - MovementController: 移动控制
 * - InteractionHandler: 交互处理
 * - AnimationScheduler: 动画调度
 */

import { Position, PetState, PetAnimation, eventBus } from '../core/EventBus';
import { PetStateMachine } from './core/PetStateMachine';
import { MovementController } from './movement/MovementController';
import { InteractionHandler } from './interaction/InteractionHandler';
import { AnimationScheduler } from './animation/AnimationScheduler';

/**
 * 行为配置（保持与原版兼容）
 */
export interface BehaviorConfig {
  idleMinTime: number;
  idleMaxTime: number;
  walkMinTime: number;
  walkMaxTime: number;
  sleepChance: number;
  sleepMinTime: number;
  sleepMaxTime: number;
  walkSpeed: number;
  chaseChance: number;
  chaseCooldown: number;
}

/**
 * 默认行为配置
 */
const DEFAULT_BEHAVIOR_CONFIG: BehaviorConfig = {
  idleMinTime: 3000,
  idleMaxTime: 8000,
  walkMinTime: 2000,
  walkMaxTime: 6000,
  sleepChance: 0.2,
  sleepMinTime: 5000,
  sleepMaxTime: 15000,
  walkSpeed: 1,
  chaseChance: 0.08,
  chaseCooldown: 300000,
};

/**
 * 位置变更回调
 */
export type PositionCallback = (x: number, y: number) => void;

/**
 * 动画变更回调
 */
export type AnimationCallback = (animation: PetAnimation) => void;

/**
 * PetBehavior 协调者类
 * 职责：协调各个子模块，不直接实现具体逻辑
 */
export class PetBehavior {
  // 子模块
  private stateMachine: PetStateMachine;
  private movement: MovementController;
  private interaction: InteractionHandler;
  private animation: AnimationScheduler;

  // 配置
  private config: BehaviorConfig;

  // 回调
  private positionCallback?: PositionCallback;
  private animationCallback?: AnimationCallback;

  // 状态同步
  private isDragging: boolean = false;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = { ...DEFAULT_BEHAVIOR_CONFIG, ...config };

    // 初始化状态机
    this.stateMachine = new PetStateMachine({
      idleMinTime: this.config.idleMinTime,
      idleMaxTime: this.config.idleMaxTime,
      walkMinTime: this.config.walkMinTime,
      walkMaxTime: this.config.walkMaxTime,
      sleepChance: this.config.sleepChance,
      sleepMinTime: this.config.sleepMinTime,
      sleepMaxTime: this.config.sleepMaxTime,
      chaseChance: this.config.chaseChance,
      chaseCooldown: this.config.chaseCooldown,
      walkSpeed: this.config.walkSpeed,
    });

    // 初始化移动控制器
    this.movement = new MovementController(
      { x: 100, y: 100 },
      {
        walkSpeed: this.config.walkSpeed,
        chaseSpeedMultiplier: 2.5,
        scaleFactor: 1,
      }
    );

    // 初始化交互处理器
    this.interaction = new InteractionHandler(
      {
        petting: {
          minDuration: 500,
        },
        chasing: {
          triggerDistance: 150,
          triggerChance: this.config.chaseChance,
          loseInterestTime: 500,
          minCooldownAfterPet: this.config.chaseCooldown,
          targetOffsetX: 64,
          targetOffsetY: 64,
        },
      },
      {
        onChaseStarted: () => this.handleChaseStart(),
        onChaseEnded: () => this.handleChaseEnd(),
      }
    );

    // 初始化动画调度器
    this.animation = new AnimationScheduler({}, {
      onAnimationStart: (anim) => this.handleAnimationChange(anim),
      onDirectionChange: (flipX) => this.handleDirectionChange(flipX),
    });

    // 设置状态机回调
    this.stateMachine.onTransition((from, to) => this.handleStateTransition(from, to));

    // 设置移动回调
    this.movement.onPositionChange((pos, dir) => this.handleMovementUpdate(pos, dir));

    // 初始化动画（触发初始状态的动画）
    this.animation.onStateChange(PetState.Idle, PetState.Idle);
  }

  // ==================== 公共 API ====================

  /**
   * 设置屏幕边界
   */
  setScreenBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.movement.setScreenBounds({ minX, maxX, minY, maxY });
  }

  /**
   * 设置窗口尺寸
   */
  setWindowSize(width: number, height: number): void {
    this.movement.setWindowSize(width, height);
  }

  /**
   * 设置缩放因子
   */
  setScaleFactor(factor: number): void {
    this.movement.setScaleFactor(factor);
    this.interaction.setScaleFactor(factor);
  }

  /**
   * 设置当前位置
   */
  setPosition(x: number, y: number): void {
    this.movement.setPosition({ x, y });
    this.interaction.setPetPosition({ x, y });
  }

  /**
   * 注册位置变更回调
   */
  onPositionChange(callback: PositionCallback): void {
    this.positionCallback = callback;
  }

  /**
   * 注册动画变更回调
   */
  onAnimationChange(callback: AnimationCallback): void {
    this.animationCallback = callback;
  }

  /**
   * 获取当前状态
   */
  getState(): PetState {
    return this.stateMachine.getState();
  }

  /**
   * 获取当前动画
   */
  getCurrentAnimation(): PetAnimation {
    return this.animation.getCurrentAnimation();
  }

  /**
   * 获取行走方向
   */
  getWalkDirection(): number {
    return this.animation.getCurrentDirection();
  }

  /**
   * 设置鼠标目标位置
   */
  setTarget(x: number, y: number): void {
    this.interaction.updateMousePosition({ x, y });
  }

  /**
   * 清除目标
   */
  clearTarget(): void {
    this.interaction.getChasingController().clearMouseTarget();
  }

  /**
   * 开始抚摸
   */
  startPetting(): void {
    this.interaction.startPetting();
    this.stateMachine.setIsBeingPetted(true);

    if (this.stateMachine.getState() === PetState.Sleeping) {
      // 被叫醒
      this.stateMachine.forceState(PetState.Petting);
    } else {
      this.stateMachine.forceState(PetState.Petting);
    }
  }

  /**
   * 停止抚摸
   */
  stopPetting(): void {
    this.interaction.stopPetting();
    this.stateMachine.setIsBeingPetted(false);

    if (this.stateMachine.getState() === PetState.Petting) {
      this.stateMachine.forceState(PetState.Happy);
    }
  }

  /**
   * 设置拖拽状态
   */
  setDragging(isDragging: boolean): void {
    this.isDragging = isDragging;
    if (isDragging) {
      this.movement.stopMoving();
    }
  }

  /**
   * 更新行为（主循环调用）
   */
  update(timestamp: number): void {
    if (this.isDragging) {
      return;
    }

    // 更新交互状态
    const interactionState = this.interaction.update();

    // 同步鼠标目标给状态机（用于自动触发追逐）
    const chasingController = this.interaction.getChasingController();
    const target = chasingController.getTargetPosition();
    const distance = chasingController.getDistanceToTarget();
    this.stateMachine.setHasMouseTarget(!!target, distance);

    // 同步冷却状态给状态机（冷却期内不触发追逐）
    this.stateMachine.setInChaseCooldown(this.interaction.isInCooldown());

    // 更新状态机
    this.stateMachine.update();

    // 更新追逐目标
    if (interactionState.isChasing && interactionState.chaseTarget) {
      this.movement.startChasing(interactionState.chaseTarget);
    }

    // 更新移动
    if (this.stateMachine.getState() === PetState.Walking ||
        this.stateMachine.getState() === PetState.ChasingMouse) {
      this.movement.update(timestamp);
    }

    // 更新动画
    this.animation.update();
  }

  // ==================== 测试用 API ====================

  /**
   * 强制进入行走状态（测试用）
   */
  forceWalk(): void {
    this.stateMachine.forceState(PetState.Walking);
    this.movement.startWalking();
  }

  /**
   * 强制进入空闲状态（测试用）
   */
  forceIdle(): void {
    this.stateMachine.forceState(PetState.Idle);
    this.movement.stopMoving();
  }

  /**
   * 强制进入睡眠状态（测试用）
   */
  forceSleep(): void {
    this.stateMachine.forceState(PetState.Sleeping);
    this.movement.stopMoving();
  }

  /**
   * 强制进入追逐状态（测试用）
   */
  forceChase(): boolean {
    const success = this.interaction.forceChase();
    if (success) {
      this.stateMachine.forceState(PetState.ChasingMouse);
    }
    return success;
  }

  // ==================== 私有方法 ====================

  /**
   * 处理状态转换
   */
  private handleStateTransition(from: PetState, to: PetState): void {
    console.log(`[PetBehavior] State transition: ${from} -> ${to}`);

    // 通知动画调度器
    this.animation.onStateChange(from, to);

    // 根据新状态启动/停止移动
    switch (to) {
      case PetState.Walking:
        this.movement.startWalking();
        break;

      case PetState.ChasingMouse:
        // 确保追逐控制器开始工作
        if (!this.interaction.getChasingController().isChasing()) {
          this.interaction.startChasing();
        }
        break;

      case PetState.Idle:
      case PetState.Sleeping:
      case PetState.Happy:
      case PetState.Petting:
        this.movement.stopMoving();
        break;
    }

    // 发送事件
    eventBus.emit('pet:stateChanged', { from, to });
  }

  /**
   * 处理追逐开始
   */
  private handleChaseStart(): void {
    console.log('[PetBehavior] Chase started');
    const target = this.interaction.getChasingController().getTargetPosition();
    if (target) {
      this.movement.startChasing(target);
    }
    this.stateMachine.forceState(PetState.ChasingMouse);
  }

  /**
   * 处理追逐结束
   */
  private handleChaseEnd(): void {
    console.log('[PetBehavior] Chase ended');
    this.movement.stopMoving();
    this.stateMachine.forceState(PetState.Idle);
  }

  /**
   * 处理动画变更
   */
  private handleAnimationChange(animation: PetAnimation): void {
    this.animationCallback?.(animation);
    eventBus.emit('pet:animationChanged', {
      animation,
      flipX: this.animation.shouldFlipX(),
    });
  }

  /**
   * 处理方向变更
   */
  private handleDirectionChange(_flipX: boolean): void {
    // 方向变更时通知动画回调
    const currentAnim = this.animation.getCurrentAnimation();
    this.animationCallback?.(currentAnim);
  }

  /**
   * 处理移动更新
   */
  private handleMovementUpdate(position: Position, direction: number): void {
    // 更新动画方向
    this.animation.setWalkDirection(direction);

    // 通知外部
    this.positionCallback?.(position.x, position.y);

    // 更新交互处理器的位置
    this.interaction.setPetPosition(position);

    // 发送事件
    eventBus.emit('pet:positionChanged', position);
  }
}