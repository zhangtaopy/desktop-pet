interface Position {
  x: number;
  y: number;
}

export interface DragCallbacks {
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onDragMove?: () => void;  // 真正移动时调用
}

export function initDrag(canvas: HTMLCanvasElement, callbacks?: DragCallbacks): void {
  let isDragging = false;
  let dragStart: Position = { x: 0, y: 0 };
  let hasMoved = false;

  const tauri = (window as any).__TAURI__;
  const win = tauri?.window?.getCurrentWindow?.() || tauri?.webviewWindow?.getCurrentWebviewWindow?.();

  if (!win) {
    console.error('无法获取窗口对象！');
    return;
  }

  canvas.addEventListener('mousedown', async (e: MouseEvent) => {
    isDragging = true;
    hasMoved = false;
    callbacks?.onDragStart?.();

    try {
      const position = await win.outerPosition();
      // 将鼠标的逻辑像素转换为物理像素，统一坐标系
      const scaleFactor = window.devicePixelRatio || 1;
      dragStart = {
        x: e.screenX * scaleFactor - position.x,
        y: e.screenY * scaleFactor - position.y
      };
    } catch (err) {
      console.error('获取窗口位置失败:', err);
    }
  });

  document.addEventListener('mousemove', async (e: MouseEvent) => {
    if (!isDragging) return;
    if (!hasMoved) {
      hasMoved = true;
      callbacks?.onDragMove?.();
    }

    // 将鼠标的逻辑像素转换为物理像素
    const scaleFactor = window.devicePixelRatio || 1;
    const newX = e.screenX * scaleFactor - dragStart.x;
    const newY = e.screenY * scaleFactor - dragStart.y;

    try {
      await win.setPosition({ type: 'Physical', x: Math.round(newX), y: Math.round(newY) });
    } catch (err) {
      console.error('设置窗口位置失败:', err);
    }
  });

  document.addEventListener('mouseup', async () => {
    if (!isDragging) return;
    isDragging = false;

    try {
      const position = await win.outerPosition();
      callbacks?.onDragEnd?.(position.x, position.y);
    } catch (err) {
      console.error('获取最终位置失败:', err);
    }
  });

  // 防止拖拽时选中文本
  canvas.addEventListener('selectstart', (e) => e.preventDefault());
}
