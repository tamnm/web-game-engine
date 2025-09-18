import { describe, expect, it } from 'vitest';
import { World, ComponentDefinition } from '../ecs';

interface Position {
  x: number;
  y: number;
}

const PositionComponent: ComponentDefinition<Position> = {
  name: 'position',
  defaults: () => ({ x: 0, y: 0 }),
};

const VelocityComponent: ComponentDefinition<Position> = {
  name: 'velocity',
  defaults: () => ({ x: 1, y: 0 }),
};

describe('World', () => {
  it('updates entities through systems and queries', () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, PositionComponent, { x: 0, y: 0 });
    world.addComponent(entity, VelocityComponent, { x: 10, y: 0 });

    world.registerSystem({
      id: 'movement',
      stage: 'update',
      execute: ({ world, delta }) => {
        type Row = { entity: number; position: Position; velocity: Position };
        for (const row of world.query<Row>({ all: [PositionComponent, VelocityComponent] })) {
          row.position.x += row.velocity.x * (delta / 1000);
        }
      },
    });

    world.step(1000);
    const updated = world.getComponent(entity, PositionComponent);
    expect(updated).toEqual({ x: 10, y: 0 });
  });

  it('serializes and snapshots entities', () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, PositionComponent, { x: 4, y: 2 });

    const snapshot = world.snapshot(entity);
    expect(snapshot.components.position).toEqual({ x: 4, y: 2 });

    const serialized = world.serialize();
    expect(serialized.entities).toContain(entity);
    const entry = serialized.components.find((c) => c.name === PositionComponent.name);
    expect(entry?.data[0]).toEqual({ x: 4, y: 2 });
  });
});
