/**
 * Core 模块导出
 */

export {
  eventBus,
  PetState,
  PetAnimation,
} from './EventBus';

export type { Position, PetEvents, TypedEventEmitter } from './EventBus';

// 服务容器导出
export {
  container,
  createStorageService,
  createWindowManager,
  getService,
} from './AppContainer';

export type {
  AppServices,
  TauriApi,
  WindowHandle,
  MonitorInfo,
  ScreenBounds,
  StorageService,
  WindowManager,
} from './AppContainer';

export { PositionManager } from './PositionManager';
export type { PositionManagerConfig } from './PositionManager';

export { TaskScheduler } from './TaskScheduler';
export type { TaskSchedulerConfig, TaskCallbacks } from './TaskScheduler';
