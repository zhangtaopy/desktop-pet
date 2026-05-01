import { PetRenderer } from '../renderer/pet/PetRenderer';
import { DialogueManager } from '../renderer/DialogueManager';
import { WeatherService } from '../renderer/WeatherService';

export class MenuManager {
  private menuVisible: boolean = false;
  private cleanupFns: Array<() => void> = [];

  constructor(
    private petRenderer: PetRenderer,
    private dialogueManager: DialogueManager,
    private weatherService: WeatherService,
  ) {}

  setup(): void {
    const menuBtn = document.getElementById('test-menu-btn');
    const menu = document.getElementById('test-menu');
    if (!menuBtn || !menu) return;

    const hideMenu = () => {
      if (this.menuVisible) {
        this.menuVisible = false;
        menu.classList.add('hidden');
      }
    };

    const onMenuToggle = (e: Event) => {
      e.stopPropagation();
      this.menuVisible = !this.menuVisible;
      menu.classList.toggle('hidden', !this.menuVisible);
    };
    menuBtn.addEventListener('click', onMenuToggle);
    this.cleanupFns.push(() => menuBtn.removeEventListener('click', onMenuToggle));

    // 天气测试按钮
    this.bindButton('btn-weather-sunny', () => { this.petRenderer.setWeather('sunny'); hideMenu(); });
    this.bindButton('btn-weather-rain', () => { this.petRenderer.setWeather('rain'); hideMenu(); });
    this.bindButton('btn-weather-snow', () => { this.petRenderer.setWeather('snow'); hideMenu(); });
    this.bindButton('btn-weather-cloudy', () => { this.petRenderer.setWeather('cloudy'); hideMenu(); });
    this.bindButton('btn-weather-fog', () => { this.petRenderer.setWeather('fog'); hideMenu(); });

    // 对话测试按钮
    this.bindButton('btn-chat-time', () => {
      this.petRenderer.showBubble(
        this.dialogueManager.getInteractionDialogue()
      );
      hideMenu();
    });
    this.bindButton('btn-chat-weather', () => {
      this.petRenderer.showBubble({ text: '☀️ 阳光真好！', duration: 3000, priority: 'weather' });
      hideMenu();
    });
    this.bindButton('btn-chat-idle', () => {
      this.petRenderer.showBubble({ text: '你好呀~', duration: 3000, priority: 'idle' });
      hideMenu();
    });

    // 地点设置
    const locationInput = document.getElementById('input-location') as HTMLInputElement;
    if (locationInput) {
      locationInput.value = this.weatherService.getLocation();
    }
    this.bindButton('btn-set-location', () => {
      if (locationInput) {
        this.weatherService.setLocation(locationInput.value.trim());
        this.petRenderer.showBubble({
          text: locationInput.value.trim()
            ? `已切换到 ${locationInput.value.trim()} 的天气`
            : '已切换为自动定位',
          duration: 2500,
          priority: 'interaction',
        });
      }
      hideMenu();
    });

    const onOutsideClick = (e: MouseEvent) => {
      if (!this.menuVisible) return;
      const target = e.target as HTMLElement;
      if (target === menuBtn || menu.contains(target)) return;
      hideMenu();
    };
    document.addEventListener('click', onOutsideClick);
    this.cleanupFns.push(() => document.removeEventListener('click', onOutsideClick));

    this.listenTrayEvents(menuBtn);
  }

  destroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }

  private bindButton(id: string, handler: () => void): void {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', handler);
    this.cleanupFns.push(() => btn.removeEventListener('click', handler));
  }

  private async listenTrayEvents(menuBtn: HTMLElement): Promise<void> {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen('toggle-menu-btn', () => {
        const isHidden = menuBtn.classList.contains('hidden');
        menuBtn.classList.toggle('hidden', !isHidden);
      });
      this.cleanupFns.push(unlisten);
    } catch {
      // Tray events not available in non-Tauri environment
    }
  }
}
