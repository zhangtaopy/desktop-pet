/**
 * MenuManager - 测试菜单管理
 * 处理测试菜单的显示/隐藏和按钮事件
 */

import { PetBehavior } from '../behavior/PetBehavior';
import { type TauriApi, type WindowHandle, type ScreenBounds } from '../core/AppContainer';
import { getMousePositionFromTauri } from '../core/PositionManager';

export class MenuManager {
  private menuVisible: boolean = false;
  private cleanupFns: Array<() => void> = [];

  constructor(
    private behavior: PetBehavior,
    private window: WindowHandle | null,
    private tauri: TauriApi | null,
    private screenBounds: ScreenBounds,
  ) {}

  /**
   * 设置菜单交互
   */
  setup(): void {
    const menuBtn = document.getElementById('test-menu-btn');
    const menu = document.getElementById('test-menu');
    if (!menuBtn || !menu) return;

    const btnPet = document.getElementById('btn-pet');
    const btnChase = document.getElementById('btn-chase');
    const btnWalk = document.getElementById('btn-walk');
    const btnSleep = document.getElementById('btn-sleep');

    const hideMenu = () => {
      if (this.menuVisible) {
        this.menuVisible = false;
        menu.classList.add('hidden');
      }
    };

    const onMenuToggle = (e: Event) => {
      e.stopPropagation();
      this.menuVisible = !this.menuVisible;
      menu.classList.toggle('hidden', !this.menuVisible);
    };
    menuBtn.addEventListener('click', onMenuToggle);
    this.cleanupFns.push(() => menuBtn.removeEventListener('click', onMenuToggle));

    if (btnPet) {
      const onClickPet = () => { this.behavior.startPetting(); hideMenu(); };
      btnPet.addEventListener('click', onClickPet);
      this.cleanupFns.push(() => btnPet.removeEventListener('click', onClickPet));
    }

    if (btnChase) {
      const onClickChase = () => {
        this.triggerChase();
        hideMenu();
      };
      btnChase.addEventListener('click', onClickChase);
      this.cleanupFns.push(() => btnChase.removeEventListener('click', onClickChase));
    }

    if (btnWalk) {
      const onClickWalk = () => { this.behavior.forceWalk(); hideMenu(); };
      btnWalk.addEventListener('click', onClickWalk);
      this.cleanupFns.push(() => btnWalk.removeEventListener('click', onClickWalk));
    }

    if (btnSleep) {
      const onClickSleep = () => { this.behavior.forceSleep(); hideMenu(); };
      btnSleep.addEventListener('click', onClickSleep);
      this.cleanupFns.push(() => btnSleep.removeEventListener('click', onClickSleep));
    }

    const onOutsideClick = (e: MouseEvent) => {
      if (!this.menuVisible) return;
      const target = e.target as HTMLElement;
      if (target === menuBtn || menu.contains(target)) return;
      hideMenu();
    };
    document.addEventListener('click', onOutsideClick);
    this.cleanupFns.push(() => document.removeEventListener('click', onOutsideClick));

    this.listenTrayEvents(menuBtn);
  }

  /**
   * 触发追逐（通过菜单按钮）
   */
  async triggerChase(): Promise<void> {
    const hasTarget = await this.syncMousePosition();
    if (!hasTarget || !this.window) return;

    try {
      const pos = await this.window.outerPosition();
      this.behavior.setPosition(pos.x, pos.y);
    } catch (e) {
      console.error('Failed to sync position:', e);
    }

    this.behavior.forceChase();
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

  /**
   * 同步鼠标位置到行为系统
   */
  private async syncMousePosition(): Promise<boolean> {
    const pos = await getMousePositionFromTauri(this.tauri);
    if (!pos) return false;

    const scaleFactor = this.screenBounds.scaleFactor ?? window.devicePixelRatio ?? 1;
    this.behavior.setTarget(pos.x * scaleFactor, pos.y * scaleFactor);
    return true;
  }

  /**
   * 监听系统托盘事件
   */
  private async listenTrayEvents(menuBtn: HTMLElement): Promise<void> {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen('toggle-menu-btn', () => {
        const isHidden = menuBtn.classList.contains('hidden');
        menuBtn.classList.toggle('hidden', !isHidden);
      });
      this.cleanupFns.push(unlisten);
    } catch {
      // Tray events not available in non-Tauri environment
    }
  }
}
