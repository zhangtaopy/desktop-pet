/**
 * Movement 模块导出
 */

export { MovementController } from './MovementController';
export type { MovementConfig, PositionChangeCallback } from './MovementController';
export { DEFAULT_MOVEMENT_CONFIG } from './MovementController';

export { ScreenBoundDetector } from './ScreenBoundDetector';
export type { ScreenBounds, WindowSize, BoundCheckResult } from './ScreenBoundDetector';

export { WalkDirector } from './WalkDirector';
export type { Direction, WalkInstruction, WalkConfig } from './WalkDirector';
export { DEFAULT_WALK_CONFIG } from './WalkDirector';