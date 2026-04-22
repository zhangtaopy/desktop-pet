/**
 * Renderer 模块导出
 * 渲染相关组件
 */

// 通用精灵引擎
export {
  SpriteRenderer,
  SpriteSheet,
  FrameAnimator,
} from './sprite';

export type {
  SpriteRendererConfig,
  SpriteSheetConfig,
  FrameRect,
  FrameAnimatorConfig,
  AnimationState,
} from './sprite';

// 宠物专属渲染
export {
  PetRenderer,
  PetAppearance,
  PetExpression,
  DEFAULT_PET_COLORS,
} from './pet';

export type {
  PetRendererConfig,
  PixelColor,
  PetAppearanceConfig,
  ExpressionState,
} from './pet';

// 时间管理器
export { TimeManager } from './TimeManager';
