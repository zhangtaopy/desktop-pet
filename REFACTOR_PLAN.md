# Desktop Pet 代码重构计划

> 生成时间：2026-04-21  
> 基于 graphify 知识图谱分析结果  
> 当前状态：120 节点 · 174 边 · 17 个社区

---

## 执行摘要

通过知识图谱分析发现，当前代码存在**架构边界模糊**和**模块职责过重**的问题。核心优化方向是：
- 拆分上帝对象 `PetBehavior`（30 连接）
- 解耦超级枢纽 `main()`（21 连接，跨 4 社区）
- 提升低内聚模块的凝聚力
- 建立清晰的跨层通信机制

---

## 问题 1：PetBehavior 上帝对象

### 现状分析

| 指标 | 数值 | 含义 |
|------|------|------|
| 连接数 | 30 条边 | 全图最高，远超过一般类 |
| 社区内聚 | 0.12 | 极低，内部职责松散 |
| 包含方法 | 25+ | 状态/动画/移动/交互混杂 |

**图谱可视化特征**：
- 社区 0（Pet Behavior Logic）几乎完全由 PetBehavior 及其方法组成
- 与社区 4（Window Management）有强桥接关系

### 问题表现

当前 `PetBehavior` 承担以下职责：
1. ✅ **状态管理**：idle/walk/sleep/chase/petting 状态切换
2. ✅ **动画控制**：setAnimation, getCurrentAnimation
3. ✅ **移动逻辑**：updateWalking, 屏幕边界检测
4. ✅ **交互处理**：startPetting, stopPetting, startChasing
5. ✅ **随机行为**：decideNextAction, randomBetween
6. ✅ **缩放控制**：setScaleFactor

### 重构方案：策略模式 + 组合

#### 目标架构

```
src/behavior/
├── index.ts                      # 统一导出
├── PetBehavior.ts                # 协调者（简化至 50 行内）
├── core/
│   ├── PetStateMachine.ts        # 纯状态机（idle/walk/sleep/chase/happy）
│   ├── StateTransition.ts        # 状态流转规则
│   └── PetState.ts               # 状态数据定义
├── movement/
│   ├── MovementController.ts     # 移动控制（速度、方向、边界）
│   ├── ScreenBoundDetector.ts    # 屏幕边界检测
│   └── WalkDirector.ts           # 随机游走算法
├── interaction/
│   ├── InteractionHandler.ts     # 交互协调
│   ├── PettingController.ts      # 抚摸逻辑
│   └── ChasingController.ts      # 鼠标追逐
└── animation/
    ├── AnimationScheduler.ts     # 动画切换调度
    └── AnimationMapping.ts       # 状态→动画映射
```

#### PetBehavior 重构后示例

```typescript
// 只保留协调职责
declare class PetBehavior {
  private stateMachine: PetStateMachine;
  private movement: MovementController;
  private interaction: InteractionHandler;
  private animationScheduler: AnimationScheduler;
  
  // 不再是 25+ 方法，而是委托
  update(dt: number): void;
  onUserPet(): void;
  onMouseMove(pos: Position): void;
}
```

### 预期收益

- **可测试性**：可以单独测试 MovementController 而不依赖整个 PetBehavior
- **可替换性**：可以替换 WalkDirector 实现不同的游走算法
- **可读性**：新开发者能快速定位到具体功能模块
- **图谱改善**：社区 0 分裂为 3-4 个高内聚子社区

---

## 问题 2：main() 超级枢纽

### 现状分析

| 指标 | 数值 | 健康阈值 |
|------|------|----------|
| 连接数 | 21 条边 | <10 |
| 中介中心性 | 0.415 | <0.2 |
| 跨越社区 | 4 个 | <2 |

**图谱可视化特征**：
- 位于社区 4（Window Management）中心
- 与社区 0/1/2/5 均有直接边
- 是前端/后端/渲染/时间的唯一交汇点

### 问题表现

当前 `main()` 直接控制：
```
main()
  ├── initDrag()           # 窗口拖拽
  ├── PetRenderer.start()  # 渲染启动
  ├── restorePosition()    # 位置恢复
  ├── Database.load()      # 数据加载  
  ├── TimeManager.init()   # 时间系统
  └── PetBehavior.update() # 行为更新
```

**违反原则**：单一职责原则、依赖倒置原则

### 重构方案：依赖注入 + 事件总线

#### 阶段一：引入事件总线（低侵入）

```typescript
// src/core/EventBus.ts
interface PetEvents {
  'window:moved': { x: number; y: number };
  'window:resized': { width: number; height: number };
  'pet:stateChanged': { from: State; to: State };
  'time:updated': { hour: number; isNight: boolean };
  'user:petted': { position: Position };
}

export const eventBus = new TypedEventEmitter<PetEvents>();
```

#### 阶段二：服务容器

```typescript
// src/core/AppContainer.ts
interface AppServices {
  windowManager: WindowManager;
  renderer: PetRenderer;
  petBehavior: PetBehavior;
  database: PetDatabase;
  timeManager: TimeManager;
}

export const container = createContainer<AppServices>();
```

#### 阶段三：App 类取代 main()

```typescript
// src/App.ts
export class App {
  constructor(private services: AppServices) {}
  
  async init(): Promise<void> {
    // 并行初始化
    await Promise.all([
      this.services.renderer.load(),
      this.services.database.restore(),
    ]);
    
    // 订阅关系通过事件总线建立，不硬编码
    this.services.windowManager.enableDrag();
    this.services.timeManager.start();
  }
}

// src/main.ts - 仅做装配
const app = new App(createServices());
app.init();
```

### 预期收益

- **可测试性**：可以 mock 任意服务进行单元测试
- **可替换性**：替换 WindowManager 实现不需要修改 App
- **图谱改善**：`main()` 边数从 21 降至 3-5，各模块形成星型而非网状

---

## 问题 3：低内聚模块

### 现状分析

| 社区 | 名称 | 内聚度 | 问题 |
|------|------|--------|------|
| 0 | Pet Behavior Logic | 0.12 | God Class |
| 1 | Sprite Rendering | 0.12 | 渲染与精灵混合 |
| 3 | Architecture Plan | 0.13 | 文档节点孤立 |

**健康标准**：内聚度 > 0.5 为良好，> 0.3 为可接受

### 问题 3a：Sprite Rendering 内聚低

**根因**：`PetRenderer` 和 `SpriteRenderer` 虽然都在渲染，但：
- PetRenderer 关心宠物外观、表情、位置
- SpriteRenderer 是通用精灵动画引擎

**重构方案**：

```
src/render/
├── sprite/                    # 通用引擎（可复用）
│   ├── SpriteRenderer.ts      # 纯精灵渲染
│   ├── SpriteSheet.ts         # 精灵图管理
│   └── FrameAnimator.ts       # 帧动画逻辑
├── pet/                       # 宠物专属
│   ├── PetAppearance.ts       # 外观组合
│   ├── PetExpression.ts       # 表情系统（眨眼等）
│   └── PetRenderer.ts         # 协调者
└── effects/                   # 特效（预留）
    └── ParticleEmitter.ts
```

### 问题 3b：Architecture Plan 社区孤立

**根因**：开发计划文档（desktop-pet-plan.md）中的技术栈节点：
- Tauri、Rust、TypeScript、Canvas、SQLite

这些节点只有**文档边**，没有**代码边**连接到实际文件。

**重构方案（可选）**：

在代码中显性引用技术栈（用于图谱追踪）：

```typescript
// src/config/TechStack.ts
// 此文件仅用于图谱分析，无运行时作用
export const TechStack = {
  framework: 'Tauri',      // 指向 src-tauri/
  frontend: 'TypeScript',  // 指向 src/
  backend: 'Rust',         // 指向 src-tauri/src/
  storage: 'SQLite',       // 指向 database.rs
  build: 'Vite',           // 指向 vite.config.ts
} as const;
```

---

## 问题 4：前后端耦合过紧

### 现状分析

**图谱发现**：社区 2（Backend Database）包含不应属于后端的概念：
- `MousePosition` - 前端鼠标位置
- `create_tray()` - 系统托盘（应该独立为 Integration 层）

### 问题表现

```rust
// commands.rs 混淆了领域逻辑和技术细节
#[tauri::command]
pub fn get_pet_state() -> PetState  // 领域操作 ✅

#[tauri::command]  
pub fn save_position(x: i32, y: i32)  // 窗口管理细节 ❌
```

### 重构方案：分层架构（Clean Architecture）

```
src-tauri/src/
├── domain/              # 核心业务，无任何外部依赖
│   ├── pet/
│   │   ├── Pet.rs           # 实体：宠物属性、行为
│   │   ├── PetRepository.rs # 接口：存储契约
│   │   └── PetState.rs      # 值对象：状态枚举
│   └── common/
│       └── Position.rs      # 通用值对象
├── application/         # 应用用例，依赖 domain
│   ├── pet/
│   │   ├── GetPetState.rs   # 查询用例
│   │   ├── RenamePet.rs     # 命令用例
│   │   └── PetEvents.rs     # 领域事件
│   └── window/
│       └── TrackPosition.rs # 窗口位置追踪
├── infrastructure/      # 技术实现，依赖 application
│   ├── persistence/
│   │   ├── SqliteStorage.rs     # Repository 实现
│   │   └── DatabaseConnection.rs
│   └── platform/
│       ├── TauriCommands.rs     # Tauri 命令适配器
│       ├── SystemTray.rs        # 托盘实现
│       └── WindowManager.rs     # 窗口管理
└── main.rs              # Composition Root，唯一了解所有层的地方
```

### 依赖规则

```
domain ← application ← infrastructure
   ↑
（无外部依赖，可单元测试）
```

---

## 问题 5：孤立节点

### 孤立节点清单

| 节点 | 连接数 | 根因 |
|------|--------|------|
| MousePosition | 1 | 类型定义未与使用方连接 |
| Main HTML Entry | 0 | HTML 未在代码中显性引用 |
| 5 个图标文件 | 0 | 资源文件无代码引用 |

### 重构方案

**MousePosition**：显式导入关系

```typescript
// 不要仅在类型声明中使用
// 要显式建立：src/main.ts ──uses──> MousePosition
import type { MousePosition } from './types/Position';
```

**图标资源**：建立资源清单

```typescript
// src/assets/Icons.ts
import icon128 from '../src-tauri/icons/128x128.png';  // 建立代码边

export const AppIcons = {
  '128x128': icon128,
  // ...
} as const;
```

---

## 重构优先级与路线图

### P0 - 必须立即重构（阻塞其他改进）

| 问题 | 改动范围 | 预计时间 | 风险 |
|------|----------|----------|------|
| 拆分 PetBehavior | 1 个文件 → 6 个文件 | 4-6 小时 | 中等（需测试）|
| 引入事件总线 | 新增 + 修改 5 处 | 2-3 小时 | 低 |

**建议合并为一个 PR**：因为两者都涉及 PetBehavior 的接口变更

### P1 - 应该在本迭代完成

| 问题 | 改动范围 | 预计时间 | 收益 |
|------|----------|----------|------|
| main() 解耦 | main.ts + 新增 | 3-4 小时 | 可测试性大幅提升 |
| Sprite 分包 | 拆分 2 个文件 | 2 小时 | 渲染逻辑清晰 |

### P2 - 可延后（技术债务）

| 问题 | 建议时机 |
|------|----------|
| 后端分层架构 | 需要添加新后端功能时 |
| 消除孤立节点 | 项目文档化阶段 |
| 图标资源引用 | Webpack/Vite 配置优化时 |

---

## 实施建议

### 分支策略

```
main
├── refactor/pet-behavior-split      # P0
│   └── (包含事件总线引入)
├── refactor/main-decoupling         # P1
├── refactor/sprite-structure        # P1
└── refactor/clean-architecture      # P2 (可选)
```

### 验证清单

每个重构 PR 需检查图谱变化：

- [ ] PetBehavior 边数从 30 降至 <15
- [ ] main() 边数从 21 降至 <10
- [ ] 新增社区是否高内聚 (>0.4)
- [ ] 没有新的孤立节点产生
- [ ] EXTRACTED 边比例保持 >75%

### 回滚标准

如出现以下情况，考虑回滚：
- 单元测试覆盖率下降 >10%
- 构建体积增加 >20%
- 运行时性能下降（肉眼可见的卡顿）

---

## 附录：重构前后图谱对比预期

| 指标 | 当前 | 目标 | 改善 |
|------|------|------|------|
| 最大节点度数 | 30 | <15 | 50%↓ |
| 平均中介中心性 | 0.12 | <0.08 | 33%↓ |
| 社区数量 | 17 | 12-14 | 合并碎片化社区 |
| 低内聚社区 (<0.3) | 5 | 1-2 | 模块更清晰 |
| 孤立节点 | 7 | 0-2 | 连接完整性 |

---

## 如何追踪重构进度

每次代码变更后，重新运行：

```bash
/graphify . --update
```

对比图谱变化，特别是：
1. `GRAPH_REPORT.md` 的 God Nodes 列表
2. Surprising Connections 是否减少
3. 社区内聚度是否提升

---

*此文档为重构决策记录，实施后应更新图谱并验证预期改善是否达成。*
