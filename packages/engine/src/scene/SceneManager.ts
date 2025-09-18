import { EventEmitter } from '../utils/EventEmitter';
import { World } from '../ecs';
import { NoopTransition, Scene, Transition } from './Scene';

export interface SceneManagerEvents {
  pushed: { scene: Scene };
  popped: { scene: Scene };
  replaced: { from: Scene; to: Scene };
  [key: string]: unknown;
}

export class SceneManager {
  private readonly stack: Scene[] = [];
  private readonly transitions = new Map<string, Transition>();
  private activeTransition: {
    transition: Transition;
    from?: Scene;
    to: Scene;
    elapsed: number;
  } | null = null;

  readonly events = new EventEmitter<SceneManagerEvents>();

  constructor(private readonly worldFactory: () => World) {
    // register default transition
    this.registerTransition(new NoopTransition());
  }

  registerTransition(transition: Transition): void {
    this.transitions.set(transition.id, transition);
  }

  get current(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  async push(sceneFactory: (world: World) => Scene, transitionId: string = 'noop') {
    const world = this.worldFactory();
    const scene = sceneFactory(world);
    await scene.onEnter();
    this.stack.push(scene);
    this.events.emit('pushed', { scene });
    this.beginTransition(undefined, scene, transitionId);
  }

  async replace(sceneFactory: (world: World) => Scene, transitionId: string = 'noop') {
    const previous = this.current;
    const world = this.worldFactory();
    const scene = sceneFactory(world);
    await scene.onEnter();
    if (previous) {
      this.stack[this.stack.length - 1] = scene;
      this.events.emit('replaced', { from: previous, to: scene });
      this.beginTransition(previous, scene, transitionId);
    } else {
      this.stack.push(scene);
      this.events.emit('pushed', { scene });
      this.beginTransition(undefined, scene, transitionId);
    }
  }

  async pop(transitionId: string = 'noop') {
    const scene = this.stack.pop();
    if (!scene) return;
    await scene.onExit();
    this.events.emit('popped', { scene });
    const next = this.current;
    if (next) {
      this.beginTransition(scene, next, transitionId);
    }
  }

  update(delta: number): void {
    if (this.activeTransition) {
      const current = this.activeTransition;
      current.elapsed += delta;
      const progress = current.transition.duration
        ? Math.min(1, current.elapsed / current.transition.duration)
        : 1;
      current.transition.update(current.to, progress);
      if (progress >= 1) {
        current.transition.finish(current.to);
        this.activeTransition = null;
      }
    }
    this.current?.update(delta);
  }

  render(): void {
    this.current?.render();
  }

  private beginTransition(from: Scene | undefined, to: Scene, transitionId: string) {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      throw new Error(`Unknown transition: ${transitionId}`);
    }
    transition.start(to);
    this.activeTransition = { transition, from, to, elapsed: 0 };
  }
}
