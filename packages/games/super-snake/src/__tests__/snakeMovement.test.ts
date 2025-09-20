import { describe, expect, it } from 'vitest';
import { World } from '@web-game-engine/core';
import {
  Snake,
  SnakeComponent,
  SnakeDirection,
  SnakeMovement,
  SnakeMovementComponent,
  spawnSuperSnake,
  createSnakeMovementSystem,
} from '../game';

function stepWorld(world: World, delta: number): void {
  world.step(delta);
}

function configureSnakeShape(
  world: World,
  entity: number,
  segments: Array<{ x: number; y: number }>,
  direction: SnakeDirection
): SnakeComponent {
  const snake = world.getComponent(entity, Snake);
  if (!snake) throw new Error('Snake component missing in test setup');
  snake.segments = segments.map(({ x, y }) => ({ x, y }));
  snake.direction = direction;
  snake.nextDirection = direction;
  snake.pendingGrowth = 0;
  snake.alive = true;
  return snake;
}

describe('Super Snake movement system', () => {
  it('wraps around grid edges in wrap mode', () => {
    const world = new World();
    const entity = spawnSuperSnake(world, {
      gridWidth: 5,
      gridHeight: 5,
      moveIntervalMs: 100,
      mode: 'wrap',
      direction: 'right',
      spawn: { x: 4, y: 2 },
    });

    world.registerSystem(createSnakeMovementSystem());
    stepWorld(world, 100);

    const snake = world.getComponent(entity, Snake);
    expect(snake?.segments[0]).toMatchObject({ x: 0, y: 2 });
    expect(snake?.alive).toBe(true);
  });

  it('dies when colliding with wall in solid mode', () => {
    const world = new World();
    const entity = spawnSuperSnake(world, {
      gridWidth: 5,
      gridHeight: 5,
      moveIntervalMs: 100,
      mode: 'solid',
      direction: 'right',
      spawn: { x: 4, y: 2 },
    });

    world.registerSystem(createSnakeMovementSystem());
    stepWorld(world, 100);

    const snake = world.getComponent(entity, Snake);
    expect(snake?.alive).toBe(false);
  });

  it('dies on self-collision when running into its body', () => {
    const world = new World();
    const entity = spawnSuperSnake(world, {
      gridWidth: 6,
      gridHeight: 6,
      moveIntervalMs: 100,
      mode: 'wrap',
      direction: 'right',
      spawn: { x: 3, y: 3 },
      initialLength: 5,
    });

    const snake = configureSnakeShape(
      world,
      entity,
      [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
      'up'
    );

    const movement = world.getComponent(entity, SnakeMovement) as
      | SnakeMovementComponent
      | undefined;
    if (movement) {
      movement.moveIntervalMs = 100;
      movement.accumulatorMs = 0;
    }

    // Force the next turn towards the left so the head hits the body.
    snake.nextDirection = 'left';

    world.registerSystem(createSnakeMovementSystem());
    stepWorld(world, 100);

    expect(snake.alive).toBe(false);
  });
});
