/**
 * 应用主类
 * 职责：管理应用生命周期，协调各子模块的初始化和运行
 */

import { PetRenderer } from './renderer/pet/PetRenderer';
import { PetBehavior } from './behavior/PetBehavior';
import { TimeManager } from './renderer/TimeManager';
import { WeatherService } from './renderer/WeatherService';
import { DialogueManager } from './renderer/DialogueManager';
import { PomodoroTimer } from './renderer/PomodoroTimer';
import { CYCLES_BEFORE_LONG_BREAK, DEFAULT_FOCUS_MIN, DEFAULT_SHORT_BREAK_MIN, DEFAULT_LONG_BREAK_MIN } from './renderer/PomodoroTimer';
import { eventBus } from './core/EventBus';
import {
  container,
  createStorageService,
  createWindowManager,
  type AppServices,
  type TauriApi,
  type WindowHandle,
  type ScreenBounds,
} from './core/AppContainer';
import { PositionManager } from './core/PositionManager';
import { TaskScheduler } from './core/TaskScheduler';
import { InteractionManager } from './ui/InteractionManager';
import { MenuManager } from './ui/MenuManager';

/**
 * 应用配置
 */
export interface AppConfig {
  /** 画布元素 */
  canvas: HTMLCanvasElement;
  /** 显示尺寸 */
  displaySize?: number;
  /** 行为配置 */
  behaviorConfig?: {
    idleMinTime?: number;
    idleMaxTime?: number;
    walkMinTime?: number;
    walkMaxTime?: number;
    sleepChance?: number;
    sleepMinTime?: number;
    sleepMaxTime?: number;
    walkSpeed?: number;
  };
}

/**
 * 应用状态
 */
export type AppState = 'uninitialized' | 'initializing' | 'running' | 'paused' | 'stopped';

/**
 * Desktop Pet 应用类
 * 仅负责生命周期协调，具体逻辑委托给子模块
 */
export class App {
  private state: AppState = 'uninitialized';
  private services: Partial<AppServices> = {};
  private cleanupFns: Array<() => void> = [];

  // 子模块
  private positionManager!: PositionManager;
  private taskScheduler!: TaskScheduler;
  private interactionManager!: InteractionManager;
  private menuManager!: MenuManager;
  private weatherService!: WeatherService;
  private dialogueManager!: DialogueManager;
  private pomodoroTimer!: PomodoroTimer;

  // 天气同步
  private readonly weatherFetchInterval = 30 * 60 * 1000;
  private lastWeatherFetch: number = 0;
  private weatherSynced: boolean = false;

  constructor(private config: AppConfig) {}

  /**
   * 初始化应用
   */
  async init(): Promise<void> {
    if (this.state !== 'uninitialized') {
      throw new Error(`Cannot initialize app in state: ${this.state}`);
    }

    this.state = 'initializing';
    console.log('=== Desktop Pet Starting ===');

    try {
      // 1. 初始化 Tauri API
      const tauri = this.getTauriApi();
      console.log('Tauri available:', !!tauri);

      // 2. 初始化画布
      this.initCanvas();

      // 3. 初始化时间管理器
      const timeManager = new TimeManager();
      console.log('当前时间段:', timeManager.getTimeOfDay());

      // 3.5 初始化天气服务和对话管理器
      this.weatherService = new WeatherService();
      this.dialogueManager = new DialogueManager(timeManager);

      // 3.6 初始化番茄钟
      this.pomodoroTimer = new PomodoroTimer();
      this.pomodoroTimer.setTickHandler((phase, remainingMs, totalMs, justChanged) => {
        petRenderer.setPomodoroState(phase, remainingMs, totalMs);
        if (justChanged) {
          if (phase === 'focus') {
            petRenderer.showBubble({ text: `专注开始！${DEFAULT_FOCUS_MIN} 分钟`, duration: 3000, priority: 'interaction' });
            behavior.forceIdle();
          } else if (phase === 'shortBreak') {
            petRenderer.showBubble({ text: `休息 ${DEFAULT_SHORT_BREAK_MIN} 分钟~ 喝杯咖啡☕`, duration: 4000, priority: 'interaction' });
            petRenderer.showHearts();
          } else if (phase === 'longBreak') {
            petRenderer.showBubble({ text: `完成 ${CYCLES_BEFORE_LONG_BREAK} 轮！长休息 ${DEFAULT_LONG_BREAK_MIN} 分钟`, duration: 4000, priority: 'interaction' });
            petRenderer.showHearts();
          }
        }
      });

      // 4. 初始化渲染器
      const petRenderer = new PetRenderer({
        canvas: this.config.canvas,
        displaySize: this.config.displaySize ?? 64,
      });
      await petRenderer.loadAnimations();
      console.log('Renderer loaded');

      // 5. 初始化行为系统
      const sleepChance = 0.15 * timeManager.getSleepChanceModifier();
      const behavior = new PetBehavior({
        idleMinTime: 2000,
        idleMaxTime: 6000,
        walkMinTime: 1500,
        walkMaxTime: 4000,
        sleepChance,
        sleepMinTime: 4000,
        sleepMaxTime: 12000,
        walkSpeed: 1.5,
        ...this.config.behaviorConfig,
      });

      // 6. 初始化存储服务
      const storage = createStorageService(tauri);
      container.setStorage(storage);

      // 7. 获取窗口和屏幕信息
      const window = this.getWindowHandle(tauri);
      const screenBounds = await this.getScreenBounds();

      // 8. 配置行为系统
      behavior.setScreenBounds(
        screenBounds.minX, screenBounds.maxX,
        screenBounds.minY, screenBounds.maxY,
      );
      behavior.setScaleFactor(screenBounds.scaleFactor);

      // 9. 初始化位置管理
      this.positionManager = new PositionManager(
        behavior, window, screenBounds, tauri, storage,
      );
      await this.positionManager.initPosition();

      // 10. 注册服务
      this.services = {
        petBehavior: behavior,
        petRenderer,
        timeManager,
        tauri,
        window,
        screenBounds,
        canvas: this.config.canvas,
      };

      container.register('petBehavior', behavior);
      container.register('petRenderer', petRenderer);
      container.register('timeManager', timeManager);
      container.register('tauri', tauri);
      container.register('window', window);
      container.register('screenBounds', screenBounds);
      container.register('canvas', this.config.canvas);

      if (window) {
        container.setWindowManager(createWindowManager(window));
      }

      // 11. 初始化任务调度器
      this.taskScheduler = new TaskScheduler({
        onTimeCheck: () => timeManager.update(),
        onMouseUpdate: () => void this.positionManager.updateMousePosition(),
      });

      // 12. 初始化交互管理
      this.interactionManager = new InteractionManager(this.config.canvas, behavior, petRenderer, this.pomodoroTimer);
      this.interactionManager.setup();

      // 13. 初始化菜单
      this.menuManager = new MenuManager(petRenderer, this.dialogueManager, this.weatherService);
      this.menuManager.setup();

      // 14. 设置事件监听
      this.setupEventListeners();
      this.positionManager.setupEventListeners();

      // 15. 监听托盘番茄钟事件
      if (tauri) {
        this.listenPomodoroTray();
      }

      this.state = 'running';
      eventBus.emit('app:initialized', undefined);
      console.log('=== Desktop Pet Ready ===');
    } catch (error) {
      this.state = 'stopped';
      console.error('Failed to initialize app:', error);
      throw error;
    }
  }

  /**
   * 启动主循环
   */
  start(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot start app in state: ${this.state}`);
    }

    const { petRenderer, petBehavior } = this.services;
    if (!petRenderer || !petBehavior) return;

    petRenderer.render();

    const mainLoop = (timestamp: number) => {
      if (this.state === 'stopped') return;

      const now = Date.now();

      if (!this.interactionManager.getIsDragging()) {
        if (this.pomodoroTimer.isRunning() && this.pomodoroTimer.getPhase() === 'focus') {
          // 专注时宠物保持空闲，不更新行为
        } else {
          petBehavior.update(timestamp);
        }
        petRenderer.setFlipX(petBehavior.getWalkDirection() < 0);
      }

      petRenderer.update(timestamp);
      petRenderer.render();

      // 定期任务
      this.positionManager.tryPeriodicSave(now);
      this.taskScheduler.run(now);

      // 天气同步
      if (!this.weatherSynced || now - this.lastWeatherFetch > this.weatherFetchInterval) {
        this.syncWeather();
        this.lastWeatherFetch = now;
      }

      // 对话气泡（专注时不显示随机对话）
      if (this.pomodoroTimer.getPhase() !== 'focus' || !this.pomodoroTimer.isRunning()) {
        this.showRandomDialogue();
      }

      // 番茄钟
      this.pomodoroTimer.update(timestamp);

      requestAnimationFrame(mainLoop);
    };

    requestAnimationFrame(mainLoop);
  }

  /**
   * 暂停应用
   */
  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
    }
  }

  /**
   * 恢复应用
   */
  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  /**
   * 停止应用并清理资源
   */
  stop(): void {
    if (this.state === 'stopped') return;

    this.state = 'stopped';
    eventBus.emit('app:shutdown', undefined);

    // 清理子模块
    this.interactionManager?.destroy();
    this.menuManager?.destroy();
    this.positionManager?.destroy();

    // 清理内部回调
    for (const cleanup of this.cleanupFns) {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    this.cleanupFns = [];
    container.clear();
  }

  /**
   * 获取应用状态
   */
  getState(): AppState {
    return this.state;
  }

  /**
   * 获取服务
   */
  getServices(): Partial<AppServices> {
    return { ...this.services };
  }

  // ==================== 私有方法 ====================

  private getTauriApi(): TauriApi | null {
    return (window as any).__TAURI__ ?? null;
  }

  private getWindowHandle(tauri: TauriApi | null): WindowHandle | null {
    if (!tauri) return null;
    return tauri.window?.getCurrentWindow?.() ?? tauri.webviewWindow?.getCurrentWebviewWindow?.() ?? null;
  }

  private initCanvas(): void {
    const { canvas } = this.config;
    canvas.width = 128;
    canvas.height = 128;
    console.log('Canvas initialized');
  }

  private async getScreenBounds(): Promise<ScreenBounds> {
    try {
      const { availableMonitors, primaryMonitor } = await import('@tauri-apps/api/window');

      const monitors = await availableMonitors();

      if (monitors && monitors.length > 0) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        let scaleFactor = 1;

        for (const monitor of monitors) {
          minX = Math.min(minX, monitor.position.x);
          minY = Math.min(minY, monitor.position.y);
          maxX = Math.max(maxX, monitor.position.x + monitor.size.width);
          maxY = Math.max(maxY, monitor.position.y + monitor.size.height);
          scaleFactor = monitor.scaleFactor;
        }

        console.log('虚拟桌面边界:', { minX, maxX, minY, maxY, monitors: monitors.length });
        return { minX, maxX, minY, maxY, scaleFactor };
      }

      const monitor = await primaryMonitor();
      if (monitor) {
        return {
          minX: monitor.position.x,
          minY: monitor.position.y,
          maxX: monitor.position.x + monitor.size.width,
          maxY: monitor.position.y + monitor.size.height,
          scaleFactor: monitor.scaleFactor,
        };
      }
    } catch (err) {
      console.error('获取显示器边界失败:', err);
    }

    const scaleFactor = window.devicePixelRatio || 1;
    return {
      minX: 0, minY: 0,
      maxX: (window.screen.width || 1920) * scaleFactor,
      maxY: (window.screen.height || 1080) * scaleFactor,
      scaleFactor,
    };
  }

  private setupEventListeners(): void {
    const { petBehavior, petRenderer, window } = this.services;
    if (!petBehavior || !petRenderer) return;

    petBehavior.onPositionChange(async (x, y) => {
      if (window) {
        try {
          await window.setPosition({ type: 'Physical', x: Math.round(x), y: Math.round(y) });
        } catch (e) {
          console.error('Failed to set position:', e);
        }
      }
    });

    petBehavior.onAnimationChange((animation) => {
      petRenderer.setAnimation(animation);
      petRenderer.setFlipX(petBehavior.getWalkDirection() < 0);
    });
  }

  private showRandomDialogue(): void {
    const { petRenderer } = this.services;
    if (!petRenderer || !this.dialogueManager) return;

    if (petRenderer.isBubbleVisible()) return;

    const weather = this.weatherService.getCurrentWeather();
    const dialogue = this.dialogueManager.getNextDialogue(weather);

    if (dialogue) {
      petRenderer.showBubble(dialogue);
      eventBus.emit('dialogue:show', {
        text: dialogue.text,
        duration: dialogue.duration,
      });
    }
  }

  private async syncWeather(): Promise<void> {
    const { petRenderer } = this.services;
    if (!petRenderer) return;

    const weather = await this.weatherService.getWeather();
    if (weather) {
      petRenderer.setWeather(weather.condition);
      eventBus.emit('weather:updated', {
        condition: weather.condition,
        temperature: weather.temperature,
        description: weather.description,
      });
    }

    this.weatherSynced = true;
  }

  private async listenPomodoroTray(): Promise<void> {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const { petRenderer } = this.services;
      const unlisten = await listen('pomodoro-toggle', () => {
        if (this.pomodoroTimer.isRunning()) {
          this.pomodoroTimer.stop();
          petRenderer?.showBubble({ text: '番茄钟已停止', duration: 2000, priority: 'interaction' });
        } else {
          this.pomodoroTimer.startOrRestart();
        }
      });
      this.cleanupFns.push(unlisten);
    } catch {
      // Tauri not available
    }
  }
}

/**
 * 创建应用实例
 */
export function createApp(config: AppConfig): App {
  return new App(config);
}
