# Graph Report - .  (2026-04-23)

## Corpus Check
- Corpus is ~38,985 words - fits in a single context window. You may not need a graph.

## Summary
- 368 nodes ¡¤ 531 edges ¡¤ 29 communities detected
- Extraction: 75% EXTRACTED ¡¤ 25% INFERRED ¡¤ 0% AMBIGUOUS ¡¤ INFERRED: 133 edges (avg confidence: 0.81)
- Token cost: 18,500 input ¡¤ 3,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pet Rendering|Pet Rendering]]
- [[_COMMUNITY_App Core & DI|App Core & DI]]
- [[_COMMUNITY_Architecture Patterns|Architecture Patterns]]
- [[_COMMUNITY_Pet Behavior|Pet Behavior]]
- [[_COMMUNITY_State Management|State Management]]
- [[_COMMUNITY_Animation System|Animation System]]
- [[_COMMUNITY_Interaction System|Interaction System]]
- [[_COMMUNITY_Movement System|Movement System]]
- [[_COMMUNITY_Sprite Rendering|Sprite Rendering]]
- [[_COMMUNITY_Event System|Event System]]
- [[_COMMUNITY_Configuration Types|Configuration Types]]
- [[_COMMUNITY_Window Management|Window Management]]
- [[_COMMUNITY_State Types|State Types]]
- [[_COMMUNITY_Index Exports|Index Exports]]
- [[_COMMUNITY_Service Types|Service Types]]
- [[_COMMUNITY_Behavior Module|Behavior Module]]
- [[_COMMUNITY_Interaction Module|Interaction Module]]
- [[_COMMUNITY_Animation Module|Animation Module]]
- [[_COMMUNITY_Render Module|Render Module]]
- [[_COMMUNITY_Utils|Utils]]
- [[_COMMUNITY_Movement Module|Movement Module]]
- [[_COMMUNITY_Core Module|Core Module]]
- [[_COMMUNITY_Event Types|Event Types]]
- [[_COMMUNITY_Pet Render Module|Pet Render Module]]
- [[_COMMUNITY_Sprite Module|Sprite Module]]
- [[_COMMUNITY_Refactoring Docs|Refactoring Docs]]
- [[_COMMUNITY_Screen Bounds|Screen Bounds]]
- [[_COMMUNITY_Walk Logic|Walk Logic]]
- [[_COMMUNITY_Other|Other]]

## God Nodes (most connected - your core abstractions)
1. `PetBehavior` - 27 edges
2. `App` - 22 edges
3. `MovementController` - 21 edges
4. `PetStateMachine` - 20 edges
5. `ChasingController` - 19 edges
6. `InteractionHandler` - 17 edges
7. `AnimationScheduler` - 15 edges
8. `PetRenderer` - 15 edges
9. `PettingController` - 14 edges
10. `FrameAnimator` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Test Plan` --references--> `MovementController`  [EXTRACTED]
  TEST_PLAN.md ¡ú src/behavior/movement/MovementController.ts
- `Refactor Plan` --rationale_for--> `MovementController`  [EXTRACTED]
  REFACTOR_PLAN.md ¡ú src/behavior/movement/MovementController.ts
- `Refactor Plan` --rationale_for--> `ScreenBoundDetector`  [EXTRACTED]
  REFACTOR_PLAN.md ¡ú src/behavior/movement/ScreenBoundDetector.ts
- `Refactor Plan` --rationale_for--> `WalkDirector`  [EXTRACTED]
  REFACTOR_PLAN.md ¡ú src/behavior/movement/WalkDirector.ts
- `Refactor Plan` --rationale_for--> `EventBus`  [EXTRACTED]
  REFACTOR_PLAN.md ¡ú src/core/EventBus.ts

## Hyperedges (group relationships)
- **Coordinator Pattern Implementation** ¡ª behavior_petbehavior, core_petstatemachine, interaction_interactionhandler, animation_animationscheduler [INFERRED 0.90]
- **State Machine Hierarchy** ¡ª core_petstatemachine, core_statetransition, core_petstate [INFERRED 0.85]
- **Interaction Subsystem** ¡ª interaction_interactionhandler, interaction_pettingcontroller, interaction_chasingcontroller [INFERRED 0.90]
- **Movement System** ¡ª movement_movementcontroller, movement_screenbounddetector, movement_walkdirector [INFERRED 0.85]
- **Rendering Pipeline** ¡ª render_petrenderer, render_spriterenderer, render_frameanimator, render_spritesheet [INFERRED 0.80]
- **Dependency Injection System** ¡ª core_appcontainer, service_container, di_container_pattern [INFERRED 0.85]

## Communities

### Community 0 - "Pet Rendering"
Cohesion: 0.06
Nodes (4): PetAppearance, PetExpression, PetRenderer, SpriteSheet

### Community 1 - "App Core & DI"
Cohesion: 0.06
Nodes (7): App, createApp(), createStorageService(), createWindowManager(), getService(), ServiceContainer, main()

### Community 2 - "Architecture Patterns"
Cohesion: 0.08
Nodes (37): AnimationState, Movement Module, BoundCheckResult, Clean Architecture, AppContainer, EventBus, Core Module, PetAnimation (+29 more)

### Community 3 - "Pet Behavior"
Cohesion: 0.12
Nodes (1): PetBehavior

### Community 4 - "State Management"
Cohesion: 0.11
Nodes (3): PetStateMachine, createDefaultTransitions(), StateTransition

### Community 5 - "Animation System"
Cohesion: 0.11
Nodes (2): AnimationMapping, AnimationScheduler

### Community 6 - "Interaction System"
Cohesion: 0.15
Nodes (1): MovementController

### Community 7 - "Movement System"
Cohesion: 0.14
Nodes (1): InteractionHandler

### Community 8 - "Sprite Rendering"
Cohesion: 0.18
Nodes (1): ChasingController

### Community 9 - "Event System"
Cohesion: 0.15
Nodes (1): SpriteRenderer

### Community 10 - "Configuration Types"
Cohesion: 0.2
Nodes (1): WalkDirector

### Community 11 - "Window Management"
Cohesion: 0.16
Nodes (1): PettingController

### Community 12 - "State Types"
Cohesion: 0.16
Nodes (1): TypedEventEmitter

### Community 13 - "Index Exports"
Cohesion: 0.17
Nodes (1): FrameAnimator

### Community 14 - "Service Types"
Cohesion: 0.22
Nodes (9): AnimationMapping, AnimationScheduler, App, createApp, PetBehavior, ChasingController, InteractionHandler, PettingController (+1 more)

### Community 15 - "Behavior Module"
Cohesion: 0.29
Nodes (1): ScreenBoundDetector

### Community 16 - "Interaction Module"
Cohesion: 0.5
Nodes (4): Dependency Injection Container Pattern, ServiceContainer, StorageService, WindowManager

### Community 17 - "Animation Module"
Cohesion: 1.0
Nodes (2): Observer Pattern (EventBus), TypedEventEmitter

### Community 18 - "Render Module"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Utils"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Movement Module"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Core Module"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Event Types"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Pet Render Module"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Sprite Module"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Refactoring Docs"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Screen Bounds"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Walk Logic"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Other"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **22 isolated node(s):** `main`, `AnimationMapping`, `PettingController`, `ChasingController`, `Dependency Injection Container Pattern` (+17 more)
  These have ¡Ü1 connection - possible missing edges or undocumented components.
- **Thin community `Animation Module`** (2 nodes): `Observer Pattern (EventBus)`, `TypedEventEmitter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Render Module`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Movement Module`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Core Module`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Event Types`** (1 nodes): `PetState.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pet Render Module`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sprite Module`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Refactoring Docs`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Screen Bounds`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Walk Logic`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Other`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PetStateMachine` connect `State Management` to `Pet Behavior`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `PetBehavior` connect `Pet Behavior` to `App Core & DI`, `Configuration Types`, `State Types`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `MovementController` connect `Interaction System` to `App Core & DI`, `Configuration Types`, `Pet Behavior`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `main`, `AnimationMapping`, `PettingController` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pet Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `App Core & DI` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Architecture Patterns` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._