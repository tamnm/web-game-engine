import { SceneManager, World } from '@web-game-engine/core';
import {
  SuperSnakeScene,
  SuperSnakeOptions,
  SuperSnakeInputOptions,
  SuperSnakeUIOptions,
  SnakeGameMode,
} from './game';

export interface BootOptions {
  /** Host element that will receive the canvas. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Optional pre-existing canvas; created automatically when omitted. */
  canvas?: HTMLCanvasElement;
  /** Optional rendering context for tests or custom surfaces. */
  context?: CanvasRenderingContext2D;
  /** Options passed to the Super Snake scene (grid size, speed, etc.). */
  scene?: SuperSnakeSceneConfig;
}

export interface SuperSnakeSceneConfig extends SuperSnakeOptions {
  input?: SuperSnakeInputOptions;
  ui?: SuperSnakeUIOptions;
  leaderboard?: {
    storageKey?: string;
    maxEntries?: number;
    storage?: Storage;
  };
  autoStartMode?: SnakeGameMode;
}

export interface SuperSnakeRuntime {
  canvas: HTMLCanvasElement;
  manager: SceneManager;
  stop(): Promise<void>;
}

export async function bootSuperSnake(options: BootOptions = {}): Promise<SuperSnakeRuntime> {
  const container = options.container ?? document.body;
  const canvas = options.canvas ?? options.context?.canvas ?? document.createElement('canvas');
  if (options.context && options.context.canvas !== canvas) {
    throw new Error('Provided context must be created from the supplied canvas');
  }
  if (!canvas.parentElement) {
    container.appendChild(canvas);
  }
  const context = options.context ?? canvas.getContext('2d');
  if (!context) {
    throw new Error('Super Snake requires a 2D canvas context');
  }

  const manager = new SceneManager(() => new World());
  await manager.push((world) => new SuperSnakeScene(world, { context, ...(options.scene ?? {}) }));

  let running = true;
  let rafId = 0;
  let last = performance.now();

  const step = (time: number) => {
    if (!running) return;
    const delta = time - last;
    last = time;
    manager.update(delta);
    manager.render();
    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);

  async function stop(): Promise<void> {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    await manager.pop();
  }

  const current = manager.current;
  if (current instanceof SuperSnakeScene) {
    const mode = options.scene?.autoStartMode;
    if (mode) {
      current.startGame(mode);
    }
  }

  return { canvas, manager, stop };
}
