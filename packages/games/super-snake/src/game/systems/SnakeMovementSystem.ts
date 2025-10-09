import type { System } from '@web-game-engine/core';
import {
  Grid,
  GridComponent,
  Snake,
  SnakeComponent,
  SnakeGameState,
  SnakeGameStateComponent,
  SnakeMovement,
  SnakeMovementComponent,
  PowerUpState,
  PowerUpStateComponent,
} from '../components';
import { advancePosition } from '../Grid';
import { applyNextDirection, getHead, stepSnake, willSelfCollide } from '../Snake';
import { getMovementSpeedMultiplier, isGhostPhaseActive } from '../PowerUps';

export function createSnakeMovementSystem(): System {
  return {
    id: 'super-snake.systems.snake-movement',
    stage: 'update',
    order: 0,
    execute: ({ world, delta, elapsed }) => {
      const query = world.query({
        all: [Grid, Snake, SnakeMovement, SnakeGameState],
      });
      if (query.size === 0) return;

      for (const row of query) {
        const entity = row.entity as number;
        const grid = world.getComponent(entity, Grid) as GridComponent | undefined;
        const snake = world.getComponent(entity, Snake) as SnakeComponent | undefined;
        const movement = world.getComponent(entity, SnakeMovement) as
          | SnakeMovementComponent
          | undefined;
        const state = world.getComponent(entity, SnakeGameState) as
          | SnakeGameStateComponent
          | undefined;
        const powerUps = world.getComponent(entity, PowerUpState) as
          | PowerUpStateComponent
          | undefined;

        if (!grid || !snake || !movement || !state) {
          continue;
        }

        if (!snake.alive || snake.segments.length === 0) {
          continue;
        }

        state.mode = grid.mode;
        movement.accumulatorMs += delta;
        const speedMultiplier = getMovementSpeedMultiplier(powerUps, elapsed);
        const effectiveInterval = Math.max(1, movement.moveIntervalMs * speedMultiplier);
        const ghostPhase = isGhostPhaseActive(powerUps, elapsed);

        while (movement.accumulatorMs >= effectiveInterval) {
          movement.accumulatorMs -= effectiveInterval;

          const direction = applyNextDirection(snake);
          const head = getHead(snake);
          const { position: nextPosition, collided } = advancePosition(
            head,
            direction,
            grid,
            state.mode
          );

          const selfCollision = ghostPhase ? false : willSelfCollide(snake, nextPosition);

          if (collided || selfCollision) {
            snake.alive = false;
            movement.accumulatorMs = 0;
            break;
          }

          stepSnake(snake, nextPosition);
          state.ticks += 1;
          state.lastMoveAt = elapsed;
        }
      }
    },
  };
}
