import type { World } from '@web-game-engine/core';
import {
  FoodConfig,
  FoodConfigComponent,
  FoodState,
  FoodStateComponent,
  Grid,
  GridComponent,
  GridMode,
  Snake,
  SnakeComponent,
  SnakeDirection,
  SnakeGameState,
  SnakeMovement,
  FoodDefinition,
  PowerUpConfig,
  PowerUpConfigComponent,
  PowerUpDefinition,
  PowerUpState,
  PowerUpStateComponent,
} from './components';
import { directionToVector, GridPosition } from './Grid';
import { initializeSnake } from './Snake';
import { computeAvailableCells, createFoodItem, selectFoodDefinition } from './Food';

export interface SuperSnakeOptions {
  gridWidth?: number;
  gridHeight?: number;
  cellSize?: number;
  moveIntervalMs?: number;
  mode?: GridMode;
  initialLength?: number;
  direction?: SnakeDirection;
  spawn?: GridPosition;
  foodDefinitions?: FoodDefinition[];
  foodMaxActive?: number;
  foodSpawnIntervalMs?: number;
  comboWindowMs?: number;
  random?: () => number;
  powerUpDefinitions?: PowerUpDefinition[];
  powerUpMaxActive?: number;
  powerUpSpawnIntervalMs?: number;
  powerUpInitialDelayMs?: number;
}

export function spawnSuperSnake(world: World, options: SuperSnakeOptions = {}): number {
  const grid: GridComponent = {
    ...Grid.defaults!(),
    width: options.gridWidth ?? 16,
    height: options.gridHeight ?? 16,
    cellSize: options.cellSize ?? 32,
    mode: options.mode ?? 'wrap',
  };

  const entity = world.createEntity();
  world.addComponent(entity, Grid, grid);

  const snake: SnakeComponent = {
    ...Snake.defaults!(),
    segments: [],
    direction: options.direction ?? 'right',
    nextDirection: options.direction ?? 'right',
    pendingGrowth: 0,
    alive: true,
  };

  const start: GridPosition = options.spawn ?? {
    x: Math.floor(grid.width / 2),
    y: Math.floor(grid.height / 2),
  };
  const direction = snake.direction;
  const delta = directionToVector(direction);
  const length = Math.max(1, options.initialLength ?? 3);
  const segments: GridPosition[] = [];
  for (let i = 0; i < length; i += 1) {
    segments.push({ x: start.x - delta.x * i, y: start.y - delta.y * i });
  }
  initializeSnake(snake, segments, direction);
  world.addComponent(entity, Snake, snake);

  const movementDefaults = SnakeMovement.defaults!();
  const movement = {
    ...movementDefaults,
    moveIntervalMs: Math.max(16, options.moveIntervalMs ?? movementDefaults.moveIntervalMs),
    accumulatorMs: 0,
  };
  world.addComponent(entity, SnakeMovement, movement);

  const state = SnakeGameState.defaults!();
  state.mode = grid.mode;
  world.addComponent(entity, SnakeGameState, state);

  const foodConfigDefaults = FoodConfig.defaults!();
  const foodConfig: FoodConfigComponent = {
    ...foodConfigDefaults,
    definitions:
      options.foodDefinitions ?? foodConfigDefaults.definitions.map((def) => ({ ...def })),
    maxActive: options.foodMaxActive ?? foodConfigDefaults.maxActive,
    spawnIntervalMs: options.foodSpawnIntervalMs ?? foodConfigDefaults.spawnIntervalMs,
    comboWindowMs: options.comboWindowMs ?? foodConfigDefaults.comboWindowMs,
    random: options.random ?? foodConfigDefaults.random,
  };
  world.addComponent(entity, FoodConfig, foodConfig);
  const foodState = FoodState.defaults!();
  world.addComponent(entity, FoodState, foodState);
  seedInitialFood(foodConfig, foodState, grid, snake);

  const powerUpConfigDefaults = PowerUpConfig.defaults!();
  const powerUpConfig: PowerUpConfigComponent = {
    ...powerUpConfigDefaults,
    definitions:
      options.powerUpDefinitions ??
      powerUpConfigDefaults.definitions.map((definition) => ({ ...definition })),
    maxActive: options.powerUpMaxActive ?? powerUpConfigDefaults.maxActive,
    spawnIntervalMs: options.powerUpSpawnIntervalMs ?? powerUpConfigDefaults.spawnIntervalMs,
    initialDelayMs: options.powerUpInitialDelayMs ?? powerUpConfigDefaults.initialDelayMs,
    random: options.random ?? powerUpConfigDefaults.random,
  };
  world.addComponent(entity, PowerUpConfig, powerUpConfig);
  const powerUpState: PowerUpStateComponent = PowerUpState.defaults!();
  world.addComponent(entity, PowerUpState, powerUpState);

  return entity;
}

function seedInitialFood(
  config: FoodConfigComponent,
  state: FoodStateComponent,
  grid: GridComponent,
  snake: SnakeComponent
): void {
  const random = config.random ?? Math.random;
  const target = Math.min(config.maxActive, grid.width * grid.height - snake.segments.length);
  for (let i = state.items.length; i < target; i += 1) {
    const available = computeAvailableCells(grid, snake, state);
    if (available.length === 0) break;
    const cell = available[Math.floor(random() * available.length)];
    const definition = selectFoodDefinition(config, random);
    const item = createFoodItem(state, definition, cell, 0);
    state.items.push(item);
    state.lastSpawnAt = 0;
  }
}
