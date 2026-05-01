import { WeatherCondition, WeatherData } from './WeatherService';
import { TimeManager } from './TimeManager';

export interface DialogueEntry {
  text: string;
  duration: number;
  priority: 'weather' | 'time' | 'greeting' | 'idle' | 'interaction';
}

export class DialogueManager {
  private minInterval: number = 15000;
  private maxInterval: number = 60000;
  private nextBubbleTime: number = 0;
  private timeManager: TimeManager;

  private idlePhrases: string[] = [
    '你好呀~', '今天天气不错呢', '有点无聊...', '你在忙什么？',
    '哼着小曲♪', '好安静哦', '转圈圈~', '有人吗？',
    '发发呆...', '伸个懒腰~', '嗯？', '嘿嘿',
    '想出去玩', '好困呀', '喵~', '汪汪！',
  ];

  private timeGreetings: Record<string, string[]> = {
    morning: [
      '早上好！新的一天开始啦', '太阳照屁股啦', '今天也要元气满满哦',
      '早餐吃了吗？', '早起的鸟儿有虫吃~',
    ],
    afternoon: [
      '下午好~', '吃饱了有点困呢', '该休息一下了',
      '下午茶时间到！', '继续加油哦',
    ],
    evening: [
      '傍晚了呢', '天快黑了', '晚饭吃什么好呢？',
      '一天过得好快呀', '该收工啦',
    ],
    night: [
      '这么晚了还不睡？', '熬夜会变丑的哦', '晚安啦~',
      '该睡觉了zzz', '夜深了...有人在吗？', '月亮好圆啊',
    ],
  };

  private weatherPhrases: Record<WeatherCondition, string[]> = {
    sunny: [
      '☀️ 阳光真好！', '大晴天，心情好~', '好晒呀，要戴墨镜才行',
      '太阳好大，躲一躲', '阳光普照！开心~',
    ],
    'partly-cloudy': [
      '多云转晴？', '云朵像棉花糖~', '太阳被藏起来啦',
      '不冷不热刚刚好', '云朵飘呀飘',
    ],
    cloudy: [
      '☁️ 阴天了呢', '天灰灰的', '阴沉沉的，想睡觉',
      '乌云密布...', '天阴了，要下雨吗？',
    ],
    overcast: [
      '灰蒙蒙的一片', '好暗呀', '阴天让人犯困',
      '天要塌下来了吗...', '暗暗的，适合发呆',
    ],
    rain: [
      '🌧️ 下雨了！', '滴答滴答~', '下雨天想窝在家',
      '带伞了吗？', '雨水哗啦啦', '小心路滑哦',
    ],
    drizzle: [
      '下小雨了呢', '毛毛雨~', '小雨滴答滴答',
      '小雨淅淅沥沥', '空气变清新了',
    ],
    thunderstorm: [
      '⚡ 打雷了！', '好可怕...', '雷声轰隆隆',
      '躲起来躲起来！', '不要怕不要怕',
    ],
    snow: [
      '❄️ 下雪啦！', '雪花飘飘~', '好冷好冷',
      '白茫茫的真好看', '堆雪人啦', '围好围巾哦',
    ],
    fog: [
      '起雾了呢', '雾茫茫的看不清', '小心别迷路哦',
      '好神秘的感觉', '像在仙境里',
    ],
    mist: [
      '薄薄的雾', '朦胧胧的', '有点凉呢',
    ],
    unknown: [
      '天气怎样呢...', '看不出来什么天', '好奇外面什么样',
    ],
  };

  private interactionPhrases: string[] = [
    '嘻嘻，好舒服~', '再摸摸~', '好开心！', '不要停~',
    '好喜欢你呀', '蹭蹭~', '嘿嘿嘿', '主人最好了！',
  ];

  private reactionPhrases: string[] = [
    '嗯？什么东西？', '吓我一跳', '哇！', '哦？',
    '有意思~', '你在干嘛？', '咦？',
  ];

  constructor(timeManager: TimeManager) {
    this.timeManager = timeManager;
    this.scheduleNext();
  }

  private scheduleNext(): void {
    const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    this.nextBubbleTime = Date.now() + interval;
  }

  getNextDialogue(weather: WeatherData | null): DialogueEntry | null {
    const now = Date.now();
    if (now < this.nextBubbleTime) return null;

    this.scheduleNext();
    return this.pickDialogue(weather);
  }

  getInteractionDialogue(): DialogueEntry {
    const text = this.interactionPhrases[Math.floor(Math.random() * this.interactionPhrases.length)];
    return { text, duration: 2500, priority: 'interaction' };
  }

  getReactionDialogue(): DialogueEntry {
    const text = this.reactionPhrases[Math.floor(Math.random() * this.reactionPhrases.length)];
    return { text, duration: 2000, priority: 'interaction' };
  }

  private pickDialogue(weather: WeatherData | null): DialogueEntry {
    const rand = Math.random();

    if (weather && rand < 0.35) {
      const phrases = this.weatherPhrases[weather.condition] ?? this.weatherPhrases.unknown;
      const text = phrases[Math.floor(Math.random() * phrases.length)];
      return { text, duration: 4000, priority: 'weather' };
    }

    if (rand < 0.65) {
      const timeOfDay = this.timeManager.getTimeOfDay();
      const phrases = this.timeGreetings[timeOfDay] ?? [];
      if (phrases.length > 0) {
        const text = phrases[Math.floor(Math.random() * phrases.length)];
        return { text, duration: 3500, priority: 'time' };
      }
    }

    const text = this.idlePhrases[Math.floor(Math.random() * this.idlePhrases.length)];
    return { text, duration: 3000, priority: 'idle' };
  }

  reset(): void {
    this.scheduleNext();
  }
}
