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

        const blockedCells = collectBlockedCells(level);

        if (snake.alive && snake.segments.length > 0) {
          const magnetRange = getMagnetRange(powerUps, elapsed);
          if (magnetRange !== null && magnetRange > 0 && food.items.length > 0) {
            const head = getHead(snake);
            const occupied = new Set<string>();
            snake.segments.forEach((segment) => occupied.add(`${segment.x},${segment.y}`));
            blockedCells.forEach((cell) => occupied.add(`${cell.x},${cell.y}`));
            food.items.forEach((item) => occupied.add(`${item.x},${item.y}`));

            food.items.forEach((item) => {
              const key = `${item.x},${item.y}`;
              occupied.delete(key);
              const dx = Math.sign(head.x - item.x);
              const dy = Math.sign(head.y - item.y);
              const distance = Math.abs(head.x - item.x) + Math.abs(head.y - item.y);
              if (distance > 0 && distance <= magnetRange) {
                const target = {
                  x: item.x + dx,
                  y: item.y + dy,
                };
                const targetKey = `${target.x},${target.y}`;
                const withinBounds =
                  target.x >= 0 && target.y >= 0 && target.x < grid.width && target.y < grid.height;
                if (withinBounds && !occupied.has(targetKey)) {
                  item.x = target.x;
                  item.y = target.y;
                }
              }
              occupied.add(`${item.x},${item.y}`);
            });
          }

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
          const available = computeAvailableCells(grid, snake, food, blockedCells);
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
