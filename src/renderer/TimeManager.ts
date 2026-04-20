export enum TimeOfDay {
  Morning = 'morning',   // 6:00 - 12:00
  Afternoon = 'afternoon', // 12:00 - 18:00
  Evening = 'evening',   // 18:00 - 21:00
  Night = 'night',       // 21:00 - 6:00
}

export class TimeManager {
  private currentTime: TimeOfDay;

  constructor() {
    this.currentTime = this.calculateTimeOfDay();
  }

  private calculateTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      return TimeOfDay.Morning;
    } else if (hour >= 12 && hour < 18) {
      return TimeOfDay.Afternoon;
    } else if (hour >= 18 && hour < 21) {
      return TimeOfDay.Evening;
    } else {
      return TimeOfDay.Night;
    }
  }

  getTimeOfDay(): TimeOfDay {
    return this.currentTime;
  }

  isDayTime(): boolean {
    const time = this.calculateTimeOfDay();
    return time === TimeOfDay.Morning || time === TimeOfDay.Afternoon;
  }

  isNightTime(): boolean {
    return this.calculateTimeOfDay() === TimeOfDay.Night;
  }

  // 获取当前时间应该有的睡眠概率调整
  getSleepChanceModifier(): number {
    const time = this.calculateTimeOfDay();
    switch (time) {
      case TimeOfDay.Night:
        return 2.0; // 夜晚更容易睡觉
      case TimeOfDay.Evening:
        return 1.5; // 傍晚也比较容易困
      case TimeOfDay.Morning:
        return 0.8; // 早上精神好
      case TimeOfDay.Afternoon:
        return 1.0; // 下午正常
    }
  }

  // 获取背景颜色建议（用于渲染器）
  getBackgroundColor(): string {
    const time = this.calculateTimeOfDay();
    switch (time) {
      case TimeOfDay.Night:
        return '#1a1a2e'; // 深蓝色夜晚
      case TimeOfDay.Evening:
        return '#2d3436'; // 傍晚
      case TimeOfDay.Morning:
        return '#ffeaa7'; // 晨光
      case TimeOfDay.Afternoon:
        return '#ffffff'; // 白天透明
    }
  }

  // 更新时间（每分钟检查一次即可）
  update(): void {
    this.currentTime = this.calculateTimeOfDay();
  }
}
