/**
 * Core 模块导出
 */

// 从核心事件总线重新导出 PetState
export { PetState } from '../../core/EventBus';
export type { StateConfig } from './PetState';
export { DEFAULT_STATE_CONFIG } from './PetState';

export { PetStateMachine } from './PetStateMachine';
export type { StateMachineConfig, StateChangeCallback } from './PetStateMachine';

export { StateTransition, createDefaultTransitions } from './StateTransition';
export type {
  TransitionCondition,
  TransitionContext,
  TransitionRule,
  BehaviorConfig,
} from './StateTransition';
export { DEFAULT_CONFIG } from './StateTransition';