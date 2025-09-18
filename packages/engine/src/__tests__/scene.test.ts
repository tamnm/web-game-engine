import { beforeEach, describe, expect, it } from 'vitest';
import { Scene, SceneManager } from '../scene';
import { World } from '../ecs';
import { MinimalDemoScene } from '../demo/MinimalDemoScene';

class TestScene extends Scene {
  entered = false;
  exited = false;
  ticks = 0;

  constructor(world: World) {
    super('test', world);
  }

  override async onEnter(): Promise<void> {
    this.entered = true;
  }

  override async onExit(): Promise<void> {
    this.exited = true;
  }

  override update(): void {
    this.ticks += 1;
  }
}

describe('SceneManager', () => {
  let manager: SceneManager;

  beforeEach(() => {
    manager = new SceneManager(() => new World());
  });

  it('pushes and pops scenes with lifecycle hooks', async () => {
    const scene = new TestScene(new World());
    await manager.push(() => scene);
    expect(scene.entered).toBe(true);

    await manager.pop();
    expect(scene.exited).toBe(true);
  });

  it('updates current scene each frame', async () => {
    const scene = new TestScene(new World());
    await manager.push(() => scene);
    manager.update(16);
    manager.update(16);
    expect(scene.ticks).toBe(2);
  });

  it('runs minimal demo scene and updates telemetry', () => {
    const world = new World();
    const scene = new MinimalDemoScene(world);
    scene.update(1000);
    expect(scene.lastTelemetry.position.x).toBeGreaterThan(0);
    expect(scene.lastTelemetry.elapsed).toBeCloseTo(1);
  });
});
