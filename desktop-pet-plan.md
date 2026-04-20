# 桌面像素宠物开发计划

## 项目概述

一个跨平台的桌面像素宠物应用，支持 macOS 和 Windows。

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Tauri 2.0 + Rust |
| 前端 | TypeScript + 原生 HTML/CSS |
| 动画 | Canvas 2D API |
| 构建 | Vite |
| 数据存储 | SQLite (通过 Rust) |

### 最终目标

- 打包体积：约 5-10 MB
- 内存占用：约 50-100 MB
- 支持 macOS 和 Windows

---

## 阶段一：项目初始化与环境搭建

### 步骤 1.1：安装前置依赖

**macOS:**
```bash
# 安装 Homebrew（如果没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri 依赖
brew install cairo pkg-config
```

**Windows:**
```powershell
# 安装 Node.js（从官网下载安装包）
# https://nodejs.org/

# 安装 Rust
# 从 https://rustup.rs/ 下载安装

# 安装 Visual Studio Build Tools
# 从 https://visualstudio.microsoft.com/ 下载
# 勾选 "Desktop development with C++"
```

**验证安装:**
```bash
node --version    # 应显示 v18+ 或更高
npm --version     # 应显示 9+ 或更高
rustc --version   # 应显示 rustc 版本
cargo --version   # 应显示 cargo 版本
```

---

### 步骤 1.2：创建 Tauri 项目

```bash
# 使用 pnpm（推荐）或 npm
npm install -g pnpm

# 创建项目
pnpm create tauri-app desktop-pet

# 交互式选择：
# - Package manager: pnpm
# - UI template: Vanilla
# - UI flavor: TypeScript
```

**项目创建后的目录结构:**
```
desktop-pet/
├── src/                    # 前端源码
│   ├── main.ts
│   ├── styles.css
│   └── vite-env.d.ts
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### 步骤 1.3：安装前端依赖

```bash
cd desktop-pet

# 安装基础依赖
pnpm install

# 安装 Tauri CLI（如果还没装）
pnpm add -D @tauri-apps/cli
```

---

### 步骤 1.4：验证项目可运行

```bash
# 启动开发模式
pnpm tauri dev
```

**预期结果:**
- 打开一个窗口，显示默认的 Tauri 欢迎页面
- 没有报错信息

**完成后标记:** ✅ 阶段一完成

---

## 阶段二：透明无边框窗口

### 步骤 2.1：修改 Tauri 配置

**编辑 `src-tauri/tauri.conf.json`:**

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Desktop Pet",
        "width": 128,
        "height": 128,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "resizable": false,
        "center": false,
        "x": 100,
        "y": 100
      }
    ],
    "security": {
      "csp": null
    },
    "withGlobalTauri": true
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**关键配置说明:**

| 配置项 | 值 | 作用 |
|--------|-----|------|
| `decorations` | `false` | 移除标题栏和边框 |
| `transparent` | `true` | 允许窗口透明 |
| `alwaysOnTop` | `true` | 始终显示在最前面 |
| `skipTaskbar` | `true` | 不在任务栏显示 |
| `resizable` | `false` | 禁止调整大小 |

---

### 步骤 2.2：创建透明背景的前端页面

**编辑 `index.html`:**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Desktop Pet</title>
  </head>
  <body>
    <div id="app">
      <canvas id="pet-canvas"></canvas>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**编辑 `src/styles.css`:**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 128px;
  height: 128px;
  background: transparent;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

#app {
  width: 100%;
  height: 100%;
}

#pet-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

#pet-canvas:active {
  cursor: grabbing;
}
```

**编辑 `src/main.ts`:**

```typescript
import './styles.css';

const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (ctx) {
  canvas.width = 128;
  canvas.height = 128;

  // 临时：绘制一个测试方块
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(32, 32, 64, 64);

  console.log('Canvas initialized');
}
```

---

### 步骤 2.3：配置 macOS 特殊权限

**编辑 `src-tauri/Cargo.toml`，添加 macOS 权限:**

```toml
[dependencies]
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

---

### 步骤 2.4：测试透明窗口

```bash
pnpm tauri dev
```

**预期结果:**
- 窗口没有标题栏和边框
- 背景透明
- 显示一个红色方块
- 窗口始终在最前面
- 任务栏没有图标

**完成后标记:** ✅ 阶段二完成

---

## 阶段三：窗口拖拽功能

### 步骤 3.1：创建窗口拖拽模块

**创建 `src/drag.ts`:**

```typescript
interface Position {
  x: number;
  y: number;
}

export function initDrag(canvas: HTMLCanvasElement): void {
  let isDragging = false;
  let dragStart: Position = { x: 0, y: 0 };

  const { getCurrentWindow } = window.__TAURI__.window;
  const win = getCurrentWindow();

  canvas.addEventListener('mousedown', async (e: MouseEvent) => {
    isDragging = true;
    const position = await win.outerPosition();
    dragStart = {
      x: e.screenX - position.x,
      y: e.screenY - position.y
    };
  });

  document.addEventListener('mousemove', async (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.screenX - dragStart.x;
    const newY = e.screenY - dragStart.y;

    await win.setPosition({ type: 'Physical', x: newX, y: newY });
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}
```

---

### 步骤 3.2：在主文件中使用拖拽

**更新 `src/main.ts`:**

```typescript
import './styles.css';
import { initDrag } from './drag';

const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (ctx) {
  canvas.width = 128;
  canvas.height = 128;
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(32, 32, 64, 64);
  console.log('Canvas initialized');
}

initDrag(canvas);
console.log('Drag initialized');
```

---

### 步骤 3.3：测试拖拽功能

```bash
pnpm tauri dev
```

**预期结果:**
- 可以用鼠标拖拽红色方块移动窗口
- 拖拽时光标变化

**完成后标记:** ✅ 阶段三完成

---

## 阶段四：像素精灵渲染系统

### 步骤 4.1：创建资源目录

```bash
mkdir -p assets/sprites
```

### 步骤 4.2：配置 Vite

**更新 `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  publicDir: 'assets',
});
```

### 步骤 4.3：创建精灵渲染器

**创建 `src/renderer/SpriteRenderer.ts`:**

```typescript
export interface SpriteConfig {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameDuration: number;
}

export class SpriteRenderer {
  private image: HTMLImageElement | null = null;
  private config: SpriteConfig;
  private currentFrame: number = 0;
  private lastFrameTime: number = 0;
  private isLoaded: boolean = false;

  constructor(config: SpriteConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      this.image.onerror = reject;
      this.image.src = this.config.src;
    });
  }

  update(deltaTime: number): void {
    if (!this.isLoaded) return;
    this.lastFrameTime += deltaTime;

    if (this.lastFrameTime >= this.config.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
      this.lastFrameTime = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1): void {
    if (!this.isLoaded || !this.image) return;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      this.image,
      this.currentFrame * this.config.frameWidth,
      0,
      this.config.frameWidth,
      this.config.frameHeight,
      x,
      y,
      this.config.frameWidth * scale,
      this.config.frameHeight * scale
    );
  }

  loaded(): boolean {
    return this.isLoaded;
  }
}
```

### 步骤 4.4：创建宠物渲染类

**创建 `src/renderer/PetRenderer.ts`:**

```typescript
import { SpriteRenderer, SpriteConfig } from './SpriteRenderer';

export enum PetAnimation {
  Idle = 'idle',
  Walk = 'walk',
  Sleep = 'sleep',
}

export class PetRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Map<PetAnimation, SpriteRenderer> = new Map();
  private currentAnimation: PetAnimation = PetAnimation.Idle;
  private lastTime: number = 0;
  private displaySize: number = 64;

  constructor(canvas: HTMLCanvasElement, displaySize: number = 64) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.displaySize = displaySize;
  }

  async loadAnimations(): Promise<void> {
    const configs: Record<PetAnimation, SpriteConfig> = {
      [PetAnimation.Idle]: {
        src: '/sprites/idle.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        frameDuration: 200,
      },
      [PetAnimation.Walk]: {
        src: '/sprites/walk.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        frameDuration: 150,
      },
      [PetAnimation.Sleep]: {
        src: '/sprites/sleep.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 2,
        frameDuration: 500,
      },
    };

    for (const [anim, config] of Object.entries(configs)) {
      const renderer = new SpriteRenderer(config);
      this.sprites.set(anim as PetAnimation, renderer);
      await renderer.load().catch(() => console.warn(`Failed to load ${anim}`));
    }
  }

  setAnimation(animation: PetAnimation): void {
    this.currentAnimation = animation;
  }

  update(timestamp: number): void {
    const deltaTime = this.lastTime ? timestamp - this.lastTime : 0;
    this.lastTime = timestamp;

    const sprite = this.sprites.get(this.currentAnimation);
    if (sprite?.loaded()) {
      sprite.update(deltaTime);
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sprite = this.sprites.get(this.currentAnimation);

    if (sprite?.loaded()) {
      const scale = this.displaySize / 32;
      const x = (this.canvas.width - this.displaySize) / 2;
      const y = (this.canvas.height - this.displaySize) / 2;
      sprite.render(this.ctx, x, y, scale);
    } else {
      this.drawFallback();
    }
  }

  private drawFallback(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = '#4ecdc4';
    const x = (this.canvas.width - this.displaySize) / 2;
    const y = (this.canvas.height - this.displaySize) / 2;
    this.ctx.fillRect(x, y, this.displaySize, this.displaySize);
  }

  start(): void {
    const loop = (timestamp: number) => {
      this.update(timestamp);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
```

### 步骤 4.5：更新主入口

**更新 `src/main.ts`:**

```typescript
import './styles.css';
import { initDrag } from './drag';
import { PetRenderer, PetAnimation } from './renderer/PetRenderer';

async function main() {
  const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
  canvas.width = 128;
  canvas.height = 128;

  const petRenderer = new PetRenderer(canvas, 64);
  await petRenderer.loadAnimations();

  initDrag(canvas);
  petRenderer.start();

  // 测试：每 5 秒切换动画
  const animations = [PetAnimation.Idle, PetAnimation.Walk, PetAnimation.Sleep];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % animations.length;
    petRenderer.setAnimation(animations[i]);
  }, 5000);
}

main().catch(console.error);
```

### 步骤 4.6：准备精灵图

将精灵图放入 `assets/sprites/` 目录：
- `idle.png` - 128x32 (4帧 x 32px)
- `walk.png` - 128x32
- `sleep.png` - 64x32 (2帧)

如果没有精灵图，会显示降级的彩色方块。

### 步骤 4.7：测试

```bash
pnpm tauri dev
```

**完成后标记:** ✅ 阶段四完成

---

## 阶段五：系统托盘

### 步骤 5.1：创建托盘模块

**创建 `src-tauri/src/tray.rs`:**

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn create_tray(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示宠物", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "隐藏宠物", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}
```

### 步骤 5.2：更新主入口

**更新 `src-tauri/src/main.rs`:**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tray;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 步骤 5.3：测试托盘

```bash
pnpm tauri dev
```

**预期结果:**
- 系统托盘显示图标
- 右键菜单：显示/隐藏/退出

**完成后标记:** ✅ 阶段五完成

---

## 阶段六：宠物状态管理

### 步骤 6.1：创建状态模块

**创建 `src-tauri/src/pet.rs`:**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetState {
    pub name: String,
    pub mood: String,
    pub position_x: i32,
    pub position_y: i32,
}

impl Default for PetState {
    fn default() -> Self {
        Self {
            name: "小像素".into(),
            mood: "normal".into(),
            position_x: 100,
            position_y: 100,
        }
    }
}
```

### 步骤 6.2：创建命令

**创建 `src-tauri/src/commands.rs`:**

```rust
use crate::pet::PetState;

#[tauri::command]
pub fn get_pet_state() -> PetState {
    PetState::default()
}

#[tauri::command]
pub fn set_pet_name(name: String) -> PetState {
    let mut state = PetState::default();
    state.name = name;
    state
}
```

### 步骤 6.3：注册命令

**更新 `src-tauri/src/main.rs`:**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod pet;
mod tray;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_pet_state,
            commands::set_pet_name,
        ])
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**完成后标记:** ✅ 阶段六完成

---

## 阶段七：数据持久化

### 步骤 7.1：添加 SQLite 依赖

**编辑 `src-tauri/Cargo.toml`:**

```toml
[dependencies]
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
directories = "5"
```

### 步骤 7.2：创建数据库模块

**创建 `src-tauri/src/database.rs`:**

```rust
use crate::pet::PetState;
use directories::ProjectDirs;
use rusqlite::Connection;
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let db_path = Self::get_db_path();
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS pet_state (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '小像素',
                position_x INTEGER NOT NULL DEFAULT 100,
                position_y INTEGER NOT NULL DEFAULT 100
            )",
            [],
        )?;

        conn.execute(
            "INSERT OR IGNORE INTO pet_state (id) VALUES (1)",
            [],
        )?;

        Ok(Self { conn })
    }

    fn get_db_path() -> PathBuf {
        ProjectDirs::from("com", "desktop-pet", "DesktopPet")
            .map(|d| d.data_dir().join("pet.db"))
            .unwrap_or_else(|| PathBuf::from("pet.db"))
    }

    pub fn save(&self, state: &PetState) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE pet_state SET name = ?1, position_x = ?2, position_y = ?3 WHERE id = 1",
            [&state.name, &state.position_x.to_string(), &state.position_y.to_string()],
        )?;
        Ok(())
    }

    pub fn load(&self) -> Result<PetState, rusqlite::Error> {
        self.conn.query_row(
            "SELECT name, position_x, position_y FROM pet_state WHERE id = 1",
            [],
            |row| Ok(PetState {
                name: row.get(0)?,
                mood: "normal".into(),
                position_x: row.get(1)?,
                position_y: row.get(2)?,
            }),
        )
    }
}
```

### 步骤 7.3：集成数据库

**更新 `src-tauri/src/main.rs` 并在命令中使用数据库保存/加载状态。**

**完成后标记:** ✅ 阶段七完成

---

## 阶段八：构建与打包

### 步骤 8.1：配置打包信息

**编辑 `src-tauri/tauri.conf.json`:**

```json
{
  "productName": "Desktop Pet",
  "version": "0.1.0",
  "identifier": "com.desktop-pet.app",
  "bundle": {
    "active": true,
    "targets": ["dmg", "app", "nsis"],
    "publisher": "Your Name",
    "shortDescription": "A cute pixel desktop pet"
  }
}
```

### 步骤 8.2：优化构建

**编辑 `src-tauri/Cargo.toml`:**

```toml
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

### 步骤 8.3：构建

```bash
pnpm tauri build
```

**产物位置:**
- macOS: `src-tauri/target/release/bundle/`
- Windows: `src-tauri/target/release/bundle/nsis/`

**完成后标记:** ✅ 阶段八完成

---

## 阶段九：后续扩展（可选）

### 9.1 随机行为
- [ ] 随机走动
- [ ] 屏幕边界检测
- [ ] 随机睡觉/醒来

### 9.2 交互功能
- [ ] 点击抚摸动画
- [ ] 右键菜单自定义动作
- [ ] 拖拽时反应

### 9.3 系统集成
- [ ] 时间感知（白天/黑夜）
- [ ] 天气显示
- [ ] 提醒功能

### 9.4 个性化
- [ ] 多种宠物选择
- [ ] 设置面板
- [ ] 宠物换装

---

## 进度追踪

| 阶段 | 状态 |
|------|------|
| 一：项目初始化 | ✅ |
| 二：透明窗口 | ✅ |
| 三：拖拽功能 | ✅ |
| 四：精灵渲染 | ✅ |
| 五：系统托盘 | ✅ |
| 六：状态管理 | ✅ |
| 七：数据持久化 | ✅ |
| 八：构建打包 | ✅ |
| 九：扩展功能 | ✅ |

---

*文档版本: 1.0*
