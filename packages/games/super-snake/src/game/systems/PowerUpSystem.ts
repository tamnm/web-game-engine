import type { System } from '@web-game-engine/core';
import {
  Grid,
  GridComponent,
  PowerUpConfig,
  PowerUpConfigComponent,
  PowerUpState,
  PowerUpStateComponent,
  Snake,
  SnakeComponent,
  FoodState,
  FoodStateComponent,
} from '../components';
import {
  computePowerUpSpawnCells,
  createPowerUpItem,
  mergeEffectConfigs,
  purgeExpiredPowerUps,
  selectPowerUpDefinition,
} from '../PowerUps';
import { getHead } from '../Snake';

export function createPowerUpSystem(): System {
  return {
    id: 'super-snake.systems.power-ups',
    stage: 'update',
    order: 1,
    execute: ({ world, elapsed }) => {
      const rows = world.query({
        all: [Grid, Snake, PowerUpConfig, PowerUpState],
      });
      if (rows.size === 0) return;

      for (const row of rows) {
        const entity = row.entity as number;
        const grid = world.getComponent(entity, Grid) as GridComponent | undefined;
        const snake = world.getComponent(entity, Snake) as SnakeComponent | undefined;
        const config = world.getComponent(entity, PowerUpConfig) as
          | PowerUpConfigComponent
          | undefined;
        const powerUps = world.getComponent(entity, PowerUpState) as
          | PowerUpStateComponent
          | undefined;
        const foods = world.getComponent(entity, FoodState) as FoodStateComponent | undefined;

        if (!grid || !snake || !config || !powerUps) {
          continue;
        }

        purgeExpiredPowerUps(powerUps, elapsed);

        if (snake.alive && snake.segments.length > 0 && powerUps.items.length > 0) {
          const head = getHead(snake);
          const index = powerUps.items.findIndex((item) => item.x === head.x && item.y === head.y);
          if (index >= 0) {
            const item = powerUps.items.splice(index, 1)[0];
            const definition = config.definitions.find((def) => def.id === item.definitionId);
            if (definition) {
              const expiresAt = elapsed + definition.durationMs;
              const existingIndex = powerUps.active.findIndex((entry) => entry.type === item.type);
              if (existingIndex >= 0) {
                const existing = powerUps.active[existingIndex];
                existing.expiresAt = Math.max(existing.expiresAt, expiresAt);
                existing.effect = mergeEffectConfigs(existing.effect, definition.effect);
              } else {
                powerUps.active.push({
                  id: item.id,
                  type: item.type,
                  expiresAt,
                  effect: { ...definition.effect },
                });
              }
            }
          }
        }

        const random = config.random ?? Math.random;
        const canSpawn =
          config.definitions.length > 0 &&
          powerUps.items.length < config.maxActive &&
          elapsed >= config.initialDelayMs &&
          elapsed - powerUps.lastSpawnAt >= config.spawnIntervalMs;

        if (canSpawn && snake.segments.length > 0) {
          const available = computePowerUpSpawnCells(grid, snake, foods, powerUps);
          if (available.length > 0) {
            const cell = available[Math.floor(random() * available.length)];
            const definition = selectPowerUpDefinition(config, random);
            const item = createPowerUpItem(powerUps, definition, cell, elapsed);
            powerUps.items.push(item);
            powerUps.lastSpawnAt = elapsed;
          } else {
            powerUps.lastSpawnAt = elapsed;
          }
        }
      }
    },
  };
}
