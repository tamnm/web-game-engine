import { World } from '../ecs';

export interface SceneLifecycleParams {
  world: World;
}

export abstract class Scene {
  protected constructor(
    public readonly id: string,
    protected readonly world: World
  ) {}

  /** Called once when the scene becomes active */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEnter(_params?: Record<string, unknown>): Promise<void> | void {}

  /** Called once when the scene is removed */
  onExit(): Promise<void> | void {}

  /** Update hook executed every frame */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_delta: number): void {}

  /** Optional render hook for scene-specific drawing */
  render(): void {}
}

export interface Transition {
  readonly id: string;
  readonly duration: number;
  start(scene: Scene): void;
  update(scene: Scene, progress: number): void;
  finish(scene: Scene): void;
}

export class NoopTransition implements Transition {
  readonly id = 'noop';
  readonly duration = 0;
  start(): void {}
  update(): void {}
  finish(): void {}
}
