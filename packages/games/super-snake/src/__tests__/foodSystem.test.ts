import { describe, expect, it } from 'vitest';
import { World } from '@web-game-engine/core';
import {
  FoodConfig,
  FoodConfigComponent,
  FoodState,
  FoodStateComponent,
  PowerUpState,
  Snake,
  SnakeComponent,
  SnakeGameState,
} from '../game';
import { selectFoodDefinition } from '../game/Food';
import { spawnSuperSnake } from '../game/factory';
import { createFoodSystem } from '../game/systems/FoodSystem';

function createRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

describe('Food utilities', () => {
  it('selectFoodDefinition honours weights', () => {
    const config = FoodConfig.defaults!();
    const random = createRandom([0.0, 0.65, 0.95]);
    const first = selectFoodDefinition(config, random);
    const second = selectFoodDefinition(config, random);
    const third = selectFoodDefinition(config, random);

    expect(first.id).toBe('apple');
    expect(second.id).toBe('berry');
    expect(third.id).toBe('starfruit');
  });
});

describe('Food system', () => {
  it('spawns, replaces, and rewards food consumption with combos', () => {
    const world = new World();
    const randomValues = [0.3, 0.0, 0.3, 0.95, 0.1, 0.0];
    const random = createRandom(randomValues);
    const entity = spawnSuperSnake(world, {
      gridWidth: 6,
      gridHeight: 4,
      foodMaxActive: 1,
      random,
    });

    const snake = world.getComponent(entity, Snake) as SnakeComponent;
    const state = world.getComponent(entity, SnakeGameState)!;
    const foodState = world.getComponent(entity, FoodState) as FoodStateComponent;
    const foodConfig = world.getComponent(entity, FoodConfig) as FoodConfigComponent;

    expect(foodState.items).toHaveLength(1);
    const firstFood = foodState.items[0];
    expect(firstFood.type).toBe('apple');

    // Place snake head on the food and run the food system.
    snake.segments[0].x = firstFood.x;
    snake.segments[0].y = firstFood.y;

    const foodSystem = createFoodSystem();
    foodSystem.execute({ world, delta: 0, elapsed: 0 });

    expect(state.score).toBe(firstFood.score);
    expect(state.comboCount).toBe(1);
    expect(snake.pendingGrowth).toBe(firstFood.growth);
    expect(foodState.items).toHaveLength(1);
    const secondFood = foodState.items[0];
    expect(secondFood.type).toBe('starfruit');

    // Consume the new food within the combo window.
    snake.segments[0].x = secondFood.x;
    snake.segments[0].y = secondFood.y;
    foodSystem.execute({ world, delta: 0, elapsed: foodConfig.comboWindowMs / 2 });

    expect(state.comboCount).toBeGreaterThan(1);
    expect(state.maxCombo).toBe(state.comboCount);
    expect(state.score).toBeGreaterThan(firstFood.score);
    expect(foodState.items).toHaveLength(1);
  });

  it('pulls nearby food toward the snake when magnet is active', () => {
    const world = new World();
    const entity = spawnSuperSnake(world, {
      gridWidth: 8,
      gridHeight: 8,
      foodMaxActive: 1,
    });

    const snake = world.getComponent(entity, Snake) as SnakeComponent;
    snake.segments = [
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
    ];

    const foodState = world.getComponent(entity, FoodState) as FoodStateComponent;
    foodState.items = [
      {
        id: 1,
        type: 'apple',
        x: 1,
        y: 4,
        spawnedAt: 0,
        growth: 1,
        score: 10,
        comboBonus: 0,
        tint: [1, 0, 0, 1],
      },
    ];

    const powerUps = world.getComponent(entity, PowerUpState);
    powerUps?.items.splice(0, powerUps.items.length);
    powerUps?.active.splice(0, powerUps.active.length);
    powerUps?.active.push({
      id: 99,
      type: 'magnet',
      expiresAt: 10_000,
      effect: { magnetRange: 5 },
    });

    const state = world.getComponent(entity, SnakeGameState)!;
    state.score = 0;

    const foodSystem = createFoodSystem();
    foodSystem.execute({ world, delta: 0, elapsed: 1_000 });

    expect(foodState.items[0]).toMatchObject({ x: 2, y: 4 });
  });
});
