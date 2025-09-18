import { Scene } from '../scene';
import { World, ComponentDefinition } from '../ecs';
import { vec2, Vec2 } from '../math/Vec2';
import { AssetManager } from '../assets';

interface PositionComponent {
  value: Vec2;
}

interface VelocityComponent {
  value: Vec2;
}

const Position: ComponentDefinition<PositionComponent> = {
  name: 'position',
  defaults: () => ({ value: vec2() }),
};

const Velocity: ComponentDefinition<VelocityComponent> = {
  name: 'velocity',
  defaults: () => ({ value: vec2(1, 0) }),
};

export interface DemoTelemetry {
  position: Vec2;
  elapsed: number;
}

/**
 * Minimal demo scene that wires the ECS world, a movement system, and the asset manager.
 * It is intentionally lightweight and meant to be used as a smoke test or template.
 */
export class MinimalDemoScene extends Scene {
  private readonly assetManager = new AssetManager();
  private telemetry: DemoTelemetry = { position: vec2(), elapsed: 0 };

  constructor(world: World) {
    super('minimal-demo', world);
    this.registerSystems();
    this.spawnEntity();
  }

  get lastTelemetry(): DemoTelemetry {
    return this.telemetry;
  }

  private registerSystems(): void {
    this.world.registerSystem({
      id: 'movement-system',
      stage: 'update',
      execute: ({ world, delta }) => {
        const seconds = delta / 1000;
        type Row = { entity: number; position: PositionComponent; velocity: VelocityComponent };
        for (const row of world.query<Row>({ all: [Position, Velocity] })) {
          row.position.value.x += row.velocity.value.x * seconds;
          row.position.value.y += row.velocity.value.y * seconds;
          this.telemetry.position = { ...row.position.value };
          this.telemetry.elapsed += seconds;
        }
      },
    });
  }

  private spawnEntity(): void {
    const entity = this.world.createEntity();
    this.world.addComponent(entity, Position, Position.defaults!());
    this.world.addComponent(entity, Velocity, Velocity.defaults!());
  }

  override update(delta: number): void {
    this.world.step(delta);
  }

  /** Preload assets required for the demo. */
  async preloadAssets(manifest: { key: string; source: string }[]): Promise<void> {
    await this.assetManager.load(manifest.map((entry) => ({ ...entry }))); // progress events available
  }
}
