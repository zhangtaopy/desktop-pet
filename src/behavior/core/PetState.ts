/**
 * PetState - 状态数据定义
 * 从原来的 PetBehavior.ts 中提取
 */

// 从核心事件总线重新导出 PetState
export { PetState } from '../../core/EventBus';

/**
 * 状态配置接口
 */
export interface StateConfig {
  minDuration: number;
  maxDuration: number;
}

/**
 * 从 core/EventBus 导入 PetState 后创建默认配置
 */
import { PetState } from '../../core/EventBus';

/**
 * 各状态的默认配置
 */
export const DEFAULT_STATE_CONFIG: Record<PetState, StateConfig | null> = {
  [PetState.Idle]: { minDuration: 3000, maxDuration: 8000 },
  [PetState.Walking]: { minDuration: 2000, maxDuration: 6000 },
  [PetState.Sleeping]: { minDuration: 5000, maxDuration: 15000 },
  [PetState.Petting]: { minDuration: 1500, maxDuration: 1500 },
  [PetState.Happy]: { minDuration: 1000, maxDuration: 1000 },
  [PetState.ChasingMouse]: null, // 追逐没有固定时长，到达目标即结束
};
