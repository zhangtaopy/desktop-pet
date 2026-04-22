/**
 * Interaction 模块导出
 */

export { InteractionHandler } from './InteractionHandler';
export type { InteractionConfig, InteractionCallbacks } from './InteractionHandler';

export { PettingController, PettingState } from './PettingController';
export type { PettingConfig, PettingCallbacks } from './PettingController';
export { DEFAULT_PETTING_CONFIG } from './PettingController';

export { ChasingController, ChasingState } from './ChasingController';
export type { ChasingConfig, ChasingCallbacks } from './ChasingController';
export { DEFAULT_CHASING_CONFIG } from './ChasingController';