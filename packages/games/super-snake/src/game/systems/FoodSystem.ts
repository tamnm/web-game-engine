import type { System } from '@web-game-engine/core';
import {
  FoodConfig,
  FoodConfigComponent,
  FoodState,
  FoodStateComponent,
  Grid,
  GridComponent,
  LevelState,
  LevelStateComponent,
  PowerUpState,
  PowerUpStateComponent,
  Snake,
  SnakeComponent,
  SnakeGameState,
  SnakeGameStateComponent,
} from '../components';
import { computeAvailableCells, createFoodItem, selectFoodDefinition } from '../Food';
import { getHead } from '../Snake';
import { getMagnetRange, getScoreMultiplier } from '../PowerUps';
import { collectBlockedCells } from '../Level';

export function createFoodSystem(): System {
  return {
    id: 'super-snake.systems.food',
    stage: 'update',
    order: 3,
    execute: ({ world, elapsed }) => {
      const rows = world.query({
        all: [Grid, Snake, SnakeGameState, FoodConfig, FoodState],
      });
      if (rows.size === 0) return;

      for (const row of rows) {
        const entity = row.entity as number;
        const grid = world.getComponent(entity, Grid) as GridComponent | undefined;
        const snake = world.getComponent(entity, Snake) as SnakeComponent | undefined;
        const state = world.getComponent(entity, SnakeGameState) as
          | SnakeGameStateComponent
          | undefined;
        const config = world.getComponent(entity, FoodConfig) as FoodConfigComponent | undefined;
        const food = world.getComponent(entity, FoodState) as FoodStateComponent | undefined;
        const powerUps = world.getComponent(entity, PowerUpState) as
          | PowerUpStateComponent
          | undefined;
        const level = world.getComponent(entity, LevelState) as LevelStateComponent | undefined;

        if (!grid || !snake || !state || !config || !food) {
          continue;
        }

        const random = config.random ?? Math.random;

        if (snake.alive && snake.segments.length > 0) {
          const head = getHead(snake);
          const consumedIndex = food.items.findIndex(
            (item) => item.x === head.x && item.y === head.y
          );
          if (consumedIndex >= 0) {
            const item = food.items.splice(consumedIndex, 1)[0];
            snake.pendingGrowth += item.growth;

            const withinCombo = elapsed - state.lastConsumedAt <= config.comboWindowMs;
            const baseCombo = withinCombo ? state.comboCount + 1 : 1;
            const updatedCombo = baseCombo + item.comboBonus;
            state.comboCount = updatedCombo;
            state.maxCombo = Math.max(state.maxCombo, state.comboCount);
            state.lastConsumedAt = elapsed;
            const multiplier = Math.max(1, state.comboCount);
            const scoreBoost = powerUps ? getScoreMultiplier(powerUps, elapsed) : 1;
            state.score += item.score * multiplier * scoreBoost;

            // Allow immediate respawn if capacity remains.
            food.lastSpawnAt = elapsed - config.spawnIntervalMs;
          }
        }

        while (
          food.items.length < config.maxActive &&
          elapsed - food.lastSpawnAt >= config.spawnIntervalMs
        ) {
          const blocked = collectBlockedCells(level);
          const available = computeAvailableCells(grid, snake, food, blocked);
          if (available.length === 0) {
            break;
          }
          let spawnPool = available;
          if (powerUps && snake.segments.length > 0) {
            const magnetRange = getMagnetRange(powerUps, elapsed);
            if (magnetRange !== null) {
              const head = getHead(snake);
              const magnetised = available.filter(
                (cell) => Math.abs(cell.x - head.x) + Math.abs(cell.y - head.y) <= magnetRange
              );
              if (magnetised.length > 0) {
                spawnPool = magnetised;
              }
            }
          }
          const cell = spawnPool[Math.floor(random() * spawnPool.length)];
          const definition = selectFoodDefinition(config, random);
          const item = createFoodItem(food, definition, cell, elapsed);
          food.items.push(item);
          food.lastSpawnAt = elapsed;
        }
      }
    },
  };
}
