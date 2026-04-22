/**
 * Desktop Pet 主入口导出
 */

// 应用类
export { App, createApp } from './App';
export type { AppConfig, AppState } from './App';

// 核心模块
export {
  eventBus,
  PetState,
  PetAnimation,
  container,
  createStorageService,
  createWindowManager,
  getService,
} from './core';

export type {
  Position,
  PetEvents,
  TypedEventEmitter,
  AppServices,
  TauriApi,
  WindowHandle,
  ScreenBounds,
  StorageService,
  WindowManager,
} from './core';

// 行为模块
export { PetBehavior } from './behavior/PetBehavior';
export type { BehaviorConfig } from './behavior';

// 渲染模块
export {
  SpriteRenderer,
  SpriteSheet,
  FrameAnimator,
  PetRenderer,
  PetAppearance,
  PetExpression,
  TimeManager,
  DEFAULT_PET_COLORS,
} from './renderer';

export type {
  SpriteRendererConfig,
  SpriteSheetConfig,
  FrameRect,
  FrameAnimatorConfig,
  AnimationState,
  PetRendererConfig,
  PixelColor,
  PetAppearanceConfig,
  ExpressionState,
} from './renderer';
