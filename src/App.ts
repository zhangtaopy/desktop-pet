/**
 * 应用主类
 * 取代 main() 函数，管理应用生命周期
 */

import { PetRenderer } from './renderer/pet/PetRenderer';
import { PetBehavior } from './behavior/PetBehavior';
import { TimeManager } from './renderer/TimeManager';
import { eventBus } from './core/EventBus';
import { initDrag } from './drag';
import {
  container,
  createStorageService,
  createWindowManager,
  type AppServices,
  type TauriApi,
  type WindowHandle,
  type ScreenBounds,
} from './core/AppContainer';

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
 * 管理所有服务的初始化、运行和清理
 */
export class App {
  private state: AppState = 'uninitialized';
  private services: Partial<AppServices> = {};
  private cleanupFns: Array<() => void> = [];
  private lastSaveTime: number = 0;
  private lastTimeCheck: number = 0;
  private lastMouseUpdate: number = 0;
  private isDragging: boolean = false;
  private menuVisible: boolean = false;

  // 配置常量
  private readonly saveInterval = 5000;
  private readonly timeCheckInterval = 60000;
  private readonly mouseUpdateInterval = 100;

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

      // 6. 初始化容器服务（在 initPosition 之前）
      container.setStorage(createStorageService(tauri));

      // 7. 获取窗口和屏幕信息
      const window = this.getWindowHandle(tauri);
      const screenBounds = await this.getScreenBounds();

      // 8. 配置行为系统
      behavior.setScreenBounds(
        screenBounds.minX,
        screenBounds.maxX,
        screenBounds.minY,
        screenBounds.maxY
      );
      behavior.setScaleFactor(screenBounds.scaleFactor);

      // 9. 初始化位置（需要 storage 已设置）
      await this.initPosition(behavior, window, screenBounds);

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

      // 10. 设置事件监听
      this.setupEventListeners();

      // 11. 设置 UI 交互
      this.setupUIInteractions();

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

    // 初始渲染
    petRenderer.render();

    // 启动主循环
    const mainLoop = (timestamp: number) => {
      if (this.state === 'stopped') return;

      if (!this.isDragging) {
        petBehavior.update(timestamp);
        petRenderer.setFlipX(petBehavior.getWalkDirection() < 0);
      }

      petRenderer.update(timestamp);
      petRenderer.render();

      // 定期任务
      this.runPeriodicTasks();

      requestAnimationFrame(mainLoop);
    };

    requestAnimationFrame(mainLoop);
  }

  /**
   * 运行定期任务
   */
  private runPeriodicTasks(): void {
    const now = Date.now();

    // 保存位置
    if (now - this.lastSaveTime > this.saveInterval) {
      this.saveCurrentPosition();
      this.lastSaveTime = now;
    }

    // 检查时间变化
    if (now - this.lastTimeCheck > this.timeCheckInterval) {
      this.services.timeManager?.update();
      this.lastTimeCheck = now;
    }

    // 更新鼠标位置
    if (now - this.lastMouseUpdate > this.mouseUpdateInterval) {
      this.updateMousePosition();
      this.lastMouseUpdate = now;
    }
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

    // 执行清理函数
    for (const cleanup of this.cleanupFns) {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    this.cleanupFns = [];

    // 清理容器
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
    // Canvas 固定为 128x128，宠物显示尺寸由 PetRenderer 单独控制
    canvas.width = 128;
    canvas.height = 128;
    console.log('Canvas initialized');
  }

  private async getScreenBounds(): Promise<ScreenBounds> {
    try {
      const { availableMonitors, primaryMonitor } = await import('@tauri-apps/api/window');

      // 获取所有显示器
      const monitors = await availableMonitors();

      if (monitors && monitors.length > 0) {
        // 计算虚拟桌面边界（包含所有显示器）
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

      // Fallback: 单显示器
      const monitor = await primaryMonitor();
      if (monitor) {
        console.log('Monitor info:', {
          position: monitor.position,
          size: monitor.size,
          scaleFactor: monitor.scaleFactor,
        });
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

    // Fallback
    const scaleFactor = window.devicePixelRatio || 1;
    return {
      minX: 0,
      minY: 0,
      maxX: (window.screen.width || 1920) * scaleFactor,
      maxY: (window.screen.height || 1080) * scaleFactor,
      scaleFactor,
    };
  }

  private async initPosition(
    behavior: PetBehavior,
    window: WindowHandle | null,
    screenBounds: ScreenBounds
  ): Promise<void> {
    let windowWidth = 128;
    let windowHeight = 128;

    if (window) {
      try {
        const currentPos = await window.outerPosition();
        const currentSize = await window.outerSize();
        behavior.setPosition(currentPos.x, currentPos.y);
        windowWidth = currentSize.width;
        windowHeight = currentSize.height;
        behavior.setWindowSize(windowWidth, windowHeight);
      } catch {
        const scaledSize = 128 * screenBounds.scaleFactor;
        behavior.setWindowSize(scaledSize, scaledSize);
      }
    } else {
      const scaledSize = 128 * screenBounds.scaleFactor;
      behavior.setWindowSize(scaledSize, scaledSize);
    }

    // 恢复保存的位置
    const storage = container.getStorage();
    const savedPos = await storage.getPetState();

    if (savedPos && window) {
      behavior.setPosition(savedPos.position_x, savedPos.position_y);
      try {
        await window.setPosition({
          type: 'Physical',
          x: Math.round(savedPos.position_x),
          y: Math.round(savedPos.position_y),
        });
        console.log('Position restored:', savedPos);
      } catch (e) {
        console.error('Failed to restore position:', e);
      }
    }
  }

  private setupEventListeners(): void {
    const { petBehavior, petRenderer, window } = this.services;
    if (!petBehavior || !petRenderer) return;

    // 位置变化回调
    petBehavior.onPositionChange(async (x, y) => {
      if (window) {
        try {
          await window.setPosition({ type: 'Physical', x: Math.round(x), y: Math.round(y) });
        } catch (e) {
          console.error('Failed to set position:', e);
        }
      }
    });

    // 动画变化回调
    petBehavior.onAnimationChange((animation) => {
      petRenderer.setAnimation(animation);
      petRenderer.setFlipX(petBehavior.getWalkDirection() < 0);
    });
  }

  private setupUIInteractions(): void {
    const { canvas, petBehavior } = this.services;
    if (!canvas || !petBehavior) return;

    // 拖拽
    initDrag(canvas, {
      onDragStart: () => {},
      onDragMove: () => {
        this.isDragging = true;
      },
      onDragEnd: async (x: number, y: number) => {
        if (this.isDragging) {
          petBehavior.setPosition(x, y);
          await container.getStorage().savePosition(x, y);
        }
        this.isDragging = false;
      },
    });

    // 点击抚摸
    let lastClickTime = 0;
    canvas.addEventListener('click', () => {
      if (this.isDragging) return;
      const now = Date.now();
      if (now - lastClickTime < 300) return;
      lastClickTime = now;
      petBehavior.startPetting();
    });

    // 菜单
    this.setupMenu();
  }

  private setupMenu(): void {
    const { petBehavior } = this.services;
    if (!petBehavior) return;

    const menuBtn = document.getElementById('test-menu-btn');
    const menu = document.getElementById('test-menu');
    const btnPet = document.getElementById('btn-pet');
    const btnChase = document.getElementById('btn-chase');
    const btnWalk = document.getElementById('btn-walk');
    const btnSleep = document.getElementById('btn-sleep');

    const hideMenu = () => {
      if (this.menuVisible) {
        this.menuVisible = false;
        menu?.classList.add('hidden');
      }
    };

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.menuVisible = !this.menuVisible;
      menu?.classList.toggle('hidden', !this.menuVisible);
    });

    btnPet?.addEventListener('click', () => {
      petBehavior.startPetting();
      hideMenu();
    });

    btnChase?.addEventListener('click', () => {
      this.triggerChase();
    });

    btnWalk?.addEventListener('click', () => {
      petBehavior.forceWalk();
      hideMenu();
    });

    btnSleep?.addEventListener('click', () => {
      petBehavior.forceSleep();
      hideMenu();
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', (e) => {
      if (this.menuVisible) {
        const target = e.target as HTMLElement;
        if (target === menuBtn || menu?.contains(target)) return;
        hideMenu();
      }
    });

    // 监听托盘事件
    this.listenTrayEvents(menuBtn);
  }

  private async triggerChase(): Promise<void> {
    const { petBehavior, window } = this.services;
    if (!petBehavior) return;

    const hasTarget = await this.updateMousePosition();
    if (hasTarget && window) {
      try {
        const pos = await window.outerPosition();
        petBehavior.setPosition(pos.x, pos.y);
      } catch (e) {
        console.error('Failed to sync position:', e);
      }

      petBehavior.forceChase();
    }

    // 隐藏菜单
    const menu = document.getElementById('test-menu');
    if (this.menuVisible) {
      this.menuVisible = false;
      menu?.classList.add('hidden');
    }
  }

  private async updateMousePosition(): Promise<boolean> {
    const { petBehavior, tauri } = this.services;
    if (!petBehavior) return false;

    try {
      let pos: { x: number; y: number } | null = null;

      if (tauri?.core?.invoke) {
        pos = await tauri.core.invoke('get_mouse_position');
      } else if (tauri?.invoke) {
        pos = await tauri.invoke('get_mouse_position');
      } else {
        const { cursorPosition } = await import('@tauri-apps/api/window');
        const cursor = await cursorPosition();
        pos = { x: cursor.x, y: cursor.y };
      }

      if (pos) {
        // 将鼠标逻辑坐标转换为物理坐标，与窗口坐标系保持一致
        const scaleFactor = this.services.screenBounds?.scaleFactor ?? window.devicePixelRatio ?? 1;
        petBehavior.setTarget(pos.x * scaleFactor, pos.y * scaleFactor);
        return true;
      }
    } catch (e) {
      console.error('Failed to get mouse position:', e);
    }

    return false;
  }

  private async saveCurrentPosition(): Promise<void> {
    const { window } = this.services;
    if (!window) return;

    try {
      const pos = await window.outerPosition();
      await container.getStorage().savePosition(pos.x, pos.y);
    } catch {
      // Ignore
    }
  }

  private async listenTrayEvents(menuBtn: HTMLElement | null): Promise<void> {
    const { listen } = await import('@tauri-apps/api/event');
    void listen('toggle-menu-btn', () => {
      if (menuBtn) {
        const isHidden = menuBtn.classList.contains('hidden');
        menuBtn.classList.toggle('hidden', !isHidden);
      }
    });
  }
}

/**
 * 创建应用实例
 */
export function createApp(config: AppConfig): App {
  return new App(config);
}
