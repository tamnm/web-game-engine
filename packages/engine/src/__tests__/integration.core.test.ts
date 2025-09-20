import { describe, expect, it } from 'vitest';
import { Scene, SceneManager } from '../scene';
import { World } from '../ecs/World';
import type { ComponentDefinition } from '../ecs/types';
import { HeadlessRenderer } from '../testing';
import type { Texture } from '../rendering';

interface PositionComponent {
  x: number;
  y: number;
}

interface VelocityComponent {
  x: number;
  y: number;
}

const Position: ComponentDefinition<PositionComponent> = {
  name: 'integration.position',
  defaults: () => ({ x: 0, y: 0 }),
};

const Velocity: ComponentDefinition<VelocityComponent> = {
  name: 'integration.velocity',
  defaults: () => ({ x: 2, y: 0 }),
};

function createTexture(id: string, width = 16, height = 16): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    id,
    width,
    height,
    source: canvas,
  };
}

class IntegrationScene extends Scene {
  private readonly renderer: HeadlessRenderer;
  private readonly texture: Texture;
  private entity: number | null = null;
  private readonly movementSystemId = 'integration.movement';
  private lastStats: { x: number; statsSprites: number } | null = null;

  constructor(world: World, renderer: HeadlessRenderer, texture: Texture) {
    super('integration.scene', world);
    this.renderer = renderer;
    this.texture = texture;
  }

  override onEnter(): void {
    const entity = this.world.createEntity();
    this.world.addComponent(entity, Position, { x: 0, y: 0 });
    this.world.addComponent(entity, Velocity, { x: 2, y: 0 });
    this.entity = entity;

    this.world.registerSystem({
      id: this.movementSystemId,
      stage: 'update',
      execute: ({ world, delta }) => {
        if (this.entity === null) return;
        const position = world.getComponent(this.entity, Position);
        const velocity = world.getComponent(this.entity, Velocity);
        if (!position || !velocity) return;
        const seconds = delta / 1000;
        position.x += velocity.x * seconds;
        position.y += velocity.y * seconds;
      },
    });
  }

  override onExit(): void {
    this.world.unregisterSystem(this.movementSystemId);
    if (this.entity !== null && this.world.hasEntity(this.entity)) {
      this.world.destroyEntity(this.entity);
    }
    this.entity = null;
  }

  override update(delta: number): void {
    this.world.step(delta);
  }

  override render(): void {
    if (this.entity === null) return;
    const position = this.world.getComponent(this.entity, Position);
    if (!position) return;
    this.renderer.begin();
    this.renderer.drawSprite(this.texture, {
      x: position.x,
      y: position.y,
      width: this.texture.width,
      height: this.texture.height,
    });
    const stats = this.renderer.end();
    this.lastStats = { x: position.x, statsSprites: stats.sprites };
  }

  get snapshot(): { x: number; statsSprites: number } | null {
    return this.lastStats;
  }
}

describe('Engine integration', () => {
  it('advances systems and records render commands headlessly', async () => {
    const renderer = new HeadlessRenderer();
    const texture = createTexture('integration-sprite');
    const manager = new SceneManager(() => new World());
    const scene = new IntegrationScene(new World(), renderer, texture);

    await manager.push(() => scene);

    manager.update(500);
    manager.render();

    manager.update(500);
    manager.render();

    const frames = renderer.getFrames();
    expect(frames).toHaveLength(2);
    expect(frames[0].commands).toHaveLength(1);
    expect(frames[0].commands[0].x).toBeCloseTo(1);
    expect(frames[1].commands[0].x).toBeCloseTo(2);
    expect(scene.snapshot?.statsSprites).toBe(1);

    await manager.pop();
  });
});
