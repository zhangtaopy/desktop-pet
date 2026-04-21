# Graph Report - .  (2026-04-21)

## Corpus Check
- Corpus is ~19,511 words - fits in a single context window. You may not need a graph.

## Summary
- 120 nodes ¡¤ 174 edges ¡¤ 17 communities detected
- Extraction: 80% EXTRACTED ¡¤ 20% INFERRED ¡¤ 0% AMBIGUOUS ¡¤ INFERRED: 34 edges (avg confidence: 0.8)
- Token cost: 5,500 input ¡¤ 1,750 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pet Behavior Logic|Pet Behavior Logic]]
- [[_COMMUNITY_Sprite Rendering|Sprite Rendering]]
- [[_COMMUNITY_Backend Database|Backend Database]]
- [[_COMMUNITY_Architecture Plan|Architecture Plan]]
- [[_COMMUNITY_Window Management|Window Management]]
- [[_COMMUNITY_Time System|Time System]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Type Definitions|Type Definitions]]
- [[_COMMUNITY_Tauri Library|Tauri Library]]
- [[_COMMUNITY_HTML Entry|HTML Entry]]
- [[_COMMUNITY_State Management|State Management]]
- [[_COMMUNITY_App Icon 128|App Icon 128]]
- [[_COMMUNITY_App Icon 128@2x|App Icon 128@2x]]
- [[_COMMUNITY_App Icon 256|App Icon 256]]
- [[_COMMUNITY_App Icon 32|App Icon 32]]
- [[_COMMUNITY_Main App Icon|Main App Icon]]

## God Nodes (most connected - your core abstractions)
1. `PetBehavior` - 30 edges
2. `main()` - 21 edges
3. `PetRenderer` - 11 edges
4. `SpriteRenderer` - 9 edges
5. `TimeManager` - 9 edges
6. `Desktop Pet Development Plan` - 6 edges
7. `Database` - 5 edges
8. `getWindow()` - 4 edges
9. `setWindowPosition()` - 4 edges
10. `set_pet_name()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `initDrag()`  [INFERRED]
  src-tauri\src\main.rs ¡ú src\drag.ts
- `main()` --calls--> `create_tray()`  [INFERRED]
  src-tauri\src\main.rs ¡ú src-tauri\src\tray.rs
- `main()` --calls--> `getScreenBounds()`  [EXTRACTED]
  src-tauri\src\main.rs ¡ú src\main.ts
- `main()` --calls--> `restorePosition()`  [EXTRACTED]
  src-tauri\src\main.rs ¡ú src\main.ts
- `main()` --calls--> `getWindow()`  [EXTRACTED]
  src-tauri\src\main.rs ¡ú src\main.ts

## Communities

### Community 0 - "Pet Behavior Logic"
Cohesion: 0.12
Nodes (1): PetBehavior

### Community 1 - "Sprite Rendering"
Cohesion: 0.12
Nodes (2): PetRenderer, SpriteRenderer

### Community 2 - "Backend Database"
Cohesion: 0.18
Nodes (8): get_mouse_position(), get_pet_state(), MousePosition, save_position(), set_pet_name(), Database, PetState, create_tray()

### Community 3 - "Architecture Plan"
Cohesion: 0.13
Nodes (17): Idle Animation, Sleep Animation, Walk Animation, Window Drag, Data Persistence, Sprite Rendering System, System Tray, Transparent Borderless Window (+9 more)

### Community 4 - "Window Management"
Cohesion: 0.29
Nodes (7): initDrag(), getScreenBounds(), getWindow(), getWindowPosition(), main(), restorePosition(), setWindowPosition()

### Community 5 - "Time System"
Cohesion: 0.33
Nodes (1): TimeManager

### Community 6 - "Build Config"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Type Definitions"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Tauri Library"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "HTML Entry"
Cohesion: 1.0
Nodes (1): Main HTML Entry

### Community 11 - "State Management"
Cohesion: 1.0
Nodes (1): Pet State Management

### Community 12 - "App Icon 128"
Cohesion: 1.0
Nodes (1): App icon 128x128.png

### Community 13 - "App Icon 128@2x"
Cohesion: 1.0
Nodes (1): App icon 128x128@2x.png

### Community 14 - "App Icon 256"
Cohesion: 1.0
Nodes (1): App icon 256x256.png

### Community 15 - "App Icon 32"
Cohesion: 1.0
Nodes (1): App icon 32x32.png

### Community 16 - "Main App Icon"
Cohesion: 1.0
Nodes (1): App icon icon.png

## Knowledge Gaps
- **7 isolated node(s):** `MousePosition`, `Main HTML Entry`, `App icon 128x128.png`, `App icon 128x128@2x.png`, `App icon 256x256.png` (+2 more)
  These have ¡Ü1 connection - possible missing edges or undocumented components.
- **Thin community `Build Config`** (2 nodes): `main()`, `build.rs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Definitions`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tauri Library`** (1 nodes): `lib.rs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HTML Entry`** (1 nodes): `Main HTML Entry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `State Management`** (1 nodes): `Pet State Management`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Icon 128`** (1 nodes): `App icon 128x128.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Icon 128@2x`** (1 nodes): `App icon 128x128@2x.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Icon 256`** (1 nodes): `App icon 256x256.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Icon 32`** (1 nodes): `App icon 32x32.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main App Icon`** (1 nodes): `App icon icon.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `Window Management` to `Pet Behavior Logic`, `Sprite Rendering`, `Backend Database`, `Time System`?**
  _High betweenness centrality (0.415) - this node is a cross-community bridge._
- **Why does `PetBehavior` connect `Pet Behavior Logic` to `Window Management`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `main()` (e.g. with `.getTimeOfDay()` and `.getSleepChanceModifier()`) actually correct?**
  _`main()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MousePosition`, `Main HTML Entry`, `App icon 128x128.png` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pet Behavior Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Sprite Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Architecture Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._