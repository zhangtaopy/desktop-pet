import './styles.css';
import { cursorPosition, currentMonitor, primaryMonitor } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { initDrag } from './drag';
import { PetRenderer } from './renderer/PetRenderer';
import { PetBehavior } from './behavior/PetBehavior';
import { TimeManager } from './renderer/TimeManager';

const tauri = (window as any).__TAURI__;

async function getScreenBounds(): Promise<{ minX: number; minY: number; maxX: number; maxY: number; scaleFactor: number }> {
  try {
    const monitor = await currentMonitor() ?? await primaryMonitor();
    if (monitor) {
      console.log('Monitor info:', {
        position: monitor.position,
        size: monitor.size,
        workArea: monitor.workArea,
        scaleFactor: monitor.scaleFactor
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

  // Fallback: 使用 devicePixelRatio 作为缩放因子
  const scaleFactor = window.devicePixelRatio || 1;
  return {
    minX: 0,
    minY: 0,
    maxX: (window.screen.width || 1920) * scaleFactor,
    maxY: (window.screen.height || 1080) * scaleFactor,
    scaleFactor: scaleFactor,
  };
}

async function restorePosition(): Promise<{ x: number; y: number } | null> {
  if (!tauri) return null;

  try {
    let state;
    if (tauri.core?.invoke) {
      state = await tauri.core.invoke('get_pet_state');
    } else if (tauri.invoke) {
      state = await tauri.invoke('get_pet_state');
    }

    if (state && typeof state.position_x === 'number' && typeof state.position_y === 'number') {
      return { x: state.position_x, y: state.position_y };
    }
  } catch (err) {
    console.error('恢复位置失败:', err);
  }
  return null;
}

async function savePosition(x: number, y: number): Promise<void> {
  if (!tauri) return;

  try {
    if (tauri.core?.invoke) {
      await tauri.core.invoke('save_position', { x, y });
    } else if (tauri.invoke) {
      await tauri.invoke('save_position', { x, y });
    }
  } catch (err) {
    console.error('保存位置失败:', err);
  }
}

function getWindow(): any {
  return tauri?.window?.getCurrentWindow?.() || tauri?.webviewWindow?.getCurrentWebviewWindow?.();
}

async function getWindowPosition(): Promise<{ x: number; y: number }> {
  const win = getWindow();
  if (!win) throw new Error('No window');
  return win.outerPosition();
}

async function setWindowPosition(x: number, y: number): Promise<void> {
  const win = getWindow();
  if (!win) return;
  await win.setPosition({ type: 'Physical', x: Math.round(x), y: Math.round(y) });
}

async function main() {
  console.log('=== Desktop Pet Starting ===');
  console.log('Tauri available:', !!tauri);

  const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  console.log('Canvas found');

  canvas.width = 128;
  canvas.height = 128;

  // 初始化时间管理器
  const timeManager = new TimeManager();
  console.log('当前时间段:', timeManager.getTimeOfDay());

  // 根据时间调整睡眠概率
  const sleepChance = 0.15 * timeManager.getSleepChanceModifier();

  // 初始化渲染器
  const petRenderer = new PetRenderer(canvas, 64);
  await petRenderer.loadAnimations();
  console.log('Renderer loaded');

  // 初始化行为系统
  const behavior = new PetBehavior({
    idleMinTime: 2000,
    idleMaxTime: 6000,
    walkMinTime: 1500,
    walkMaxTime: 4000,
    sleepChance: sleepChance,
    sleepMinTime: 4000,
    sleepMaxTime: 12000,
    walkSpeed: 1.5,
  });

  // 获取屏幕尺寸
  const screenBounds = await getScreenBounds();
  console.log('Screen bounds:', screenBounds);
  behavior.setScreenBounds(screenBounds.minX, screenBounds.maxX, screenBounds.minY, screenBounds.maxY);
  behavior.setScaleFactor(screenBounds.scaleFactor);

  // 恢复位置或获取当前窗口位置
  const win = getWindow();

  let windowWidth = 128;
  let windowHeight = 128;

  if (win) {
    try {
      const currentPos = await getWindowPosition();
      const currentSize = await win.outerSize();
      behavior.setPosition(currentPos.x, currentPos.y);
      windowWidth = currentSize.width;
      windowHeight = currentSize.height;
      behavior.setWindowSize(windowWidth, windowHeight);
    } catch (e) {
      // 如果获取失败，使用默认值并乘以缩放因子
      const scaledSize = 128 * screenBounds.scaleFactor;
      windowWidth = scaledSize;
      windowHeight = scaledSize;
      behavior.setWindowSize(windowWidth, windowHeight);
    }
  } else {
    console.error('Window object is null, using default size');
    // 如果窗口对象不存在，使用默认值并乘以缩放因子
    const scaledSize = 128 * screenBounds.scaleFactor;
    windowWidth = scaledSize;
    windowHeight = scaledSize;
    behavior.setWindowSize(windowWidth, windowHeight);
    console.log('Using scaled default window size:', { windowWidth, windowHeight });
  }

  const savedPos = await restorePosition();
  if (savedPos && win) {
    behavior.setPosition(savedPos.x, savedPos.y);
    try {
      await setWindowPosition(savedPos.x, savedPos.y);
      console.log('Position restored:', savedPos);
    } catch (e) {
      console.error('Failed to restore position:', e);
    }
  }

  // 设置回调
  behavior.onPositionChange(async (x, y) => {
    try {
      await setWindowPosition(x, y);
    } catch (e) {
      console.error('Failed to set position:', e);
    }
  });

  behavior.onAnimationChange((animation) => {
    petRenderer.setAnimation(animation);
    petRenderer.setFlipX(behavior.getWalkDirection() < 0);
  });

  // 初始化拖拽
  let isDragging = false;
  initDrag(canvas, {
    onDragStart: () => {
      // 不在这里设置 isDragging，等真正移动时再设置
    },
    onDragMove: () => {
      isDragging = true;  // 真正移动时才标记为拖拽
    },
    onDragEnd: async (x: number, y: number) => {
      if (isDragging) {
        behavior.setPosition(x, y);
        await savePosition(x, y);
      }
      isDragging = false;
    },
  });
  console.log('Drag initialized');

  // 点击抚摸
  let lastClickTime = 0;
  canvas.addEventListener('click', () => {
    if (isDragging) return;

    const now = Date.now();
    if (now - lastClickTime < 300) return;
    lastClickTime = now;

    behavior.startPetting();
  });

  // 测试菜单
  const menuBtn = document.getElementById('test-menu-btn');
  const menu = document.getElementById('test-menu');
  const btnPet = document.getElementById('btn-pet');
  const btnChase = document.getElementById('btn-chase');
  const btnWalk = document.getElementById('btn-walk');
  const btnSleep = document.getElementById('btn-sleep');

  console.log('Menu elements:', { menuBtn, menu, btnPet, btnChase, btnWalk, btnSleep });

  if (!menu) {
    console.error('Menu element not found!');
  } else {
    console.log('Menu element found:', menu);
  }

  let menuVisible = false;

  const hideMenu = () => {
    if (menuVisible) {
      menuVisible = false;
      menu?.classList.add('hidden');
    }
  };

  menuBtn?.addEventListener('click', (e) => {
    console.log('Menu button clicked!');
    e.stopPropagation();
    menuVisible = !menuVisible;
    menu?.classList.toggle('hidden', !menuVisible);
  });

  btnPet?.addEventListener('click', () => {
    behavior.startPetting();
    hideMenu();
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', (e) => {
    if (menuVisible) {
      const target = e.target as HTMLElement;
      if (target === menuBtn || menu?.contains(target)) {
        return;
      }
      hideMenu();
    }
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', (e) => {
    if (menuVisible) {
      // 如果点击的是菜单按钮或菜单内部，不关闭
      const target = e.target as HTMLElement;
      if (target === menuBtn || menu?.contains(target)) {
        return;
      }
      hideMenu();
    }
  });

  // 监听全局鼠标位置，让宠物追逐鼠标
  const mouseUpdateInterval = 100; // 更频繁更新

  // 获取全局鼠标位置
  async function updateMousePosition(): Promise<boolean> {
    try {
      let pos: { x: number; y: number } | null = null;

      if (tauri?.core?.invoke) {
        pos = await tauri.core.invoke('get_mouse_position');
      } else if (tauri?.invoke) {
        pos = await tauri.invoke('get_mouse_position');
      } else {
        const cursor = await cursorPosition();
        pos = { x: cursor.x, y: cursor.y };
      }

      if (pos) {
        behavior.setTarget(pos.x, pos.y);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to get mouse position:', e);
      return false;
    }
  }

  async function triggerChase(): Promise<void> {
    const hasTarget = await updateMousePosition();
    if (hasTarget) {
      const w = getWindow();
      if (w) {
        try {
          const pos = await w.outerPosition();
          behavior.setPosition(pos.x, pos.y);
        } catch (e) {
          console.error('Failed to sync position:', e);
        }
      }
      behavior.forceChase();
    }
    hideMenu();
  }

  btnChase?.addEventListener('click', () => {
    void triggerChase();
  });

  btnWalk?.addEventListener('click', () => {
    behavior.forceWalk();
    hideMenu();
  });

  btnSleep?.addEventListener('click', () => {
    behavior.forceSleep();
    hideMenu();
  });

  // 监听来自托盘的切换菜单按钮事件
  void listen('toggle-menu-btn', () => {
    if (menuBtn) {
      const isHidden = menuBtn.classList.contains('hidden');
      if (isHidden) {
        menuBtn.classList.remove('hidden');
      } else {
        menuBtn.classList.add('hidden');
      }
    }
  });

  // 主循环
  let lastSaveTime = 0;
  let lastTimeCheck = 0;
  let lastMouseUpdate = 0;
  const saveInterval = 5000;
  const timeCheckInterval = 60000;

  const mainLoop = (timestamp: number) => {
    if (!isDragging) {
      behavior.update(timestamp);
      petRenderer.setFlipX(behavior.getWalkDirection() < 0);
    }

    petRenderer.update(timestamp);
    petRenderer.render();

    // 定期保存位置
    const now = Date.now();
    if (now - lastSaveTime > saveInterval) {
      const w = getWindow();
      if (w) {
        w.outerPosition().then((pos: { x: number; y: number }) => {
          savePosition(pos.x, pos.y);
          lastSaveTime = now;
        }).catch(() => {});
      }
    }

    // 定期检查时间变化
    if (now - lastTimeCheck > timeCheckInterval) {
      timeManager.update();
      lastTimeCheck = now;
    }

    // 定期更新鼠标位置，让宠物追逐
    if (now - lastMouseUpdate > mouseUpdateInterval) {
      updateMousePosition();
      lastMouseUpdate = now;
    }

    requestAnimationFrame(mainLoop);
  };

  petRenderer.render();
  requestAnimationFrame(mainLoop);
  void updateMousePosition();
  console.log('=== Desktop Pet Ready ===');
}

main().catch(console.error);
