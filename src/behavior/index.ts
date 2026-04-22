/**
 * Behavior 模块统一导出
 */

// 从核心事件总线重新导出常用类型
export { PetState, PetAnimation } from '../core/EventBus';
export type { Position } from '../core/EventBus';

// Core
export * from './core';

// Movement
export * from './movement';

// Interaction
export * from './interaction';

// Animation
export * from './animation';

// 行为配置（从原来的 PetBehavior 导出，保持兼容）
export interface BehaviorConfig {
  idleMinTime: number;
  idleMaxTime: number;
  walkMinTime: number;
  walkMaxTime: number;
  sleepChance: number;
  sleepMinTime: number;
  sleepMaxTime: number;
  walkSpeed: number;
  chaseChance: number;
  chaseCooldown: number;
}