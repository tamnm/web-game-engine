# SceneManager

Kind: class

## Members

- stack
- transitions
- activeTransition
- events
- (anonymous)
- registerTransition — (transition: Transition): void
- current
- push — (sceneFactory: (world: World) => Scene, transitionId?: string): Promise<void>
- replace — (sceneFactory: (world: World) => Scene, transitionId?: string): Promise<void>
- pop — (transitionId?: string): Promise<void>
- update — (delta: number): void
- render — (): void
- beginTransition — (from: Scene, to: Scene, transitionId: string): void
