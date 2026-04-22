/**
 * Desktop Pet 入口点
 * 仅负责服务装配和应用启动
 */

import './styles.css';
import { createApp } from './App';

/**
 * 主入口函数
 * 仅做装配，所有逻辑委托给 App 类
 */
async function main(): Promise<void> {
  // 获取画布元素
  const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  // 创建应用实例
  const app = createApp({
    canvas,
    displaySize: 64,
  });

  // 初始化并启动
  try {
    await app.init();
    app.start();
  } catch (error) {
    console.error('Application failed to start:', error);
  }
}

// 启动应用
main().catch(console.error);
