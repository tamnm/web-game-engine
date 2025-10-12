import type { System } from '@web-game-engine/core';
import { Grid, LevelState, LevelStateComponent, Snake, SnakeComponent } from '../components';
import { stepHazards } from '../Level';

export function createHazardSystem(): System {
  return {
    id: 'super-snake.systems.hazards',
    stage: 'update',
    order: 1,
    execute: ({ world, elapsed }) => {
      const rows = world.query({
        all: [Grid, Snake, LevelState],
      });
      if (rows.size === 0) return;

      for (const row of rows) {
        const entity = row.entity as number;
        const snake = world.getComponent(entity, Snake) as SnakeComponent | undefined;
        const level = world.getComponent(entity, LevelState) as LevelStateComponent | undefined;

        if (!snake || !level) {
          continue;
        }
        if (!snake.alive || snake.segments.length === 0) {
          continue;
        }

        const hazardsDisabled = level.hazardsDisabledUntil > elapsed;

        if (!hazardsDisabled) {
          stepHazards(level, elapsed);
        }

        if (!hazardsDisabled) {
          const hazardHit = level.hazards.some((hazard) =>
            snake.segments.some(
              (segment) =>
                hazard.active !== false &&
                segment.x === hazard.position.x &&
                segment.y === hazard.position.y
            )
          );
          if (hazardHit) {
            snake.alive = false;
          }
        }
      }
    },
  };
}
