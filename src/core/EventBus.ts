/**
 * 事件总线 - 跨模块通信机制
 * 用于解耦各模块之间的直接调用
 */

/**
 * 宠物位置信息
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 宠物状态枚举 - 从原来的 PetBehavior.ts 提取出来
 */
export enum PetState {
  Idle = 'idle',
  Walking = 'walking',
  Sleeping = 'sleeping',
  Petting = 'petting',
  Happy = 'happy',
  ChasingMouse = 'chasing',
}

/**
 * 动画类型 - 从原来的 PetRenderer.ts 提取出来
 */
export enum PetAnimation {
  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  Sleep = 'sleep',
  Petting = 'petting',
  Happy = 'happy',
}

/**
 * 天气事件数据
 */
export interface WeatherEventData {
  condition: string;
  temperature: number;
  description: string;
}

/**
 * 对话气泡事件数据
 */
export interface DialogueEventData {
  text: string;
  duration: number;
}

/**
 * 事件定义接口
 */
export interface PetEvents {
  // 窗口相关事件
  'window:moved': Position;
  'window:resized': { width: number; height: number };

  // 宠物状态事件
  'pet:stateChanged': { from: PetState; to: PetState };
  'pet:animationChanged': { animation: PetAnimation; flipX?: boolean };
  'pet:positionChanged': Position;

  // 时间事件
  'time:updated': { hour: number; isNight: boolean };

  // 用户交互事件
  'user:petStarted': void;
  'user:petEnded': void;
  'user:mouseMoved': Position;
  'user:dragStart': void;
  'user:dragEnd': Position;

  // 天气事件
  'weather:updated': WeatherEventData;
  'weather:error': string;

  // 对话/气泡事件
  'dialogue:show': DialogueEventData;
  'dialogue:hide': void;

  // 系统事件
  'app:initialized': void;
  'app:shutdown': void;
}

type EventCallback<T> = (data: T) => void;

/**
 * 类型安全的事件总线实现
 */
class TypedEventEmitter<EventMap extends Record<string, any>> {
  private listeners: { [K in keyof EventMap]?: Array<EventCallback<EventMap[K]>> } = {};

  /**
   * 订阅事件
   */
  on<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅事件
   */
  off<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * 订阅一次性事件
   */
  once<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): void {
    const onceCallback = (data: EventMap[K]) => {
      this.off(event, onceCallback);
      callback(data);
    };
    this.on(event, onceCallback);
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners = {};
  }
}

// 导出全局事件总线实例
export const eventBus = new TypedEventEmitter<PetEvents>();

// 导出类型
export type { TypedEventEmitter };
