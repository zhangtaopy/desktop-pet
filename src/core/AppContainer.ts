/**
 * 服务容器 - 依赖注入容器
 * 用于管理应用各服务的生命周期和依赖关系
 */

import type { PetRenderer } from '../renderer/pet/PetRenderer';
import type { PetBehavior } from '../behavior/PetBehavior';
import type { TimeManager } from '../renderer/TimeManager';

/**
 * Tauri API 类型定义
 */
export interface TauriApi {
  core?: {
    invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
  };
  invoke?<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
  window?: {
    getCurrentWindow(): WindowHandle;
  };
  webviewWindow?: {
    getCurrentWebviewWindow(): WindowHandle;
  };
}

/**
 * 窗口句柄接口
 */
export interface WindowHandle {
  outerPosition(): Promise<{ x: number; y: number }>;
  outerSize(): Promise<{ width: number; height: number }>;
  setPosition(position: { type: 'Physical' | 'Logical'; x: number; y: number }): Promise<void>;
}

/**
 * 显示器信息
 */
export interface MonitorInfo {
  position: { x: number; y: number };
  size: { width: number; height: number };
  workArea?: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
}

/**
 * 屏幕边界
 */
export interface ScreenBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  scaleFactor: number;
}

/**
 * 应用服务接口
 */
export interface AppServices {
  /** 宠物行为控制器 */
  petBehavior: PetBehavior;
  /** 宠物渲染器 */
  petRenderer: PetRenderer;
  /** 时间管理器 */
  timeManager: TimeManager;
  /** Tauri API */
  tauri: TauriApi | null;
  /** 当前窗口句柄 */
  window: WindowHandle | null;
  /** 屏幕边界 */
  screenBounds: ScreenBounds;
  /** 应用画布 */
  canvas: HTMLCanvasElement;
}

/**
 * 存储服务接口
 */
export interface StorageService {
  getPetState(): Promise<{ position_x: number; position_y: number } | null>;
  savePosition(x: number, y: number): Promise<void>;
  getMousePosition(): Promise<{ x: number; y: number } | null>;
}

/**
 * 创建存储服务
 */
export function createStorageService(tauri: TauriApi | null): StorageService {
  return {
    async getPetState() {
      if (!tauri) return null;
      try {
        const invoke = tauri.core?.invoke ?? tauri.invoke;
        if (invoke) {
          return await invoke('get_pet_state');
        }
      } catch (err) {
        console.error('获取宠物状态失败:', err);
      }
      return null;
    },

    async savePosition(x: number, y: number) {
      if (!tauri) return;
      try {
        const invoke = tauri.core?.invoke ?? tauri.invoke;
        if (invoke) {
          await invoke('save_position', { x, y });
        }
      } catch (err) {
        console.error('保存位置失败:', err);
      }
    },

    async getMousePosition() {
      if (!tauri) return null;
      try {
        const invoke = tauri.core?.invoke ?? tauri.invoke;
        if (invoke) {
          return await invoke('get_mouse_position');
        }
      } catch (err) {
        console.error('获取鼠标位置失败:', err);
      }
      return null;
    },
  };
}

/**
 * 窗口管理服务
 */
export interface WindowManager {
  getPosition(): Promise<{ x: number; y: number }>;
  getSize(): Promise<{ width: number; height: number }>;
  setPosition(x: number, y: number): Promise<void>;
}

/**
 * 创建窗口管理器
 */
export function createWindowManager(window: WindowHandle | null): WindowManager {
  return {
    async getPosition() {
      if (!window) throw new Error('Window not available');
      return window.outerPosition();
    },

    async getSize() {
      if (!window) {
        return { width: 128, height: 128 };
      }
      return window.outerSize();
    },

    async setPosition(x: number, y: number) {
      if (!window) return;
      await window.setPosition({ type: 'Physical', x: Math.round(x), y: Math.round(y) });
    },
  };
}

/**
 * 简化的服务容器实现
 * 使用单例模式管理服务实例
 */
class ServiceContainer {
  private services: Partial<AppServices> = {};
  private storage: StorageService | null = null;
  private windowManager: WindowManager | null = null;

  /**
   * 注册服务
   */
  register<K extends keyof AppServices>(
    key: K,
    service: AppServices[K]
  ): void {
    this.services[key] = service;
  }

  /**
   * 获取服务
   */
  get<K extends keyof AppServices>(key: K): AppServices[K] {
    const service = this.services[key];
    if (!service) {
      throw new Error(`Service '${String(key)}' not registered`);
    }
    return service;
  }

  /**
   * 检查服务是否已注册
   */
  has<K extends keyof AppServices>(key: K): boolean {
    return key in this.services;
  }

  /**
   * 设置存储服务
   */
  setStorage(storage: StorageService): void {
    this.storage = storage;
  }

  /**
   * 获取存储服务
   */
  getStorage(): StorageService {
    if (!this.storage) {
      throw new Error('Storage service not set');
    }
    return this.storage;
  }

  /**
   * 设置窗口管理器
   */
  setWindowManager(manager: WindowManager): void {
    this.windowManager = manager;
  }

  /**
   * 获取窗口管理器
   */
  getWindowManager(): WindowManager {
    if (!this.windowManager) {
      throw new Error('Window manager not set');
    }
    return this.windowManager;
  }

  /**
   * 获取所有注册的服务
   */
  getAll(): Partial<AppServices> {
    return { ...this.services };
  }

  /**
   * 清空所有服务
   */
  clear(): void {
    this.services = {};
    this.storage = null;
    this.windowManager = null;
  }
}

// 导出全局容器实例
export const container = new ServiceContainer();

// 导出便捷函数
export function getService<K extends keyof AppServices>(key: K): AppServices[K] {
  return container.get(key);
}
