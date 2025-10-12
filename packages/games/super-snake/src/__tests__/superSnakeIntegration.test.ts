import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { World } from '@web-game-engine/core';
import { bootSuperSnake } from '../main';
import { SuperSnakeScene, SnakeGameState } from '../game';
import { DEFAULT_LEVEL_PRESETS } from '../game/LevelPresets';

interface StubbedCanvasContext {
  canvas: HTMLCanvasElement;
  fillRect: ReturnType<typeof vi.fn>;
}

describe('Super Snake integration', () => {
  let rafQueue: FrameRequestCallback[];
  let now: number;

  beforeEach(() => {
    now = 0;
    rafQueue = [];
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    let rafId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      rafId += 1;
      return rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  function createStubContext(
    canvas: HTMLCanvasElement
  ): StubbedCanvasContext & CanvasRenderingContext2D {
    const fillRect = vi.fn();
    const stub: Record<string, unknown> = {
      canvas,
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect,
    };
    Object.defineProperties(stub, {
      fillStyle: {
        get: () => '#000',
        set: vi.fn(),
      },
      strokeStyle: {
        get: () => '#fff',
        set: vi.fn(),
      },
      lineWidth: {
        get: () => 1,
        set: vi.fn(),
      },
    });
    return stub as unknown as CanvasRenderingContext2D & StubbedCanvasContext;
  }

  function runFrame(delta: number): void {
    const callback = rafQueue.shift();
    if (!callback) {
      throw new Error('No frame queued; did the loop schedule requestAnimationFrame?');
    }
    now += delta;
    callback(now);
  }

  it('boots, advances frames, spawns weighted food, and tracks combos deterministically', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    const context = createStubContext(canvas);
    vi.spyOn(canvas, 'getContext').mockReturnValue(context);

    const randomValues = [0.3, 0.05, 0.3, 0.95];
    let randomIndex = 0;
    const random = () => {
      const value = randomValues[randomIndex] ?? 0;
      randomIndex += 1;
      return value;
    };

    const runtime = await bootSuperSnake({
      container,
      canvas,
      context,
      scene: {
        gridWidth: 6,
        gridHeight: 4,
        cellSize: 10,
        moveIntervalMs: 100,
        mode: 'wrap',
        direction: 'right',
        spawn: { x: 5, y: 1 },
        foodMaxActive: 1,
        random,
        autoStartMode: 'classic',
        levelId: 'test-lab',
        levelDefinitions: [
          {
            id: 'test-lab',
            name: 'Test Lab',
            theme: {
              id: 'test-theme',
              backgroundColor: '#021016',
              gridLineColor: 'rgba(255, 255, 255, 0.08)',
              snakeBodyColor: '#8ef9b0',
              snakeHeadColor: '#c8ffe0',
              obstacleColor: '#123042',
              hazardColor: '#f26c6c',
              overlayColor: undefined,
            },
            obstacles: [],
            hazards: [],
          },
        ],
      },
    });

    expect(runtime.canvas).toBe(canvas);
    expect(container.contains(canvas)).toBe(true);
    expect(rafQueue).toHaveLength(1);

    const scene = runtime.manager.current as SuperSnakeScene;
    expect(scene).toBeInstanceOf(SuperSnakeScene);

    let state = scene.getDebugState();
    expect(state?.snake.segments[0]).toMatchObject({ x: 5, y: 1 });
    expect(state?.food.items).toHaveLength(1);
    expect(state?.food.items[0]).toMatchObject({ x: 0, y: 1, type: 'apple' });
    expect(state?.state.score).toBe(0);

    runFrame(100); // advance one move
    state = scene.getDebugState();
    expect(state?.snake.segments[0]).toMatchObject({ x: 0, y: 1 });
    expect(state?.food.items[0]).toMatchObject({ x: 1, y: 1, type: 'starfruit' });
    expect(state?.state.score).toBe(10);
    expect(state?.state.comboCount).toBe(1);
    expect(context.fillRect).toHaveBeenCalled();
    expect(canvas.width).toBe(6 * 10);
    expect(canvas.height).toBe(4 * 10);
    expect(canvas.style.width).toBe('60px');
    expect(canvas.style.height).toBe('40px');

    runFrame(100);
    state = scene.getDebugState();
    expect(state?.snake.segments[0]).toMatchObject({ x: 1, y: 1 });
    expect(state?.state.score).toBe(310);
    expect(state?.state.comboCount).toBe(4);
    expect(state?.state.maxCombo).toBe(4);

    await runtime.stop();
    const cancel = globalThis.cancelAnimationFrame as ReturnType<typeof vi.fn>;
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('levels up when score thresholds are reached and carries score forward', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const context = createStubContext(canvas);
    vi.spyOn(canvas, 'getContext').mockReturnValue(context);

    const world = new World();
    const scene = new SuperSnakeScene(world, { context, ui: { container } });
    scene.onEnter();
    scene.startGame('classic');

    const internals = scene as unknown as {
      snakeEntity: number | null;
      phase: string;
      applyPendingLevelUp(): void;
      ui: { getState(): string };
    };

    const firstThreshold = DEFAULT_LEVEL_PRESETS[0].progression.nextScoreThreshold;
    expect(firstThreshold).not.toBeNull();
    const snakeEntity = internals.snakeEntity;
    expect(snakeEntity).not.toBeNull();
    const state = world.getComponent(snakeEntity!, SnakeGameState);
    expect(state).toBeDefined();
    if (!state || firstThreshold === null) {
      throw new Error('Level progression prerequisites missing');
    }

    state.score = firstThreshold - 10;
    scene.update(0);
    expect(internals.phase).toBe('playing');

    state.score = firstThreshold;
    scene.update(0);
    expect(internals.phase).toBe('level-up');
    expect(internals.ui.getState()).toBe('level-up');

    internals.applyPendingLevelUp();
    expect(internals.phase).toBe('playing');
    let debug = scene.getDebugState();
    expect(debug?.level?.id).toBe('ember-dunes');
    expect(debug?.state.score).toBe(firstThreshold);

    const secondThreshold = DEFAULT_LEVEL_PRESETS[1].progression.nextScoreThreshold;
    expect(secondThreshold).not.toBeNull();
    if (secondThreshold === null) {
      throw new Error('Second level threshold missing');
    }
    const secondEntity = internals.snakeEntity;
    expect(secondEntity).not.toBeNull();
    const secondState = world.getComponent(secondEntity!, SnakeGameState);
    expect(secondState).toBeDefined();
    if (!secondState) {
      throw new Error('Unable to access state for second level');
    }

    secondState.score = secondThreshold - 10;
    scene.update(0);
    expect(internals.phase).toBe('playing');

    secondState.score = secondThreshold;
    scene.update(0);
    expect(internals.ui.getState()).toBe('level-up');

    internals.applyPendingLevelUp();
    debug = scene.getDebugState();
    expect(debug?.level?.id).toBe('midnight-market');
    expect(debug?.state.score).toBe(secondThreshold);

    scene.onExit();
  });
});
