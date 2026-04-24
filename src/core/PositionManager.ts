/**
 * PositionManager - 位置管理
 * 负责宠物位置的恢复、保存和同步，以及与 Tauri 窗口的位置同步
 */

import { PetBehavior } from '../behavior/PetBehavior';
import { type TauriApi, type WindowHandle, type ScreenBounds, type StorageService } from './AppContainer';
import { eventBus } from './EventBus';

export interface PositionManagerConfig {
  saveInterval: number;
}

const DEFAULT_CONFIG: PositionManagerConfig = {
  saveInterval: 5000,
};

/**
 * 从 Tauri 获取鼠标位置（跨 API 版本兼容）
 */
export async function getMousePositionFromTauri(tauri: TauriApi | null): Promise<{ x: number; y: number } | null> {
  if (!tauri) return null;

  try {
    if (tauri.core?.invoke) {
      return await tauri.core.invoke<{ x: number; y: number }>('get_mouse_position');
    }
    if (tauri.invoke) {
      return await tauri.invoke<{ x: number; y: number }>('get_mouse_position');
    }
    const { cursorPosition } = await import('@tauri-apps/api/window');
    const cursor = await cursorPosition();
    return { x: cursor.x, y: cursor.y };
  } catch {
    return null;
  }
}

export class PositionManager {
  private lastSaveTime: number = 0;
  private config: PositionManagerConfig;
  private cleanupFns: Array<() => void> = [];

  constructor(
    private behavior: PetBehavior,
    private window: WindowHandle | null,
    private screenBounds: ScreenBounds,
    private tauri: TauriApi | null,
    private storage: StorageService,
    config?: Partial<PositionManagerConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化位置：设置窗口尺寸并恢复上次位置
   */
  async initPosition(): Promise<void> {
    let windowWidth = 128;
    let windowHeight = 128;

    if (this.window) {
      try {
        const currentPos = await this.window.outerPosition();
        const currentSize = await this.window.outerSize();
        this.behavior.setPosition(currentPos.x, currentPos.y);
        windowWidth = currentSize.width;
        windowHeight = currentSize.height;
        this.behavior.setWindowSize(windowWidth, windowHeight);
      } catch {
        const scaledSize = 128 * this.screenBounds.scaleFactor;
        this.behavior.setWindowSize(scaledSize, scaledSize);
      }
    } else {
      const scaledSize = 128 * this.screenBounds.scaleFactor;
      this.behavior.setWindowSize(scaledSize, scaledSize);
    }

    const savedPos = await this.storage.getPetState();

    if (savedPos && this.window) {
      this.behavior.setPosition(savedPos.position_x, savedPos.position_y);
      try {
        await this.window.setPosition({
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

  /**
   * 保存当前位置到存储
   */
  async saveCurrentPosition(): Promise<void> {
    if (!this.window) return;
    try {
      const pos = await this.window.outerPosition();
      await this.storage.savePosition(pos.x, pos.y);
    } catch {
      // Save failures are non-critical
    }
  }

  /**
   * 更新鼠标位置到行为系统
   */
  async updateMousePosition(): Promise<boolean> {
    const pos = await getMousePositionFromTauri(this.tauri);
    if (pos) {
      const scaleFactor = this.screenBounds.scaleFactor ?? window.devicePixelRatio ?? 1;
      this.behavior.setTarget(pos.x * scaleFactor, pos.y * scaleFactor);
      return true;
    }
    return false;
  }

  /**
   * 定期保存检查（在主循环中调用）
   */
  tryPeriodicSave(now: number): void {
    if (now - this.lastSaveTime > this.config.saveInterval) {
      this.lastSaveTime = now;
      this.saveCurrentPosition();
    }
  }

  /**
   * 监听窗口位置变化事件
   */
  setupEventListeners(): void {
    const unsub = eventBus.on('user:dragEnd', async (pos) => {
      this.behavior.setPosition(pos.x, pos.y);
      await this.storage.savePosition(pos.x, pos.y);
    });
    this.cleanupFns.push(unsub);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }
}
